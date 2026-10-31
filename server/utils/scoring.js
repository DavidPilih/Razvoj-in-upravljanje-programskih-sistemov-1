// ELO (Student.duelRating): everyone starts at 1000 and never drops below MIN_RATING.
const MIN_RATING = 100;
const SOLO_ELO_PER_POINT = 5;
const DUEL_K = 32;

// result: 1 win, 0.5 draw, 0 loss. A win against a stronger opponent is worth more.
function eloChange(rating, opponentRating, result, k = DUEL_K) {
    const expected = 1 / (1 + 10 ** ((opponentRating - rating) / 400));
    return Math.round(k * (result - expected));
}

// Daily and classic quizzes: harder questions (more points) move the rating more.
function soloEloChange(points, correct) {
    return (correct ? 1 : -1) * SOLO_ELO_PER_POINT * (points || 1);
}

function clampRating(rating) {
    return Math.max(MIN_RATING, rating);
}

module.exports = { MIN_RATING, eloChange, soloEloChange, clampRating };
