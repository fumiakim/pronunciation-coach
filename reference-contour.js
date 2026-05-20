// reference-contour.js — テキストから「理想的な」ピッチ・エネルギー曲線を合成
// Phonemes.wordsWithStress (ARPABET 強勢付き) を入力に、教科書的な
// 英語イントネーション・強勢パターンを描く参照カーブを生成する。

(() => {
  "use strict";

  // 弱形 (function words) — 強勢・エネルギーを下げて表現
  const FUNCTION_WORDS = new Set([
    "a", "an", "the",
    "of", "to", "in", "on", "at", "by", "for", "with", "from", "into", "as",
    "is", "are", "was", "were", "be", "been", "being", "am",
    "have", "has", "had", "having",
    "do", "does", "did", "done",
    "will", "would", "shall", "should", "can", "could", "may", "might", "must",
    "and", "or", "but", "if", "that", "this", "than", "so",
    "i", "you", "he", "she", "it", "we", "they",
    "me", "him", "her", "us", "them",
    "my", "your", "his", "its", "our", "their",
    "not", "no",
  ]);

  function detectSentenceType(text) {
    const t = text.trim();
    if (t.endsWith("?")) return "question";
    if (t.endsWith("!")) return "exclamation";
    return "statement";
  }

  // 各音素の素の継続時間 (ms) — 自然な英語発話の経験的目安
  function basePhoneDuration(p) {
    if (p.isVowel) {
      if (p.stress === "1") return 180;
      if (p.stress === "2") return 140;
      return 90; // 弱母音 (シュワ等)
    }
    const stopCons = new Set(["p", "b", "t", "d", "k", "g"]);
    const fricCons = new Set(["s", "ʃ", "f", "θ", "z", "ʒ", "v", "ð"]);
    if (stopCons.has(p.ipa)) return 55;
    if (fricCons.has(p.ipa)) return 95;
    return 70;
  }

  function basePhoneEnergy(p, isFunc) {
    let e;
    if (p.isVowel) {
      if (p.stress === "1") e = 0.10;
      else if (p.stress === "2") e = 0.07;
      else e = 0.040;
    } else {
      const stopCons = new Set(["p", "b", "t", "d", "k", "g"]);
      const fricCons = new Set(["s", "ʃ", "f", "θ", "z", "ʒ", "v", "ð"]);
      if (stopCons.has(p.ipa)) e = 0.015;
      else if (fricCons.has(p.ipa)) e = 0.028;
      else e = 0.038; // nasal/liquid
    }
    if (isFunc) e *= 0.65;
    return e;
  }

  function basePhonePitch(p, isFunc) {
    if (!p.isVowel) return 0;
    let pitch;
    if (p.stress === "1") pitch = 170;
    else if (p.stress === "2") pitch = 135;
    else pitch = 110;
    if (isFunc) pitch -= 8;
    return pitch;
  }

  async function generate(text, totalDurationSec, numFrames) {
    const result = {
      pitch: new Array(numFrames).fill(0),
      energy: new Array(numFrames).fill(0),
    };
    if (!window.Phonemes || !window.Phonemes.wordsWithStress) return result;
    if (totalDurationSec <= 0 || numFrames <= 0) return result;

    const sentenceType = detectSentenceType(text);
    let words;
    try {
      words = await window.Phonemes.wordsWithStress(text);
    } catch (_) {
      return result;
    }
    if (!words.length) return result;

    // 音素イベントを平坦化
    const events = [];
    for (let wi = 0; wi < words.length; wi++) {
      const w = words[wi];
      const isFunc = FUNCTION_WORDS.has(w.word);
      for (let pi = 0; pi < w.phones.length; pi++) {
        events.push({
          phone: w.phones[pi],
          isFunc,
          wordEnd: pi === w.phones.length - 1 && wi < words.length - 1,
        });
      }
    }
    if (!events.length) return result;

    // 生の合計継続時間 + 単語間休止 + 文末休止
    const wordPauseMs = 35;
    const sentencePauseMs = 120;
    let rawTotal = 0;
    for (const e of events) {
      rawTotal += basePhoneDuration(e.phone);
      if (e.wordEnd) rawTotal += wordPauseMs;
    }
    rawTotal += sentencePauseMs;

    const targetMs = totalDurationSec * 1000;
    const scale = targetMs / Math.max(1, rawTotal);

    // 文末強勢音節 (の中で最後のもの) を特定
    let lastStressedIdx = -1;
    for (let i = 0; i < events.length; i++) {
      if (events[i].phone.isVowel && events[i].phone.stress === "1") {
        lastStressedIdx = i;
      }
    }

    let curMs = 0;
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      const dur = basePhoneDuration(e.phone) * scale;
      const startFrame = Math.floor((curMs / targetMs) * numFrames);
      const endFrame = Math.min(numFrames, Math.floor(((curMs + dur) / targetMs) * numFrames));

      // 文全体の漸減 (declination)
      const progress = (curMs + dur / 2) / targetMs;
      const decl = progress * 22; // 約 -22Hz over sentence

      let phPitch = basePhonePitch(e.phone, e.isFunc);
      if (phPitch > 0) phPitch -= decl;

      // 文末イントネーション境界
      if (i === lastStressedIdx) {
        if (sentenceType === "question") phPitch += 40;
        else phPitch -= 10;
      } else if (i > lastStressedIdx && phPitch > 0) {
        if (sentenceType === "question") phPitch += 28;
        else phPitch = Math.max(80, phPitch - 18);
      }

      const phEnergy = basePhoneEnergy(e.phone, e.isFunc);

      for (let f = startFrame; f < endFrame; f++) {
        result.pitch[f] = phPitch;
        result.energy[f] = phEnergy;
      }
      curMs += dur;

      if (e.wordEnd) {
        const pauseDur = wordPauseMs * scale;
        const pStart = Math.floor((curMs / targetMs) * numFrames);
        const pEnd = Math.min(numFrames, Math.floor(((curMs + pauseDur) / targetMs) * numFrames));
        for (let f = pStart; f < pEnd; f++) {
          result.pitch[f] = 0;
          result.energy[f] = 0;
        }
        curMs += pauseDur;
      }
    }

    return {
      pitch: smoothNonZero(result.pitch, 3),
      energy: smoothMA(result.energy, 3),
    };
  }

  // 0でない値だけで近傍平均 (0は無声扱いなので埋めない)
  function smoothNonZero(arr, w) {
    const out = new Array(arr.length);
    const half = Math.floor(w / 2);
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === 0) { out[i] = 0; continue; }
      let sum = 0, n = 0;
      for (let j = -half; j <= half; j++) {
        const idx = i + j;
        if (idx >= 0 && idx < arr.length && arr[idx] > 0) {
          sum += arr[idx]; n++;
        }
      }
      out[i] = n > 0 ? sum / n : 0;
    }
    return out;
  }
  function smoothMA(arr, w) {
    const out = new Array(arr.length);
    const half = Math.floor(w / 2);
    for (let i = 0; i < arr.length; i++) {
      let sum = 0, n = 0;
      for (let j = -half; j <= half; j++) {
        const idx = i + j;
        if (idx >= 0 && idx < arr.length) { sum += arr[idx]; n++; }
      }
      out[i] = n > 0 ? sum / n : arr[i];
    }
    return out;
  }

  window.ReferenceContour = { generate };
})();
