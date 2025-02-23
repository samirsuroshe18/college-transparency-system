import { Router } from "express";
import { getElections, endElection, createElectionAdmin, upcomingElection, getLiveElections, getCompletedElections } from "../../controllers/electionModule/election.controller.js";

const router = Router();

router.post("/create", createElectionAdmin);
router.get("/get", getElections);
router.get("/live", getLiveElections);
router.put("/end/:id", endElection);
router.get("/upcoming", upcomingElection);
router.get("/completed", getCompletedElections);

export default router;
