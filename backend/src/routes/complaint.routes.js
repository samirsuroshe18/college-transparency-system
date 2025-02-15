import { Router } from "express";
import { submitComplaint } from "../controllers/complaint.controller";

const router = Router();

router.route("/submit-complaint").post(submitComplaint)

export default router;