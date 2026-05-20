// audio-features.js — Web Audio API による音響特徴 (ピッチ、エネルギー) 抽出 & 描画

(() => {
  "use strict";

  // Blob (MediaRecorder の出力) → 16kHz monoの Float32Array へ
  async function decodeToMono(blob, targetRate) {
    const arrayBuffer = await blob.arrayBuffer();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtx();
    let decoded;
    try {
      decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    } finally {
      try { audioCtx.close(); } catch (_) {}
    }
    const rate = targetRate || decoded.sampleRate;
    if (Math.abs(decoded.sampleRate - rate) < 1 && decoded.numberOfChannels === 1) {
      return { data: decoded.getChannelData(0), sampleRate: rate, duration: decoded.duration };
    }
    const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const frames = Math.max(1, Math.ceil(decoded.duration * rate));
    const off = new OfflineCtx(1, frames, rate);
    const src = off.createBufferSource();
    src.buffer = decoded;
    src.connect(off.destination);
    src.start(0);
    const rendered = await off.startRendering();
    return { data: rendered.getChannelData(0), sampleRate: rate, duration: rendered.duration };
  }

  // 自己相関を用いた簡易ピッチ検出
  // 80Hz〜500Hz の範囲で基本周波数を探索
  function detectPitchAutocorr(frame, sampleRate) {
    const minLag = Math.floor(sampleRate / 500);
    const maxLag = Math.floor(sampleRate / 80);
    const N = frame.length;
    // 簡易 RMS による無音判定
    let energy = 0;
    for (let i = 0; i < N; i++) energy += frame[i] * frame[i];
    const rms = Math.sqrt(energy / N);
    if (rms < 0.01) return 0;

    let bestLag = -1, bestCorr = -Infinity;
    for (let lag = minLag; lag < maxLag && lag < N; lag++) {
      let sum = 0;
      for (let i = 0; i + lag < N; i++) sum += frame[i] * frame[i + lag];
      // ノーマライズ
      const norm = sum / (N - lag);
      if (norm > bestCorr) {
        bestCorr = norm;
        bestLag = lag;
      }
    }
    if (bestLag < 0) return 0;
    // 閾値: 自己相関のピークが十分鋭くないとき無声扱い
    if (bestCorr < rms * rms * 0.4) return 0;
    return sampleRate / bestLag;
  }

  function rms(frame) {
    let s = 0;
    for (let i = 0; i < frame.length; i++) s += frame[i] * frame[i];
    return Math.sqrt(s / frame.length);
  }

  // 音声を一定窓で走査し、ピッチ列・エネルギー列を返す
  async function analyzeBlob(blob) {
    const { data, sampleRate, duration } = await decodeToMono(blob, 16000);
    const frameSize = 1024; // ~64ms @ 16kHz
    const hop = 512;        // ~32ms
    const pitch = [];
    const energy = [];
    const times = [];
    for (let i = 0; i + frameSize < data.length; i += hop) {
      const frame = data.subarray(i, i + frameSize);
      pitch.push(detectPitchAutocorr(frame, sampleRate));
      energy.push(rms(frame));
      times.push((i + frameSize / 2) / sampleRate);
    }
    // ピッチ系列の中央値スムージング (3-window) でアウトライア除去
    const smoothed = smoothMedian(pitch, 3);
    return { pitch: smoothed, energy, times, sampleRate, duration };
  }

  function smoothMedian(arr, k) {
    const half = Math.floor(k / 2);
    const out = new Array(arr.length).fill(0);
    for (let i = 0; i < arr.length; i++) {
      const slice = [];
      for (let j = -half; j <= half; j++) {
        const idx = i + j;
        if (idx >= 0 && idx < arr.length) slice.push(arr[idx]);
      }
      slice.sort((a, b) => a - b);
      out[i] = slice[Math.floor(slice.length / 2)];
    }
    return out;
  }

  // Canvas へ描画
  function drawContour(canvas, values, opts) {
    opts = opts || {};
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // 背景グリッド
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let g = 1; g <= 3; g++) {
      const y = (H * g) / 4;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // 有効な値だけで最大値計算
    const valid = values.filter((v) => v > 0);
    if (valid.length === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = "12px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(opts.emptyLabel || "(データなし)", W / 2, H / 2);
      return;
    }
    const minV = opts.min != null ? opts.min : Math.min(...valid);
    const maxV = opts.max != null ? opts.max : Math.max(...valid);
    const span = Math.max(1e-6, maxV - minV);

    // 帯塗り (面)
    ctx.fillStyle = opts.fill || "rgba(124, 92, 255, 0.18)";
    ctx.beginPath();
    let started = false;
    values.forEach((v, i) => {
      const x = (i / (values.length - 1 || 1)) * W;
      const norm = v > 0 ? (v - minV) / span : 0;
      const y = H - norm * H * 0.9 - H * 0.05;
      if (v > 0) {
        if (!started) { ctx.moveTo(x, H); ctx.lineTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      } else if (started) {
        ctx.lineTo(x, H);
        started = false;
      }
    });
    if (started) ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();

    // 折れ線
    ctx.strokeStyle = opts.stroke || "#7c5cff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    let drawing = false;
    values.forEach((v, i) => {
      const x = (i / (values.length - 1 || 1)) * W;
      const norm = v > 0 ? (v - minV) / span : 0;
      const y = H - norm * H * 0.9 - H * 0.05;
      if (v > 0) {
        if (!drawing) { ctx.moveTo(x, y); drawing = true; }
        else ctx.lineTo(x, y);
      } else {
        drawing = false;
      }
    });
    ctx.stroke();

    // Y軸ラベル (min/max)
    if (opts.unit) {
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.font = "10px system-ui";
      ctx.textAlign = "right";
      ctx.fillText(Math.round(maxV) + opts.unit, W - 4, 12);
      ctx.fillText(Math.round(minV) + opts.unit, W - 4, H - 4);
    }
  }

  // 統計 (発話レート、平均ピッチ、ピッチレンジ)
  function summarize(features) {
    const { pitch, energy, times, duration } = features;
    const voiced = pitch.filter((v) => v > 0);
    const meanPitch = voiced.length ? voiced.reduce((a, b) => a + b, 0) / voiced.length : 0;
    const minPitch = voiced.length ? Math.min(...voiced) : 0;
    const maxPitch = voiced.length ? Math.max(...voiced) : 0;
    const energyMean = energy.length ? energy.reduce((a, b) => a + b, 0) / energy.length : 0;

    // 簡易音節カウント: エネルギーピーク数
    let peaks = 0;
    const thr = energyMean * 1.4;
    for (let i = 2; i < energy.length - 2; i++) {
      if (
        energy[i] > thr &&
        energy[i] > energy[i - 1] &&
        energy[i] > energy[i + 1] &&
        energy[i] > energy[i - 2] &&
        energy[i] > energy[i + 2]
      ) peaks++;
    }
    const sylPerSec = duration > 0 ? peaks / duration : 0;

    return {
      meanPitch: Math.round(meanPitch),
      pitchRange: Math.round(maxPitch - minPitch),
      sylPerSec: +sylPerSec.toFixed(2),
      durationSec: +duration.toFixed(2),
    };
  }

  window.AudioFeatures = { analyzeBlob, drawContour, summarize };
})();
