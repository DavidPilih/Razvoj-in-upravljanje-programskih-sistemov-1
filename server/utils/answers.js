// Shared by solo quizzes and multiplayer. Match the entire submitted text
// inside a reference, ignoring case, accents, and repeated whitespace.
// Numeric references require every digit in order; other references require
// at least three matching characters (or an exact match for shorter answers).
function normalize(value) {
    return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().trim().replaceAll(',', '.').replace(/\s+/g, ' ');
}

function isCorrectAnswer(question, answer) {
    if (typeof answer !== 'string') return false;
    const given = normalize(answer);
    if (!given) return false;
    return [question.answer, ...(question.acceptedAnswers || [])]
        .some(reference => {
            if (reference == null) return false;
            const expected = normalize(reference);
            if (given === expected) return true;
            const expectedDigits = expected.replace(/\D/g, '');
            if (expectedDigits) {
                const givenDigits = given.replace(/\D/g, '');
                return givenDigits === expectedDigits && expected.includes(given);
            }
            return given.length >= 3 && expected.includes(given);
        });
}

module.exports = { isCorrectAnswer };
