import express from "express";
import { castVote, getElectionResults } from "../../controllers/electionModule/vote.controller.js";

const router = express.Router();

// Route to cast a vote
router.post("/vote", castVote);

// Route to get election results
router.get("/results/:electionId", getElectionResults);

  
// Route to get all votes for an election
//router.get("/votes/:electionId", getVotes);

export default router;
