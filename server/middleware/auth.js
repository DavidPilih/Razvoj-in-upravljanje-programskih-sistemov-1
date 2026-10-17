function requireAuth(req, res, next) {
    if (!req.session.student_id) {
        return res.status(401).json({ error: "Nisi prijavljen" });
    }
    next();
}

module.exports = {requireAuth}