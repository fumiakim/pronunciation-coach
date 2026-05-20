// audio-features.js — Web Audio API による音響特徴 (ピッチ、エネルギー) 抽出 & 描画

(() => {
  "use strict";

  // Blob (MediaRecorder の出力) → mono Float32Array (デタッチ済みコピー)
  async function decodeToMono(blob, targetRate) {
    const arrayBuffer = await blob.arrayBuffer();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtx();
    let decoded;
    try {
      decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    } catch (e) {
      try { audioCtx.close(); } catch (_) {}
      throw new Error("decodeAudioData failed: " + (e && e.message ? e.message : e));
    }

    try {
      const rate = targetRate || decoded.sampleRate;
      // 既に target レート + mono ならそのまま
      if (Math.abs(decoded.sampleRate - rate) < 1 && decoded.numberOfChannels === 1) {
        return {
          data: new Float32Array(decoded.getChannelData(0)),
          sampleRate: rate,
          duration: decoded.duration,
        };
      }
      // 16kHz mono へリサンプル
      const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const frames = Math.max(1, Math.ceil(decoded.duration * rate));
      const off = new OfflineCtx(1, frames, rate);
      const src = off.createBufferSource();
      src.buffer = decoded;
      src.connect(off.destination);
      src.start(0);
      const rendered = await off.startRendering();
      return {
        data: new Float32Array(rendered.getChannelData(0)),
        sampleRate: rate,
        duration: rendered.duration,
      };
    } finally {
      try { audioCtx.close(); } catch (_) {}
    }
  }

  // 正規化自己相関 (NACF) によるピッチ検出
  // 80Hz〜500Hz の範囲。閾値は緩めに設定し、有声フレームを取りこぼさない。
  function detectPitchAutocorr(frame, sampleRate) {
    const N = frame.length;
    let energy = 0;
    for (let i = 0; i < N; i++) energy += frame[i] * frame[i];
    if (energy < 1e-5) return 0;

    const minLag = Math.max(2, Math.floor(sampleRate / 500));
    const maxLag = Math.min(N - 2, Math.floor(sampleRate / 80));

    let bestLag = -1, bestRho = -Infinity;
    for (let lag = minLag; lag < maxLag; lag++) {
      let s1 = 0, s2 = 0, s3 = 0;
      for (let i = 0; i + lag < N; i++) {
        const a = frame[i];
        const b = frame[i + lag];
        s1 += a * b;
        s2 += a * a;
        s3 += b * b;
      }
      const denom = Math.sqrt(s2 * s3);
      if (denom < 1e-10) continue;
      const rho = s1 / denom;
      if (rho > bestRho) {
        bestRho = rho;
        bestLag = lag;
      }
    }
    if (bestLag < 0 || bestRho < 0.3) return 0;
    return sampleRate / bestLag;
  }

  function rms(frame) {
    let s = 0;
    for (let i = 0; i < frame.length; i++) s += frame[i] * frame[i];
    return Math.sqrt(s / frame.length);
  }

  async function analyzeBlob(blob) {
    const { data, sampleRate, duration } = await decodeToMono(blob, 16000);
    const frameSize = 1024; // ~64ms @ 16kHz
    const hop = 512;
    const pitch = [];
    const energy = [];
    const times = [];
    for (let i = 0; i + frameSize < data.length; i += hop) {
      const frame = data.subarray(i, i + frameSize);
      pitch.push(detectPitchAutocorr(frame, sampleRate));
      energy.push(rms(frame));
      times.push((i + frameSize / 2) / sampleRate);
    }
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

  // バッキングストアを表示サイズに合わせる
  function fitCanvas(canvas) {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return false;
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    return true;
  }

  function drawContour(canvas, values, opts) {
    opts = opts || {};
    fitCanvas(canvas);
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, W, H);

    // 背景グリッド
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let g = 1; g <= 3; g++) {
      const y = (H * g) / 4;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    const ref = Array.isArray(opts.reference) ? opts.reference : null;
    const combined = ref ? values.concat(ref) : values;
    const valid = combined.filter((v) => v > 0);
    if (valid.length === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.font = (12 * dpr) + "px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(opts.emptyLabel || "(データなし)", W / 2, H / 2);
      return;
    }

    const minV = opts.min != null ? opts.min : Math.min(...valid);
    const maxV = opts.max != null ? opts.max : Math.max(...valid);
    const span = Math.max(1e-6, maxV - minV);

    function plotLine(arr, lineOpts) {
      const N = arr.length;
      if (lineOpts.fill) {
        ctx.fillStyle = lineOpts.fill;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < N; i++) {
          const v = arr[i];
          const x = (i / (N - 1 || 1)) * W;
          const norm = v > 0 ? (v - minV) / span : 0;
          const y = H - norm * H * 0.85 - H * 0.08;
          if (v > 0) {
            if (!started) { ctx.moveTo(x, H); ctx.lineTo(x, y); started = true; }
            else ctx.lineTo(x, y);
          } else if (started) {
            ctx.lineTo(x, H); started = false;
          }
        }
        if (started) ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fill();
      }

      ctx.strokeStyle = lineOpts.stroke;
      ctx.lineWidth = lineOpts.lineWidth || 2 * dpr * 0.6;
      ctx.setLineDash(lineOpts.dash || []);
      ctx.beginPath();
      let drawing = false;
      for (let i = 0; i < N; i++) {
        const v = arr[i];
        const x = (i / (N - 1 || 1)) * W;
        const norm = v > 0 ? (v - minV) / span : 0;
        const y = H - norm * H * 0.85 - H * 0.08;
        if (v > 0) {
          if (!drawing) { ctx.moveTo(x, y); drawing = true; }
          else ctx.lineTo(x, y);
        } else {
          drawing = false;
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 参照カーブを背景に
    if (ref) {
      plotLine(ref, {
        stroke: opts.referenceStroke || "rgba(255,255,255,0.55)",
        lineWidth: 1.5 * dpr,
        dash: [6 * dpr, 4 * dpr],
      });
    }

    // ユーザー曲線を上に
    plotLine(values, {
      fill: opts.fill,
      stroke: opts.stroke || "#7c5cff",
      lineWidth: 2 * dpr * 0.7,
    });

    // Y軸ラベル
    if (opts.unit) {
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = (10 * dpr) + "px system-ui";
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      ctx.fillText(Math.round(maxV) + opts.unit, W - 6 * dpr, 4 * dpr);
      ctx.textBaseline = "bottom";
      ctx.fillText(Math.round(minV) + opts.unit, W - 6 * dpr, H - 4 * dpr);
    }
  }

  function drawError(canvas, message) {
    fitCanvas(canvas);
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255, 107, 138, 0.7)";
    const dpr = window.devicePixelRatio || 1;
    ctx.font = (12 * dpr) + "px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⚠ " + message, W / 2, H / 2);
  }

  function summarize(features) {
    const { pitch, energy, duration } = features;
    const voiced = pitch.filter((v) => v > 0);
    const meanPitch = voiced.length ? voiced.reduce((a, b) => a + b, 0) / voiced.length : 0;
    const minPitch = voiced.length ? Math.min(...voiced) : 0;
    const maxPitch = voiced.length ? Math.max(...voiced) : 0;
    const energyMean = energy.length ? energy.reduce((a, b) => a + b, 0) / energy.length : 0;
    const energyMax = energy.length ? Math.max(...energy) : 0;

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
      minPitch: Math.round(minPitch),
      maxPitch: Math.round(maxPitch),
      pitchRange: Math.round(maxPitch - minPitch),
      voicedFrames: voiced.length,
      totalFrames: pitch.length,
      energyMean: +energyMean.toFixed(4),
      energyMax: +energyMax.toFixed(4),
      sylPerSec: +sylPerSec.toFixed(2),
      durationSec: +duration.toFixed(2),
    };
  }

  window.AudioFeatures = { analyzeBlob, drawContour, drawError, summarize, fitCanvas };
})();
