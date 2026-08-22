const API_BASE = "http://localhost:8000/api";

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// Renders an AI insight block: the cached summary/idea if one exists, or a
// "Generate AI insight" button if not (insights are only computed on click,
// never automatically on page load, to avoid spending Gemini quota on every reload).
function renderInsight(container, { summary, actionableIdea, postUrl }) {
  if (summary !== null && summary !== undefined) {
    const ideaBlock = actionableIdea
      ? `<div class="actionable-idea">💡 <strong>Idea:</strong> ${escapeHtml(actionableIdea)}</div>`
      : "";
    container.innerHTML = `<p>${escapeHtml(summary)}</p>${ideaBlock}`;
    return;
  }
  if (!postUrl) {
    container.innerHTML = "";
    return;
  }
  container.innerHTML = `<button type="button" class="generate-insight-btn">🤖 Generate AI insight</button>`;
  container.querySelector(".generate-insight-btn").addEventListener("click", async (e) => {
    const btn = e.target;
    btn.disabled = true;
    btn.textContent = "Generating...";
    try {
      const res = await fetch(postUrl, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const ideaBlock = data.actionable_idea
        ? `<div class="actionable-idea">💡 <strong>Idea:</strong> ${escapeHtml(data.actionable_idea)}</div>`
        : "";
      const note = data.source === "fallback"
        ? `<p><small>(AI unavailable right now - showing an automatic summary instead)</small></p>`
        : "";
      container.innerHTML = `<p>${escapeHtml(data.summary)}</p>${ideaBlock}${note}`;
    } catch (err) {
      btn.disabled = false;
      btn.textContent = "🤖 Generate AI insight";
      console.error(err);
    }
  });
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
      <div class="insight-block"></div>
      <ul class="report-list" style="display: none;">${reportList}</ul>
    `;
    renderInsight(card.querySelector(".insight-block"), {
      summary: area.summary,
      actionableIdea: area.actionable_idea,
      postUrl: area.report_count >= 3 ? `${API_BASE}/dashboard/patterns/${area.area}/insight` : null,
    });
    card.querySelector(".area-toggle").addEventListener("click", () => {
      const list = card.querySelector(".report-list");
      list.style.display = list.style.display === "none" ? "block" : "none";
    });
    container.appendChild(card);
  });
}

loadReportsOnMap();
loadAreaSummaries();
