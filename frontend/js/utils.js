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
