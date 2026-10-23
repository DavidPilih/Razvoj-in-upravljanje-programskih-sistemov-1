const StudentSchema = require("../models/Student")


async function changeElo(req,res){
    try{
    const user = await StudentSchema.findById(req.session.student_id);
    let user_elo = user.duelRating;
    const other_guy_elo = req.body.opponent_elo;
    const result = req.body.result; //1zmaga 0 izguba
    const K = 32;
    const expected = 1 / (1 + 10 ** ((other_guy_elo - user_elo) / 400));
    const elo_change = Math.round(K * (result - expected));
    user.duelRating = user_elo += elo_change;
    await user.save();
            return res.status(200).json({ elo_change, duelRating: user.duelRating });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = {changeElo}