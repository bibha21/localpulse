const API_BASE = "http://localhost:8000/api";

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
document.getElementById("greeting").textContent = `${timeGreeting()} 👋`;

const OVERVIEW_META = {
  safety: { icon: "🛡️", label: "Safety" },
  greenspace: { icon: "🌳", label: "Greenspace" },
  connectivity: { icon: "📶", label: "Connectivity" },
};

function overviewCardHtml(key, data) {
  const meta = OVERVIEW_META[key];
  return `
    <div class="overview-card">
      <div class="overview-icon">${meta.icon}</div>
      <div class="overview-label">${meta.label}</div>
      <div class="overview-status">${escapeHtml(data.status)}</div>
      <div class="overview-detail">${escapeHtml(data.detail)}</div>
    </div>
  `;
}

async function loadOverview() {
  const grid = document.getElementById("overview-grid");
  try {
    const res = await fetch(`${API_BASE}/dashboard/overview`);
    const data = await res.json();
    grid.innerHTML = Object.keys(OVERVIEW_META)
      .map((key) => overviewCardHtml(key, data[key]))
      .join("");
  } catch (err) {
    grid.innerHTML = '<p class="ideas-empty">Couldn\'t load the neighbourhood pulse right now.</p>';
    console.error(err);
  }
}

const EXCHANGE_ITEMS = [
  { category: "garden_share", icon: "🌱", title: "Garden Share", description: "Share extra gardening samples and veggies for a kind gesture." },
  { category: "skill_swap", icon: "🧠", title: "Skill Swap", description: "Exchange skills with neighbours, from coding to cooking." },
  { category: "tool_library", icon: "🛠️", title: "Tool Library", description: "Share tools and equipment to reduce waste and help others." },
  { category: "neighborly_help", icon: "🤲", title: "Neighborly Help", description: "Offer help like mowing lawns or running errands for neighbours." },
];

function exchangeCardHtml(item, count) {
  const postsUrl = `exchange-posts.html?category=${encodeURIComponent(item.category)}`;
  const countLabel = count
    ? `<a href="${postsUrl}" class="exchange-count">${count} post${count === 1 ? "" : "s"}</a>`
    : "";
  return `
    <div class="exchange-card">
      <div class="exchange-icon">${item.icon}</div>
      <h4><a href="${postsUrl}" class="exchange-title-link">${escapeHtml(item.title)}</a> ${countLabel}</h4>
      <p>${escapeHtml(item.description)}</p>
      <div class="exchange-card-actions">
        <a href="${postsUrl}" class="btn btn-outline">View posts</a>
        <button type="button" class="btn btn-primary exchange-btn" data-category="${item.category}" data-title="${escapeHtml(item.title)}">Share / Ask</button>
      </div>
    </div>
  `;
}

async function renderExchange() {
  const grid = document.getElementById("exchange-grid");
  let counts = {};
  try {
    const res = await fetch(`${API_BASE}/exchange/counts`);
    counts = await res.json();
  } catch (err) {
    console.error("Couldn't load exchange counts", err);
  }

  grid.innerHTML = EXCHANGE_ITEMS.map((item) => exchangeCardHtml(item, counts[item.category])).join("");
  grid.querySelectorAll(".exchange-btn").forEach((btn) => {
    btn.addEventListener("click", () => openExchangeDialog(btn.dataset.category, btn.dataset.title));
  });
}

function rewardsCardHtml(rewards) {
  const latestTier = rewards.tiers_reached.length
    ? rewards.tiers_reached[rewards.tiers_reached.length - 1]
    : null;
  const nextTierLine = rewards.next_tier
    ? `${rewards.next_tier.threshold - rewards.total_points} points to ${escapeHtml(rewards.next_tier.name)}`
    : "All badge tiers reached!";
  const cityLine = rewards.city_reward_unlocked
    ? `🎉 Unlocked for ${rewards.year}: ${escapeHtml(rewards.city_yearly_reward)}`
    : `${rewards.city_yearly_reward_threshold - rewards.year_points} points to this year's City of Espoo reward`;

  return `
    <h3>🏆 Neighbourhood Rewards</h3>
    <p class="muted">Every completed exchange post earns the whole neighbourhood ${rewards.points_per_deed} points.</p>
    <div class="rewards-stats">
      <div>
        <div class="overview-status">${rewards.total_points}</div>
        <div class="overview-detail">total points (${rewards.total_completed_deeds} deeds)</div>
      </div>
      <div>
        <div class="overview-status">${rewards.year_points}</div>
        <div class="overview-detail">points in ${rewards.year} (${rewards.year_completed_deeds} deeds)</div>
      </div>
    </div>
    ${latestTier ? `<p>🥉 Current badge: <strong>${escapeHtml(latestTier)}</strong></p>` : ""}
    <p class="muted">${nextTierLine}</p>
    <p class="rewards-city-line">${cityLine}</p>
  `;
}

async function loadRewards() {
  const card = document.getElementById("rewards-card");
  try {
    const res = await fetch(`${API_BASE}/exchange/rewards`);
    const rewards = await res.json();
    card.innerHTML = rewardsCardHtml(rewards);
  } catch (err) {
    card.innerHTML = '<p class="ideas-empty">Couldn\'t load neighbourhood rewards right now.</p>';
    console.error(err);
  }
}

const exchangeDialog = document.getElementById("exchange-dialog");
const exchangeForm = document.getElementById("exchange-form");
const exchangeStatus = document.getElementById("exchange-form-status");
let activeExchangeCategory = null;

function openExchangeDialog(category, title) {
  activeExchangeCategory = category;
  document.getElementById("exchange-dialog-category").textContent = title;
  exchangeForm.reset();
  exchangeStatus.textContent = "";
  exchangeDialog.showModal();
}

document.getElementById("exchange-cancel-btn").addEventListener("click", () => exchangeDialog.close());
exchangeDialog.addEventListener("click", (e) => {
  if (e.target === exchangeDialog) exchangeDialog.close();
});

exchangeForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("exchange-title").value.trim();
  const description = document.getElementById("exchange-description").value.trim();
  const contact = document.getElementById("exchange-contact").value.trim();

  exchangeStatus.textContent = "Posting...";
  try {
    const res = await fetch(`${API_BASE}/exchange/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: activeExchangeCategory, title, description, contact: contact || null }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    rememberMyExchangePost(data.id);
    exchangeStatus.textContent = "Posted! Your neighbours can now see this.";
    setTimeout(() => {
      exchangeDialog.close();
      renderExchange();
    }, 700);
  } catch (err) {
    exchangeStatus.textContent = "Something went wrong - is the backend running?";
    console.error(err);
  }
});

function initiativeTags(idea) {
  const tags = [];
  if (idea.needs_funding) tags.push("Seeking Funding");
  if (idea.environmental_impact === "High Impact") tags.push("Eco-Friendly");
  if (!tags.length) tags.push("High Social Value");
  return tags;
}

function initiativeCardHtml(idea) {
  const tags = initiativeTags(idea)
    .map((t) => `<span class="idea-badge">${escapeHtml(t)}</span>`)
    .join("");
  return `
    <div class="initiative-card">
      <div class="initiative-visual">🌟</div>
      <div class="initiative-body">
        <div class="initiative-tags">${tags}</div>
        <h4>${escapeHtml(idea.title)}</h4>
        <p>${escapeHtml(idea.description)}</p>
        <div class="idea-meta">
          <span>👍 ${idea.support_count}</span>
          <span>👥 ${idea.volunteer_count} volunteers</span>
          <span>💶 €${idea.est_budget_min} - €${idea.est_budget_max}</span>
        </div>
        <div class="idea-card-actions">
          <button type="button" class="btn btn-primary" data-action="support" data-id="${idea.id}">Support</button>
          <button type="button" class="btn btn-outline" data-action="volunteer" data-id="${idea.id}">Volunteer</button>
        </div>
      </div>
    </div>
  `;
}

async function loadInitiatives() {
  const grid = document.getElementById("initiatives-grid");
  try {
    const res = await fetch(`${API_BASE}/ideas/?sort=most_supported`);
    const ideas = await res.json();
    grid.innerHTML = ideas.length
      ? ideas.slice(0, 2).map(initiativeCardHtml).join("")
      : '<p class="ideas-empty">No pitched ideas yet - be the first to <a href="pitch-idea.html">share one</a>.</p>';
  } catch (err) {
    grid.innerHTML = '<p class="ideas-empty">Couldn\'t load featured initiatives right now.</p>';
    console.error(err);
  }
}

document.getElementById("initiatives-grid").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const { action, id } = btn.dataset;
  btn.disabled = true;
  try {
    await fetch(`${API_BASE}/ideas/${id}/${action}`, { method: "POST" });
    loadInitiatives();
  } catch (err) {
    console.error(`Failed to ${action} idea ${id}`, err);
    btn.disabled = false;
  }
});

const STATUS_VERBS = {
  submitted: "was submitted",
  received: "was received by the city",
  under_review: "is under review",
  assigned: "was assigned to a team",
  action_planned: "has an action planned",
  completed: "was resolved",
};

// Only category/status/timestamp ever get shown here - never a report's raw
// free-text description, matching the privacy rule used across the rest of
// the app (see the planner dashboard's own privacy note).
function reportActivityItem(report) {
  const verb = STATUS_VERBS[report.status] || "was updated";
  return {
    when: report.created_at,
    html: `
      <div class="activity-item">
        <span class="activity-icon">📍</span>
        <div>
          <strong>${escapeHtml(report.category)}</strong> report ${verb}.
          <div class="activity-time">${escapeHtml(report.created_at)}</div>
        </div>
      </div>
    `,
  };
}

function ideaActivityItem(idea) {
  return {
    when: idea.created_at,
    html: `
      <div class="activity-item">
        <span class="activity-icon">💡</span>
        <div>
          New idea pitched: <strong>${escapeHtml(idea.title)}</strong>.
          <div class="activity-time">${escapeHtml(idea.created_at)} · <a href="ideas.html">Support it →</a></div>
        </div>
      </div>
    `,
  };
}

async function loadActivity() {
  const container = document.getElementById("activity-feed");
  try {
    const [reportsRes, ideasRes] = await Promise.all([
      fetch(`${API_BASE}/reports/`),
      fetch(`${API_BASE}/ideas/?sort=recent`),
    ]);
    const reports = await reportsRes.json();
    const ideas = await ideasRes.json();

    const items = [...reports.slice(0, 3).map(reportActivityItem), ...ideas.slice(0, 3).map(ideaActivityItem)]
      .sort((a, b) => (a.when < b.when ? 1 : -1))
      .slice(0, 5);

    container.innerHTML = items.length
      ? items.map((i) => i.html).join("")
      : '<p class="ideas-empty">No activity yet - be the first to report or pitch something.</p>';
  } catch (err) {
    container.innerHTML = '<p class="ideas-empty">Couldn\'t load recent activity.</p>';
    console.error(err);
  }
}

loadOverview();
renderExchange();
loadRewards();
loadInitiatives();
loadActivity();
