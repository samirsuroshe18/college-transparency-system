import { Router } from "express";
import { submitComplaint } from "../controllers/complaint.controller.js";
import { authenticateUser } from "../middlewares/user.middleware.js";

const router = Router();

router.route("/submit-complaint").post(authenticateUser, submitComplaint);

export default router;