const express = require("express");
const router = express.Router();
const {
  createFeedback,
  getFeedbacks,
  updateFeedback,
  deleteFeedback,
  analyzeSentiment,
  summarizeFeedback,
  answerFeedbackQuestion,
} = require("../controllers/feedbackControllers");

router.post("/", createFeedback);
router.get("/", getFeedbacks);
router.put("/:id", updateFeedback);
router.delete("/:id", deleteFeedback);
router.post("/ai/sentiment", analyzeSentiment);
router.post("/ai/summary", summarizeFeedback);
router.post("/ai/assistant", answerFeedbackQuestion);

module.exports = router;