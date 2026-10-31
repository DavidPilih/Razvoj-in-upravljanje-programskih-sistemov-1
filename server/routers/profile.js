const express = require("express");
const router = express.Router();
const { getProfile, updateProfile } = require("../controllers/profile");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, getProfile);
router.patch("/", requireAuth, updateProfile);

module.exports = router;
