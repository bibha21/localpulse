const API_BASE = "http://localhost:8000/api";

// Center map on Espoo
const map = L.map("map").setView([60.2055, 24.6559], 13);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

let selectedLatLng = null;
let marker = null;

map.on("click", (e) => {
  selectedLatLng = e.latlng;
  if (marker) map.removeLayer(marker);
  marker = L.marker(selectedLatLng).addTo(map);
});

document.getElementById("report-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const statusEl = document.getElementById("status");

  if (!selectedLatLng) {
    statusEl.textContent = "Tap the map to mark where the issue is first.";
    return;
  }

  const note = document.getElementById("note").value;

  statusEl.textContent = "Submitting...";
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
    const data = await res.json();
    statusEl.textContent = `Reported as "${data.category}" (confidence ${data.confidence}). Thank you!`;
    document.getElementById("report-form").reset();
  } catch (err) {
    statusEl.textContent = "Something went wrong - is the backend running?";
    console.error(err);
  }
});
