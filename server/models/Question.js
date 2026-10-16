const mongoose = require("mongoose");
const { SUBJECTS, GRADES } = require("./constants");

const questionSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, enum: SUBJECTS },
    grade: { type: Number, required: true, enum: GRADES },
    text: { type: String, required: true, trim: true },

    // Original answer as written by the author, used for display.
    answer: { type: String, required: true, trim: true },
    // Variants accepted when checking a typed answer.
    acceptedAnswers: { type: [String], default: [] },
    // Distractors for the kahoot (multiple choice) mode.
    wrongAnswers: { type: [String], default: [] },

    // Base value from the question files; game modes apply their own scoring on top.
    points: { type: Number, required: true, min: 1, default: 1 },
    topic: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

questionSchema.index({ subject: 1, grade: 1, active: 1 });
questionSchema.index({ subject: 1, grade: 1, text: 1 }, { unique: true });

module.exports = mongoose.model("Question", questionSchema);
