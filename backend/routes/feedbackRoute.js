const express = require("express");
const router = express.Router();
const {
  createFeedback,
  getFeedbacks,
} = require("../controllers/feedbackControllers");

router.post("/", createFeedback);
router.get("/", getFeedbacks);

module.exports = router;