const StudentModel = require("../models/Student");

async function getProfile(req, res) {
    try {
        const student = await StudentModel.findById(req.session.student_id);
        if (!student) {
            return res.status(404).json({ error: "Uporabnik ne obstaja" });
        }

        const higher = filter => StudentModel.countDocuments({ ...filter, totalScore: { $gt: student.totalScore } });
        const [overall, inGrade] = await Promise.all([higher({}), higher({ grade: student.grade })]);

        res.status(200).json({ student, rank: { overall: overall + 1, grade: inGrade + 1 } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Napaka na strežniku" });
    }
}

// Students can change only what is shown to others and their grade; scores stay server-side.
async function updateProfile(req, res) {
    try {
        const student = await StudentModel.findById(req.session.student_id);
        if (!student) {
            return res.status(404).json({ error: "Uporabnik ne obstaja" });
        }

        const { nickname, grade, classLabel } = req.body;
        if (nickname !== undefined) student.nickname = nickname;
        if (grade !== undefined) student.grade = Number(grade);
        if (classLabel !== undefined) student.classLabel = classLabel;
        await student.save();

        res.status(200).json(student);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: "Ta vzdevek je že zaseden." });
        }
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: "Preveri vnesene podatke." });
        }
        console.error(err);
        res.status(500).json({ error: "Napaka na strežniku" });
    }
}

module.exports = { getProfile, updateProfile };
