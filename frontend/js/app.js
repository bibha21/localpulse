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

const TRANSLATIONS = {
  en: {
    title: "LocalPulse",
    subtitle: "Report a concern or idea in your neighbourhood",
    noteLabel: "What's going on?",
    notePlaceholder: "e.g. Broken streetlight on Otaniementie",
    photoLabel: "Add a photo (optional)",
    submitBtn: "Submit report",
    voiceBtn: "🎤 Voice",
    voiceBtnRecording: "⏹ Stop",
    tapMap: "Tap the map to mark where the issue is first.",
    needSomething: "Add a description or a photo (at least one is needed).",
    submitting: "Submitting...",
    thankYou: (data) => `Reported as "${data.category}" (confidence ${data.confidence}). Thank you!`,
    networkError: "Something went wrong - is the backend running?",
    voiceUnsupported: "Voice input isn't supported in this browser.",
  },
  fi: {
    title: "LocalPulse",
    subtitle: "Ilmoita ongelmasta tai ideasta naapurustossasi",
    noteLabel: "Mistä on kyse?",
    notePlaceholder: "esim. Rikkinäinen katuvalo Otaniementiellä",
    photoLabel: "Lisää kuva (valinnainen)",
    submitBtn: "Lähetä ilmoitus",
    voiceBtn: "🎤 Puhu",
    voiceBtnRecording: "⏹ Pysäytä",
    tapMap: "Napauta karttaa merkitäksesi ongelman sijainnin.",
    needSomething: "Lisää kuvaus tai kuva (vähintään toinen tarvitaan).",
    submitting: "Lähetetään...",
    thankYou: (data) => `Ilmoitettu luokkaan "${data.category}" (luottamus ${data.confidence}). Kiitos!`,
    networkError: "Jotain meni pieleen - onko taustajärjestelmä käynnissä?",
    voiceUnsupported: "Äänisyöttöä ei tueta tässä selaimessa.",
  },
  sv: {
    title: "LocalPulse",
    subtitle: "Rapportera ett problem eller en idé i ditt grannskap",
    noteLabel: "Vad handlar det om?",
    notePlaceholder: "t.ex. Trasig gatlykta på Otsvängen",
    photoLabel: "Lägg till ett foto (valfritt)",
    submitBtn: "Skicka rapport",
    voiceBtn: "🎤 Tala",
    voiceBtnRecording: "⏹ Stoppa",
    tapMap: "Tryck på kartan för att markera var problemet finns.",
    needSomething: "Lägg till en beskrivning eller ett foto (minst ett behövs).",
    submitting: "Skickar...",
    thankYou: (data) => `Rapporterad som "${data.category}" (säkerhet ${data.confidence}). Tack!`,
    networkError: "Något gick fel - körs backend?",
    voiceUnsupported: "Röstinmatning stöds inte i den här webbläsaren.",
  },
};

const SPEECH_LANG = { en: "en-US", fi: "fi-FI", sv: "sv-SE" };

let currentLang = localStorage.getItem("lp_lang") || "en";

function applyTranslations() {
  const t = TRANSLATIONS[currentLang];
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (typeof t[key] === "string") el.textContent = t[key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (typeof t[key] === "string") el.setAttribute("placeholder", t[key]);
  });
  document.getElementById("language").value = currentLang;
}

document.getElementById("language").addEventListener("change", (e) => {
  currentLang = e.target.value;
  localStorage.setItem("lp_lang", currentLang);
  applyTranslations();
});

applyTranslations();

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
  const t = TRANSLATIONS[currentLang];

  if (!selectedLatLng) {
    setStatus(t.tapMap, "error");
    return;
  }

  const note = document.getElementById("note").value;
  const photoFile = document.getElementById("photo").files[0];

  if (!note && !photoFile) {
    setStatus(t.needSomething, "error");
    return;
  }

  const formData = new FormData();
  formData.append("text_note", note);
  formData.append("latitude", selectedLatLng.lat);
  formData.append("longitude", selectedLatLng.lng);
  if (photoFile) formData.append("photo", photoFile);

  setStatus(t.submitting, "info");
  try {
    const res = await fetch(`${API_BASE}/reports/`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      setStatus("Couldn't submit that report - please check the details and try again.", "error");
      return;
    }
    const data = await res.json();
    setStatus(t.thankYou(data), "success");
    document.getElementById("report-form").reset();
    if (marker) map.removeLayer(marker);
    marker = null;
    selectedLatLng = null;
    rememberReport(data.id);
    loadMyReports();
  } catch (err) {
    setStatus(t.networkError, "error");
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
  voiceBtn.title = TRANSLATIONS[currentLang].voiceUnsupported;
} else {
  voiceBtn.addEventListener("click", () => {
    if (recognizing) {
      recognizer.stop();
      return;
    }

    recognizer = new SpeechRecognitionImpl();
    recognizer.lang = SPEECH_LANG[currentLang];
    recognizer.interimResults = false;
    recognizer.maxAlternatives = 1;

    recognizer.onstart = () => {
      recognizing = true;
      voiceBtn.textContent = TRANSLATIONS[currentLang].voiceBtnRecording;
    };
    recognizer.onend = () => {
      recognizing = false;
      voiceBtn.textContent = TRANSLATIONS[currentLang].voiceBtn;
    };
    recognizer.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      document.getElementById("status").textContent = TRANSLATIONS[currentLang].networkError;
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
