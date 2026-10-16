const express = require("express")
const router = express.Router()
const { login, register, deleteUser } = require("../controllers/auth");


router.post("/register", register);
router.post("/login", login)
router.put("delete", deleteUser)


module.exports = router