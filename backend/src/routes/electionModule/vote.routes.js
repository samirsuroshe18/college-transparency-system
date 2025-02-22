import express from "express";
import { castVote, hasVoted } from "../../controllers/electionModule/vote.controller.js";
//import authMiddleware from "../../middlewares/auth.middleware.js"; 

const router = express.Router();

// Route to cast a vote (protected)
// {router.post("/vote", authMiddleware, castVote);}

// Route to check if a user has already voted (protected)
// {router.get("/has-voted/:electionId", authMiddleware, hasVoted);}



export default router;
