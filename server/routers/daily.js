const express = require("express");
const router = express.Router();
const { getDaily, getDailyQuiz } = require("../controllers/daily");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, getDaily);
router.get("/quiz", getDailyQuiz);

module.exports = router;
