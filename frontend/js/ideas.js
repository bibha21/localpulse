const API_BASE = "http://localhost:8000/api";

let currentSort = "recent";
let currentIdeas = [];
let searchTerm = "";
const supportedIds = new Set();

function formatBudget(min, max) {
  if (min == null || max == null) return t("ideas.budgetTBD");
  return `€${Math.round(min)} - €${Math.round(max)}`;
}

function ideaCardHtml(idea) {
  const badge = idea.needs_funding
    ? `<span class="idea-badge">${t("ideas.badgeSeekingFunding")}</span>`
    : idea.environmental_impact === "High Impact"
    ? `<span class="idea-badge">${t("ideas.badgeEco")}</span>`
    : `<span class="idea-badge">${t("ideas.badgeSocial")}</span>`;
  const alreadySupported = supportedIds.has(idea.id);

  return `
    <div class="idea-card" data-id="${idea.id}">
      <div class="idea-card-top">${badge}</div>
      <h3>${escapeHtml(tc(idea.title))}</h3>
      <p>${escapeHtml(tc(idea.description))}</p>
      <div class="idea-meta">
        <span>👍 ${idea.support_count}</span>
        <span>👥 ${idea.volunteer_count} ${t("ideas.volunteersSuffix")}</span>
        <span>💶 ${formatBudget(idea.est_budget_min, idea.est_budget_max)}</span>
      </div>
      <div class="idea-card-actions">
        <button type="button" class="btn btn-primary support-btn${alreadySupported ? " supported" : ""}" data-action="support" data-id="${idea.id}" ${alreadySupported ? "disabled" : ""}>
          ${alreadySupported ? t("ideas.supported") : t("ideas.support")}
        </button>
        <button type="button" class="btn btn-outline" data-action="volunteer" data-id="${idea.id}">${t("ideas.volunteer")}</button>
      </div>
    </div>
  `;
}

function ctaCardHtml() {
  return `
  <a class="idea-card idea-card--cta" href="pitch-idea.html">
    <div class="idea-cta-icon">+</div>
    <h3>${t("ideas.ctaTitle")}</h3>
    <p>${t("ideas.ctaBody")}</p>
    <span class="btn btn-primary">${t("ideas.ctaBtn")}</span>
  </a>
`;
}

function matchesSearch(idea) {
  if (!searchTerm) return true;
  const haystack = `${idea.title} ${idea.description}`.toLowerCase();
  return haystack.includes(searchTerm);
}

function renderIdeas() {
  const grid = document.getElementById("ideas-grid");
  const filtered = currentIdeas.filter(matchesSearch);

  if (searchTerm && filtered.length === 0) {
    grid.innerHTML = `<p class="ideas-empty">${t("ideas.noMatch", { term: escapeHtml(searchTerm) })}</p>` + ctaCardHtml();
    return;
  }
  grid.innerHTML = filtered.map(ideaCardHtml).join("") + ctaCardHtml();
}

async function loadIdeas() {
  const grid = document.getElementById("ideas-grid");
  try {
    const res = await fetch(`${API_BASE}/ideas/?sort=${currentSort}`);
    currentIdeas = await res.json();
    renderIdeas();
  } catch (err) {
    grid.innerHTML = ctaCardHtml();
    console.error("Failed to load ideas - is the backend running?", err);
  }
}

// Re-render idea cards (badges, buttons, CTA) when the language changes.
window.addEventListener("i18n:changed", renderIdeas);

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
