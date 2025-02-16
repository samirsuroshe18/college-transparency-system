import express from "express";
import { createElection, getElections, endElection } from "../controllers/election.controller.js";

const router = express.Router();

router.post("/create", createElection);
router.get("/", getElections);
router.put("/end/:id", endElection);

export default router;
