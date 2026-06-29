const Feedback = require("../models/Feedback");

// POST /api/feedback
exports.createFeedback = async (req, res) => {
  try {
    const { name, rating, comment } = req.body;
    const normalizedRating = Number(rating);

    if (!name || !normalizedRating || normalizedRating < 1 || normalizedRating > 5) {
      return res.status(400).json({ error: "Name and rating (1-5) are required." });
    }

    const feedback = new Feedback({
      name: String(name).trim(),
      rating: normalizedRating,
      comment: comment ? String(comment).trim() : "",
    });
    await feedback.save();

    res.status(201).json({ message: "Feedback submitted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/feedback
exports.getFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};