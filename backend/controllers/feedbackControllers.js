const Feedback = require("../models/Feedback");
const {
  MAX_COMMENT_LENGTH,
  validateFeedback,
  validateId,
} = require("../utils/feedbackValidation");
const {
  analyzeSentiment: getSentiment,
  summarizeFeedback: getSummary,
  answerQuestion,
} = require("../services/aiService");

const handleValidation = (req, res, options) => {
  const result = validateFeedback(req.body, options);
  if (result.error) {
    res.status(400).json({ error: result.error });
    return null;
  }
  return result.value;
};

exports.createFeedback = async (req, res) => {
  const value = handleValidation(req, res);
  if (!value) return;

  const feedback = await Feedback.create(value);
  res.status(201).json({ message: "Feedback submitted successfully", feedback });
};

exports.getFeedbacks = async (req, res) => {
  const feedbacks = await Feedback.find().sort({ createdAt: -1 });
  res.json(feedbacks);
};

exports.updateFeedback = async (req, res) => {
  if (!validateId(req.params.id)) {
    return res.status(400).json({ error: "Feedback ID is invalid." });
  }
  const value = handleValidation(req, res, { partial: true });
  if (!value) return;

  const feedback = await Feedback.findByIdAndUpdate(req.params.id, value, {
    new: true,
    runValidators: true,
  });
  if (!feedback) return res.status(404).json({ error: "Feedback not found." });
  res.json({ message: "Feedback updated successfully", feedback });
};

exports.deleteFeedback = async (req, res) => {
  if (!validateId(req.params.id)) {
    return res.status(400).json({ error: "Feedback ID is invalid." });
  }
  const feedback = await Feedback.findByIdAndDelete(req.params.id);
  if (!feedback) return res.status(404).json({ error: "Feedback not found." });
  res.json({ message: "Feedback deleted successfully" });
};

exports.analyzeSentiment = async (req, res) => {
  const { comment } = req.body || {};
  if (typeof comment !== "string" || !comment.trim() || comment.length > MAX_COMMENT_LENGTH) {
    return res.status(400).json({
      error: `Comment must contain 1-${MAX_COMMENT_LENGTH} characters.`,
    });
  }
  const sentiment = await getSentiment(comment.trim());
  res.json(sentiment);
};

exports.summarizeFeedback = async (req, res) => {
  const feedback = await Feedback.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .select("rating comment -_id");
  if (feedback.length === 0) {
    return res.status(400).json({ error: "Submit feedback before requesting a summary." });
  }
  const summary = await getSummary(feedback);
  res.json(summary);
};

exports.answerFeedbackQuestion = async (req, res) => {
  const { question } = req.body || {};
  if (typeof question !== "string" || !question.trim() || question.trim().length > 500) {
    return res.status(400).json({ error: "Question must contain 1-500 characters." });
  }

  const feedback = await Feedback.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .select("rating comment -_id");
  if (feedback.length === 0) {
    return res.status(400).json({ error: "Submit feedback before asking the assistant." });
  }
  const answer = await answerQuestion(question.trim(), feedback);
  res.json({ answer });
};
