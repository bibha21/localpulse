const API_BASE = "http://localhost:8000/api";
const LOW_SIGNAL_THRESHOLD = 3;

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
      .bindPopup(`<strong>${area.report_count} reports</strong><br>${escapeHtml(area.summary)}`)
      .on("click", () => selectArea(area.area));
    areaMarkers.set(area.area, circle);
  });
}

function areaCardHtml(area) {
  const isLowSignal = area.report_count < LOW_SIGNAL_THRESHOLD;
  const flag =
    area.report_count > 0 && area.needs_review_count / area.report_count >= 0.5
      ? '<span class="area-flag">⚠ needs review</span>'
      : "";
  return `
    <div class="area-card${isLowSignal ? " low-signal" : ""}" data-area="${escapeHtml(area.area)}">
      <strong>Area ${escapeHtml(area.area)}</strong> - ${area.report_count} reports ${flag}<br>
      ${escapeHtml(area.summary)}
    </div>
  `;
}

function renderAreaCards(areas) {
  const container = document.getElementById("area-summaries");
  container.innerHTML = areas.length
    ? areas.map(areaCardHtml).join("")
    : '<p class="ideas-empty">No reports yet - patterns will appear here once residents start reporting.</p>';

  container.querySelectorAll(".area-card").forEach((card) => {
    card.addEventListener("click", () => selectArea(card.dataset.area));
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
