const express = require("express")

const {getCandidates, addCandidate, getAllCandidates,approveAndAddToAcceptedList, disapproveCandidate,getAllAcceptedCandidates, getSpecificCandidate} = require("../controllers/Candidates.js")
const router = express.Router()

router.route("/addCandidate").post(addCandidate)
router.route("/allCandidates").get(getAllCandidates)

router.route("/candidates/:id").get(getCandidates)

router.route("/approve/:id").patch(approveAndAddToAcceptedList)
router.route("/disapprove/:id").patch(disapproveCandidate)

router.route("/allAcceptedCandidates").get(getAllAcceptedCandidates)
router.route("/:id").get(getSpecificCandidate)


module.exports = router;