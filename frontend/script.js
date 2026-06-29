const API_URL = "http://localhost:5000/api/feedback";

const form = document.getElementById("feedbackForm");
const feedbackList = document.getElementById("feedbackList");
const statusEl = document.getElementById("formStatus");

const setStatus = (message, isError = false) => {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#b63812" : "#6d5f55";
};

const renderFeedback = (items) => {
  if (!feedbackList) return;
  feedbackList.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No feedback yet. Be the first to share your thoughts.";
    feedbackList.appendChild(empty);
    return;
  }

  items.forEach((fb, index) => {
    const card = document.createElement("div");
    card.className = "feedback-item";
    card.style.animationDelay = `${index * 0.05}s`;

    const title = document.createElement("h4");
    title.textContent = fb.name || "Anonymous";

    const rating = document.createElement("span");
    rating.className = "rating-pill";
    rating.textContent = `${fb.rating}/5`;

    const titleRow = document.createElement("div");
    titleRow.style.display = "flex";
    titleRow.style.alignItems = "center";
    titleRow.style.justifyContent = "space-between";
    titleRow.style.gap = "1rem";
    titleRow.appendChild(title);
    titleRow.appendChild(rating);

    const comment = document.createElement("p");
    comment.textContent = fb.comment || "No additional comments provided.";

    card.appendChild(titleRow);
    card.appendChild(comment);
    feedbackList.appendChild(card);
  });
};

const loadFeedback = async () => {
  if (!feedbackList) return;
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    renderFeedback(Array.isArray(data) ? data : []);
  } catch (error) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Unable to load feedback. Please try again later.";
    feedbackList.innerHTML = "";
    feedbackList.appendChild(empty);
  }
};

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("Submitting your feedback...");

    const payload = {
      name: document.getElementById("name").value.trim(),
      rating: Number(document.getElementById("rating").value),
      comment: document.getElementById("comment").value.trim(),
    };

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      setStatus("Thanks! Your feedback was saved.");
      form.reset();
      await loadFeedback();
    } catch (error) {
      setStatus("Could not submit feedback. Please try again.", true);
    }
  });
}

loadFeedback();