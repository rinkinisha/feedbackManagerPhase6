import { useState } from "react";
import {
  analyzeSentiment,
  deleteFeedback,
  updateFeedback,
} from "./api.js";

export function SiteHeader({ archivePage }) {
  return (
    <header className={`hero${archivePage ? " slim" : ""}`}>
      <div className="hero-inner">
        <p className="eyebrow">Student Voice Portal</p>
        <h1>{archivePage ? "All Feedback" : "Student Feedback Manager"}</h1>
        <p className="subhead">
          {archivePage
            ? "Browse every response stored in the system."
            : "Collect, review, and learn from student feedback in one place."}
        </p>
        <nav className="site-nav" aria-label="Main navigation">
          <a href="/">Submit feedback</a>
          <a href="/feedback.html">Feedback archive</a>
        </nav>
      </div>
    </header>
  );
}

export function FeedbackForm({ onCreated }) {
  const [status, setStatus] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setStatus("Submitting your feedback...");
    setError(false);
    setSubmitting(true);
    try {
      await onCreated({
        name: formData.get("name").trim(),
        rating: Number(formData.get("rating")),
        comment: formData.get("comment").trim(),
      });
      form.reset();
      setStatus("Thanks! Your feedback was saved.");
    } catch (requestError) {
      setError(true);
      setStatus(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card">
      <div className="card-header">
        <h2>Submit Feedback</h2>
        <p>Share your experience to help improve learning outcomes.</p>
      </div>
      <form className="feedback-form" onSubmit={handleSubmit}>
        <label>
          <span>Your Name</span>
          <input name="name" type="text" placeholder="e.g., Alex Johnson" maxLength="80" required />
        </label>
        <label>
          <span>Rating</span>
          <select name="rating" defaultValue="" required>
            <option value="" disabled>Select Rating</option>
            <option value="1">1 - Needs work</option>
            <option value="2">2 - Fair</option>
            <option value="3">3 - Good</option>
            <option value="4">4 - Very Good</option>
            <option value="5">5 - Excellent</option>
          </select>
        </label>
        <label>
          <span>Comments</span>
          <textarea
            name="comment"
            maxLength="2000"
            placeholder="Tell us what worked and what could be better."
          />
        </label>
        <button className="primary-btn" type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Feedback"}
        </button>
        <p className={`form-status${error ? " error-text" : ""}`} role="status">{status}</p>
      </form>
    </section>
  );
}

export function FeedbackCard({ feedback, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(feedback.name);
  const [rating, setRating] = useState(String(feedback.rating));
  const [comment, setComment] = useState(feedback.comment || "");
  const [sentiment, setSentiment] = useState(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const handleUpdate = async (event) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      await updateFeedback(feedback._id, { name, rating: Number(rating), comment });
      setEditing(false);
      await onChanged();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this feedback response?")) return;
    setBusy(true);
    try {
      await deleteFeedback(feedback._id);
      await onChanged();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSentiment = async () => {
    setBusy(true);
    setStatus("");
    try {
      setSentiment(await analyzeSentiment(feedback.comment || ""));
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="feedback-item">
      {editing ? (
        <form className="edit-form" onSubmit={handleUpdate}>
          <label>
            <span>Name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength="80" required />
          </label>
          <label>
            <span>Rating</span>
            <select value={rating} onChange={(event) => setRating(event.target.value)} required>
              {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}/5</option>)}
            </select>
          </label>
          <label>
            <span>Comment</span>
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength="2000" />
          </label>
          <div className="feedback-actions">
            <button type="submit" className="text-btn" disabled={busy}>Save</button>
            <button type="button" className="text-btn" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <>
          <div className="feedback-title-row">
            <h4>{feedback.name || "Anonymous"}</h4>
            <span className="rating-pill">{feedback.rating}/5</span>
          </div>
          <p>{feedback.comment || "No additional comments provided."}</p>
          <div className="feedback-actions">
            <button type="button" className="text-btn" onClick={() => setEditing(true)}>Edit</button>
            <button type="button" className="text-btn danger-btn" onClick={handleDelete} disabled={busy}>Delete</button>
            {feedback.comment?.trim() && (
              <button type="button" className="text-btn" onClick={handleSentiment} disabled={busy}>
                Analyze sentiment
              </button>
            )}
          </div>
          {sentiment && (
            <p className="ai-result">
              <strong>{sentiment.sentiment}</strong> ({Math.round(sentiment.confidence * 100)}%): {sentiment.reason}
            </p>
          )}
          {status && <p className="inline-error" role="alert">{status}</p>}
        </>
      )}
    </article>
  );
}

export function FeedbackList({ feedback, loading, error, onChanged }) {
  if (loading) return <div className="empty-state" role="status">Loading feedback...</div>;
  if (error) return <div className="empty-state error-text" role="alert">{error}</div>;
  if (!feedback.length) {
    return <div className="empty-state">No feedback yet. Be the first to share your thoughts.</div>;
  }
  return (
    <div className="feedback-list">
      {feedback.map((item) => (
        <FeedbackCard key={item._id} feedback={item} onChanged={onChanged} />
      ))}
    </div>
  );
}
