const StudentModel = require("../models/Student");

const LOGIN_FAILED = { error: "Napačno uporabniško ime ali geslo" };

async function register(req, res) {
    try {
        const { username, password, firstName, lastName, nickname, grade, classLabel } = req.body;
        const student = await StudentModel.create({
            username, password, firstName, lastName, nickname, grade, classLabel,
        });
        res.status(201).json(student);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Napaka" });
    }
}

async function login(req, res) {
    try {
        const user = await StudentModel.findOne({ username: req.body.username }).select("+password");

        if (!user) return res.status(401).json(LOGIN_FAILED);

        const passwordOk = await user.comparePassword(req.body.password);
        if (!passwordOk) return res.status(401).json(LOGIN_FAILED);

        req.session.student_id = user.id;
        res.status(200).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Napaka na strežniku" });
    }
}

async function me(req, res) {
    try {
        const user = await StudentModel.findById(req.session.student_id);
        if (!user) {
            return res.status(404).json({ error: "Uporabnik ne obstaja" });
        }
        res.status(200).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Napaka na strežniku" });
    }
}

async function deleteUser(req, res) {
    try {
        const deleted = await StudentModel.findByIdAndDelete(req.session.student_id);
        if (!deleted) {
            return res.status(404).json({ error: "Uporabnik ne obstaja" });
        }

        req.session.destroy((err) => {
            if (err) console.error(err);
            res.clearCookie("connect.sid");
            res.status(200).json({ message: "Račun izbrisan" });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Napaka na strežniku" });
    }
}

function logout(req, res) {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Odjava ni uspela" });
        }
        res.clearCookie("connect.sid");
        res.status(200).json({ message: "Odjavljen" });
    });
}

module.exports = { register, login, me, deleteUser, logout };