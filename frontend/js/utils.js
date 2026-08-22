// Escapes text before it is interpolated into innerHTML, so resident-submitted
// titles/descriptions can never break out into markup or run script (XSS).
function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}
