const mongoose = require("mongoose");
const { SUBJECTS, GRADES } = require("./constants");

// One question per day per grade.
const dailyChallengeSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // "YYYY-MM-DD"
    grade: { type: Number, required: true, enum: GRADES },
    subject: { type: String, required: true, enum: SUBJECTS },
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
  },
  { timestamps: true }
);

dailyChallengeSchema.index({ date: 1, grade: 1 }, { unique: true });

module.exports = mongoose.model("DailyChallenge", dailyChallengeSchema);
