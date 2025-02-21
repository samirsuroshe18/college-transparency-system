import express from "express";
import { castVote, hasVoted } from "../../controllers/electionModule/vote.controller.js";

const router = express.Router();

// Route to cast a vote
router.post("/vote", castVote);

// Route to check if a user has already voted
router.get("/has-voted/:electionId/:voterId", hasVoted);

export default router;
