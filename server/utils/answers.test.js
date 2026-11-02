const test = require('node:test');
const assert = require('node:assert/strict');
const { isCorrectAnswer } = require('./answers');

for (const subject of ['history', 'math']) {
    test(`${subject}: accepts sufficiently long submitted substrings of a reference`, () => {
        for (const [reference, answer] of [
            ['360°', '360'], ['James Watt', 'watt'], ['7. stoletje', '7'],
            ['1450 našega štetja', '1450'], ['na Goli otok', 'Goli otok'],
            ['Voltaire in Montesquieu', 'Voltaire'], ['1450', '1450'],
            ['Razsvetljenstvo', 'svet'], ['Jožef II.', 'JOZEF'],
            ['James Watt', '  JAMES   WATT  '],
        ]) assert.equal(isCorrectAnswer({ subject, answer: reference }, answer), true, `${reference}: ${answer}`);
    });
}

test('requires all reference digits in order, or three characters for text answers', () => {
    for (const [reference, answer] of [
        ['1848', '18'], ['1848', '848'], ['leta 1848', '184'],
        ['360 stopinj', '36'], ['James Watt', 'wa'], ['7. stoletje', 'stoletje'],
        ['12345 enot', '1234'], ['leta 1848', 'leta'], ['1848', '1849'],
        ['1848', '8481'], ['7. stoletje', '8'], ['7. stoletje', '77'],
        ['12. stoletje', '2. stoletje'],
    ]) assert.equal(isCorrectAnswer({ answer: reference }, answer), false, `${reference}: ${answer}`);
    for (const [reference, answer] of [
        ['leta 1848', '1848'], ['360 stopinj', '360'], ['James Watt', 'Wat'],
        ['12345 enot', '12345'], ['7', '7'], ['da', 'da'],
        ['7. stoletje', '7'], ['12. stoletje', '12'], ['7. stoletje', '7.'],
    ]) assert.equal(isCorrectAnswer({ answer: reference }, answer), true, `${reference}: ${answer}`);
});

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
