const express = require("express")
const router = express.Router()
const { getQuestions, checkAnswer } = require("../controllers/questions")
const {requireAuth} = require("../middleware/auth")

router.get("/", getQuestions)
router.post("/:id/checkAnswer", checkAnswer)
module.exports = router; 