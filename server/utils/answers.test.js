const test = require('node:test');
const assert = require('node:assert/strict');
const { isCorrectAnswer } = require('./answers');

for (const subject of ['history', 'math']) {
    test(`${subject}: accepts any submitted substring of a reference`, () => {
        for (const [reference, answer] of [
            ['360°', '360'], ['James Watt', 'watt'], ['7. stoletje', '7'],
            ['1450 našega štetja', '1450'], ['na Goli otok', 'Goli otok'],
            ['Voltaire in Montesquieu', 'Voltaire'], ['1450', '450'],
            ['Razsvetljenstvo', 'svet'], ['Jožef II.', 'JOZEF'],
            ['James Watt', '  JAMES   WATT  '],
        ]) assert.equal(isCorrectAnswer({ subject, answer: reference }, answer), true, `${reference}: ${answer}`);
    });
}

test('rejects empty or nonmatching submissions and does not reverse containment', () => {
    const question = { subject: 'history', answer: 'James Watt' };
    for (const answer of ['', '   ', null, undefined, 123, 'watts', 'ni James Watt', 'James ali Watt']) {
        assert.equal(isCorrectAnswer(question, answer), false);
    }
});

test('still supports accepted alternatives and decimal commas', () => {
    const question = { subject: 'math', answer: '0.5', acceptedAnswers: ['1/2'] };
    assert.equal(isCorrectAnswer(question, '0,5'), true);
    assert.equal(isCorrectAnswer(question, '1/2'), true);
    assert.equal(isCorrectAnswer(question, '2/3'), false);
});
