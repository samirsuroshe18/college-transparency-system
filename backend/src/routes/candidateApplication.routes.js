import express from "express";
import { applyForElection, getApplications, updateApplicationStatus } from "../controllers/candidateApplication.controller.js";

const router = express.Router();

router.post("/apply", applyForElection);
router.get("/:electionId", getApplications);
router.put("/update/:id", updateApplicationStatus);

export default router;
