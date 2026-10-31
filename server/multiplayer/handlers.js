const { WebSocketServer, WebSocket } = require('ws');
const { createRooms } = require('./rooms');

function attachMultiplayer(server, options = {}) {
    const loadQuestions = options.loadQuestions || (async (grade, subject) => {
        const Question = require('../models/Question');
        return Question.aggregate([
            { $match: { grade, subject, active: true } }, { $sample: { size: 10 } },
        ]);
    });
    // Updates both duelRatings from the ratings before the match; returns { [studentId]: { change, rating } }.
    const finishDuel = options.finishDuel || (async results => {
        const Student = require('../models/Student');
        const { eloChange, clampRating } = require('../utils/scoring');
        const students = await Student.find({ _id: { $in: results.map(r => r.studentId) } }).select('duelRating');
        if (students.length !== 2) return null;
        const rating = id => students.find(s => String(s._id) === String(id)).duelRating;
        const changes = {};
        for (const [me, other] of [results, [...results].reverse()]) {
            const next = clampRating(rating(me.studentId) + eloChange(rating(me.studentId), rating(other.studentId), me.result));
            changes[me.studentId] = { change: next - rating(me.studentId), rating: next };
        }
        await Promise.all(Object.entries(changes).map(([id, { change }]) => Student.updateOne({ _id: id }, { $inc: { duelRating: change } })));
        return changes;
    });
    const rooms = createRooms({ ...options, loadQuestions, finishDuel });
    const wss = new WebSocketServer({ server, path: '/multiplayer', maxPayload: 8192 });
    wss.on('connection', (socket, request) => {
        // The login session comes from the cookie on the upgrade request; guests have none.
        const identity = new Promise(resolve => {
            if (!options.session) return resolve(null);
            options.session(request, {}, () => resolve(request.session?.student_id || null));
        });
        let membership = null;
        let pending = false;
        let windowStart = Date.now();
        let messages = 0;
        socket.alive = true;
        socket.on('pong', () => { socket.alive = true; });
        const send = data => {
            if (data.type === 'expired') membership = null;
            if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data));
        };
        socket.on('message', async raw => {
            if (pending) return send({ type: 'error', error: 'Počakaj na zaključek prejšnje zahteve.' });
            try {
                if (Date.now() - windowStart > 1000) { windowStart = Date.now(); messages = 0; }
                if (++messages > 20) throw new Error('Preveč zahtev. Počakaj trenutek.');
                const data = JSON.parse(raw.toString());
                if (!data || typeof data !== 'object') throw new Error('Neveljavna zahteva.');
                pending = true;
                if (['create', 'join', 'resume'].includes(data.type)) {
                    if (membership) throw new Error('Že si član sobe.');
                    const studentId = await identity;
                    membership = data.type === 'resume'
                        ? rooms.resume(data.code, data.token, send)
                        : rooms[data.type]({ ...data, studentId }, send);
                } else {
                    if (!membership) throw new Error('Najprej se pridruži sobi.');
                    const { code, token } = membership;
                    if (data.type === 'start') await rooms.start(code, token);
                    else if (data.type === 'answer') rooms.answer(code, token, data);
                    else if (data.type === 'leave') {
                        rooms.leave(code, token);
                        membership = null;
                        send({ type: 'left' });
                    } else throw new Error('Neznana zahteva.');
                }
            } catch (err) {
                send({ type: 'error', error: err.message || 'Zahteva ni uspela.' });
            } finally { pending = false; }
        });
        socket.on('error', () => {});
        socket.on('close', () => {
            if (membership) rooms.disconnect(membership.code, membership.token);
        });
    });
    const maintenance = setInterval(() => {
        rooms.cleanup();
        for (const socket of wss.clients) {
            if (!socket.alive) socket.terminate();
            else { socket.alive = false; socket.ping(); }
        }
    }, 30000);
    maintenance.unref();
    wss.on('close', () => { clearInterval(maintenance); rooms.close(); });
    return wss;
}

module.exports = { attachMultiplayer };
