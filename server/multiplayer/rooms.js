const { randomBytes, randomInt } = require('node:crypto');
const { GRADES, SUBJECTS } = require('../models/constants');

const normalize = value => String(value).trim().toLowerCase().replaceAll(',', '.');

function createRooms({ loadQuestions, roundMs = 30000, revealMs = 4000, reconnectMs = 60000 }) {
    const rooms = new Map();

    function snapshot(room, player) {
        const question = room.questions[room.index];
        const reveal = room.status === 'reveal' || room.status === 'finished';
        return {
            code: room.code, mode: room.mode, grade: room.grade, subject: room.subject,
            status: room.status, playerId: player.id, hostId: room.hostId,
            index: room.index, total: room.questions.length, deadline: room.deadline,
            players: room.players.map(p => ({
                id: p.id, nickname: p.nickname,
                score: p.score - (room.status === 'question' && p.answers[room.index]?.correct ? 1 : 0),
                connected: Boolean(p.send), left: p.left,
                answered: Boolean(p.answers[room.index]),
                ...(reveal && { correct: p.answers[room.index]?.correct || false }),
            })),
            question: question ? { id: String(question._id), text: question.text } : null,
            submitted: Boolean(player.answers[room.index]),
            ...(reveal && question && { correctAnswer: question.answer }),
            ...(reveal && { yourAnswer: player.answers[room.index]?.answer || '' }),
        };
    }

    function broadcast(room) {
        for (const player of room.players) {
            if (player.send) player.send({ type: 'state', room: snapshot(room, player) });
        }
    }

    function destroy(room) {
        clearTimeout(room.timer);
        for (const player of room.players) clearTimeout(player.disconnectTimer);
        rooms.delete(room.code);
    }

    function endRound(room) {
        if (room.status !== 'question') return;
        clearTimeout(room.timer);
        room.status = 'reveal';
        room.deadline = Date.now() + revealMs;
        broadcast(room);
        room.timer = setTimeout(() => {
            if (room.index + 1 === room.questions.length) {
                room.status = 'finished';
                room.deadline = null;
                broadcast(room);
            } else {
                room.index += 1;
                nextRound(room);
            }
        }, revealMs);
    }

    function nextRound(room) {
        room.status = 'question';
        room.deadline = Date.now() + roundMs;
        room.timer = setTimeout(() => endRound(room), roundMs);
        broadcast(room);
    }

    function checkRound(room) {
        const playing = room.players.filter(p => !p.left);
        if (playing.length && playing.every(p => p.answers[room.index])) endRound(room);
    }

    function locate(code, token) {
        const room = rooms.get(String(code));
        const player = room?.players.find(p => p.token === token && !p.left);
        if (!room || !player) throw new Error('Soba ne obstaja več ali pa nisi njen član.');
        return { room, player };
    }

    function addPlayer(room, nickname, send) {
        if (typeof nickname !== 'string' || !nickname.trim() || nickname.trim().length > 30) {
            throw new Error('Vnesi vzdevek z največ 30 znaki.');
        }
        if (room.players.some(p => normalize(p.nickname) === normalize(nickname))) {
            throw new Error('Ta vzdevek je v sobi že zaseden.');
        }
        const player = {
            id: randomBytes(12).toString('hex'), token: randomBytes(32).toString('hex'),
            nickname: nickname.trim(), score: 0, answers: [], send, left: false,
        };
        room.players.push(player);
        room.hostId ||= player.id;
        send({ type: 'joined', code: room.code, token: player.token });
        broadcast(room);
        return { code: room.code, token: player.token };
    }

    return {
        create(data, send) {
            if (!['group', 'duel'].includes(data.mode) || !GRADES.includes(Number(data.grade)) || !SUBJECTS.includes(data.subject)) {
                throw new Error('Izberi način, razred in predmet.');
            }
            if (rooms.size >= 500) throw new Error('Trenutno je preveč sob. Poskusi pozneje.');
            let code;
            do { code = String(randomInt(100000, 1000000)); } while (rooms.has(code));
            const room = {
                code, mode: data.mode, grade: Number(data.grade), subject: data.subject,
                players: [], status: 'waiting', questions: [], index: 0, createdAt: Date.now(),
            };
            // Validate the nickname before retaining a room.
            const membership = addPlayer(room, data.nickname, send);
            rooms.set(code, room);
            return membership;
        },
        join(data, send) {
            const room = rooms.get(String(data.code));
            if (!room) throw new Error('Sobe s to kodo ni.');
            if (room.mode !== data.mode) throw new Error('Izberi isti način igre kot gostitelj.');
            if (room.status !== 'waiting') throw new Error('Igra se je že začela.');
            if (room.players.length >= (room.mode === 'duel' ? 2 : 20)) throw new Error('Soba je polna.');
            return addPlayer(room, data.nickname, send);
        },
        resume(code, token, send) {
            const { room, player } = locate(code, token);
            if (player.send) throw new Error('Ta igralec je že povezan v drugem zavihku.');
            clearTimeout(player.disconnectTimer);
            player.send = send;
            broadcast(room);
            return { code, token };
        },
        async start(code, token) {
            const { room, player } = locate(code, token);
            if (room.hostId !== player.id) throw new Error('Igro lahko začne samo gostitelj.');
            if (room.status !== 'waiting') throw new Error('Igra se je že začela.');
            if (room.players.length < 2 || room.players.some(p => !p.send)) throw new Error('Počakaj na vsaj dva povezana igralca.');
            room.status = 'loading';
            broadcast(room);
            try {
                const questions = await loadQuestions(room.grade, room.subject);
                if (questions.length !== 10) throw new Error('Za igro potrebujemo 10 vprašanj.');
                if (!rooms.has(code)) return;
                room.questions = questions;
                nextRound(room);
            } catch (err) {
                if (rooms.has(code)) { room.status = 'waiting'; broadcast(room); }
                throw err;
            }
        },
        answer(code, token, data) {
            const { room, player } = locate(code, token);
            const question = room.questions[room.index];
            if (room.status !== 'question' || Date.now() >= room.deadline) throw new Error('Čas za odgovor je potekel.');
            if (data.questionId !== String(question._id)) throw new Error('To vprašanje ni več na vrsti.');
            if (player.answers[room.index]) throw new Error('Odgovor si že oddal.');
            if (typeof data.answer !== 'string' || !data.answer.trim() || data.answer.length > 500) throw new Error('Vnesi odgovor z največ 500 znaki.');
            const correct = [question.answer, ...(question.acceptedAnswers || [])].some(a => normalize(a) === normalize(data.answer));
            player.answers[room.index] = { answer: data.answer.trim(), correct };
            if (correct) player.score += 1;
            // Scores become visible only once everyone has answered or time expires.
            checkRound(room);
            if (room.status === 'question') broadcast(room);
        },
        disconnect(code, token) {
            let found;
            try { found = locate(code, token); } catch { return; }
            const { room, player } = found;
            player.send = null;
            clearTimeout(player.disconnectTimer);
            player.disconnectTimer = setTimeout(() => this.leave(code, token), reconnectMs);
            broadcast(room);
        },
        leave(code, token) {
            let found;
            try { found = locate(code, token); } catch { return; }
            const { room, player } = found;
            clearTimeout(player.disconnectTimer);
            player.left = true;
            player.send = null;
            if (room.status === 'waiting') room.players = room.players.filter(p => p !== player);
            const remaining = room.players.filter(p => !p.left);
            if (!remaining.length) return destroy(room);
            if (room.hostId === player.id) room.hostId = remaining[0].id;
            checkRound(room);
            broadcast(room);
        },
        cleanup() {
            for (const room of rooms.values()) {
                if (Date.now() - room.createdAt > 2 * 60 * 60 * 1000) {
                    for (const player of room.players) player.send?.({ type: 'expired', error: 'Soba je potekla.' });
                    destroy(room);
                }
            }
        },
        close() { for (const room of rooms.values()) destroy(room); },
    };
}

module.exports = { createRooms };
