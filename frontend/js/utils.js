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
const STATUS_LABELS = {
  submitted: "Submitted",
  received: "Received",
  under_review: "Under Review",
  assigned: "Assigned",
  action_planned: "Action Planned",
  completed: "Completed",
};

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
