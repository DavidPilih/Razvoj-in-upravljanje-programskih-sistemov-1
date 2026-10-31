const StudentModel = require("../models/Student");
const { GRADES } = require("../models/constants");

// Leaderboard name -> Student field it is sorted by.
const FIELDS = {
    total: "totalScore",
    math: "scoreBySubject.math",
    history: "scoreBySubject.history",
    duel: "duelRating",
};
const LIMIT = 20;

function valueOf(student, field) {
    return field.split(".").reduce((obj, key) => obj?.[key], student) ?? 0;
}

async function getLeaderboard(req, res) {
    try {
        const by = req.query.by || "total";
        const field = FIELDS[by];
        const grade = req.query.grade ? Number(req.query.grade) : null;
        if (!field || (grade !== null && !GRADES.includes(grade))) {
            return res.status(400).json({ error: "Izberi veljavno lestvico in razred." });
        }

        const filter = grade ? { grade } : {};
        // duelRating is always included because the knight title shown next to the name follows ELO.
        const fields = [...new Set(["nickname", "grade", "duelRating", field])].join(" ");
        const students = await StudentModel.find(filter)
            .sort({ [field]: -1, nickname: 1 })
            .limit(LIMIT)
            .select(fields)
            .lean();

        // Only nicknames are public, because the students are minors.
        const myId = req.session?.student_id;
        const entries = [];
        for (const [index, student] of students.entries()) {
            const value = valueOf(student, field);
            const previous = entries[index - 1];
            entries.push({
                rank: previous && previous.value === value ? previous.rank : index + 1,
                nickname: student.nickname,
                grade: student.grade,
                value,
                rating: student.duelRating,
                me: String(student._id) === myId,
            });
        }

        let me = null;
        if (myId && !entries.some(entry => entry.me)) {
            const student = await StudentModel.findById(myId).select(fields).lean();
            if (student && (!grade || student.grade === grade)) {
                const value = valueOf(student, field);
                const higher = await StudentModel.countDocuments({ ...filter, [field]: { $gt: value } });
                me = { rank: higher + 1, nickname: student.nickname, grade: student.grade, value, rating: student.duelRating, me: true };
            }
        }

        res.status(200).json({ entries, me });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lestvice ni bilo mogoče naložiti." });
    }
}

module.exports = { getLeaderboard };
