const express = require("express")
const router = express.Router();
const {changeElo} = require("../controllers/scoring")


router.post("/changeElo", changeElo )



module.exports = router;