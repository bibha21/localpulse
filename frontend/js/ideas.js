const API_BASE = "http://localhost:8000/api";

let currentSort = "recent";
let currentIdeas = [];
let searchTerm = "";
const supportedIds = new Set();

function formatBudget(min, max) {
  if (min == null || max == null) return "Budget TBD";
  return `€${Math.round(min)} - €${Math.round(max)}`;
}

function ideaCardHtml(idea) {
  const badge = idea.needs_funding
    ? `<span class="idea-badge">Seeking Funding</span>`
    : idea.environmental_impact === "High Impact"
    ? `<span class="idea-badge">Eco-Friendly</span>`
    : `<span class="idea-badge">High Social Value</span>`;
  const alreadySupported = supportedIds.has(idea.id);

  return `
    <div class="idea-card" data-id="${idea.id}">
      <div class="idea-card-top">${badge}</div>
      <h3>${escapeHtml(idea.title)}</h3>
      <p>${escapeHtml(idea.description)}</p>
      <div class="idea-meta">
        <span>👍 ${idea.support_count}</span>
        <span>👥 ${idea.volunteer_count} Volunteers</span>
        <span>💶 ${formatBudget(idea.est_budget_min, idea.est_budget_max)}</span>
      </div>
      <div class="idea-card-actions">
        <button type="button" class="btn btn-primary support-btn${alreadySupported ? " supported" : ""}" data-action="support" data-id="${idea.id}" ${alreadySupported ? "disabled" : ""}>
          ${alreadySupported ? "✓ Supported" : "Support"}
        </button>
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

function matchesSearch(idea) {
  if (!searchTerm) return true;
  const haystack = `${idea.title} ${idea.description}`.toLowerCase();
  return haystack.includes(searchTerm);
}

function renderIdeas() {
  const grid = document.getElementById("ideas-grid");
  const filtered = currentIdeas.filter(matchesSearch);

  if (searchTerm && filtered.length === 0) {
    grid.innerHTML = `<p class="ideas-empty">No ideas match "${escapeHtml(searchTerm)}".</p>` + ctaCardHtml;
    return;
  }
  grid.innerHTML = filtered.map(ideaCardHtml).join("") + ctaCardHtml;
}

async function loadIdeas() {
  const grid = document.getElementById("ideas-grid");
  try {
    const res = await fetch(`${API_BASE}/ideas/?sort=${currentSort}`);
    currentIdeas = await res.json();
    renderIdeas();
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

document.getElementById("ideas-search").addEventListener("input", (e) => {
  searchTerm = e.target.value.trim().toLowerCase();
  renderIdeas();
});

document.getElementById("ideas-grid").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const { action, id } = btn.dataset;
  btn.disabled = true;
  try {
    await fetch(`${API_BASE}/ideas/${id}/${action}`, { method: "POST" });
    if (action === "support") supportedIds.add(Number(id));
    loadIdeas();
  } catch (err) {
    console.error(`Failed to ${action} idea ${id}`, err);
    btn.disabled = false;
  }
});

loadIdeas();
