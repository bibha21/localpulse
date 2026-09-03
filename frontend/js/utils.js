// Escapes text before it is interpolated into innerHTML, so resident-submitted
// titles/descriptions can never break out into markup or run script (XSS).
function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

// Statuses match backend/database.py REPORT_STATUSES - kept in sync manually
// since this is a small hackathon prototype without a shared schema.
const STATUS_PIPELINE = ["submitted", "received", "under_review", "assigned", "action_planned", "completed"];

// Localized status label. Falls back to the raw key if i18n.js hasn't loaded.
function statusLabel(status) {
  return typeof window.t === "function" ? window.t("status." + status) : status;
}

// Back-compat shim: existing call sites use STATUS_LABELS[status]. This proxy
// resolves each lookup through statusLabel() so it stays language-aware.
const STATUS_LABELS = new Proxy(
  {},
  { get: (_target, prop) => statusLabel(String(prop)) }
);

// There's no login system in this prototype (see backend/routers/reports.py),
// so "only the post's creator can mark it complete" is enforced the same way
// the report-status flow already does it: remember ids created from this
// browser in local storage, and only show the owner-only action for those.
const MY_EXCHANGE_POSTS_KEY = "localpulse_my_exchange_post_ids";

function getMyExchangePostIds() {
  try {
    return JSON.parse(localStorage.getItem(MY_EXCHANGE_POSTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function rememberMyExchangePost(id) {
  const ids = getMyExchangePostIds();
  if (!ids.includes(id)) {
    ids.unshift(id);
    localStorage.setItem(MY_EXCHANGE_POSTS_KEY, JSON.stringify(ids.slice(0, 50)));
  }
}
