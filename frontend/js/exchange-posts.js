const API_BASE = "http://localhost:8000/api";

const KNOWN_CATEGORIES = ["garden_share", "skill_swap", "tool_library", "neighborly_help"];

const params = new URLSearchParams(window.location.search);
const category = params.get("category") || "garden_share";
const isKnownCategory = KNOWN_CATEGORIES.includes(category);

// Localized title/description for the current category.
function metaTitle() {
  return isKnownCategory ? t("exchange." + category + ".title") : t("exchange.fallbackTitle");
}
function metaDescription() {
  return isKnownCategory ? t("exchange." + category + ".desc") : "";
}

function renderChrome() {
  const title = metaTitle();
  document.title = `LocalPulse - Espoo | ${title}`;
  document.getElementById("exchange-posts-title").textContent = title;
  document.getElementById("exchange-posts-subtitle").textContent = metaDescription();
}
renderChrome();

function postItemHtml(post) {
  const contact = post.contact
    ? `<div class="exchange-post-contact">📬 ${escapeHtml(tc(post.contact))}</div>`
    : "";
  const isMine = getMyExchangePostIds().includes(post.id);
  const isCompleted = post.status === "completed";

  const statusBadge = isCompleted
    ? `<span class="idea-badge exchange-status-done">${t("exchangePosts.completed")}</span>`
    : `<span class="idea-badge">${t("exchangePosts.open")}</span>`;

  const completeAction =
    isMine && !isCompleted
      ? `<button type="button" class="btn btn-outline complete-btn" data-id="${post.id}">${t("exchangePosts.markComplete")}</button>`
      : "";

  return `
    <div class="exchange-post${isCompleted ? " exchange-post--done" : ""}">
      <div class="exchange-post-top">${statusBadge}</div>
      <h4>${escapeHtml(tc(post.title))}</h4>
      <p>${escapeHtml(tc(post.description))}</p>
      ${contact}
      <div class="exchange-post-footer">
        <div class="activity-time">${escapeHtml(post.created_at)}</div>
        ${completeAction}
      </div>
    </div>
  `;
}

async function loadPosts() {
  const list = document.getElementById("exchange-posts-list");
  try {
    const res = await fetch(`${API_BASE}/exchange/?category=${encodeURIComponent(category)}`);
    let posts = await res.json();
    // The backend already orders by created_at DESC (most recent first).
    if (currentHood()) posts = posts.filter((p) => matchesHood(exchangeHood, p));
    if (posts.length) {
      list.innerHTML = posts.map(postItemHtml).join("");
    } else if (currentHood()) {
      list.innerHTML = `<p class="ideas-empty">${t("exchangePosts.noneHood", {
        title: escapeHtml(metaTitle()),
        hood: escapeHtml(hoodLabel(currentHood())),
      })}</p>`;
    } else {
      list.innerHTML = `<p class="ideas-empty">${t("exchangePosts.none", { title: escapeHtml(metaTitle()) })}</p>`;
    }
  } catch (err) {
    list.innerHTML = `<p class="ideas-empty">${t("exchangePosts.loadFail")}</p>`;
    console.error(err);
  }
}

document.getElementById("exchange-posts-list").addEventListener("click", async (e) => {
  const btn = e.target.closest(".complete-btn");
  if (!btn) return;
  btn.disabled = true;
  btn.textContent = t("exchangePosts.markingComplete");
  try {
    const res = await fetch(`${API_BASE}/exchange/${btn.dataset.id}/complete`, { method: "POST" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await Promise.all([loadPosts(), loadRewards()]);
  } catch (err) {
    console.error(`Failed to mark post ${btn.dataset.id} complete`, err);
    btn.disabled = false;
    btn.textContent = t("exchangePosts.markComplete");
  }
});

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

function openExchangeDialog() {
  document.getElementById("exchange-dialog-category").textContent = metaTitle();
  exchangeForm.reset();
  exchangeStatus.textContent = "";
  exchangeDialog.showModal();
}

document.getElementById("exchange-posts-new-btn").addEventListener("click", openExchangeDialog);
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
      body: JSON.stringify({ category, title, description, contact: contact || null }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    rememberMyExchangePost(data.id);
    exchangeStatus.textContent = t("dialog.posted");
    setTimeout(() => {
      exchangeDialog.close();
      loadPosts();
    }, 700);
  } catch (err) {
    exchangeStatus.textContent = t("dialog.error");
    console.error(err);
  }
});

// Re-render dynamic content (and the page chrome/title) on language change.
window.addEventListener("i18n:changed", () => {
  renderChrome();
  loadPosts();
  loadRewards();
});

// Re-filter the post list when the shared neighbourhood filter changes.
window.addEventListener("hood:changed", loadPosts);

mountHoodFilter("#hood-mount");
loadPosts();
loadRewards();
