const QuestionModel = require("../models/Question")
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
    if(!correct_answer || !accepted_answers) return res.status(400).json("ni ok");
    
    accepted_answers = accepted_answers.map((a) => normalize(a))
    if(normalize(correct_answer) === normalize(answer) || accepted_answers.includes(normalize(answer)))res.status(200).json("pravilni odgovor");
    else res.status(200).json(" ni pravilni odgovor");
    }catch(err){
        return res.status(400).json({error: err});
    }
}
module.exports = {getQuestions, checkAnswer}