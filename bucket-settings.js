// bucket-settings.js
// Gear-icon settings panel for the cloud-backed study-time sync.
// Mounts itself into a container element provided by the host page.
//
// Public API:
//   window.BucketSettings.init(containerElement)

(function (root) {
  "use strict";

  function shorten(uuid) {
    if (!uuid) return "—";
    return uuid.slice(0, 8) + "…" + uuid.slice(-4);
  }

  function init(container) {
    if (!container || !root.StudyBucket || !root.CloudSync) return;

    container.innerHTML =
      '<button class="bucket-gear" id="bucketGear" type="button" title="端末間で学習時間を同期 (ペアリング設定)" aria-label="ペアリング設定">⚙</button>' +
      '<div class="bucket-panel hidden" id="bucketPanel" role="dialog" aria-modal="false">' +
        '<div class="bucket-panel-header">学習データ ペアリング</div>' +
        '<div class="bucket-panel-section">' +
          '<div class="bucket-panel-label">この端末のバケツ ID</div>' +
          '<div class="bucket-row">' +
            '<code class="bucket-id" id="bucketIdDisplay">—</code>' +
            '<button class="bucket-btn" id="bucketCopy" type="button">コピー</button>' +
          '</div>' +
        '</div>' +
        '<div class="bucket-panel-section">' +
          '<div class="bucket-panel-label">別端末の UUID を貼ると同期</div>' +
          '<div class="bucket-row">' +
            '<input class="bucket-input" id="bucketInput" type="text" autocomplete="off" placeholder="00000000-0000-0000-0000-000000000000" />' +
            '<button class="bucket-btn bucket-btn-primary" id="bucketApply" type="button">同期</button>' +
          '</div>' +
        '</div>' +
        '<div class="bucket-panel-section">' +
          '<div class="bucket-panel-label">クラウド API のベース URL</div>' +
          '<div class="bucket-row">' +
            '<input class="bucket-input" id="apiBaseInput" type="text" autocomplete="off" placeholder="https://shadowing-app-virid.vercel.app" />' +
            '<button class="bucket-btn" id="apiBaseApply" type="button">保存</button>' +
          '</div>' +
        '</div>' +
        '<div class="bucket-panel-section">' +
          '<button class="bucket-link" id="bucketNew" type="button">新しいバケツを作る</button>' +
        '</div>' +
        '<div class="bucket-message hidden" id="bucketMessage"></div>' +
      '</div>';

    var gear = container.querySelector("#bucketGear");
    var panel = container.querySelector("#bucketPanel");
    var idDisplay = container.querySelector("#bucketIdDisplay");
    var copyBtn = container.querySelector("#bucketCopy");
    var input = container.querySelector("#bucketInput");
    var applyBtn = container.querySelector("#bucketApply");
    var apiInput = container.querySelector("#apiBaseInput");
    var apiApplyBtn = container.querySelector("#apiBaseApply");
    var newBtn = container.querySelector("#bucketNew");
    var message = container.querySelector("#bucketMessage");

    var messageTimer = null;
    function showMessage(text, timeoutMs) {
      message.textContent = text;
      message.classList.remove("hidden");
      if (messageTimer) clearTimeout(messageTimer);
      if (timeoutMs) {
        messageTimer = setTimeout(function () {
          message.classList.add("hidden");
          messageTimer = null;
        }, timeoutMs);
      }
    }

    function refresh() {
      var id = root.StudyBucket.get();
      idDisplay.textContent = shorten(id);
      idDisplay.title = id;
      apiInput.value = root.CloudSync.getApiBase();
    }
    refresh();

    gear.addEventListener("click", function (e) {
      e.stopPropagation();
      panel.classList.toggle("hidden");
      if (!panel.classList.contains("hidden")) refresh();
    });

    // Click outside to close
    document.addEventListener("click", function (e) {
      if (panel.classList.contains("hidden")) return;
      if (!container.contains(e.target)) panel.classList.add("hidden");
    });

    copyBtn.addEventListener("click", function () {
      var id = root.StudyBucket.get();
      if (!id) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(id)
          .then(function () { showMessage("コピーしました", 1500); })
          .catch(function () { showMessage("コピーに失敗しました", 2500); });
      } else {
        // Fallback: temporary textarea
        try {
          var ta = document.createElement("textarea");
          ta.value = id;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          showMessage("コピーしました", 1500);
        } catch (_) {
          showMessage("コピーに失敗しました", 2500);
        }
      }
    });

    applyBtn.addEventListener("click", function () {
      var v = input.value.trim();
      if (!root.StudyBucket.isValid(v)) {
        showMessage("UUID の形式が正しくありません", 2500);
        return;
      }
      if (v.toLowerCase() === root.StudyBucket.get().toLowerCase()) {
        showMessage("既にこのバケツを使用中です", 2500);
        return;
      }
      var ok = window.confirm(
        "このバケツに切り替えますか？\n\n切り替え後、既存の localStorage に残っている練習時間は新バケツのクラウドへマージされます (上書きはされません)。"
      );
      if (!ok) return;
      try {
        root.StudyBucket.set(v);
        input.value = "";
        refresh();
        showMessage("ペアリング完了。同期しています…", 2500);
      } catch (e) {
        showMessage((e && e.message) || "エラー", 2500);
      }
    });

    apiApplyBtn.addEventListener("click", function () {
      var v = apiInput.value.trim();
      try {
        root.CloudSync.setApiBase(v);
        showMessage("保存しました (リロードで反映)", 2500);
      } catch (_) {
        showMessage("URL が不正です", 2500);
      }
    });

    newBtn.addEventListener("click", function () {
      var ok = window.confirm(
        "新しいバケツを作りますか？\n\n現在の UUID は失われます。同期したい場合は事前にメモしてください。"
      );
      if (!ok) return;
      root.StudyBucket.reset();
      refresh();
      showMessage("新しいバケツを作成しました", 2500);
    });

    window.addEventListener(root.StudyBucket.CHANGED_EVENT, refresh);
  }

  root.BucketSettings = { init: init };
})(typeof window !== "undefined" ? window : globalThis);
