const DailyChallengeModel = require("../models/DailyChallenge");
const QuestionModel = require("../models/Question");
const StudentModel = require("../models/Student");

function today() {
    return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Ljubljana" });
}

async function findOrCreateDaily(date, grade) {
    const existing = await DailyChallengeModel.findOne({ date, grade });
    if (existing) return existing;

    const [question] = await QuestionModel.aggregate([
        { $match: { grade, active: true } },
        { $sample: { size: 1 } },
    ]);
    if (!question) return null;

    try {
        return await DailyChallengeModel.create({
            date,
            grade,
            subject: question.subject,
            question: question._id,
        });
    } catch (err) {
        if (err.code === 11000) {
            return DailyChallengeModel.findOne({ date, grade });
        }
        throw err;
    }
}

async function getDaily(req, res) {
    try {
        const student = await StudentModel.findById(req.session.student_id);
        if (!student) {
            return res.status(404).json({ error: "Uporabnik ne obstaja" });
        }

        const date = today();
        const daily = await findOrCreateDaily(date, student.grade);
        if (!daily) {
            return res.status(404).json({ error: "Za ta razred ni vprašanj" });
        }

        const question = await QuestionModel
            .findById(daily.question)
            .select("-answer -acceptedAnswers");

        res.status(200).json({ date, subject: daily.subject, question });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Napaka na strežniku" });
    }
}

module.exports = { getDaily };