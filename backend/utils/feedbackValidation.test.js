const test = require("node:test");
const assert = require("node:assert/strict");
const { validateFeedback, validateId } = require("./feedbackValidation");

test("validates and normalizes new feedback while preserving allowed content", () => {
  assert.deepEqual(validateFeedback({
    name: "  Alex Johnson ",
    rating: "5",
    comment: "  Helpful examples  ",
  }), {
    value: { name: "Alex Johnson", rating: 5, comment: "Helpful examples" },
  });
});

test("rejects invalid create fields and unsupported keys", () => {
  assert.match(validateFeedback({ name: "Alex", rating: true }).error, /Rating/);
  assert.match(validateFeedback({ name: "Alex", rating: 6 }).error, /Rating/);
  assert.match(validateFeedback({ name: "Alex", rating: 4, extra: "no" }).error, /Only/);
  assert.match(validateFeedback({ name: " ", rating: 4 }).error, /Name/);
});

test("requires a non-empty partial update and validates each supplied field", () => {
  assert.match(validateFeedback({}, { partial: true }).error, /at least one/);
  assert.deepEqual(validateFeedback({ comment: "Updated" }, { partial: true }), {
    value: { comment: "Updated" },
  });
  assert.match(validateFeedback({ comment: "x".repeat(2001) }, { partial: true }).error, /2000/);
});

test("validates Mongo feedback IDs", () => {
  assert.equal(validateId("507f1f77bcf86cd799439011"), true);
  assert.equal(validateId("not-an-id"), false);
});
