const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { once } = require('node:events');
const WebSocket = require('ws');
const { createRooms } = require('./rooms');
const { attachMultiplayer } = require('./handlers');

const questions = Array.from({ length: 10 }, (_, i) => ({
    _id: `question-${i}`, text: `Vprašanje ${i}`, answer: '0.5', acceptedAnswers: ['1/2'],
}));
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const roomData = { mode: 'duel', grade: 7, subject: 'math', nickname: 'Ana' };

function fixture(t, options = {}) {
    const rooms = createRooms({ loadQuestions: async () => questions, revealMs: 5, ...options });
    t.after(() => rooms.close());
    const a = [], b = [];
    const host = rooms.create(roomData, message => a.push(message));
    const guest = rooms.join({ code: host.code, mode: 'duel', nickname: 'Bor' }, message => b.push(message));
    return { rooms, a, b, host, guest, state: () => a.at(-1).room };
}

test('duel: host checks, capacity, hidden answers, single submission and final winner', async t => {
    const { rooms, host, guest, state, b } = fixture(t);
    assert.throws(() => rooms.join({ code: host.code, mode: 'duel', nickname: 'Cene' }, () => {}), /polna/);
    await assert.rejects(rooms.start(guest.code, guest.token), /gostitelj/);
    await rooms.start(host.code, host.token);
    assert.equal(state().total, 10);
    assert.equal(state().correctAnswer, undefined);
    assert.deepEqual(Object.keys(state().question).sort(), ['id', 'text']);
    for (let i = 0; i < 10; i++) {
        const data = { questionId: `question-${i}`, answer: ' 0,5 ' };
        rooms.answer(host.code, host.token, data);
        assert.equal(b.at(-1).room.players[0].score, i, 'current score must not disclose correctness');
        assert.throws(() => rooms.answer(host.code, host.token, data), /že oddal/);
        rooms.answer(guest.code, guest.token, { ...data, answer: i === 0 ? 'wrong' : '1/2' });
        assert.equal(state().status, 'reveal');
        assert.equal(state().correctAnswer, '0.5');
        await delay(15);
    }
    assert.equal(state().status, 'finished');
    assert.deepEqual(state().players.map(p => p.score), [10, 9]);
});

test('reconnect restores membership and answer; outsider and stale answers rejected', async t => {
    const { rooms, host, guest } = fixture(t);
    await rooms.start(host.code, host.token);
    rooms.answer(guest.code, guest.token, { questionId: 'question-0', answer: '1/2' });
    assert.throws(() => rooms.answer(host.code, 'fake', {}), /član/);
    assert.throws(() => rooms.answer(host.code, host.token, { questionId: 'question-9', answer: '1/2' }), /vrsti/);
    rooms.disconnect(guest.code, guest.token);
    const restored = [];
    rooms.resume(guest.code, guest.token, message => restored.push(message));
    assert.equal(restored.at(-1).room.submitted, true);
    assert.throws(() => rooms.resume(guest.code, guest.token, () => {}), /drugem zavihku/);
});

test('timeout ends a question without awarding points and rejects late answers', async t => {
    const { rooms, host, state } = fixture(t, { roundMs: 10, revealMs: 1000 });
    await rooms.start(host.code, host.token);
    await delay(30);
    assert.equal(state().status, 'reveal');
    assert.ok(state().players.every(p => p.score === 0));
    assert.throws(() => rooms.answer(host.code, host.token, { questionId: 'question-0', answer: '1/2' }), /potekel/);
});

test('waiting-room host transfer, mode validation, and insufficient questions', async t => {
    const { rooms, host, guest, b } = fixture(t, { loadQuestions: async () => [] });
    assert.throws(() => rooms.join({ code: host.code, mode: 'group', nickname: 'Cene' }, () => {}), /isti način/);
    await assert.rejects(rooms.start(host.code, host.token), /10 vprašanj/);
    assert.equal(b.at(-1).room.status, 'waiting');
    rooms.leave(host.code, host.token);
    assert.equal(b.at(-1).room.hostId, b.at(-1).room.playerId);
    await assert.rejects(rooms.start(guest.code, guest.token), /vsaj dva/);
});

test('group game accepts more than two players and waits for every answer', async t => {
    const rooms = createRooms({ loadQuestions: async () => questions, revealMs: 1000 });
    t.after(() => rooms.close());
    const events = [];
    const host = rooms.create({ ...roomData, mode: 'group' }, event => events.push(event));
    const b = rooms.join({ code: host.code, mode: 'group', nickname: 'Bor' }, () => {});
    const c = rooms.join({ code: host.code, mode: 'group', nickname: 'Cene' }, () => {});
    await rooms.start(host.code, host.token);
    rooms.answer(host.code, host.token, { questionId: 'question-0', answer: '1/2' });
    rooms.answer(b.code, b.token, { questionId: 'question-0', answer: '1/2' });
    assert.equal(events.at(-1).room.status, 'question');
    rooms.answer(c.code, c.token, { questionId: 'question-0', answer: '1/2' });
    assert.equal(events.at(-1).room.status, 'reveal');
});

test('real WebSocket clients can create, join, start, answer and resume', async t => {
    const server = createServer();
    const wss = attachMultiplayer(server, { loadQuestions: async () => questions, revealMs: 1000 });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const clients = [];
    t.after(async () => {
        for (const client of clients) client.terminate();
        await new Promise(resolve => wss.close(resolve));
        await new Promise(resolve => server.close(resolve));
    });
    async function client() {
        const socket = new WebSocket(`ws://127.0.0.1:${server.address().port}/multiplayer`);
        clients.push(socket);
        const messages = [];
        socket.on('message', raw => messages.push(JSON.parse(raw)));
        await once(socket, 'open');
        return {
            socket, messages,
            send(data) { socket.send(JSON.stringify(data)); },
            async wait(predicate) {
                for (let i = 0; i < 200; i++) {
                    const found = messages.find(predicate);
                    if (found) return found;
                    await delay(10);
                }
                throw new Error('Timed out waiting for WebSocket message');
            },
        };
    }
    const a = await client(), b = await client();
    a.send({ ...roomData, type: 'create' });
    const joined = await a.wait(event => event.type === 'joined');
    b.send({ type: 'join', code: joined.code, nickname: 'Bor', mode: 'duel' });
    const guest = await b.wait(event => event.type === 'joined');
    await a.wait(event => event.type === 'state' && event.room.players.length === 2);
    a.send({ type: 'start' });
    await b.wait(event => event.type === 'state' && event.room.status === 'question');
    b.send({ type: 'answer', questionId: 'question-0', answer: '1/2' });
    await b.wait(event => event.type === 'state' && event.room.submitted);
    b.socket.close();
    await once(b.socket, 'close');
    const reconnected = await client();
    reconnected.send({ type: 'resume', code: guest.code, token: guest.token });
    await reconnected.wait(event => event.type === 'state' && event.room.submitted);
    a.send({ type: 'answer', questionId: 'question-0', answer: 'wrong' });
    const reveal = await reconnected.wait(event => event.type === 'state' && event.room.status === 'reveal');
    assert.equal(reveal.room.correctAnswer, '0.5');
    assert.equal(reveal.room.players.find(p => p.id === reveal.room.playerId).score, 1);
});
