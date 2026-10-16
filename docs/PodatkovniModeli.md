# Server – MongoDB data models

Express backend with a MongoDB database (Mongoose).

## Setup

1. In `server/`, copy `.env.example` to `.env` and set `MONGODB_URI` to a local MongoDB (`mongodb://127.0.0.1:27017/kviz`) or a MongoDB Atlas connection string.
2. From the `server/` folder, install dependencies and load the questions:
   ```
   npm install
   npm run seed
   ```
3. Start the server: `npm run dev`. It runs on http://localhost:5000 and starts only after connecting to the database.

`npm run seed` replaces all questions in the database with the contents of `Questions/*.json`. Run it again whenever the question files change.

## Models (`server/models/`)

| Model | Purpose |
|---|---|
| `Student` | Student account: `username` + `password`, `firstName`, `lastName`, `nickname`, `grade` (7–9), `classLabel` (e.g. `"7.a"`), scores, daily streak and 1v1 rating |
| `Question` | `subject` (`math` / `history`), `grade`, `text`, `answer`, `acceptedAnswers`, `wrongAnswers` (Kahoot choices), `points`, `active` |
| `DailyChallenge` | The daily question: one per `date` (`"YYYY-MM-DD"`) per grade |
| `GameSession` | One played game in any `mode` (`daily`, `kahoot`, `duel`): its questions, players, each answer with `correct`, `pointsEarned` and `timeMs`, plus `status`, `roomCode` and `winner` |

Import everything at once (from a file in `server/`): `const { Student, Question, DailyChallenge, GameSession } = require("./models");`

### Things to know

- **Passwords** are hashed automatically (bcrypt) when a student is saved. They are never returned by queries or in JSON. To check a login:
  ```js
  const student = await Student.findOne({ username }).select("+password");
  const ok = student && (await student.comparePassword(password));
  ```
- **Leaderboards** should show `nickname`, not the real name, because the students are minors.
- **Scores:** `totalScore`, `scoreBySubject` and `scoreByMode` on `Student` are stored running totals. Update them when a game ends. The full record of every answer is kept in `GameSession`.
- **Points:** `Question.points` is the base value from the question files. Each game mode applies its own scoring and saves the result in `pointsEarned`.
- **Daily:** the database lets a student play each `DailyChallenge` only once.
- **Room codes** must be unique while a game is open. Remove `roomCode` (`$unset`) when a game finishes so the code can be reused.

## Question files (`Questions/`)

Files are named `<subject>_<grade>.json` (`mat_7.json`, `zgo_9.json`). The seed script converts the keys like this:

| File key | DB field |
|---|---|
| `vprašanje` | `text` |
| `rezultat` | `answer` (math answers like `"1/2 ali 0.5"` are also split into `acceptedAnswers`) |
| `vrednost vprašanja` | `points` |
| `napačni odgovori` | `wrongAnswers`, an array of strings for Kahoot |

To add a new subject, add its file prefix to `SUBJECT_BY_PREFIX` in `server/scripts/seedQuestions.js` and its name to `SUBJECTS` in `server/models/constants.js`.
