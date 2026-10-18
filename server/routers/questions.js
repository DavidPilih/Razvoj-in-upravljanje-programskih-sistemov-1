const express = require("express")
const router = express.Router()
const { getQuestions, checkAnswer, getKlasicno } = require("../controllers/questions")
const {requireAuth} = require("../middleware/auth")

router.get("/", getQuestions)
router.get("/klasicno", getKlasicno)
router.post("/:id/checkAnswer", checkAnswer)
module.exports = router;
