const API_BASE = "http://localhost:8000/api";

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// Renders an AI insight block: the cached summary/idea if one exists, or a
// "Generate AI insight" button if not (insights are only computed on click,
// never automatically on page load, to avoid spending Gemini quota on every reload).
function renderInsight(container, { summary, actionableIdea, postUrl }) {
  if (summary !== null && summary !== undefined) {
    const ideaBlock = actionableIdea
      ? `<div class="actionable-idea">💡 <strong>Idea:</strong> ${escapeHtml(actionableIdea)}</div>`
      : "";
    container.innerHTML = `<p>${escapeHtml(summary)}</p>${ideaBlock}`;
    return;
  }
  if (!postUrl) {
    container.innerHTML = "";
    return;
  }
  container.innerHTML = `<button type="button" class="generate-insight-btn">🤖 Generate AI insight</button>`;
  container.querySelector(".generate-insight-btn").addEventListener("click", async (e) => {
    const btn = e.target;
    btn.disabled = true;
    btn.textContent = "Generating...";
    try {
      const res = await fetch(postUrl, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const ideaBlock = data.actionable_idea
        ? `<div class="actionable-idea">💡 <strong>Idea:</strong> ${escapeHtml(data.actionable_idea)}</div>`
        : "";
      const note = data.source === "fallback"
        ? `<p><small>(AI unavailable right now - showing an automatic summary instead)</small></p>`
        : "";
      container.innerHTML = `<p>${escapeHtml(data.summary)}</p>${ideaBlock}${note}`;
    } catch (err) {
      btn.disabled = false;
      btn.textContent = "🤖 Generate AI insight";
      console.error(err);
    }
  });
}

async function loadTopics() {
  const container = document.getElementById("topics");
  const res = await fetch(`${API_BASE}/topics/`);
  const topics = await res.json();
  container.innerHTML = "";

  topics.forEach((topic) => {
    const card = document.createElement("div");
    card.className = "topic-card";

    const breakdown = Object.entries(topic.sentiment_breakdown)
      .map(([sentiment, count]) => `<span class="sentiment-badge sentiment-${escapeHtml(sentiment)}">${escapeHtml(sentiment)}: ${count}</span>`)
      .join("");

    const commentItems = topic.comments
      .map(
        (c) => `
          <li>
            <span class="sentiment-badge sentiment-${escapeHtml(c.sentiment)}">${escapeHtml(c.sentiment)}</span>
            ${escapeHtml(c.comment_text)}
            <br><small>${escapeHtml(c.created_at)}</small>
          </li>`
      )
      .join("");

    card.innerHTML = `
      <h2>${escapeHtml(topic.title)}</h2>
      <div class="area">${escapeHtml(topic.area)} · ${topic.comment_count} comment(s)</div>
      <p>${escapeHtml(topic.description)}</p>
      <div class="sentiment-breakdown">${breakdown}</div>
      <div class="insight-block"></div>
      <form class="comment-form" data-topic-id="${topic.id}">
        <textarea placeholder="Share your feedback or concern..." required></textarea>
        <button type="submit">Submit</button>
      </form>
      <div class="comment-status"></div>
      <ul class="comment-list">${commentItems}</ul>
    `;

    renderInsight(card.querySelector(".insight-block"), {
      summary: topic.summary,
      actionableIdea: topic.actionable_idea,
      postUrl: topic.comment_count >= 3 ? `${API_BASE}/topics/${topic.id}/insight` : null,
    });

    card.querySelector(".comment-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const topicId = form.getAttribute("data-topic-id");
      const textarea = form.querySelector("textarea");
      const statusEl = card.querySelector(".comment-status");
      const commentText = textarea.value.trim();
      if (!commentText) return;

      statusEl.textContent = "Submitting...";
      const formData = new FormData();
      formData.append("comment_text", commentText);

      try {
        const res = await fetch(`${API_BASE}/topics/${topicId}/comments`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        statusEl.textContent = `Thanks! Classified as: ${data.sentiment}.`;
        textarea.value = "";
        loadTopics();
      } catch (err) {
        statusEl.textContent = "Something went wrong - is the backend running?";
        console.error(err);
      }
    });

    container.appendChild(card);
  });
}

loadTopics();
