const API_BASE = "http://localhost:8000/api";

const CATEGORY_META = {
  garden_share: { title: "Garden Share", description: "Share extra gardening samples and veggies for a kind gesture." },
  skill_swap: { title: "Skill Swap", description: "Exchange skills with neighbours, from coding to cooking." },
  tool_library: { title: "Tool Library", description: "Share tools and equipment to reduce waste and help others." },
  neighborly_help: { title: "Neighborly Help", description: "Offer help like mowing lawns or running errands for neighbours." },
};

const params = new URLSearchParams(window.location.search);
const category = params.get("category") || "garden_share";
const meta = CATEGORY_META[category] || { title: "Community Exchange", description: "" };

document.title = `LocalPulse - Espoo | ${meta.title}`;
document.getElementById("exchange-posts-title").textContent = meta.title;
document.getElementById("exchange-posts-subtitle").textContent = meta.description;

function postItemHtml(post) {
  const contact = post.contact
    ? `<div class="exchange-post-contact">📬 ${escapeHtml(post.contact)}</div>`
    : "";
  const isMine = getMyExchangePostIds().includes(post.id);
  const isCompleted = post.status === "completed";

  const statusBadge = isCompleted
    ? `<span class="idea-badge exchange-status-done">✅ Completed</span>`
    : `<span class="idea-badge">Open</span>`;

  const completeAction =
    isMine && !isCompleted
      ? `<button type="button" class="btn btn-outline complete-btn" data-id="${post.id}">Mark as complete</button>`
      : "";

  return `
    <div class="exchange-post${isCompleted ? " exchange-post--done" : ""}">
      <div class="exchange-post-top">${statusBadge}</div>
      <h4>${escapeHtml(post.title)}</h4>
      <p>${escapeHtml(post.description)}</p>
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
    const posts = await res.json();
    // The backend already orders by created_at DESC (most recent first).
    list.innerHTML = posts.length
      ? posts.map(postItemHtml).join("")
      : `<p class="ideas-empty">No posts yet in ${escapeHtml(meta.title)} - be the first to share or ask.</p>`;
  } catch (err) {
    list.innerHTML = '<p class="ideas-empty">Couldn\'t load posts right now.</p>';
    console.error(err);
  }
}

document.getElementById("exchange-posts-list").addEventListener("click", async (e) => {
  const btn = e.target.closest(".complete-btn");
  if (!btn) return;
  btn.disabled = true;
  btn.textContent = "Marking complete...";
  try {
    const res = await fetch(`${API_BASE}/exchange/${btn.dataset.id}/complete`, { method: "POST" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await Promise.all([loadPosts(), loadRewards()]);
  } catch (err) {
    console.error(`Failed to mark post ${btn.dataset.id} complete`, err);
    btn.disabled = false;
    btn.textContent = "Mark as complete";
  }
});

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

function openExchangeDialog() {
  document.getElementById("exchange-dialog-category").textContent = meta.title;
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

  exchangeStatus.textContent = "Posting...";
  try {
    const res = await fetch(`${API_BASE}/exchange/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, title, description, contact: contact || null }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    rememberMyExchangePost(data.id);
    exchangeStatus.textContent = "Posted! Your neighbours can now see this.";
    setTimeout(() => {
      exchangeDialog.close();
      loadPosts();
    }, 700);
  } catch (err) {
    exchangeStatus.textContent = "Something went wrong - is the backend running?";
    console.error(err);
  }
});

loadPosts();
loadRewards();
