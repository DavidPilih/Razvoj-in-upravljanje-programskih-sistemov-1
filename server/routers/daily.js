const express = require("express");
const router = express.Router();
const { getDaily } = require("../controllers/daily");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, getDaily);

module.exports = router;