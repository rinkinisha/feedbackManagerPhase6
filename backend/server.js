require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require("path");

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : ["http://localhost:5173"];

app.disable("x-powered-by");
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "25kb" }));

app.use("/api/feedback", require("./routes/feedbackRoute"));

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ error: "Request body must be valid JSON." });
  }
  console.error(error);
  res.status(error.status || 500).json({
    error: error.status && error.status < 500 ? error.message : "An unexpected server error occurred.",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  const frontendDist = path.resolve(__dirname, "../frontend/dist");
  app.use(express.static(frontendDist));
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Unable to start server:", error.message);
    process.exitCode = 1;
  });
}

module.exports = app;