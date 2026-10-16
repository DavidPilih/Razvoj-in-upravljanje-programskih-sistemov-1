const mongoose = require("mongoose");
const { SUBJECTS, GRADES, GAME_MODES } = require("./constants");

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    answer: { type: String },
    correct: { type: Boolean, required: true },
    pointsEarned: { type: Number, default: 0 },
    timeMs: { type: Number }, // time to answer, for speed-based scoring
    answeredAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const playerSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    score: { type: Number, default: 0 },
    answers: { type: [answerSchema], default: [] },
  },
  { _id: false }
);

// One document per played game, shared by all three modes.
const gameSessionSchema = new mongoose.Schema(
  {
    mode: { type: String, required: true, enum: GAME_MODES },
    subject: { type: String, enum: SUBJECTS },
    grade: { type: Number, enum: GRADES },

    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    players: { type: [playerSchema], default: [] },

    status: { type: String, enum: ["waiting", "active", "finished"], default: "waiting" },
    roomCode: { type: String }, // join code for kahoot and duel; unset it when the game finishes
    host: { type: mongoose.Schema.Types.ObjectId, ref: "Student" }, // kahoot host
    winner: { type: mongoose.Schema.Types.ObjectId, ref: "Student" }, // duel winner
    dailyChallenge: { type: mongoose.Schema.Types.ObjectId, ref: "DailyChallenge" },

    startedAt: { type: Date },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

gameSessionSchema.index({ "players.student": 1, createdAt: -1 });
// Room codes are unique only while set, so they can be reused after a game ends.
gameSessionSchema.index(
  { roomCode: 1 },
  { unique: true, partialFilterExpression: { roomCode: { $type: "string" } } }
);
// A student can play each daily challenge only once.
gameSessionSchema.index(
  { dailyChallenge: 1, "players.student": 1 },
  { unique: true, partialFilterExpression: { mode: "daily" } }
);

module.exports = mongoose.model("GameSession", gameSessionSchema);
