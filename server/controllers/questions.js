const QuestionModel = require("../models/Question")
const StudentModel = require("../models/Student")
const { SUBJECTS, GRADES } = require("../models/constants");
const { publicQuestion } = require("../utils/choices");


//helper
function normalize(str){ return str.trim().toLowerCase().replaceAll(",", ".")}

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

    const accepted_answers = [question.answer, ...(question.acceptedAnswers || [])].map(a => normalize(a));
    const correct = accepted_answers.includes(normalize(answer));

    if(req.session.student_id){
        const inc = { "stats.totalAnswers": 1 };
        if(correct) Object.assign(inc, { totalScore: 50, [`scoreBySubject.${question.subject}`]: 50, "stats.correctAnswers": 1 });
        await StudentModel.findByIdAndUpdate(req.session.student_id, { $inc: inc });
    }
    res.status(200).json({ correct, correctAnswer: question.answer });
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