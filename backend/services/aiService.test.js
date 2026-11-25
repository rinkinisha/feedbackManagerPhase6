const test = require("node:test");
const assert = require("node:assert/strict");
const {
  AiServiceError,
  analyzeSentiment,
  summarizeFeedback,
  answerQuestion,
} = require("./aiService");

const withGeminiResponse = async (t, result, callback) => {
  const previousKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test-server-key";
  t.after(() => {
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  });
  t.mock.method(global, "fetch", async (url, options) => {
    assert.equal(url, "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent");
    assert.equal(options.headers["x-goog-api-key"], "test-server-key");
    assert.equal(url.includes("test-server-key"), false);
    return {
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: typeof result === "string" ? result : JSON.stringify(result) }] } }],
      }),
    };
  });
  await callback();
};

test("validates Gemini sentiment output and keeps the key in a request header", async (t) => {
  await withGeminiResponse(t, {
    sentiment: "positive",
    confidence: 0.94,
    reason: "The student liked the clear explanations.",
  }, async () => {
    assert.deepEqual(await analyzeSentiment("Clear explanations"), {
      sentiment: "positive",
      confidence: 0.94,
      reason: "The student liked the clear explanations.",
    });
  });
});

test("rejects malformed or out-of-range AI output", async (t) => {
  await withGeminiResponse(t, {
    sentiment: "mixed",
    confidence: 1.4,
    reason: "Invalid fields",
  }, async () => {
    await assert.rejects(analyzeSentiment("Feedback"), AiServiceError);
  });
});

test("validates summary output and uses a system prompt for the assistant", async (t) => {
  const previousKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test-server-key";
  t.after(() => {
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  });

  const outputs = [
    { summary: "Students value the lessons.", strengths: ["Clear lessons"], improvements: ["Clarify homework"] },
    "Most students appreciate clear lessons.",
  ];
  const expectedAnswer = outputs[1];
  t.mock.method(global, "fetch", async (_url, options) => {
    const body = JSON.parse(options.body);
    if (outputs.length === 2) {
      assert.equal(body.generationConfig.responseMimeType, "application/json");
    } else {
      assert.match(body.systemInstruction.parts[0].text, /only questions about the feedback records/);
      assert.equal(body.generationConfig.responseMimeType, undefined);
    }
    const output = outputs.shift();
    return {
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: typeof output === "string" ? output : JSON.stringify(output) }] } }],
      }),
    };
  });

  assert.deepEqual(await summarizeFeedback([{ rating: 5, comment: "Clear lessons" }]), {
    summary: "Students value the lessons.",
    strengths: ["Clear lessons"],
    improvements: ["Clarify homework"],
  });
  assert.equal(await answerQuestion("What is working?", [{ rating: 5, comment: "Clear lessons" }]), expectedAnswer);
});
