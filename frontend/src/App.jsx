import { useCallback, useEffect, useState } from "react";
import {
  askAssistant,
  createFeedback,
  getFeedback,
  summarizeFeedback,
} from "./api.js";
import { FeedbackForm, FeedbackList, SiteHeader } from "./components.jsx";

function FeedbackInsights() {
  const [summary, setSummary] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSummary = async () => {
    setBusy(true);
    setStatus("");
    try {
      setSummary(await summarizeFeedback());
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleQuestion = async (event) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    setAnswer("");
    try {
      const result = await askAssistant(question);
      setAnswer(result.answer);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card">
      <div className="card-header">
        <h2>AI Feedback Insights</h2>
        <p>Ask for a summary of recent feedback or get help interpreting themes.</p>
      </div>
      <button type="button" className="primary-btn" onClick={handleSummary} disabled={busy}>
        {busy ? "Working..." : "Summarize recent feedback"}
      </button>
      {summary && (
        <div className="ai-result summary-result" aria-live="polite">
          <p>{summary.summary}</p>
          <p><strong>Strengths:</strong> {summary.strengths.join(", ") || "None identified"}</p>
          <p><strong>Improvements:</strong> {summary.improvements.join(", ") || "None identified"}</p>
        </div>
      )}
      <form className="assistant-form" onSubmit={handleQuestion}>
        <label htmlFor="assistant-question">Ask about feedback</label>
        <textarea
          id="assistant-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength="500"
          placeholder="What are students asking us to improve?"
          required
        />
        <button type="submit" className="text-btn" disabled={busy}>Ask assistant</button>
      </form>
      {answer && <p className="ai-result" aria-live="polite">{answer}</p>}
      {status && <p className="inline-error" role="alert">{status}</p>}
    </section>
  );
}

export default function App() {
  const archivePage = window.location.pathname.endsWith("/feedback.html");
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const refreshFeedback = useCallback(async (signal) => {
    setLoadError("");
    try {
      const items = await getFeedback({ signal });
      setFeedback(items);
    } catch (error) {
      if (error.name !== "AbortError") setLoadError(error.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    refreshFeedback(controller.signal);
    return () => controller.abort();
  }, [refreshFeedback]);

  const handleCreate = async (value) => {
    await createFeedback(value);
    await refreshFeedback();
  };

  return (
    <>
      <SiteHeader archivePage={archivePage} />
      <main className="container">
        {!archivePage && <FeedbackForm onCreated={handleCreate} />}
        <section className="card">
          <div className="card-header">
            <h2>{archivePage ? "Feedback Archive" : "Latest Feedback"}</h2>
            <p>{archivePage ? "Latest submissions appear first." : "Every response is saved and visible to the team."}</p>
          </div>
          <FeedbackList
            feedback={feedback}
            loading={loading}
            error={loadError}
            onChanged={refreshFeedback}
          />
        </section>
        <FeedbackInsights />
      </main>
      <footer className="footer">
        <p>Student Feedback Manager</p>
      </footer>
    </>
  );
}
