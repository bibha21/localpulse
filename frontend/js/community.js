// Demo-only directory data. Not real Espoo organisations - a production
// build would replace this with the City of Espoo's community/association
// registry (see README "What we'd build next").
const DEMO_INITIATIVES = [
  {
    id: 1,
    name: "Kauklahti Residents Association (example)",
    category: "Local associations",
    description: "A neighbourhood association organising resident meetings and local advocacy.",
    members: "120 members",
  },
  {
    id: 2,
    name: "Matinkylä Running Club (example)",
    category: "Sports groups",
    description: "Weekly group runs along the Matinkylä coastal path, all paces welcome.",
    members: "45 members",
  },
  {
    id: 3,
    name: "Leppävaara Youth Evening Meetups (example)",
    category: "Youth activities",
    description: "A safe, supervised evening space for teenagers to hang out and play games.",
    members: "60 regular attendees",
  },
  {
    id: 4,
    name: "Espoonlahti Beach Cleanup Volunteers (example)",
    category: "Volunteer opportunities",
    description: "Seasonal volunteer cleanups along the Espoonlahti shoreline.",
    members: "30 volunteers",
  },
  {
    id: 5,
    name: "Tapiola Summer Market (example)",
    category: "Community events",
    description: "A recurring outdoor market for local makers, food stalls and live music.",
    members: "Open to all",
  },
  {
    id: 6,
    name: "Espoon keskus Cultural Circle (example)",
    category: "Cultural activities",
    description: "Monthly gatherings celebrating Espoo's multicultural resident community.",
    members: "80 members",
  },
  {
    id: 7,
    name: "Kauklahti Community Garden Project (example)",
    category: "Neighbourhood projects",
    description: "Turning an unused lot into raised-bed community gardens and a composting area.",
    members: "25 gardeners",
  },
  {
    id: 8,
    name: "Leppävaara Tree-Planting Initiative (example)",
    category: "Environmental initiatives",
    description: "Resident-led tree planting days to green up shared courtyards and roadside verges.",
    members: "40 volunteers",
  },
];

const INTEREST_KEY = "localpulse_community_interests";
let activeCategory = "all";
let searchTerm = "";

function getInterests() {
  try {
    return new Set(JSON.parse(localStorage.getItem(INTEREST_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function toggleInterest(id) {
  const interests = getInterests();
  if (interests.has(id)) {
    interests.delete(id);
  } else {
    interests.add(id);
  }
  localStorage.setItem(INTEREST_KEY, JSON.stringify([...interests]));
}

// Category keys are the English strings in DEMO_INITIATIVES; the visible label
// is looked up per language (data-category stays the English key so filtering
// keeps working across a language switch).
function categoryLabel(category) {
  return category === "all" ? t("community.tabAll") : t("community.cat." + category);
}

function buildCategoryTabs() {
  const categories = [...new Set(DEMO_INITIATIVES.map((i) => i.category))];
  const tabsEl = document.getElementById("category-tabs");
  categories.forEach((category) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sort-tab";
    btn.dataset.category = category;
    btn.textContent = categoryLabel(category);
    tabsEl.appendChild(btn);
  });
}

function relabelCategoryTabs() {
  document.querySelectorAll("#category-tabs .sort-tab").forEach((btn) => {
    btn.textContent = categoryLabel(btn.dataset.category);
  });
}

function cardHtml(item) {
  const interested = getInterests().has(item.id);
  return `
    <div class="idea-card" data-id="${item.id}">
      <div class="idea-card-top"><span class="idea-badge">${escapeHtml(categoryLabel(item.category))}</span></div>
      <h3>${escapeHtml(tc(item.name))}</h3>
      <p>${escapeHtml(tc(item.description))}</p>
      <div class="idea-meta"><span>👥 ${escapeHtml(tc(item.members))}</span></div>
      <div class="idea-card-actions">
        <button type="button" class="btn ${interested ? "btn-primary support-btn supported" : "btn-outline"}" data-action="interest" data-id="${item.id}">
          ${interested ? t("community.interested") : t("community.imInterested")}
        </button>
      </div>
    </div>
  `;
}

function matchesFilters(item) {
  const categoryOk = activeCategory === "all" || item.category === activeCategory;
  const searchOk = !searchTerm || `${item.name} ${item.description}`.toLowerCase().includes(searchTerm);
  return categoryOk && searchOk;
}

function render() {
  const grid = document.getElementById("community-grid");
  const filtered = DEMO_INITIATIVES.filter(matchesFilters);
  grid.innerHTML = filtered.length
    ? filtered.map(cardHtml).join("")
    : `<p class="ideas-empty">${t("community.noMatch")}</p>`;
}

document.getElementById("category-tabs").addEventListener("click", (e) => {
  const tab = e.target.closest(".sort-tab");
  if (!tab) return;
  document.querySelectorAll("#category-tabs .sort-tab").forEach((t) => t.classList.remove("active"));
  tab.classList.add("active");
  activeCategory = tab.dataset.category;
  render();
});

document.getElementById("community-search").addEventListener("input", (e) => {
  searchTerm = e.target.value.trim().toLowerCase();
  render();
});

document.getElementById("community-grid").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action='interest']");
  if (!btn) return;
  toggleInterest(Number(btn.dataset.id));
  render();
});

window.addEventListener("i18n:changed", () => {
  relabelCategoryTabs();
  render();
});

buildCategoryTabs();
render();
