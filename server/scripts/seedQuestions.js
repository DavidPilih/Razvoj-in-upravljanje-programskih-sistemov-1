// Imports ../../Questions/*.json into the Question collection.
// Run with: npm run seed   (replaces all existing questions)
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const connectDB = require("../db");
const { Question } = require("../models");

const QUESTIONS_DIR = path.join(__dirname, "..", "..", "Questions");

// File prefix -> subject. File names look like "mat_7.json".
const SUBJECT_BY_PREFIX = { mat: "math", zgo: "history" };

// Keys used in the question files.
const KEYS = {
  text: "vprašanje",
  answer: "rezultat",
  points: "vrednost vprašanja",
  wrongAnswers: "napačni odgovori",
};

function acceptedAnswersFor(answer, subject) {
  const variants = new Set([answer]);
  if (subject === "math") {
    // "1/2 ali 0.5" -> ["1/2", "0.5"],  "0 (ali 0%)" -> ["0", "0%"]
    const inParens = answer.match(/^(.+?)\s*\(ali (.+)\)$/);
    const parts = inParens ? [inParens[1], inParens[2]] : answer.split(" ali ");
    parts.map((p) => p.trim()).filter(Boolean).forEach((p) => variants.add(p));
  }
  return [...variants];
}

function loadFile(fileName) {
  const match = fileName.match(/^([a-z]+)_(\d)\.json$/);
  if (!match) throw new Error(`Unexpected file name: ${fileName}`);

  const subject = SUBJECT_BY_PREFIX[match[1]];
  if (!subject) throw new Error(`Unknown subject prefix "${match[1]}" in ${fileName}`);
  const grade = Number(match[2]);

  const raw = JSON.parse(fs.readFileSync(path.join(QUESTIONS_DIR, fileName), "utf8"));
  return raw.map((q) => {
    const answer = String(q[KEYS.answer]).trim();
    return {
      subject,
      grade,
      text: String(q[KEYS.text]).trim(),
      answer,
      acceptedAnswers: acceptedAnswersFor(answer, subject),
      wrongAnswers: q[KEYS.wrongAnswers] || [],
      points: Number(q[KEYS.points]) || 1,
    };
  });
}

async function seed() {
  await connectDB();

  const files = fs.readdirSync(QUESTIONS_DIR).filter((f) => f.endsWith(".json"));
  const questions = [];
  for (const f of files) {
    const fromFile = loadFile(f);
    console.log(`  ${f}: ${fromFile.length}`);
    questions.push(...fromFile);
  }

  await Question.syncIndexes();
  await Question.deleteMany({});
  await Question.insertMany(questions);

  console.log(`Inserted ${questions.length} questions.`);
}

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
