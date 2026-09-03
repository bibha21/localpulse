const API_BASE = "http://localhost:8000/api";

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return t("pulse.greetingMorning");
  if (hour < 18) return t("pulse.greetingAfternoon");
  return t("pulse.greetingEvening");
}

function renderGreeting() {
  document.getElementById("greeting").textContent = `${timeGreeting()} 👋`;
}
renderGreeting();

const OVERVIEW_META = {
  safety: { icon: "🛡️" },
  greenspace: { icon: "🌳" },
  connectivity: { icon: "📶" },
};

function overviewCardHtml(key, data) {
  const meta = OVERVIEW_META[key];
  // Prefer the machine-readable keys from the backend so the status/detail
  // show in the active language; fall back to the pre-formatted English.
  const status = data.status_key
    ? t("overview.status." + data.status_key)
    : escapeHtml(data.status);
  const detail = data.detail_key
    ? t("overview.detail." + data.detail_key, data.detail_params || {})
    : escapeHtml(data.detail);
  return `
    <div class="overview-card">
      <div class="overview-icon">${meta.icon}</div>
      <div class="overview-label">${t("pulse.overview." + key)}</div>
      <div class="overview-status">${status}</div>
      <div class="overview-detail">${detail}</div>
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
    grid.innerHTML = `<p class="ideas-empty">${t("pulse.overviewFail")}</p>`;
    console.error(err);
  }
}

// Titles/descriptions are looked up per language via "exchange.<category>.*".
const EXCHANGE_ITEMS = [
  { category: "garden_share", icon: "🌱" },
  { category: "skill_swap", icon: "🧠" },
  { category: "tool_library", icon: "🛠️" },
  { category: "neighborly_help", icon: "🤲" },
];

function exchangeCardHtml(item, count) {
  const postsUrl = `exchange-posts.html?category=${encodeURIComponent(item.category)}`;
  const title = t("exchange." + item.category + ".title");
  const countLabel = count
    ? `<a href="${postsUrl}" class="exchange-count">${t(count === 1 ? "exchange.postsOne" : "exchange.postsMany", { count })}</a>`
    : "";
  return `
    <div class="exchange-card">
      <div class="exchange-icon">${item.icon}</div>
      <h4><a href="${postsUrl}" class="exchange-title-link">${escapeHtml(title)}</a> ${countLabel}</h4>
      <p>${escapeHtml(t("exchange." + item.category + ".desc"))}</p>
      <div class="exchange-card-actions">
        <a href="${postsUrl}" class="btn btn-outline">${t("exchange.viewPosts")}</a>
        <button type="button" class="btn btn-primary exchange-btn" data-category="${item.category}" data-title="${escapeHtml(title)}">${t("exchange.shareAsk")}</button>
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

// Translated badge name from the backend's tier key, falling back to the
// English name the API also sends.
function tierName(key, fallback) {
  return key ? t("rewards.tier." + key) : escapeHtml(fallback);
}

function rewardsCardHtml(rewards) {
  const reachedKeys = rewards.tiers_reached_keys || [];
  const latestTier = reachedKeys.length
    ? tierName(reachedKeys[reachedKeys.length - 1])
    : rewards.tiers_reached.length
    ? escapeHtml(rewards.tiers_reached[rewards.tiers_reached.length - 1])
    : null;
  const nextTierLine = rewards.next_tier
    ? t("rewards.pointsToTier", {
        count: rewards.next_tier.threshold - rewards.total_points,
        name: tierName(rewards.next_tier.key, rewards.next_tier.name),
      })
    : t("rewards.allTiers");
  const cityReward = rewards.city_yearly_reward_key
    ? t("rewards.cityGrant")
    : escapeHtml(rewards.city_yearly_reward);
  const cityLine = rewards.city_reward_unlocked
    ? t("rewards.cityUnlocked", { year: rewards.year, reward: cityReward })
    : t("rewards.cityToGo", { count: rewards.city_yearly_reward_threshold - rewards.year_points });

  return `
    <h3>${t("rewards.h3")}</h3>
    <p class="muted">${t("rewards.intro", { points: rewards.points_per_deed })}</p>
    <div class="rewards-stats">
      <div>
        <div class="overview-status">${rewards.total_points}</div>
        <div class="overview-detail">${t("rewards.totalPoints", { count: rewards.total_completed_deeds })}</div>
      </div>
      <div>
        <div class="overview-status">${rewards.year_points}</div>
        <div class="overview-detail">${t("rewards.yearPoints", { year: rewards.year, count: rewards.year_completed_deeds })}</div>
      </div>
    </div>
    ${latestTier ? `<p>${t("rewards.currentBadge")} <strong>${latestTier}</strong></p>` : ""}
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
    card.innerHTML = `<p class="ideas-empty">${t("rewards.loadFail")}</p>`;
    console.error(err);
  }
}

const exchangeDialog = document.getElementById("exchange-dialog");
const exchangeForm = document.getElementById("exchange-form");
const exchangeStatus = document.getElementById("exchange-form-status");
let activeExchangeCategory = null;

let activeExchangeTitleKey = null;

function openExchangeDialog(category, title) {
  activeExchangeCategory = category;
  activeExchangeTitleKey = category;
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

  exchangeStatus.textContent = t("dialog.posting");
  try {
    const res = await fetch(`${API_BASE}/exchange/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: activeExchangeCategory, title, description, contact: contact || null }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    rememberMyExchangePost(data.id);
    exchangeStatus.textContent = t("dialog.posted");
    setTimeout(() => {
      exchangeDialog.close();
      renderExchange();
    }, 700);
  } catch (err) {
    exchangeStatus.textContent = t("dialog.error");
    console.error(err);
  }
});

function initiativeTags(idea) {
  const tags = [];
  if (idea.needs_funding) tags.push(t("ideas.badgeSeekingFunding"));
  if (idea.environmental_impact === "High Impact") tags.push(t("ideas.badgeEco"));
  if (!tags.length) tags.push(t("ideas.badgeSocial"));
  return tags;
}

function initiativeCardHtml(idea) {
  const tags = initiativeTags(idea)
    .map((tag) => `<span class="idea-badge">${escapeHtml(tag)}</span>`)
    .join("");
  return `
    <div class="initiative-card">
      <div class="initiative-visual">🌟</div>
      <div class="initiative-body">
        <div class="initiative-tags">${tags}</div>
        <h4>${escapeHtml(tc(idea.title))}</h4>
        <p>${escapeHtml(tc(idea.description))}</p>
        <div class="idea-meta">
          <span>👍 ${idea.support_count}</span>
          <span>👥 ${idea.volunteer_count} ${t("pulse.volunteersLower")}</span>
          <span>💶 €${idea.est_budget_min} - €${idea.est_budget_max}</span>
        </div>
        <div class="idea-card-actions">
          <button type="button" class="btn btn-primary" data-action="support" data-id="${idea.id}">${t("ideas.support")}</button>
          <button type="button" class="btn btn-outline" data-action="volunteer" data-id="${idea.id}">${t("ideas.volunteer")}</button>
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
      : `<p class="ideas-empty">${t("pulse.noPitchedIdeasPre")}<a href="pitch-idea.html">${t("pulse.noPitchedIdeasLink")}</a>.</p>`;
  } catch (err) {
    grid.innerHTML = `<p class="ideas-empty">${t("pulse.initiativesFail")}</p>`;
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

// Only category/status/timestamp ever get shown here - never a report's raw
// free-text description, matching the privacy rule used across the rest of
// the app (see the planner dashboard's own privacy note).
function reportActivityItem(report) {
  const verbKey = "activity.verb." + report.status;
  const verb = t(verbKey) === verbKey ? t("activity.verb.default") : t(verbKey);
  return {
    when: report.created_at,
    html: `
      <div class="activity-item">
        <span class="activity-icon">📍</span>
        <div>
          ${t("activity.reportLine", { category: `<strong>${escapeHtml(catLabel(report.category))}</strong>`, verb })}
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
          ${t("activity.ideaLine", { title: `<strong>${escapeHtml(tc(idea.title))}</strong>` })}
          <div class="activity-time">${escapeHtml(idea.created_at)} · <a href="ideas.html">${t("activity.supportIt")}</a></div>
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
      : `<p class="ideas-empty">${t("activity.none")}</p>`;
  } catch (err) {
    container.innerHTML = `<p class="ideas-empty">${t("activity.loadFail")}</p>`;
    console.error(err);
  }
}

function loadAll() {
  loadOverview();
  renderExchange();
  loadRewards();
  loadInitiatives();
  loadActivity();
}

// Re-render everything dynamic when the language changes (static text is
// handled by js/i18n.js).
window.addEventListener("i18n:changed", () => {
  renderGreeting();
  loadAll();
});

loadAll();
