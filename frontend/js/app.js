const API_BASE = "http://localhost:8000/api";

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

map.on("click", (e) => {
  selectedLatLng = e.latlng;
  if (marker) map.removeLayer(marker);
  marker = L.marker(selectedLatLng).addTo(map);
});

document.getElementById("report-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const statusEl = document.getElementById("status");
  const t = TRANSLATIONS[currentLang];

  if (!selectedLatLng) {
    statusEl.textContent = t.tapMap;
    return;
  }

  const note = document.getElementById("note").value;
  const photoFile = document.getElementById("photo").files[0];

  if (!note && !photoFile) {
    statusEl.textContent = t.needSomething;
    return;
  }

  const formData = new FormData();
  formData.append("text_note", note);
  formData.append("latitude", selectedLatLng.lat);
  formData.append("longitude", selectedLatLng.lng);
  if (photoFile) formData.append("photo", photoFile);

  statusEl.textContent = t.submitting;
  try {
    const res = await fetch(`${API_BASE}/reports/`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    statusEl.textContent = TRANSLATIONS[currentLang].thankYou(data);
    document.getElementById("report-form").reset();
  } catch (err) {
    statusEl.textContent = TRANSLATIONS[currentLang].networkError;
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
