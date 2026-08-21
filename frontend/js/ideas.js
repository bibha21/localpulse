const API_BASE = "http://localhost:8000/api";

let currentSort = "recent";

function formatBudget(min, max) {
  if (min == null || max == null) return "Budget TBD";
  return `$${Math.round(min)} - $${Math.round(max)}`;
}

function ideaCardHtml(idea) {
  const badge = idea.needs_funding
    ? `<span class="idea-badge">Seeking Funding</span>`
    : idea.environmental_impact === "High Impact"
    ? `<span class="idea-badge">Eco-Friendly</span>`
    : `<span class="idea-badge">High Social Value</span>`;

  return `
    <div class="idea-card" data-id="${idea.id}">
      <div class="idea-card-top">${badge}</div>
      <h3>${idea.title}</h3>
      <p>${idea.description}</p>
      <div class="idea-meta">
        <span>👍 ${idea.support_count}</span>
        <span>👥 ${idea.volunteer_count} Volunteers</span>
      </div>
      <div class="idea-card-actions">
        <button type="button" class="btn btn-primary" data-action="support" data-id="${idea.id}">Support</button>
        <button type="button" class="btn btn-outline" data-action="volunteer" data-id="${idea.id}">Volunteer</button>
      </div>
    </div>
  `;
}

const ctaCardHtml = `
  <a class="idea-card idea-card--cta" href="pitch-idea.html">
    <div class="idea-cta-icon">+</div>
    <h3>Have a bright idea?</h3>
    <p>Got a concept to improve our neighbourhood? Pitch it to the community and gather support.</p>
    <span class="btn btn-primary">Pitch a New Idea</span>
  </a>
`;

async function loadIdeas() {
  const grid = document.getElementById("ideas-grid");
  try {
    const res = await fetch(`${API_BASE}/ideas/?sort=${currentSort}`);
    const ideas = await res.json();
    grid.innerHTML = ideas.map(ideaCardHtml).join("") + ctaCardHtml;
  } catch (err) {
    grid.innerHTML = ctaCardHtml;
    console.error("Failed to load ideas - is the backend running?", err);
  }
}

document.getElementById("sort-tabs").addEventListener("click", (e) => {
  const tab = e.target.closest(".sort-tab");
  if (!tab) return;
  document.querySelectorAll(".sort-tab").forEach((t) => t.classList.remove("active"));
  tab.classList.add("active");
  currentSort = tab.dataset.sort;
  loadIdeas();
});

document.getElementById("ideas-grid").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const { action, id } = btn.dataset;
  btn.disabled = true;
  try {
    await fetch(`${API_BASE}/ideas/${id}/${action}`, { method: "POST" });
    loadIdeas();
  } catch (err) {
    console.error(`Failed to ${action} idea ${id}`, err);
    btn.disabled = false;
  }
});

loadIdeas();
