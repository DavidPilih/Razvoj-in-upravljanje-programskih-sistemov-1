const express = require("express");
const router = express.Router();
const { register, login, me, deleteUser, logout } = require("../controllers/auth");
const { requireAuth } = require("../middleware/auth")

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.delete("/me", requireAuth, deleteUser);


module.exports = router;