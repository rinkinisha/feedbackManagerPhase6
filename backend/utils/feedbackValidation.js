const mongoose = require("mongoose");

const MAX_NAME_LENGTH = 80;
const MAX_COMMENT_LENGTH = 2000;
const allowedFields = new Set(["name", "rating", "comment"]);

const cleanString = (value) => value.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

const validateFeedback = (input, { partial = false } = {}) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Request body must be an object." };
  }

  const keys = Object.keys(input);
  if (keys.some((key) => !allowedFields.has(key))) {
    return { error: "Only name, rating, and comment fields are allowed." };
  }
  if (partial && keys.length === 0) {
    return { error: "Provide at least one field to update." };
  }
  if (!partial && (!Object.hasOwn(input, "name") || !Object.hasOwn(input, "rating"))) {
    return { error: "Name and rating (1-5) are required." };
  }

  const value = {};
  if (Object.hasOwn(input, "name")) {
    if (typeof input.name !== "string") return { error: "Name must be text." };
    value.name = cleanString(input.name);
    if (!value.name || value.name.length > MAX_NAME_LENGTH) {
      return { error: `Name must be between 1 and ${MAX_NAME_LENGTH} characters.` };
    }
  }
  if (Object.hasOwn(input, "rating")) {
    if (typeof input.rating !== "number" && typeof input.rating !== "string") {
      return { error: "Rating must be a whole number from 1 to 5." };
    }
    const rating = Number(input.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return { error: "Rating must be a whole number from 1 to 5." };
    }
    value.rating = rating;
  }
  if (Object.hasOwn(input, "comment")) {
    if (typeof input.comment !== "string") return { error: "Comment must be text." };
    value.comment = cleanString(input.comment);
    if (value.comment.length > MAX_COMMENT_LENGTH) {
      return { error: `Comment must be no more than ${MAX_COMMENT_LENGTH} characters.` };
    }
  } else if (!partial) {
    value.comment = "";
  }

  return { value };
};

const validateId = (id) => mongoose.isValidObjectId(id);

module.exports = {
  MAX_COMMENT_LENGTH,
  validateFeedback,
  validateId,
};
