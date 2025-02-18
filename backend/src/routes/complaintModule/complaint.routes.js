import { Router } from "express";
import { submitComplaint } from "../../controllers/complaintModule/complaint.controller.js";
import { verifyJwt } from "../../middlewares/auth.middleware.js";

const router = Router();

router.route("/submit-complaint").post(verifyJwt, submitComplaint);

export default router;