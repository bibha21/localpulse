const API_BASE = "http://localhost:8000/api";
const LOW_SIGNAL_THRESHOLD = 3;

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

const showLowSignalCheckbox = document.getElementById("show-low-signal");
const areaMarkers = new Map(); // area key -> leaflet circle marker
let currentAreas = [];

function reviewColor(area) {
  const reviewRatio = area.report_count ? area.needs_review_count / area.report_count : 0;
  return reviewRatio >= 0.5 ? "#E24B4A" : "#0c447c";
}

function selectArea(key) {
  document.querySelectorAll(".area-card").forEach((card) => {
    card.classList.toggle("selected", card.dataset.area === key);
  });
  const marker = areaMarkers.get(key);
  if (marker) {
    map.panTo(marker.getLatLng());
    marker.openPopup();
  }
}

function renderMap(areas) {
  areaMarkers.forEach((marker) => map.removeLayer(marker));
  areaMarkers.clear();

  const visibleAreas = showLowSignalCheckbox.checked
    ? areas
    : areas.filter((a) => a.report_count >= LOW_SIGNAL_THRESHOLD);

  visibleAreas.forEach((area) => {
    const circle = L.circleMarker([area.center.lat, area.center.lon], {
      radius: 8 + Math.min(area.report_count, 20) * 1.5,
      color: reviewColor(area),
      fillColor: reviewColor(area),
      fillOpacity: 0.35,
      weight: 2,
    })
      .addTo(map)
      .bindPopup(`<strong>${area.report_count} reports</strong><br>${escapeHtml(area.location)}`)
      .on("click", () => selectArea(area.area));
    areaMarkers.set(area.area, circle);
  });
}

function renderAreaCards(areas) {
  const container = document.getElementById("area-summaries");
  if (!areas.length) {
    container.innerHTML = '<p class="ideas-empty">No reports yet - patterns will appear here once residents start reporting.</p>';
    return;
  }
  container.innerHTML = "";

  areas.forEach((area) => {
    const isLowSignal = area.report_count < LOW_SIGNAL_THRESHOLD;
    const flag =
      area.report_count > 0 && area.needs_review_count / area.report_count >= 0.5
        ? '<span class="area-flag">⚠ needs review</span>'
        : "";
    const card = document.createElement("div");
    card.className = `area-card${isLowSignal ? " low-signal" : ""}`;
    card.dataset.area = area.area;
    const breakdown = Object.entries(area.categories)
      .map(([category, count]) => `${category}: ${count}`)
      .join(", ");
    const reportList = area.reports
      .map((r) => {
        const currentIndex = STATUS_PIPELINE.indexOf(r.status);
        const nextStatus = STATUS_PIPELINE[currentIndex + 1];
        const actionBtn = nextStatus
          ? `<button type="button" class="advance-status-btn" data-id="${r.id}">Take action → ${STATUS_LABELS[nextStatus]}</button>`
          : `<span class="status-badge status-completed">Pipeline complete</span>`;
        return `
          <li data-report-id="${r.id}">
            [${escapeHtml(r.category)}${r.needs_review ? ", needs review" : ""}]
            ${escapeHtml(r.description) || "(no description)"}
            <br><small>confidence: ${r.confidence} · reported: ${escapeHtml(r.created_at)}</small>
            <div class="report-action">
              <span class="status-badge status-${escapeHtml(r.status)}">${STATUS_LABELS[r.status] || r.status}</span>
              ${actionBtn}
            </div>
          </li>`;
      })
      .join("");
    card.innerHTML = `
      <strong title="grid ${escapeHtml(area.area)}">${escapeHtml(area.location)}</strong> ${flag} - <span class="area-toggle" style="cursor: pointer; text-decoration: underline;">${area.report_count} reports</span><br>
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
    card.querySelector(".area-toggle").addEventListener("click", (e) => {
      e.stopPropagation();
      const list = card.querySelector(".report-list");
      list.style.display = list.style.display === "none" ? "block" : "none";
    });
    card.querySelector(".report-list").addEventListener("click", async (e) => {
      e.stopPropagation();
      const btn = e.target.closest(".advance-status-btn");
      if (!btn) return;
      btn.disabled = true;
      btn.textContent = "Updating...";
      try {
        const res = await fetch(`${API_BASE}/reports/${btn.dataset.id}/advance-status`, { method: "POST" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // Update just this report's status in place - reloading the whole
        // dashboard would re-collapse every expanded report list, making a
        // successful update look like nothing happened.
        const li = card.querySelector(`li[data-report-id="${data.id}"]`);
        const nextStatus = STATUS_PIPELINE[STATUS_PIPELINE.indexOf(data.status) + 1];
        const nextActionBtn = nextStatus
          ? `<button type="button" class="advance-status-btn" data-id="${data.id}">Take action → ${STATUS_LABELS[nextStatus]}</button>`
          : `<span class="status-badge status-completed">Pipeline complete</span>`;
        li.querySelector(".report-action").innerHTML = `
          <span class="status-badge status-${escapeHtml(data.status)}">${STATUS_LABELS[data.status] || data.status}</span>
          ${nextActionBtn}
        `;
      } catch (err) {
        btn.disabled = false;
        btn.textContent = "Take action →";
        console.error(err);
      }
    });
    card.addEventListener("click", () => selectArea(area.area));
    container.appendChild(card);
  });
}

function pulseCardHtml(pulse) {
  const levelClass = `level-${pulse.activity_level.toLowerCase()}`;
  const priorities = pulse.top_priorities.map((p) => `<li>${escapeHtml(p)}</li>`).join("");
  return `
    <div class="pulse-card ${levelClass}">
      <h3>${escapeHtml(pulse.district)}</h3>
      <div class="pulse-level ${levelClass}">${pulse.activity_level} activity - ${pulse.report_count} reports</div>
      <div>${escapeHtml(pulse.summary)}</div>
      ${priorities ? `<p class="muted" style="margin:10px 0 2px;">Top resident priorities</p><ol class="priorities">${priorities}</ol>` : ""}
    </div>
  `;
}

async function loadPulse() {
  const container = document.getElementById("pulse-cards");
  const res = await fetch(`${API_BASE}/dashboard/pulse`);
  const pulses = await res.json();
  container.innerHTML = pulses.length
    ? pulses.map(pulseCardHtml).join("")
    : '<p class="ideas-empty">No district-level activity yet.</p>';
}

async function loadDashboard() {
  const res = await fetch(`${API_BASE}/dashboard/patterns`);
  currentAreas = await res.json();
  renderMap(currentAreas);
  renderAreaCards(currentAreas);
}

showLowSignalCheckbox.addEventListener("change", () => renderMap(currentAreas));

loadPulse();
loadDashboard();
