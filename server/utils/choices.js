function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

// Questions with long answers come with wrong answers; those are shown as multiple choice.
function choicesFor(question) {
    return question.wrongAnswers?.length ? shuffle([question.answer, ...question.wrongAnswers]) : undefined;
}

// What a player may see: never the answer, and wrong answers only mixed with the right one.
function publicQuestion(question) {
    const { answer, acceptedAnswers, wrongAnswers, ...rest } = question;
    const choices = choicesFor(question);
    return choices ? { ...rest, choices } : rest;
}

module.exports = { choicesFor, publicQuestion };
