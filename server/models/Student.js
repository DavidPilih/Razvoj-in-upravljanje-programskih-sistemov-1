const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { GRADES } = require("./constants");

const SALT_ROUNDS = 10;

const scoreBySubjectSchema = new mongoose.Schema(
  {
    math: { type: Number, default: 0 },
    history: { type: Number, default: 0 },
  },
  { _id: false }
);

const scoreByModeSchema = new mongoose.Schema(
  {
    daily: { type: Number, default: 0 },
    kahoot: { type: Number, default: 0 },
    duel: { type: Number, default: 0 },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_.]+$/,
    },
    password: { type: String, required: true, minlength: 8, select: false },

    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    // Shown on leaderboards instead of the real name (students are minors).
    nickname: { type: String, required: true, unique: true, trim: true, maxlength: 30 },

    grade: { type: Number, required: true, enum: GRADES },
    classLabel: { type: String, trim: true }, // e.g. "7.a"

    // Cached totals for fast leaderboards; source of truth is GameSession.
    totalScore: { type: Number, default: 0 },
    scoreBySubject: { type: scoreBySubjectSchema, default: () => ({}) },
    scoreByMode: { type: scoreByModeSchema, default: () => ({}) },

    dailyStreak: { type: Number, default: 0 },
    lastDailyDate: { type: String }, // "YYYY-MM-DD", same format as DailyChallenge.date
    duelRating: { type: Number, default: 1000 },

    stats: {
      gamesPlayed: { type: Number, default: 0 },
      correctAnswers: { type: Number, default: 0 },
      totalAnswers: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

studentSchema.index({ totalScore: -1 });
studentSchema.index({ grade: 1, totalScore: -1 });

studentSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

// Requires the document to be loaded with .select("+password").
studentSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

studentSchema.set("toJSON", {
  transform(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Student", studentSchema);
