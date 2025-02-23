import express from "express";
import { addCandidate, getCandidates, getCandidateById } from "../../controllers/electionModule/candidate.controller.js";
import {verifyJwt} from "../../middlewares/auth.middleware.js"

const router = express.Router();

router.post("/:electionId/candidate", addCandidate);


router.get("/:electionId", getCandidates);

router.get("/candidate/:candidateId", getCandidateById);

// router.post("/apply", verifyJwt, applyElectionForm);


export default router;
