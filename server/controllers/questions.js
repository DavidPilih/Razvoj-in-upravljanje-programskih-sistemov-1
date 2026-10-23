const QuestionModel = require("../models/Question")
const StudentModel = require("../models/Student")
const { SUBJECTS, GRADES } = require("../models/constants");


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
        { $project:{ answer:0,acceptedAnswers:0}}
    ]);
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
    const id = req.params.id;
    const question = await QuestionModel.findById(id);
    const answer = req.body.answer;

    if(!question || !answer) return res.status(400).json("ni ok");

    const correct_answer = question.answer;
    let accepted_answers = question.acceptedAnswers;

    accepted_answers = accepted_answers.map(a=> normalize(a));

    if(!correct_answer || !accepted_answers) return res.status(400).json("ni ok");
    
    accepted_answers = accepted_answers.map((a) => normalize(a))
    if(normalize(correct_answer) === normalize(answer) || accepted_answers.includes(normalize(answer)))
        {
        const user_id = req.session.student_id;
        const user = await StudentModel.findById(user_id);
        if(!user) return res.status(400).json("Problem finding user");
        user.total_score +=50;
        await user.save();
        res.status(200).json("pravilni odgovor");

    }else res.status(200).json(" ni pravilni odgovor");
    }catch(err){
        return res.status(400).json({error: err});
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
            .select("-answer -acceptedAnswers");
        if (!questions.length) return res.status(404).json({ error: "Za ta sklop ni vprašanj." });
        res.json({ questions, page, total, hasNext: page * 10 < total });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Vprašanj ni bilo mogoče naložiti." });
    }
}

module.exports = {getQuestions, checkAnswer, getKlasicno}