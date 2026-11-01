const QuestionModel = require("../models/Question")
const StudentModel = require("../models/Student")
const { SUBJECTS, GRADES } = require("../models/constants");
const { publicQuestion } = require("../utils/choices");
const { MIN_RATING, soloEloChange, clampRating } = require("../utils/scoring");


//helper
const { isCorrectAnswer } = require("../utils/answers");

async function getQuestions(req,res){
    try{
    let {grade, subject, count} = req.query;
    grade = Number(grade);
    count = Number(count);
    if(!grade || !subject || !count || !SUBJECTS.includes(subject) || !GRADES.includes(grade)) {
        res.status(400);
        res.json("ni ok");
        return;
    }
    const questions = await QuestionModel.aggregate([
        { $match: {subject: subject, grade: grade}},
        { $sample: {size: count}},
        { $project:{ acceptedAnswers:0}}
    ]).then(found => found.map(publicQuestion));
    if(questions.length ===0){
        res.status(400);
        res.json("ni vprasanj");
        return;
    }
        res.status(200);
        res.json({questions: questions});
        return;
}catch(err){
    console.log(err)
}
}

async function checkAnswer(req,res){
    try{
    const question = await QuestionModel.findById(req.params.id);
    const answer = req.body.answer;

    if(!question || typeof answer !== "string" || !answer.trim()) return res.status(400).json({ error: "ni ok" });

    const correct = isCorrectAnswer(question, answer);

    if(!req.session.student_id) return res.status(200).json({ correct, correctAnswer: question.answer });

    const inc = { "stats.totalAnswers": 1 };
    if(correct) Object.assign(inc, { totalScore: 50, [`scoreBySubject.${question.subject}`]: 50, "stats.correctAnswers": 1 });
    const delta = soloEloChange(question.points, correct);
    // One pipeline update, so the ELO floor is applied atomically with the other counters.
    const set = Object.fromEntries(Object.entries(inc).map(([field, value]) => [field, { $add: [{ $ifNull: [`$${field}`, 0] }, value] }]));
    set.duelRating = { $max: [MIN_RATING, { $add: [{ $ifNull: ["$duelRating", 1000] }, delta] }] };
    const before = await StudentModel.findByIdAndUpdate(req.session.student_id, [{ $set: set }], { new: false, updatePipeline: true });
    if(!before) return res.status(200).json({ correct, correctAnswer: question.answer });

    const duelRating = clampRating(before.duelRating + delta);
    res.status(200).json({ correct, correctAnswer: question.answer, eloChange: duelRating - before.duelRating, duelRating });
    }catch(err){
        console.error(err);
        return res.status(500).json({ error: "Napaka na strežniku" });
    }
}
async function getKlasicno(req, res) {
    try {
        const grade = Number(req.query.grade);
        const subject = req.query.subject;
        const page = Number(req.query.page || 1);
        if (!GRADES.includes(grade) || !SUBJECTS.includes(subject) || !Number.isSafeInteger(page) || page < 1 || page > 10000) {
            return res.status(400).json({ error: "Izberi veljaven razred, predmet in sklop." });
        }
        const filter = { grade, subject, active: true };
        const total = await QuestionModel.countDocuments(filter);
        const questions = await QuestionModel.find(filter)
            .sort({ _id: 1 }).skip((page - 1) * 10).limit(10)
            .select("-acceptedAnswers").lean();
        if (!questions.length) return res.status(404).json({ error: "Za ta sklop ni vprašanj." });
        res.json({ questions: questions.map(publicQuestion), page, total, hasNext: page * 10 < total });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Vprašanj ni bilo mogoče naložiti." });
    }
}

module.exports = {getQuestions, checkAnswer, getKlasicno}
