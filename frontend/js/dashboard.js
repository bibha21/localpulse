const API_BASE = "http://localhost:8000/api";

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

const map = L.map("map").setView([60.2055, 24.6559], 12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

async function loadReportsOnMap() {
  const res = await fetch(`${API_BASE}/reports/`);
  const reports = await res.json();
  reports.forEach((r) => {
    L.circleMarker([r.latitude, r.longitude], {
      radius: 6,
      color: r.needs_review ? "#E24B4A" : "#0c447c",
    })
      .addTo(map)
      .bindPopup(`${escapeHtml(r.category)}: ${escapeHtml(r.description)}`);
  });
}

async function loadAreaSummaries() {
  const res = await fetch(`${API_BASE}/dashboard/patterns`);
  const areas = await res.json();
  const container = document.getElementById("area-summaries");
  container.innerHTML = "";

  areas.forEach((area) => {
    const card = document.createElement("div");
    card.className = "area-card";
    const breakdown = Object.entries(area.categories)
      .map(([category, count]) => `${category}: ${count}`)
      .join(", ");
    const reportList = area.reports
      .map(
        (r) => `
          <li>
            [${escapeHtml(r.category)}${r.needs_review ? ", needs review" : ""}]
            ${escapeHtml(r.description) || "(no description)"}
            <br><small>confidence: ${r.confidence} · reported: ${escapeHtml(r.created_at)}</small>
          </li>`
      )
      .join("");
    card.innerHTML = `
      <strong title="grid ${escapeHtml(area.area)}">${escapeHtml(area.location)}</strong> - <span class="area-toggle" style="cursor: pointer; text-decoration: underline;">${area.report_count} reports</span><br>
      ${breakdown}<br>
      ${area.needs_review_count} report(s) flagged for review<br>
      ${area.summary}
      <ul class="report-list" style="display: none;">${reportList}</ul>
    `;
    card.querySelector(".area-toggle").addEventListener("click", () => {
      const list = card.querySelector(".report-list");
      list.style.display = list.style.display === "none" ? "block" : "none";
    });
    container.appendChild(card);
  });
}

loadReportsOnMap();
loadAreaSummaries();
