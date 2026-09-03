const API_BASE = "http://localhost:8000/api";
const MY_REPORTS_KEY = "localpulse_my_report_ids";

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
        <span>${t("index.reportCard", { id: report.id })} <strong>${catLabel(report.category)}</strong></span>
        <span>${STATUS_LABELS[report.status]}</span>
      </div>
      <div class="report-stepper">${steps}</div>
      <div class="report-card-actions">
        <button type="button" class="simulate-btn" data-id="${report.id}" ${isComplete ? "disabled" : ""}>
          ${isComplete ? t("index.pipelineComplete") : t("index.simulateBtn")}
        </button>
      </div>
    </div>
  `;
}

async function loadMyReports() {
  const container = document.getElementById("my-reports");
  const ids = getMyReportIds();
  if (ids.length === 0) {
    container.innerHTML = `<p class="ideas-empty">${t("index.myReportsEmpty")}</p>`;
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
    container.innerHTML = `<p class="ideas-empty">${t("index.reportsLoadFail")}</p>`;
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

// Static text and placeholders are translated by js/i18n.js via [data-i18n*]
// attributes. This file only needs the speech-recognition locale map and a
// re-render hook for the dynamically built "my reports" list.
const SPEECH_LANG = { en: "en-US", fi: "fi-FI", sv: "sv-SE" };

window.addEventListener("i18n:changed", () => {
  loadMyReports();
  if (voiceBtn && voiceBtn.disabled) voiceBtn.title = t("index.voiceUnsupported");
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
    setStatus(t("index.geoUnsupported"), "error");
    return;
  }
  btn.disabled = true;
  btn.textContent = t("index.locating");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const latlng = L.latLng(pos.coords.latitude, pos.coords.longitude);
      map.setZoom(15);
      placeMarker(latlng);
      setStatus(t("index.locateFound"), "success");
      btn.disabled = false;
      btn.textContent = t("index.locateBtn");
    },
    () => {
      setStatus(t("index.locateFail"), "error");
      btn.disabled = false;
      btn.textContent = t("index.locateBtn");
    },
    { timeout: 8000 }
  );
});

document.getElementById("report-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!selectedLatLng) {
    setStatus(t("index.tapMap"), "error");
    return;
  }

  const note = document.getElementById("note").value;
  const photoFile = document.getElementById("photo").files[0];

  if (!note && !photoFile) {
    setStatus(t("index.needSomething"), "error");
    return;
  }

  const formData = new FormData();
  formData.append("text_note", note);
  formData.append("latitude", selectedLatLng.lat);
  formData.append("longitude", selectedLatLng.lng);
  if (photoFile) formData.append("photo", photoFile);

  setStatus(t("index.submitting"), "info");
  try {
    const res = await fetch(`${API_BASE}/reports/`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      setStatus(t("index.submitFail"), "error");
      return;
    }
    const data = await res.json();
    setStatus(t("index.thankYou", { category: catLabel(data.category), confidence: data.confidence }), "success");
    document.getElementById("report-form").reset();
    if (marker) map.removeLayer(marker);
    marker = null;
    selectedLatLng = null;
    rememberReport(data.id);
    loadMyReports();
  } catch (err) {
    setStatus(t("index.networkError"), "error");
    console.error(err);
  }
});

// Voice input: transcribes speech client-side via the Web Speech API and
// drops the transcript into the existing note field, so it flows through
// the same text_note pipeline as typed notes.
const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
const voiceBtn = document.getElementById("voice-btn");
let recognizing = false;
let recognizer = null;

if (!SpeechRecognitionImpl) {
  voiceBtn.disabled = true;
  voiceBtn.title = t("index.voiceUnsupported");
} else {
  voiceBtn.addEventListener("click", () => {
    if (recognizing) {
      recognizer.stop();
      return;
    }

    recognizer = new SpeechRecognitionImpl();
    recognizer.lang = SPEECH_LANG[window.i18nLang] || SPEECH_LANG.en;
    recognizer.interimResults = false;
    recognizer.maxAlternatives = 1;

    recognizer.onstart = () => {
      recognizing = true;
      voiceBtn.textContent = t("index.voiceBtnRecording");
    };
    recognizer.onend = () => {
      recognizing = false;
      voiceBtn.textContent = t("index.voiceBtn");
    };
    recognizer.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      document.getElementById("status").textContent = t("index.networkError");
    };
    recognizer.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const noteEl = document.getElementById("note");
      noteEl.value = noteEl.value ? `${noteEl.value} ${transcript}` : transcript;
    };

    recognizer.start();
  });
}

loadMyReports();
