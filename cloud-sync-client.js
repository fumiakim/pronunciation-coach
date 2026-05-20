// cloud-sync-client.js
// HTTP client for the cloud-backed study-time aggregation API hosted
// by shadowing-app (Vercel KV behind /api/study-time).
//
// Replaces the previous iframe postMessage bridge (study-sync-client.js).
// Identity = anonymous UUID from bucket-id.js. The same UUID across
// devices = the same per-day totals.
//
// Public API on window.CloudSync:
//   addSeconds(secs)          - schedule increment for "pronunciation"
//   getRange(days)            - read last N days [{date, shad, pron}]
//   migrateOnce()             - one-time push of legacy localStorage
//   getApiBase() / setApiBase(url)
//   SYNC_UPDATED_EVENT        - custom event name fired on cloud changes

(function (root) {
  "use strict";

  if (!root.StudyBucket) {
    console.warn("[cloud-sync] bucket-id.js must load before this script");
    return;
  }

  // Actual production deployment for shadowing-app on Vercel. The bare
  // "shadowing-app.vercel.app" hostname was taken by another project, so
  // Vercel issued this -virid suffix. End users can still override this
  // via the gear panel → "クラウド API のベース URL".
  var DEFAULT_API_BASE = "https://shadowing-app-virid.vercel.app";
  var API_BASE_KEY = "study-api-base";
  var MIGRATION_FLAG_KEY = "study-migration-v2";
  var FLUSH_INTERVAL_MS = 5000;
  var SYNC_UPDATED_EVENT = "study-sync:updated";
  var APP_NAME = "pronunciation";

  function getApiBase() {
    try {
      // ?api=... query overrides for ad-hoc testing
      var qs = new URL(window.location.href).searchParams.get("api");
      if (qs) {
        try {
          new URL(qs);
          localStorage.setItem(API_BASE_KEY, qs.replace(/\/$/, ""));
        } catch (_) {}
      }
      var stored = localStorage.getItem(API_BASE_KEY);
      if (stored) return stored.replace(/\/$/, "");
    } catch (_) {}
    return DEFAULT_API_BASE;
  }

  function setApiBase(url) {
    var trimmed = String(url || "").trim().replace(/\/$/, "");
    if (!trimmed) {
      localStorage.removeItem(API_BASE_KEY);
      return;
    }
    new URL(trimmed); // throws if invalid
    localStorage.setItem(API_BASE_KEY, trimmed);
  }

  function endpoint() {
    return getApiBase() + "/api/study-time";
  }

  function notify() {
    try {
      window.dispatchEvent(new CustomEvent(SYNC_UPDATED_EVENT));
    } catch (_) {}
  }

  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function postJson(body) {
    return fetch(endpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    })
      .then(function (res) {
        if (!res.ok) return null;
        return res.json().catch(function () { return null; });
      })
      .catch(function () { return null; });
  }

  // ── batched writer ────────────────────────────────────────────
  var buffer = null; // { day, addSeconds }
  var flushTimer = null;

  function flush() {
    if (!buffer || buffer.addSeconds <= 0) return Promise.resolve();
    var buf = buffer;
    buffer = null;
    var bucket = root.StudyBucket.get();
    if (!bucket) return Promise.resolve();
    return postJson({
      bucket: bucket,
      app: APP_NAME,
      day: buf.day,
      addSeconds: buf.addSeconds,
    }).then(notify);
  }

  function scheduleFlush() {
    if (flushTimer != null) return;
    flushTimer = setTimeout(function () {
      flushTimer = null;
      flush();
    }, FLUSH_INTERVAL_MS);
  }

  function addSeconds(seconds) {
    if (!isFinite(seconds) || seconds <= 0) return;
    var day = todayStr();
    var inc = Math.round(seconds);
    if (buffer && buffer.day === day) {
      buffer.addSeconds += inc;
    } else {
      if (buffer) flush();
      buffer = { day: day, addSeconds: inc };
    }
    scheduleFlush();
  }

  // ── reads ────────────────────────────────────────────────────
  function getRange(days) {
    var bucket = root.StudyBucket.get();
    if (!bucket) return Promise.resolve([]);
    var n = Math.min(60, Math.max(1, Number(days) || 7));
    var url = endpoint() + "?bucket=" + encodeURIComponent(bucket) + "&days=" + encodeURIComponent(String(n));
    return fetch(url, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) return [];
        return res.json().then(function (data) {
          return (data && data.days) || [];
        });
      })
      .catch(function () { return []; });
  }

  // ── pagehide → sendBeacon ────────────────────────────────────
  window.addEventListener("pagehide", function () {
    if (!buffer || buffer.addSeconds <= 0) return;
    var bucket = root.StudyBucket.get();
    if (!bucket) return;
    try {
      var blob = new Blob(
        [
          JSON.stringify({
            bucket: bucket,
            app: APP_NAME,
            day: buffer.day,
            addSeconds: buffer.addSeconds,
          }),
        ],
        { type: "application/json" }
      );
      navigator.sendBeacon(endpoint(), blob);
    } catch (_) {}
    buffer = null;
  });

  // ── one-time migration of legacy localStorage ────────────────
  var migrationPromise = null;

  function migrateOnce() {
    if (migrationPromise) return migrationPromise;
    if (localStorage.getItem(MIGRATION_FLAG_KEY) === "done") {
      return Promise.resolve();
    }
    var bucket = root.StudyBucket.get();
    if (!bucket) return Promise.resolve();

    migrationPromise = (function () {
      var SHAD = "shadowing-time-";
      var PRON = "pronunciation-time-";
      var entries = [];
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (!k) continue;
          var prefix = null;
          var app = null;
          if (k.indexOf(SHAD) === 0) { prefix = SHAD; app = "shadowing"; }
          else if (k.indexOf(PRON) === 0) { prefix = PRON; app = "pronunciation"; }
          if (!prefix) continue;
          var day = k.slice(prefix.length);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
          var v = parseInt(localStorage.getItem(k) || "0", 10) || 0;
          if (v > 0) entries.push({ app: app, day: day, seconds: v });
        }
      } catch (_) {}

      if (entries.length === 0) {
        try { localStorage.setItem(MIGRATION_FLAG_KEY, "done"); } catch (_) {}
        return Promise.resolve();
      }

      // Push sequentially to be polite to the API
      return entries
        .reduce(function (chain, e) {
          return chain.then(function (allOk) {
            return postJson({
              bucket: bucket,
              app: e.app,
              day: e.day,
              max: e.seconds,
            }).then(function (r) {
              return allOk && !!r;
            });
          });
        }, Promise.resolve(true))
        .then(function (allOk) {
          if (allOk) {
            try { localStorage.setItem(MIGRATION_FLAG_KEY, "done"); } catch (_) {}
            notify();
          }
        });
    })();
    return migrationPromise;
  }

  // Re-trigger migration when the user pairs to a new bucket.
  window.addEventListener(root.StudyBucket.CHANGED_EVENT, function () {
    migrationPromise = null;
    migrateOnce();
  });

  root.CloudSync = {
    addSeconds: addSeconds,
    getRange: getRange,
    migrateOnce: migrateOnce,
    getApiBase: getApiBase,
    setApiBase: setApiBase,
    SYNC_UPDATED_EVENT: SYNC_UPDATED_EVENT,
  };
})(typeof window !== "undefined" ? window : globalThis);
