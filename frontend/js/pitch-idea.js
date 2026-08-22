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
    `${resources.volunteers_min}-${resources.volunteers_max} people`;
}

descriptionEl.addEventListener("input", () => {
  charCountEl.textContent = `${descriptionEl.value.length} / 2000 characters`;
});

async function refreshPreview() {
  const description = descriptionEl.value.trim();
  if (description.length < 10) {
    aiStatusEl.textContent = "AI is listening and ready to refine your idea...";
    return;
  }

  aiStatusEl.textContent = "AI is analyzing your idea...";
  try {
    const res = await fetch(`${API_BASE}/ideas/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });
    const data = await res.json();
    updatePredictionPanels(data);
    aiStatusEl.textContent = "Predictions updated based on your description.";
  } catch (err) {
    aiStatusEl.textContent = "Couldn't reach the AI service - is the backend running?";
    console.error(err);
  }
}

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
    statusEl.textContent = "Please add a title and description first.";
    return;
  }

  statusEl.textContent = status === "draft" ? "Saving draft..." : "Publishing...";
  try {
    const res = await fetch(`${API_BASE}/ideas/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, status, ...collaborationNeeds() }),
    });
    const data = await res.json();
    updatePredictionPanels(data);
    statusEl.textContent =
      status === "draft" ? "Draft saved." : "Published to the Idea Incubator!";
    if (status !== "draft") {
      document.getElementById("pitch-form").reset();
      setTimeout(() => {
        window.location.href = "ideas.html";
      }, 800);
    }
  } catch (err) {
    statusEl.textContent = "Something went wrong - is the backend running?";
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
