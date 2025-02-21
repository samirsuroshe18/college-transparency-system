import express from "express";
import { createApplication, getApplications, getApplicationById, updateApplicationStatus } from "../../controllers/applicationModule/application.controller.js";
import { updateApplicationReviewStatus } from "../../controllers/applicationModule/application.controller.js";

const router = express.Router();

// router.post("/create", createApplication);
// router.get("/", getApplications);
// router.get("/:id", getApplicationById);
// router.put("/:id/status", updateApplicationStatus);

router.post("/create", createApplication);
router.get("/", getApplications);
router.put("/:id/status", updateApplicationStatus);
router.get("/:id", getApplicationById);
router.put("/:id/review", updateApplicationReviewStatus);

export default router;
