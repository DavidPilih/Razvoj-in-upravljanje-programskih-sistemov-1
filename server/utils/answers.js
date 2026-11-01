// Shared by solo quizzes and multiplayer. Match the entire submitted text
// inside a reference, ignoring case, accents, and repeated whitespace.
function normalize(value) {
    return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().trim().replaceAll(',', '.').replace(/\s+/g, ' ');
}

function isCorrectAnswer(question, answer) {
    if (typeof answer !== 'string') return false;
    const given = normalize(answer);
    if (!given) return false;
    return [question.answer, ...(question.acceptedAnswers || [])]
        .some(reference => reference != null && normalize(reference).includes(given));
}

module.exports = { isCorrectAnswer };
