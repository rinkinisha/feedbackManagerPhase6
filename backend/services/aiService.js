const {
  assistantSystemPrompt,
  sentimentPrompt,
  summaryPrompt,
} = require("./aiPrompts");

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
];

class AiServiceError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.status = status;
  }
}

const parseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    throw new AiServiceError("The AI returned an invalid response. Please try again.");
  }
};

const requestGemini = async (prompt, { systemInstruction, json = true } = {}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AiServiceError("AI features are not configured. Set GEMINI_API_KEY on the server.", 503);
  }

  let response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          systemInstruction: systemInstruction
            ? { parts: [{ text: systemInstruction }] }
            : undefined,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          safetySettings: SAFETY_SETTINGS,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 700,
            ...(json ? { responseMimeType: "application/json" } : {}),
          },
        }),
      },
    );
  } catch {
    throw new AiServiceError("The AI service could not be reached. Please try again.");
  }

  if (!response.ok) {
    const status = response.status === 429 ? 503 : 502;
    throw new AiServiceError(
      response.status === 429
        ? "The AI service is busy. Please try again shortly."
        : "The AI service could not complete this request.",
      status,
    );
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new AiServiceError("The AI service returned an unreadable response.");
  }
  if (!result || typeof result !== "object") {
    throw new AiServiceError("The AI service returned an invalid response.");
  }
  const candidate = result.candidates?.[0];
  const text = candidate?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();
  if (!text || result.promptFeedback?.blockReason || candidate.finishReason === "SAFETY") {
    throw new AiServiceError("The AI could not safely process this request. Please rephrase it.");
  }
  return text;
};

const analyzeSentiment = async (comment) => {
  const result = parseJson(await requestGemini(sentimentPrompt(comment)));
  if (
    !result ||
    !["positive", "neutral", "negative"].includes(result.sentiment) ||
    typeof result.confidence !== "number" ||
    result.confidence < 0 ||
    result.confidence > 1 ||
    typeof result.reason !== "string" ||
    !result.reason.trim() ||
    result.reason.length > 300
  ) {
    throw new AiServiceError("The AI returned an invalid sentiment result.");
  }
  return result;
};

const summarizeFeedback = async (feedback) => {
  const result = parseJson(await requestGemini(summaryPrompt(feedback)));
  if (
    !result ||
    typeof result.summary !== "string" ||
    !result.summary.trim() ||
    result.summary.length > 1000 ||
    !Array.isArray(result.strengths) ||
    !Array.isArray(result.improvements) ||
    [...result.strengths, ...result.improvements].some(
      (item) => typeof item !== "string" || !item.trim() || item.length > 150,
    ) ||
    result.strengths.length > 3 ||
    result.improvements.length > 3
  ) {
    throw new AiServiceError("The AI returned an invalid summary.");
  }
  return result;
};

const answerQuestion = async (question, feedback) => {
  const text = await requestGemini(
    `Feedback context (anonymous records): ${JSON.stringify(feedback)}\n\nQuestion: """${question}"""`,
    { systemInstruction: assistantSystemPrompt, json: false },
  );
  if (text.length > 3000) {
    throw new AiServiceError("The AI response exceeded the allowed length.");
  }
  return text;
};

module.exports = {
  AiServiceError,
  analyzeSentiment,
  summarizeFeedback,
  answerQuestion,
};
