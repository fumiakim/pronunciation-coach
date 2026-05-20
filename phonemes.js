// phonemes.js — テキスト → IPA 変換、音素アライメント、日本語話者向け診断
// 辞書: cmu-pronouncing-dictionary (ARPABET 形式、約134k語、3.7MB)
//        初回ダウンロード後はブラウザキャッシュにのって即時。

(() => {
  "use strict";

  let DICT = null;
  let loadPromise = null;

  async function ensureConverter() {
    if (DICT) return;
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      try {
        const mod = await import(
          "https://cdn.jsdelivr.net/npm/cmu-pronouncing-dictionary@3.0.0/+esm"
        );
        DICT = mod.dictionary || (mod.default && mod.default.dictionary);
        if (!DICT || typeof DICT !== "object") {
          throw new Error("dictionary export missing");
        }
      } catch (e) {
        loadPromise = null;
        throw e;
      }
    })();
    return loadPromise;
  }

  // ----- ARPABET → IPA -----
  // 母音は基本的に単一IPA、stress 0 (無強勢) の AH/ER はシュワ系に切替。
  const ARPA_TO_IPA = {
    AA: "ɑ", AE: "æ", AO: "ɔ", AW: "aʊ", AY: "aɪ",
    B: "b", CH: "tʃ", D: "d", DH: "ð",
    EH: "ɛ", EY: "eɪ",
    F: "f", G: "g", HH: "h",
    IH: "ɪ", IY: "iː",
    JH: "dʒ", K: "k", L: "l", M: "m", N: "n", NG: "ŋ",
    OW: "oʊ", OY: "ɔɪ",
    P: "p", R: "r", S: "s", SH: "ʃ",
    T: "t", TH: "θ",
    UH: "ʊ", UW: "uː",
    V: "v", W: "w", Y: "j", Z: "z", ZH: "ʒ",
  };

  function arpabetToIPATokens(arpa) {
    // 入力例: "HH AH0 L OW1" → ["h", "ə", "l", "oʊ"]
    return arpa
      .split(/\s+/)
      .filter(Boolean)
      .map((seg) => {
        const m = seg.match(/^([A-Z]+)(\d?)$/);
        if (!m) return null;
        const base = m[1], stress = m[2];
        if (base === "AH") return stress === "1" || stress === "2" ? "ʌ" : "ə";
        if (base === "ER") return stress === "1" || stress === "2" ? "ɝ" : "ɚ";
        return ARPA_TO_IPA[base] || null;
      })
      .filter(Boolean);
  }

  function lookupArpabet(word) {
    if (!DICT) return null;
    const w = word.toLowerCase();
    return (
      DICT[w] ||
      DICT[w.replace(/[^a-z']/g, "")] ||
      DICT[w.replace(/'/g, "")] ||
      null
    );
  }

  // 未知語向けの最小限の grapheme→IPA フォールバック
  const G2P_DIGRAPHS = [
    ["sch", "ʃ"], ["tch", "tʃ"],
    ["th", "θ"], ["sh", "ʃ"], ["ch", "tʃ"], ["ph", "f"],
    ["ng", "ŋ"], ["wh", "w"], ["qu", "kw"],
    ["ee", "iː"], ["ea", "iː"], ["ie", "iː"], ["oo", "uː"],
    ["ai", "eɪ"], ["ay", "eɪ"], ["oi", "ɔɪ"], ["oy", "ɔɪ"],
    ["ou", "aʊ"], ["ow", "aʊ"], ["oa", "oʊ"], ["ck", "k"],
  ];
  const G2P_LETTERS = {
    a: "æ", b: "b", c: "k", d: "d", e: "ɛ", f: "f", g: "g",
    h: "h", i: "ɪ", j: "dʒ", k: "k", l: "l", m: "m", n: "n",
    o: "ɔ", p: "p", q: "k", r: "r", s: "s", t: "t", u: "ʌ",
    v: "v", w: "w", x: "ks", y: "j", z: "z",
  };
  function guessG2P(word) {
    const w = word.toLowerCase().replace(/[^a-z]/g, "");
    const out = [];
    let i = 0;
    outer:
    while (i < w.length) {
      for (const [pat, val] of G2P_DIGRAPHS) {
        if (w.substr(i, pat.length) === pat) {
          // 二重母音/破擦音はそのまま1トークン
          out.push(val.length > 1 && /^[a-zA-Z]/.test(val) ? val : val);
          i += pat.length;
          continue outer;
        }
      }
      const v = G2P_LETTERS[w[i]];
      if (v) out.push(v);
      i++;
    }
    // 単語末の "e" は無音化されることが多い
    if (w.endsWith("e") && out.length > 1 && out[out.length - 1] === "ɛ") out.pop();
    return out;
  }

  async function wordsToPhonemes(text) {
    await ensureConverter();
    const words = text.match(/[A-Za-z']+/g) || [];
    const out = [];
    for (const w of words) {
      const arpa = lookupArpabet(w);
      if (arpa) {
        const tokens = arpabetToIPATokens(arpa);
        out.push({ word: w.toLowerCase(), ipa: tokens.join(""), tokens, unknown: false });
      } else {
        const tokens = guessG2P(w);
        out.push({ word: w.toLowerCase(), ipa: tokens.join(""), tokens, unknown: true });
      }
    }
    return out;
  }

  // ----- Needleman-Wunsch alignment -----
  function alignPhonemes(refs, hyps) {
    const m = refs.length, n = hyps.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    const back = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(null));
    for (let i = 0; i <= m; i++) { dp[i][0] = i; back[i][0] = "up"; }
    for (let j = 0; j <= n; j++) { dp[0][j] = j; back[0][j] = "left"; }
    back[0][0] = null;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const sameCost = refs[i - 1] === hyps[j - 1]
          ? 0
          : (similarPhone(refs[i - 1], hyps[j - 1]) ? 0.4 : 1);
        const diag = dp[i - 1][j - 1] + sameCost;
        const up = dp[i - 1][j] + 1;
        const left = dp[i][j - 1] + 1;
        const best = Math.min(diag, up, left);
        dp[i][j] = best;
        back[i][j] = best === diag ? "diag" : best === up ? "up" : "left";
      }
    }
    const ops = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
      const dir = back[i][j];
      if (dir === "diag") {
        const r = refs[i - 1], h = hyps[j - 1];
        ops.push({
          type: r === h ? "match" : (similarPhone(r, h) ? "near" : "sub"),
          ref: r, hyp: h,
        });
        i--; j--;
      } else if (dir === "up") {
        ops.push({ type: "miss", ref: refs[i - 1] }); i--;
      } else {
        ops.push({ type: "extra", hyp: hyps[j - 1] }); j--;
      }
    }
    return ops.reverse();
  }

  // 「近い音」ペア (軽微エラー扱い)
  const NEAR_PAIRS = [
    ["i", "iː"], ["u", "uː"], ["o", "oʊ"], ["ɔ", "ɔː"], ["ɑ", "ɑː"],
    ["ə", "ʌ"], ["ə", "ɚ"], ["ɝ", "ɚ"],
    ["ɪ", "iː"], ["ʊ", "uː"], ["ɛ", "eɪ"], ["ʌ", "ɑ"],
    ["s", "z"], ["f", "v"], ["p", "b"], ["t", "d"], ["k", "g"],
    ["ʃ", "ʒ"], ["θ", "ð"], ["w", "v"],
  ];
  const NEAR_SET = new Set(NEAR_PAIRS.flatMap(([a, b]) => [a + "|" + b, b + "|" + a]));
  function similarPhone(a, b) {
    if (!a || !b) return false;
    return NEAR_SET.has(a + "|" + b);
  }

  // ----- 日本語話者向け診断 -----
  const SUB_TIPS = [
    { from: "r", to: "l", tip: "/r/ → /l/ の混同: 舌先を口の天井に付けずに浮かせて発音。/l/ は付けます。" },
    { from: "l", to: "r", tip: "/l/ → /r/ の混同: 舌先を上の歯茎にしっかり付ける。" },
    { from: "θ", to: "s", tip: "/θ/ → /s/: 舌先を上前歯に軽く触れて息のみで発音。「サ行」と区別。" },
    { from: "θ", to: "t", tip: "/θ/ → /t/: 破裂させず、舌先を歯にあてて摩擦音に。" },
    { from: "ð", to: "z", tip: "/ð/ → /z/: 舌先を上前歯に触れて有声摩擦音。" },
    { from: "ð", to: "d", tip: "/ð/ → /d/: 舌先を歯に触れて摩擦させる、破裂はさせない。" },
    { from: "v", to: "b", tip: "/v/ → /b/: 下唇を上の歯に当てて声を出す。両唇を閉じない。" },
    { from: "f", to: "h", tip: "/f/ → /h/: 下唇を歯に当て、息で摩擦音を作る。" },
    { from: "f", to: "p", tip: "/f/ → /p/: 唇を閉じず、下唇と歯で摩擦。" },
    { from: "æ", to: "ɛ", tip: "/æ/: 口をしっかり横に開いて『ア』と『エ』の中間を意識。" },
    { from: "æ", to: "ʌ", tip: "/æ/: あごをしっかり下げる。/ʌ/ は中央寄り。" },
    { from: "ʌ", to: "ɑ", tip: "/ʌ/: あごを下げず、口を中央でリラックスさせて短く。" },
    { from: "ɪ", to: "iː", tip: "短母音 /ɪ/: 口を緊張させず短く。長く伸ばさない。" },
    { from: "iː", to: "ɪ", tip: "長母音 /iː/: 口を横に強く引いて長めに伸ばす。" },
    { from: "ʊ", to: "uː", tip: "短母音 /ʊ/: 唇を強く突き出さず短く。" },
    { from: "uː", to: "ʊ", tip: "長母音 /uː/: 唇を丸めて長く伸ばす。" },
    { from: "ŋ", to: "n", tip: "/ŋ/: 舌の奥を上げ、鼻に抜ける音 (シング、ハングのング)。" },
    { from: "ɝ", to: "ɑ", tip: "/ɝ/: R音性母音。舌を巻いて (or 後ろに引いて) 唸る感じで。" },
    { from: "ɚ", to: "ɑ", tip: "/ɚ/: 弱形の R 母音。語末で舌を軽く後ろに引く。" },
  ];

  function diagnose(ops) {
    const tips = new Map();
    for (const op of ops) {
      if (op.type === "sub") {
        let matched = false;
        for (const r of SUB_TIPS) {
          if (r.from === op.ref && r.to === op.hyp) {
            tips.set(r.tip, true);
            matched = true;
            break;
          }
        }
        if (!matched) {
          tips.set(`/${op.ref}/ → /${op.hyp}/ の置換が検出されました。お手本と聞き比べて確認しましょう。`, true);
        }
      } else if (op.type === "miss") {
        tips.set(`音素の脱落: /${op.ref}/ が聞き取れませんでした。意識して発音してみよう。`, true);
      }
    }
    return Array.from(tips.keys());
  }

  function gopScores(refs, ops) {
    const scores = new Array(refs.length).fill(0);
    let ri = 0;
    for (const op of ops) {
      if (op.type === "match") { scores[ri] = 1; ri++; }
      else if (op.type === "near") { scores[ri] = 0.7; ri++; }
      else if (op.type === "sub") { scores[ri] = 0.2; ri++; }
      else if (op.type === "miss") { scores[ri] = 0; ri++; }
    }
    return scores;
  }

  function overallScore(scores) {
    if (scores.length === 0) return 0;
    const s = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(s * 100);
  }

  window.Phonemes = {
    ensureConverter,
    wordsToPhonemes,
    alignPhonemes,
    diagnose,
    gopScores,
    overallScore,
  };
})();
