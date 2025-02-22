import { Router } from "express";
import { submitComplaint } from "../../controllers/complaintModule/complaint.controller.js";
import { verifyJwt } from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router = Router();

// Route to submit a complaint
router.route("/submit-complaint").post(verifyJwt, upload.single("content"), submitComplaint);

// Route to vote for revealing an anonymous complaint
// router.route("/vote-to-reveal/:complaintId").post(verifyJwt, voteToReveal);

export default router; 
