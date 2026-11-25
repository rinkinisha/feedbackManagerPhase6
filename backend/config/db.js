const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not set in the environment");
    }

    await mongoose.connect(mongoUri);
    console.log("MongoDB Connected");
  } catch (error) {
    throw error;
  }
};

module.exports = connectDB;