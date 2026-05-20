// phonemes.js — テキスト → IPA 変換、音素アライメント、日本語話者向け診断
// 外部辞書 eng-to-ipa (CMU 由来) を CDN から動的読み込み

(() => {
  "use strict";

  let convertFn = null;
  let loadPromise = null;

  async function ensureConverter() {
    if (convertFn) return convertFn;
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      try {
        const mod = await import(
          "https://cdn.jsdelivr.net/npm/eng-to-ipa@1.0.7/+esm"
        );
        const m = mod.default || mod;
        convertFn = m.convert || (m.default && m.default.convert);
        if (typeof convertFn !== "function") {
          throw new Error("eng-to-ipa: convert() not found");
        }
        return convertFn;
      } catch (e) {
        loadPromise = null;
        throw e;
      }
    })();
    return loadPromise;
  }

  // IPA 文字列を音素単位 (二重母音や破擦音は1つとして) に分割
  const MULTI = [
    "tʃ", "dʒ",
    "aɪ", "aʊ", "eɪ", "oʊ", "ɔɪ", "ʊə", "ɛə", "ɪə",
    "iː", "uː", "ɔː", "ɑː", "ɜː", "æː",
  ];
  const STRESS_OR_PUNCT = /[ˈˌ.,!?'"‘’“”\s]/;

  function tokenizeIPA(s) {
    const tokens = [];
    let i = 0;
    while (i < s.length) {
      let matched = null;
      for (const m of MULTI) {
        if (s.substr(i, m.length) === m) { matched = m; break; }
      }
      if (matched) {
        tokens.push(matched);
        i += matched.length;
      } else if (STRESS_OR_PUNCT.test(s[i])) {
        i++;
      } else {
        tokens.push(s[i]);
        i++;
      }
    }
    return tokens;
  }

  // 単語ごとの分割を保持しつつIPA変換
  async function wordsToPhonemes(text) {
    const fn = await ensureConverter();
    const words = text.match(/[A-Za-z']+/g) || [];
    const out = [];
    for (const w of words) {
      let ipa;
      try {
        ipa = fn(w, { returnArray: false });
      } catch (_) { ipa = w; }
      // 未知語はアスタリスク付きで返す。tokenizer は記号を捨てるので未知判別は別途行う
      const isUnknown = typeof ipa === "string" && ipa.includes("*");
      const cleaned = (ipa || "").replace(/\*/g, "");
      out.push({ word: w.toLowerCase(), ipa: cleaned, tokens: tokenizeIPA(cleaned), unknown: isUnknown });
    }
    return out;
  }

  // 音素レベルの Needleman-Wunsch アライメント
  function alignPhonemes(refs, hyps) {
    const m = refs.length, n = hyps.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    const back = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(null));
    for (let i = 0; i <= m; i++) { dp[i][0] = i; back[i][0] = "up"; }
    for (let j = 0; j <= n; j++) { dp[0][j] = j; back[0][j] = "left"; }
    back[0][0] = null;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const same = refs[i - 1] === hyps[j - 1] ? 0 : (similarPhone(refs[i - 1], hyps[j - 1]) ? 0.4 : 1);
        const diag = dp[i - 1][j - 1] + same;
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

  // 音響的に近い (= 軽微なエラー扱い) 音素ペア
  const NEAR_PAIRS = [
    // 母音長
    ["i", "iː"], ["u", "uː"], ["o", "oʊ"], ["ɔ", "ɔː"], ["ɑ", "ɑː"], ["ə", "ɜː"],
    // 緊張/弛緩
    ["ɪ", "iː"], ["ʊ", "uː"], ["ɛ", "eɪ"],
    // 有声/無声 (やや軽微)
    ["s", "z"], ["f", "v"], ["p", "b"], ["t", "d"], ["k", "g"], ["ʃ", "ʒ"],
    ["θ", "ð"],
    // 接近音
    ["w", "v"],
  ];
  const NEAR_SET = new Set(NEAR_PAIRS.flatMap(([a, b]) => [a + "|" + b, b + "|" + a]));
  function similarPhone(a, b) {
    if (!a || !b) return false;
    return NEAR_SET.has(a + "|" + b);
  }

  // 日本語話者向けに典型的な置換を解釈してアドバイスを返す
  const SUB_TIPS = [
    {
      from: "r", to: "l",
      tip: "/r/ → /l/ の混同: 舌先を口の天井に付けずに浮かせて発音。/l/ は付けます。",
    },
    {
      from: "l", to: "r",
      tip: "/l/ → /r/ の混同: 舌先を上の歯茎にしっかり付ける。",
    },
    {
      from: "θ", to: "s",
      tip: "/θ/ → /s/: 舌先を上前歯に軽く触れて息のみで発音。「サ行」と区別。",
    },
    {
      from: "θ", to: "t",
      tip: "/θ/ → /t/: 破裂させず、舌先を歯にあてて摩擦音に。",
    },
    {
      from: "ð", to: "z",
      tip: "/ð/ → /z/: 舌先を上前歯に触れて有声摩擦音。",
    },
    {
      from: "ð", to: "d",
      tip: "/ð/ → /d/: 舌先を歯に触れて摩擦させる、破裂はさせない。",
    },
    {
      from: "v", to: "b",
      tip: "/v/ → /b/: 下唇を上の歯に当てて声を出す。両唇を閉じない。",
    },
    {
      from: "f", to: "h",
      tip: "/f/ → /h/: 下唇を歯に当て、息で摩擦音を作る。",
    },
    {
      from: "f", to: "ɸ",
      tip: "/f/ の唇形: 「フ」(両唇) ではなく下唇と歯で摩擦。",
    },
    {
      from: "æ", to: "e",
      tip: "/æ/: 口をしっかり横に開いて『ア』と『エ』の中間。",
    },
    {
      from: "ʌ", to: "a",
      tip: "/ʌ/: あごを下げず、口をリラックスさせて短く。",
    },
    {
      from: "ɪ", to: "iː",
      tip: "短母音 /ɪ/: 口を緊張させず短く。長く伸ばさない。",
    },
    {
      from: "iː", to: "ɪ",
      tip: "長母音 /iː/: 口を横に強く引いて長めに伸ばす。",
    },
    {
      from: "ʊ", to: "uː",
      tip: "短母音 /ʊ/: 唇を強く突き出さず短く。",
    },
    {
      from: "uː", to: "ʊ",
      tip: "長母音 /uː/: 唇を丸めて長く伸ばす。",
    },
    {
      from: "ŋ", to: "n",
      tip: "/ŋ/: 舌の奥を上げ、鼻に抜ける音 (シング、ハングのング)。",
    },
  ];

  function diagnose(ops) {
    const tips = new Map();
    for (const op of ops) {
      if (op.type === "sub") {
        for (const r of SUB_TIPS) {
          if (r.from === op.ref && r.to === op.hyp) {
            tips.set(r.tip, true);
            break;
          }
        }
      } else if (op.type === "miss") {
        tips.set(`音素の脱落: /${op.ref}/ が聞き取れませんでした。意識して発音してみよう。`, true);
      } else if (op.type === "near") {
        // 軽微: 通常はメッセージ少なめ
      }
    }
    return Array.from(tips.keys());
  }

  // ops から音素ごとの「正確さ」スコア (GOP の簡易版) を算出
  // 各音素 0..1 を返す。
  function gopScores(refs, ops) {
    // 参照側の各音素に対し、対応するopをマップして点数化する
    const scores = new Array(refs.length).fill(0);
    let ri = 0;
    for (const op of ops) {
      if (op.type === "match") { scores[ri] = 1; ri++; }
      else if (op.type === "near") { scores[ri] = 0.7; ri++; }
      else if (op.type === "sub") { scores[ri] = 0.2; ri++; }
      else if (op.type === "miss") { scores[ri] = 0; ri++; }
      // extra は参照側を進めない
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
    tokenizeIPA,
  };
})();
