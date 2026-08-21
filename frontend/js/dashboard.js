const API_BASE = "http://localhost:8000/api";

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
      .bindPopup(`${r.category}: ${r.description ?? ""}`);
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
    card.innerHTML = `<strong>Area ${area.area}</strong> - ${area.report_count} reports<br>${area.summary}`;
    container.appendChild(card);
  });
}

loadReportsOnMap();
loadAreaSummaries();
