const express = require("express")
const {upload} = require("../config/multerConfig.js")
const {setUserLogin, setRegisterUser, getAllVoters, voteCast, voteCheck} = require("../controllers/Voter.js")
const router = express.Router()

router.route("/register").post(setRegisterUser)
router.route("/login").post(setUserLogin)
router.route("/allVoters").get(getAllVoters)
router.route("/voteCast/:id").post(voteCast)
router.route("/voteCheck/:id").get(voteCheck)
router.route("/token", )


module.exports = router;