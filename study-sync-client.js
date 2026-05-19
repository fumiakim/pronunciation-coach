// study-sync-client.js
// shadowing-app など別オリジンから sync.html を iframe で読み込んで
// 学習時間 (発音 + シャドーイング) を共有するためのクライアント。
//
// 使い方:
//   <script src="https://fumiakim.github.io/pronunciation-coach/study-sync-client.js"></script>
//   <script>
//     const sync = window.StudySync.create({
//       bridge: "https://fumiakim.github.io/pronunciation-coach/sync.html",
//     });
//     await sync.ready();
//     await sync.add("shadowing", 30);            // 30秒加算
//     const days = await sync.getRange(7);        // 直近7日
//   </script>

(function (root) {
  "use strict";

  function create(opts) {
    opts = opts || {};
    const bridgeUrl = opts.bridge ||
      "https://fumiakim.github.io/pronunciation-coach/sync.html";
    const bridgeOrigin = new URL(bridgeUrl).origin;

    let iframe = null;
    let readyPromise = null;
    const pending = new Map();
    let seq = 0;

    function ensureIframe() {
      if (iframe) return;
      iframe = document.createElement("iframe");
      iframe.src = bridgeUrl;
      iframe.setAttribute("aria-hidden", "true");
      iframe.setAttribute("title", "study-time-sync");
      iframe.style.cssText =
        "position:fixed;width:1px;height:1px;border:0;opacity:0;pointer-events:none;left:-9999px;top:-9999px;";
      (document.body || document.documentElement).appendChild(iframe);
    }

    function ready() {
      if (readyPromise) return readyPromise;
      readyPromise = new Promise((resolve, reject) => {
        ensureIframe();
        const timeout = setTimeout(() => {
          window.removeEventListener("message", onMessage);
          reject(new Error("study-sync timeout (failed to load bridge)"));
        }, 8000);
        function onMessage(e) {
          if (e.origin !== bridgeOrigin) return;
          const d = e.data;
          if (d && d.target === "study-sync-reply" && d.ready) {
            clearTimeout(timeout);
            window.removeEventListener("message", onMessage);
            window.addEventListener("message", onReply);
            resolve();
          }
        }
        window.addEventListener("message", onMessage);
      });
      return readyPromise;
    }

    function onReply(e) {
      if (e.origin !== bridgeOrigin) return;
      const d = e.data;
      if (!d || d.target !== "study-sync-reply" || !d.id) return;
      const resolver = pending.get(d.id);
      if (!resolver) return;
      pending.delete(d.id);
      if (d.ok === false) resolver.reject(new Error(d.error || "sync error"));
      else resolver.resolve(d);
    }

    function request(cmd, payload) {
      return ready().then(() =>
        new Promise((resolve, reject) => {
          const id = "r" + ++seq + "-" + Date.now();
          pending.set(id, { resolve, reject });
          const msg = Object.assign({ target: "study-sync", cmd, id }, payload || {});
          iframe.contentWindow.postMessage(msg, bridgeOrigin);
          // タイムアウト
          setTimeout(() => {
            if (pending.has(id)) {
              pending.delete(id);
              reject(new Error("sync timeout: " + cmd));
            }
          }, 5000);
        })
      );
    }

    return {
      ready,
      add: (app, seconds) => request("add", { app, seconds }),
      getDay: (date) => request("getDay", { date }),
      getRange: (days) => request("getRange", { days }).then((r) => r.days),
    };
  }

  root.StudySync = { create };
})(typeof window !== "undefined" ? window : globalThis);
