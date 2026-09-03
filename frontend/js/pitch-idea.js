const API_BASE = "http://localhost:8000/api";

const descriptionEl = document.getElementById("description");
const aiStatusEl = document.getElementById("ai-status");
const statusEl = document.getElementById("pitch-status");
const charCountEl = document.getElementById("char-count");

let previewTimer = null;

function updatePredictionPanels(data) {
  const impact = data.impact_prediction;
  const resources = data.resource_estimation;

  document.getElementById("impact-social").textContent = `+${impact.social_connectivity_pct}%`;
  document.getElementById("impact-environmental").textContent = impact.environmental_impact;
  document.getElementById("estimate-budget").textContent =
    `€${resources.budget_min} - €${resources.budget_max}`;
  document.getElementById("estimate-volunteers").textContent =
    t("pitch.volunteersUnit", { min: resources.volunteers_min, max: resources.volunteers_max });
}

function updateCharCount() {
  charCountEl.textContent = t("pitch.charCount", { n: descriptionEl.value.length });
}

descriptionEl.addEventListener("input", updateCharCount);

async function refreshPreview() {
  const description = descriptionEl.value.trim();
  if (description.length < 10) {
    aiStatusEl.textContent = t("pitch.aiReady");
    return;
  }

  aiStatusEl.textContent = t("pitch.aiAnalyzing");
  try {
    const res = await fetch(`${API_BASE}/ideas/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });
    const data = await res.json();
    updatePredictionPanels(data);
    aiStatusEl.textContent = t("pitch.aiUpdated");
  } catch (err) {
    aiStatusEl.textContent = t("pitch.aiFail");
    console.error(err);
  }
}

// Keep the character counter in the active language.
updateCharCount();
window.addEventListener("i18n:changed", updateCharCount);

descriptionEl.addEventListener("input", () => {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(refreshPreview, 600);
});

function collaborationNeeds() {
  return {
    needs_volunteers: document.getElementById("needs-volunteers").checked,
    needs_mentor: document.getElementById("needs-mentor").checked,
    needs_funding: document.getElementById("needs-funding").checked,
  };
}

async function submitIdea(status) {
  const title = document.getElementById("title").value.trim();
  const description = descriptionEl.value.trim();

  if (!title || !description) {
    statusEl.textContent = t("pitch.needTitleDesc");
    return;
  }

  statusEl.textContent = status === "draft" ? t("pitch.savingDraft") : t("pitch.publishing");
  try {
    const res = await fetch(`${API_BASE}/ideas/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, status, ...collaborationNeeds() }),
    });
    const data = await res.json();
    updatePredictionPanels(data);
    statusEl.textContent = status === "draft" ? t("pitch.draftSaved") : t("pitch.published");
    if (status !== "draft") {
      document.getElementById("pitch-form").reset();
      setTimeout(() => {
        window.location.href = "ideas.html";
      }, 800);
    }
  } catch (err) {
    statusEl.textContent = t("pitch.error");
    console.error(err);
  }
}

document.getElementById("pitch-form").addEventListener("submit", (e) => {
  e.preventDefault();
  submitIdea("published");
});

document.getElementById("save-draft").addEventListener("click", () => {
  submitIdea("draft");
});
