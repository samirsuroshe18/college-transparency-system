import express from "express";
import { applyForElection, getApplications, updateApplicationStatus } from "../../controllers/electionModule/candidateApplication.controller.js";

const router = express.Router();

router.route("/:electionId/apply").post(applyForElection); // ✅ Fix route structure
router.route("/:electionId").get(getApplications);
router.route("/update/:id").put(updateApplicationStatus);

export default router;
