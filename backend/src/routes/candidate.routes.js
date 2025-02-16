import express from "express";
import { addCandidate, getCandidates, getCandidateById } from "../controllers/candidate.controller.js";

const router = express.Router();

// Add a candidate to an election (Admin Only)
router.post("/:electionId/candidate", addCandidate);

// Get all candidates for a specific election
router.get("/:electionId/candidates", getCandidates);

// Get a specific candidate by ID
router.get("/candidate/:candidateId", getCandidateById);

export default router;
