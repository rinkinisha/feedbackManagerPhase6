const API_URL = "/api/feedback";

const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "The request could not be completed.");
  }
  return data;
};

export const getFeedback = (options) => request("", options);
export const createFeedback = (feedback) =>
  request("", { method: "POST", body: JSON.stringify(feedback) });
export const updateFeedback = (id, feedback) =>
  request(`/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(feedback),
  });
export const deleteFeedback = (id) =>
  request(`/${encodeURIComponent(id)}`, { method: "DELETE" });
export const analyzeSentiment = (comment) =>
  request("/ai/sentiment", { method: "POST", body: JSON.stringify({ comment }) });
export const summarizeFeedback = () =>
  request("/ai/summary", { method: "POST", body: "{}" });
export const askAssistant = (question) =>
  request("/ai/assistant", { method: "POST", body: JSON.stringify({ question }) });
