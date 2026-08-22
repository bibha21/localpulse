const API_BASE = "http://localhost:8000/api";
const MY_REPORTS_KEY = "localpulse_my_report_ids";

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

function getMyReportIds() {
  try {
    return JSON.parse(localStorage.getItem(MY_REPORTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function rememberReport(id) {
  const ids = getMyReportIds();
  if (!ids.includes(id)) {
    ids.unshift(id);
    localStorage.setItem(MY_REPORTS_KEY, JSON.stringify(ids.slice(0, 20)));
  }
}

function reportCardHtml(report) {
  const currentIndex = STATUS_PIPELINE.indexOf(report.status);
  const steps = STATUS_PIPELINE.map((step, i) => {
    const cls = i < currentIndex ? "done" : i === currentIndex ? "done current" : "";
    return `<div class="report-step ${cls}"><div class="bar"></div>${STATUS_LABELS[step]}</div>`;
  }).join("");
  const isComplete = report.status === "completed";

  return `
    <div class="report-card" data-id="${report.id}">
      <div class="report-card-top">
        <span>Report #${report.id} - <strong>${report.category}</strong></span>
        <span>${STATUS_LABELS[report.status]}</span>
      </div>
      <div class="report-stepper">${steps}</div>
      <div class="report-card-actions">
        <button type="button" class="simulate-btn" data-id="${report.id}" ${isComplete ? "disabled" : ""}>
          ${isComplete ? "Pipeline complete" : "Simulate city update →"}
        </button>
      </div>
    </div>
  `;
}

async function loadMyReports() {
  const container = document.getElementById("my-reports");
  const ids = getMyReportIds();
  if (ids.length === 0) {
    container.innerHTML = '<p class="ideas-empty">Reports you submit will show up here so you can track what happens next.</p>';
    return;
  }

  try {
    const reports = await Promise.all(
      ids.map((id) => fetch(`${API_BASE}/reports/${id}`).then((r) => (r.ok ? r.json() : null)))
    );
    container.innerHTML = reports
      .filter(Boolean)
      .map(reportCardHtml)
      .join("");
  } catch (err) {
    container.innerHTML = '<p class="ideas-empty">Couldn\'t load your reports right now.</p>';
    console.error(err);
  }
}

document.getElementById("my-reports").addEventListener("click", async (e) => {
  const btn = e.target.closest(".simulate-btn");
  if (!btn || btn.disabled) return;
  btn.disabled = true;
  try {
    await fetch(`${API_BASE}/reports/${btn.dataset.id}/advance-status`, { method: "POST" });
    loadMyReports();
  } catch (err) {
    console.error(err);
    btn.disabled = false;
  }
});

// Center map on Espoo
const map = L.map("map").setView([60.2055, 24.6559], 13);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

let selectedLatLng = null;
let marker = null;

const statusEl = document.getElementById("status");

function setStatus(message, kind = "info") {
  statusEl.textContent = message;
  statusEl.className = `visible status-${kind}`;
}

function placeMarker(latlng) {
  selectedLatLng = latlng;
  if (marker) map.removeLayer(marker);
  marker = L.marker(selectedLatLng).addTo(map);
  map.panTo(selectedLatLng);
}

map.on("click", (e) => {
  placeMarker(e.latlng);
});

document.getElementById("locate-btn").addEventListener("click", (e) => {
  const btn = e.currentTarget;
  if (!navigator.geolocation) {
    setStatus("Your browser doesn't support location lookup - tap the map instead.", "error");
    return;
  }
  btn.disabled = true;
  btn.textContent = "Locating...";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const latlng = L.latLng(pos.coords.latitude, pos.coords.longitude);
      map.setZoom(15);
      placeMarker(latlng);
      setStatus("Location found - adjust the pin if needed, then describe the issue.", "success");
      btn.disabled = false;
      btn.textContent = "📍 Use my location";
    },
    () => {
      setStatus("Couldn't get your location - tap the map to mark it manually.", "error");
      btn.disabled = false;
      btn.textContent = "📍 Use my location";
    },
    { timeout: 8000 }
  );
});

document.getElementById("report-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!selectedLatLng) {
    setStatus("Tap the map (or use your location) to mark where the issue is first.", "error");
    return;
  }

  const note = document.getElementById("note").value;

  setStatus("Submitting...", "info");
  try {
    const res = await fetch(`${API_BASE}/reports/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text_note: note,
        latitude: selectedLatLng.lat,
        longitude: selectedLatLng.lng,
      }),
    });
    if (!res.ok) {
      setStatus("Couldn't submit that report - please check the details and try again.", "error");
      return;
    }
    const data = await res.json();
    setStatus(`Reported as "${data.category}" (confidence ${Math.round(data.confidence * 100)}%). Thank you!`, "success");
    document.getElementById("report-form").reset();
    if (marker) map.removeLayer(marker);
    marker = null;
    selectedLatLng = null;
    rememberReport(data.id);
    loadMyReports();
  } catch (err) {
    setStatus("Something went wrong - is the backend running?", "error");
    console.error(err);
  }
});

loadMyReports();
