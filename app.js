(() => {
  "use strict";

  // ----- State -----
  const state = {
    level: "intermediate",
    index: 0,
    phrases: window.PHRASES.intermediate,
    isRecording: false,
    rate: 0.9,
    history: [],
    custom: null, // {en, ja, hint}
    lastAudioUrl: null, // 録音した自分の声 (Blob URL)
    audioGotResult: false,
  };

  // ----- Env detection -----
  const ua = navigator.userAgent;
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  const isFileProto = window.location.protocol === "file:";
  const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const hasMediaRecorder = typeof window.MediaRecorder !== "undefined";

  // ----- Elements -----
  const $ = (id) => document.getElementById(id);
  const els = {
    target: $("targetSentence"),
    translation: $("targetTranslation"),
    hint: $("targetHint"),
    listen: $("listenBtn"),
    record: $("recordBtn"),
    recordIcon: $("recordIcon"),
    recordLabel: $("recordLabel"),
    custom: $("customBtn"),
    prev: $("prevBtn"),
    next: $("nextBtn"),
    shuffle: $("shuffleBtn"),
    levelSelect: $("levelSelect"),
    rateSlider: $("rateSlider"),
    rateValue: $("rateValue"),
    status: $("statusBar"),
    heard: $("heardText"),
    wordDiff: $("wordDiff"),
    tips: $("tipsList"),
    scorePill: $("scorePill"),
    history: $("historyList"),
    clearHistory: $("clearHistoryBtn"),
    customModal: $("customModal"),
    customInput: $("customInput"),
    customTranslation: $("customTranslation"),
    customCancel: $("customCancel"),
    customApply: $("customApply"),
    banner: $("banner"),
    bannerTitle: $("bannerTitle"),
    bannerText: $("bannerText"),
    bannerClose: $("bannerClose"),
    bannerActions: $("bannerActions"),
    enableWhisper: $("enableWhisperBtn"),
    whisperProgress: $("whisperProgress"),
    whisperFill: $("whisperFill"),
    whisperPct: $("whisperPct"),
    playbackRow: $("playbackRow"),
    playMyVoice: $("playMyVoiceBtn"),
    playModel: $("playModelBtn"),
  };

  // ----- Whisper (transformers.js) — Safariなど SR が使えない環境向けフォールバック -----
  const whisper = {
    state: "idle", // idle | loading | ready | failed
    pipe: null,
    loadPromise: null,
  };

  function setWhisperProgress(pct, label) {
    els.whisperProgress.classList.remove("hidden");
    const clamped = Math.max(0, Math.min(100, pct));
    els.whisperFill.style.width = clamped + "%";
    els.whisperPct.textContent = (label != null ? label : Math.round(clamped) + "%");
  }

  async function loadWhisper() {
    if (whisper.state === "ready") return whisper.pipe;
    if (whisper.loadPromise) return whisper.loadPromise;

    whisper.state = "loading";
    els.enableWhisper.disabled = true;
    els.enableWhisper.style.opacity = "0.6";
    setWhisperProgress(2, "ライブラリ読込中...");

    whisper.loadPromise = (async () => {
      // transformers.js (ESM) を動的に読み込む
      const mod = await import(
        "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2"
      );
      const { pipeline, env } = mod;
      // ONNX Runtime のWASMをCDNから取得
      env.allowLocalModels = false;

      setWhisperProgress(5, "モデル読込中...");
      whisper.pipe = await pipeline(
        "automatic-speech-recognition",
        "Xenova/whisper-tiny.en",
        {
          quantized: true,
          progress_callback: (p) => {
            if (p.status === "progress" && typeof p.progress === "number") {
              setWhisperProgress(5 + p.progress * 0.9, Math.round(p.progress) + "%");
            } else if (p.status === "done") {
              setWhisperProgress(96, "初期化中...");
            }
          },
        }
      );

      setWhisperProgress(100, "✓ 完了");
      whisper.state = "ready";

      // バナーを成功メッセージに更新
      els.bannerTitle.textContent = "音声認識が有効になりました";
      els.bannerText.innerHTML =
        "Safari でも自動採点が使えるようになりました。次の録音から自動的に解析されます。";
      els.enableWhisper.classList.add("hidden");

      return whisper.pipe;
    })();

    try {
      return await whisper.loadPromise;
    } catch (e) {
      whisper.state = "failed";
      whisper.loadPromise = null;
      els.enableWhisper.disabled = false;
      els.enableWhisper.style.opacity = "";
      setWhisperProgress(0, "失敗");
      els.bannerText.innerHTML =
        "モデル読み込みに失敗しました: <code>" + (e.message || e) + "</code><br>" +
        "ネットワーク接続を確認するか、<code>start.command</code> 経由で <code>http://localhost</code> から開いてみてください。";
      throw e;
    }
  }

  // MediaRecorder の blob → Whisper 入力用 Float32Array (16kHz mono)
  async function blobToWhisperInput(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtx();
    let decoded;
    try {
      decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    } finally {
      try { audioCtx.close(); } catch (_) {}
    }
    const targetRate = 16000;
    const frames = Math.max(1, Math.ceil(decoded.duration * targetRate));
    const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const offline = new OfflineCtx(1, frames, targetRate);
    const src = offline.createBufferSource();
    src.buffer = decoded;
    src.connect(offline.destination);
    src.start(0);
    const resampled = await offline.startRendering();
    return resampled.getChannelData(0);
  }

  async function transcribeWithWhisper(blob) {
    const pipe = await loadWhisper();
    const input = await blobToWhisperInput(blob);
    const out = await pipe(input, { language: "english", task: "transcribe" });
    return (out && out.text ? out.text : "").trim();
  }

  // ----- Media recording (works on all browsers w/ mic permission) -----
  let mediaStream = null;
  let mediaRecorder = null;
  let audioChunks = [];

  async function startMediaRecording() {
    if (!hasGetUserMedia) {
      throw new Error("このブラウザは getUserMedia に対応していません。");
    }
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    if (hasMediaRecorder) {
      const mimeCandidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg",
      ];
      const mime = mimeCandidates.find((m) => {
        try { return MediaRecorder.isTypeSupported(m); } catch (_) { return false; }
      });
      mediaRecorder = mime ? new MediaRecorder(mediaStream, { mimeType: mime }) : new MediaRecorder(mediaStream);
      mediaRecorder.addEventListener("dataavailable", (e) => {
        if (e.data && e.data.size > 0) audioChunks.push(e.data);
      });
      mediaRecorder.addEventListener("stop", finalizeAudio);
      mediaRecorder.start();
    }
  }

  function stopMediaRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      try { mediaRecorder.stop(); } catch (_) {}
    }
    if (mediaStream) {
      try { mediaStream.getTracks().forEach((t) => t.stop()); } catch (_) {}
      mediaStream = null;
    }
  }

  async function finalizeAudio() {
    if (audioChunks.length === 0) return;
    const type = mediaRecorder && mediaRecorder.mimeType ? mediaRecorder.mimeType : "audio/webm";
    const blob = new Blob(audioChunks, { type });
    if (state.lastAudioUrl) URL.revokeObjectURL(state.lastAudioUrl);
    state.lastAudioUrl = URL.createObjectURL(blob);
    els.playbackRow.classList.remove("hidden");

    // SR が結果を返した場合はそのまま終了
    if (state.audioGotResult) return;

    // Whisper が使える環境なら自動で解析
    if (whisper.state === "ready") {
      setStatus("Whisperで解析中…", "recording");
      try {
        const text = await transcribeWithWhisper(blob);
        if (text) {
          state.audioGotResult = true;
          handleHeard(text);
          return;
        }
      } catch (e) {
        console.error("Whisper transcription failed:", e);
        setStatus("Whisper解析に失敗: " + (e.message || e), "error");
      }
    }

    // フォールバック: 自分の声で聞き比べ
    els.heard.textContent = "（テキスト認識は使えませんでした。下のボタンで自分の声を聞き比べてみましょう。）";
    if (whisper.state === "idle" && (isSafari || !recognition)) {
      setStatus("画面上部の「音声認識を有効化」を押すと、Safariでも自動採点が使えます。", "");
    } else if (whisper.state !== "ready") {
      setStatus("録音は成功しました。お手本と聞き比べてみましょう。", "");
    }
  }

  function playRecordedVoice() {
    if (!state.lastAudioUrl) return;
    const a = new Audio(state.lastAudioUrl);
    a.play().catch(() => {});
  }

  // ----- Speech Recognition setup -----
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  if (SR) {
    recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
  }

  // ----- Phrase navigation -----
  function currentPhrase() {
    if (state.custom) return state.custom;
    return state.phrases[state.index];
  }

  function renderPhrase() {
    const p = currentPhrase();
    els.target.textContent = p.en;
    els.translation.textContent = p.ja || "";
    els.hint.textContent = p.hint ? `💡 ${p.hint}` : "";
    resetResults();
  }

  function setLevel(level) {
    state.level = level;
    state.phrases = window.PHRASES[level] || window.PHRASES.intermediate;
    state.index = 0;
    state.custom = null;
    renderPhrase();
  }

  function step(dir) {
    if (state.custom) state.custom = null;
    state.index = (state.index + dir + state.phrases.length) % state.phrases.length;
    renderPhrase();
  }

  function shuffle() {
    if (state.custom) state.custom = null;
    if (state.phrases.length <= 1) return;
    let next;
    do {
      next = Math.floor(Math.random() * state.phrases.length);
    } while (next === state.index);
    state.index = next;
    renderPhrase();
  }

  // ----- TTS (model audio) -----
  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = state.rate;
    // Prefer a high-quality EN voice if available
    const voices = window.speechSynthesis.getVoices();
    const enVoices = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith("en"));
    const preferred = enVoices.find((v) => /Google|Samantha|Natural|Microsoft/i.test(v.name));
    utter.voice = preferred || enVoices[0] || null;
    window.speechSynthesis.speak(utter);
  }

  // ----- Status helpers -----
  function setStatus(msg, kind = "") {
    els.status.textContent = msg;
    els.status.className = "status-bar" + (kind ? " " + kind : "");
  }

  // ----- Tokenization & comparison -----
  function normalize(text) {
    return text
      .toLowerCase()
      .replace(/[‘’']/g, "'")
      .replace(/[^a-z0-9'\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokens(text) {
    return normalize(text).split(" ").filter(Boolean);
  }

  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[m][n];
  }

  function wordSimilarity(a, b) {
    if (a === b) return 1;
    const d = levenshtein(a, b);
    const max = Math.max(a.length, b.length);
    return max === 0 ? 1 : 1 - d / max;
  }

  // Align two word lists using simplified Needleman-Wunsch
  function alignWords(refs, hyps) {
    const m = refs.length, n = hyps.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    const back = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(null));
    // Costs: match=-1*sim, mismatch=1, gap=1
    for (let i = 0; i <= m; i++) { dp[i][0] = i; back[i][0] = "up"; }
    for (let j = 0; j <= n; j++) { dp[0][j] = j; back[0][j] = "left"; }
    back[0][0] = null;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const sim = wordSimilarity(refs[i - 1], hyps[j - 1]);
        const subCost = sim >= 0.55 ? 1 - sim : 1;
        const diag = dp[i - 1][j - 1] + subCost;
        const up = dp[i - 1][j] + 1;     // missing (in ref, not in hyp)
        const left = dp[i][j - 1] + 1;   // extra  (in hyp, not in ref)
        const best = Math.min(diag, up, left);
        dp[i][j] = best;
        back[i][j] = best === diag ? "diag" : best === up ? "up" : "left";
      }
    }
    // Trace back
    const ops = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
      const dir = back[i][j];
      if (dir === "diag") {
        const sim = wordSimilarity(refs[i - 1], hyps[j - 1]);
        ops.push({
          type: sim === 1 ? "correct" : sim >= 0.55 ? "partial" : "wrong",
          ref: refs[i - 1],
          hyp: hyps[j - 1],
          sim,
        });
        i--; j--;
      } else if (dir === "up") {
        ops.push({ type: "missing", ref: refs[i - 1], hyp: null });
        i--;
      } else {
        ops.push({ type: "extra", ref: null, hyp: hyps[j - 1] });
        j--;
      }
    }
    return ops.reverse();
  }

  // ----- Pronunciation tips (Japanese-speaker-focused) -----
  const TIP_RULES = [
    {
      test: (ref, hyp) => /(.+)l(.*)/.test(ref) && /(.+)r(.*)/.test(hyp) && ref.replace(/l/g, "r") === hyp,
      tip: "L↔R の混同: 「{ref}」の /l/ は舌先を上の歯茎にしっかり付けて。/r/ は付けずに舌を浮かせる。",
    },
    {
      test: (ref, hyp) => /(.+)r(.*)/.test(ref) && /(.+)l(.*)/.test(hyp) && ref.replace(/r/g, "l") === hyp,
      tip: "L↔R の混同: 「{ref}」の /r/ は舌を口内で浮かせて発音。L とは舌の位置が違う。",
    },
    {
      test: (ref, hyp) => /th/.test(ref) && (/s|z|d|t/.test(hyp.replace(/th/g, ""))),
      tip: "/θ/ または /ð/ の音: 「{ref}」は舌先を上前歯につけて息を出す。「サ行」「ザ行」ではない。",
    },
    {
      test: (ref, hyp) => /v/.test(ref) && /b/.test(hyp) && ref.replace(/v/g, "b") === hyp,
      tip: "V↔B の混同: 「{ref}」の /v/ は下唇を上の歯で軽く噛んで声を出す。",
    },
    {
      test: (ref, hyp) => /f/.test(ref) && /h|p/.test(hyp),
      tip: "/f/ は下唇を歯につけて息のみ。「フ」とは違う唇の形。",
    },
    {
      test: (ref) => /ee|ea|ie/.test(ref),
      tip: "長母音 /iː/: 「{ref}」は口を横に強く引いて長めに伸ばす。",
    },
    {
      test: (ref, hyp) => Math.abs(ref.length - hyp.length) >= 3,
      tip: "音節の脱落: 「{ref}」をゆっくり、各音節をはっきり発音してみよう。",
    },
  ];

  function diagnose(ops) {
    const tips = new Map();
    for (const op of ops) {
      if (op.type === "wrong" || op.type === "partial") {
        for (const rule of TIP_RULES) {
          try {
            if (rule.test(op.ref || "", op.hyp || "")) {
              const key = rule.tip.replace("{ref}", op.ref || "");
              tips.set(key, true);
              break;
            }
          } catch (_) {}
        }
      } else if (op.type === "missing") {
        tips.set(`単語の抜け: 「${op.ref}」が聞き取れませんでした。少し強めに発音してみよう。`, true);
      }
    }
    return Array.from(tips.keys());
  }

  // ----- Render result -----
  function renderDiff(ops) {
    els.wordDiff.innerHTML = "";
    if (ops.length === 0) {
      els.wordDiff.innerHTML = '<span class="muted">録音すると、ここに単語ごとの正誤が表示されます。</span>';
      return;
    }
    for (const op of ops) {
      const span = document.createElement("span");
      span.className = "word " + op.type;
      if (op.type === "correct") span.textContent = op.ref;
      else if (op.type === "partial") span.textContent = `${op.ref} → ${op.hyp}`;
      else if (op.type === "wrong") span.textContent = `${op.ref}≠${op.hyp}`;
      else if (op.type === "missing") span.textContent = `(${op.ref})`;
      else if (op.type === "extra") span.textContent = `+${op.hyp}`;
      els.wordDiff.appendChild(span);
    }
  }

  function renderTips(tips) {
    els.tips.innerHTML = "";
    if (tips.length === 0) {
      const li = document.createElement("li");
      li.textContent = "素晴らしい！明確に発音できています。";
      li.style.color = "var(--good)";
      els.tips.appendChild(li);
      return;
    }
    for (const t of tips) {
      const li = document.createElement("li");
      li.textContent = t;
      els.tips.appendChild(li);
    }
  }

  function computeScore(ops) {
    if (ops.length === 0) return 0;
    let total = 0, hit = 0;
    for (const op of ops) {
      if (op.type === "correct") { total += 1; hit += 1; }
      else if (op.type === "partial") { total += 1; hit += op.sim || 0.6; }
      else if (op.type === "wrong") { total += 1; hit += 0.2; }
      else if (op.type === "missing") { total += 1; }
      else if (op.type === "extra") { total += 0.5; }
    }
    return Math.max(0, Math.min(100, Math.round((hit / total) * 100)));
  }

  function setScore(score) {
    els.scorePill.textContent = `${score} / 100`;
    els.scorePill.className = "score-pill " + (score >= 85 ? "good" : score >= 60 ? "ok" : "bad");
  }

  function resetResults() {
    els.heard.textContent = "まだ録音されていません";
    els.scorePill.textContent = "— / 100";
    els.scorePill.className = "score-pill";
    els.wordDiff.innerHTML = '<span class="muted">録音すると、ここに単語ごとの正誤が表示されます。</span>';
    els.tips.innerHTML = '<li class="muted">録音すると、苦手な音に対するアドバイスを表示します。</li>';
  }

  // ----- History -----
  function pushHistory(entry) {
    state.history.unshift(entry);
    if (state.history.length > 30) state.history.pop();
    saveHistory();
    renderHistory();
  }

  function renderHistory() {
    els.history.innerHTML = "";
    if (state.history.length === 0) {
      const li = document.createElement("li");
      li.className = "muted";
      li.textContent = "録音を行うと、ここに履歴が追加されます。";
      els.history.appendChild(li);
      return;
    }
    for (const h of state.history) {
      const li = document.createElement("li");
      li.className = "history-item";
      const score = document.createElement("div");
      score.className = "h-score";
      score.textContent = h.score;
      score.style.color = h.score >= 85 ? "var(--good)" : h.score >= 60 ? "var(--warn)" : "var(--error)";
      const body = document.createElement("div");
      const target = document.createElement("div");
      target.className = "h-target";
      target.textContent = h.target;
      const heard = document.createElement("div");
      heard.className = "h-heard";
      heard.textContent = `🗣 ${h.heard}`;
      body.appendChild(target);
      body.appendChild(heard);
      const replay = document.createElement("button");
      replay.className = "h-replay";
      replay.textContent = "🔊";
      replay.onclick = () => speak(h.target);
      li.appendChild(score);
      li.appendChild(body);
      li.appendChild(replay);
      els.history.appendChild(li);
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem("pcoach.history", JSON.stringify(state.history));
    } catch (_) {}
  }
  function loadHistory() {
    try {
      const raw = localStorage.getItem("pcoach.history");
      if (raw) state.history = JSON.parse(raw) || [];
    } catch (_) { state.history = []; }
  }

  // ----- Recognition handlers -----
  async function startRecording() {
    state.audioGotResult = false;
    els.playbackRow.classList.add("hidden");

    // 1) まずマイク権限と録音ストリームを取得 (Safari の SR より先に getUserMedia)
    try {
      await startMediaRecording();
    } catch (e) {
      const msg = e && e.name === "NotAllowedError"
        ? "マイクの使用が許可されていません。ブラウザのアドレスバーの 🔒 や、システム設定 > プライバシー > マイク をご確認ください。"
        : (e && e.name === "NotFoundError")
        ? "マイクが見つかりませんでした。デバイスが接続されているかご確認ください。"
        : "マイクを取得できませんでした: " + (e && (e.message || e.name) || "unknown");
      setStatus(msg, "error");
      return;
    }

    // 2) 認識が使える環境なら同時に開始
    if (recognition) {
      try {
        recognition.start();
      } catch (e) {
        // すでに開始済み等のケースは無視
      }
    }

    state.isRecording = true;
    els.record.classList.add("is-recording");
    els.recordIcon.textContent = "⏹";
    els.recordLabel.textContent = "停止";
    setStatus(
      recognition
        ? "録音中… お手本通りに話してみてください。"
        : "録音中… (このブラウザでは自動採点はできません。録音後に聞き返して確認しましょう)",
      "recording"
    );
  }

  function stopRecording() {
    if (recognition) {
      try { recognition.stop(); } catch (_) {}
    }
    stopMediaRecording();
  }

  function onResult(event) {
    const res = event.results[0];
    const heard = res[0].transcript;
    state.audioGotResult = true;
    handleHeard(heard);
  }

  function handleHeard(heard) {
    const target = currentPhrase().en;
    els.heard.textContent = heard;

    const refWords = tokens(target);
    const hypWords = tokens(heard);
    const ops = alignWords(refWords, hypWords);
    const score = computeScore(ops);

    renderDiff(ops);
    renderTips(diagnose(ops));
    setScore(score);

    if (score >= 85) setStatus("素晴らしい発音です！", "success");
    else if (score >= 60) setStatus("もう少しで完璧。ヒントを参考にもう一度。", "");
    else setStatus("ヒントを確認して再挑戦してみましょう。", "");

    pushHistory({
      target,
      heard,
      score,
      ts: Date.now(),
    });
  }

  function onEnd() {
    state.isRecording = false;
    els.record.classList.remove("is-recording");
    els.recordIcon.textContent = "🎤";
    els.recordLabel.textContent = "録音開始";
  }

  function onError(e) {
    // MediaRecorder 側は別経路。SR だけ失敗した場合は録音は継続/完了し、
    // finalizeAudio() の方で「認識は使えなかった」フォールバック表示を行う。
    if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      // Safari の file:// などで頻発
      setStatus(
        isFileProto
          ? "音声認識サービスが利用できません。同梱の start.command を使い、http://localhost で開いてください。"
          : "音声認識サービスが利用できません。ブラウザのマイク許可設定をご確認ください。",
        "error"
      );
    } else if (e.error === "no-speech") {
      setStatus("音声が検出されませんでした。もう一度試してみてください。", "");
    } else if (e.error === "audio-capture") {
      setStatus("マイクから音を取得できませんでした。", "error");
    } else {
      // network や aborted など。録音は別系統で進行中なので致命的ではない。
      setStatus("音声認識エラー: " + e.error + "(録音自体は継続しています)", "");
    }
  }

  if (recognition) {
    recognition.addEventListener("result", onResult);
    recognition.addEventListener("end", onEnd);
    recognition.addEventListener("error", onError);
  }

  // ----- Event wiring -----
  els.listen.addEventListener("click", () => {
    speak(currentPhrase().en);
  });

  els.record.addEventListener("click", () => {
    if (state.isRecording) stopRecording();
    else startRecording();
  });

  els.prev.addEventListener("click", () => step(-1));
  els.next.addEventListener("click", () => step(1));
  els.shuffle.addEventListener("click", shuffle);

  els.levelSelect.addEventListener("change", (e) => setLevel(e.target.value));

  els.rateSlider.addEventListener("input", (e) => {
    state.rate = parseFloat(e.target.value);
    els.rateValue.textContent = state.rate.toFixed(2) + "x";
  });

  els.custom.addEventListener("click", () => {
    els.customModal.classList.remove("hidden");
    els.customInput.value = "";
    els.customTranslation.value = "";
    setTimeout(() => els.customInput.focus(), 50);
  });
  els.customCancel.addEventListener("click", () => els.customModal.classList.add("hidden"));
  els.customApply.addEventListener("click", () => {
    const en = els.customInput.value.trim();
    if (!en) return;
    state.custom = {
      en,
      ja: els.customTranslation.value.trim(),
      hint: "自由入力フレーズ。ゆっくり、明瞭に発音しましょう。",
    };
    els.customModal.classList.add("hidden");
    renderPhrase();
  });
  els.customModal.addEventListener("click", (e) => {
    if (e.target === els.customModal) els.customModal.classList.add("hidden");
  });

  els.clearHistory.addEventListener("click", () => {
    if (!confirm("履歴を全て削除しますか？")) return;
    state.history = [];
    saveHistory();
    renderHistory();
  });

  els.playMyVoice.addEventListener("click", playRecordedVoice);
  els.playModel.addEventListener("click", () => speak(currentPhrase().en));
  els.bannerClose.addEventListener("click", () => els.banner.classList.add("hidden"));
  els.enableWhisper.addEventListener("click", () => {
    loadWhisper().catch(() => {});
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea, select")) return;
    if (e.code === "Space") {
      e.preventDefault();
      if (state.isRecording) stopRecording();
      else startRecording();
    } else if (e.key === "l" || e.key === "L") {
      speak(currentPhrase().en);
    } else if (e.key === "ArrowRight") {
      step(1);
    } else if (e.key === "ArrowLeft") {
      step(-1);
    }
  });

  // Voices may load asynchronously
  if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = () => {};
    window.speechSynthesis.getVoices();
  }

  // ----- Banner messaging -----
  function showBanner(title, html, showWhisperBtn) {
    els.bannerTitle.textContent = title;
    els.bannerText.innerHTML = html;
    els.banner.classList.remove("hidden");
    els.bannerActions.classList.toggle("hidden", !showWhisperBtn);
  }

  // ----- Init -----
  function init() {
    // 環境ごとの案内
    if (isSafari && isFileProto) {
      showBanner(
        "Safari ではローカルサーバが必要です",
        'Safari は <code>file://</code> ではマイクが使えません。フォルダ内の ' +
          '<code>start.command</code> をダブルクリックして <code>http://localhost:8765</code> から開いてください。',
        false
      );
    } else if (isSafari) {
      // Safari は webkitSpeechRecognition があっても実装が動かないため、
      // Whisper を読み込めば自動採点が可能になる旨を案内
      showBanner(
        "Safariでも自動採点を使うには",
        "Safari は標準の音声認識APIが機能しないため、ブラウザ内で動く小型のWhisperモデルを読み込んで使います。" +
          "初回のみ約40MBをダウンロードします（次回以降はブラウザにキャッシュされます）。",
        true
      );
    }

    if (!recognition && !hasGetUserMedia) {
      setStatus("⚠️ このブラウザはマイク機能に対応していません。", "error");
      els.record.disabled = true;
      els.record.style.opacity = 0.5;
    } else if (!recognition) {
      setStatus(
        "このブラウザの音声認識は使えません。上の「音声認識を有効化」を押すか、お手本との聞き比べモードで練習しましょう。",
        ""
      );
    } else if (isSafari) {
      setStatus(
        "Safariの音声認識は動作しないことがあります。「音声認識を有効化」を押しておくと安定して使えます。",
        ""
      );
    } else {
      setStatus("「お手本を聞く」→「録音開始」の順で練習してみましょう。Spaceキーで録音開始/停止。");
    }
    loadHistory();
    renderHistory();
    setLevel(state.level);
  }

  init();
})();
