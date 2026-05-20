// bucket-id.js
// Anonymous UUID stored in localStorage. Devices that share this UUID
// share their cloud study-time bucket (see cloud-sync-client.js).
// Mirrors lib/bucket-id.ts in the shadowing-app project.

(function (root) {
  "use strict";

  var STORAGE_KEY = "study-bucket-id";
  var MIGRATION_FLAG_KEY = "study-migration-v2";
  var CHANGED_EVENT = "study-bucket:changed";
  var UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  function newUuid() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function isValid(s) {
    return typeof s === "string" && UUID_RE.test(s.trim());
  }

  function get() {
    try {
      var cur = localStorage.getItem(STORAGE_KEY);
      if (cur && isValid(cur)) return cur;
      var fresh = newUuid();
      localStorage.setItem(STORAGE_KEY, fresh);
      return fresh;
    } catch (_) {
      return "";
    }
  }

  function set(id) {
    var trimmed = String(id || "").trim().toLowerCase();
    if (!isValid(trimmed)) {
      throw new Error("invalid bucket id (expected UUID)");
    }
    try {
      var prev = localStorage.getItem(STORAGE_KEY);
      if (prev === trimmed) return;
      localStorage.setItem(STORAGE_KEY, trimmed);
      localStorage.removeItem(MIGRATION_FLAG_KEY);
      window.dispatchEvent(
        new CustomEvent(CHANGED_EVENT, { detail: trimmed })
      );
    } catch (_) {}
  }

  function reset() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(MIGRATION_FLAG_KEY);
      var fresh = newUuid();
      localStorage.setItem(STORAGE_KEY, fresh);
      window.dispatchEvent(
        new CustomEvent(CHANGED_EVENT, { detail: fresh })
      );
      return fresh;
    } catch (_) {
      return "";
    }
  }

  root.StudyBucket = {
    get: get,
    set: set,
    reset: reset,
    isValid: isValid,
    CHANGED_EVENT: CHANGED_EVENT,
  };
})(typeof window !== "undefined" ? window : globalThis);
