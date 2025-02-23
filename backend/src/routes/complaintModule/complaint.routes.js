import express from "express";
import { submitComplaint, getComplaints, voteComplaint } from "../../controllers/complaintModule/complaint.controller.js";
import { verifyJwt } from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router = express.Router();

router.post("/submit",verifyJwt, upload.single("document"), submitComplaint);
router.get("/all", getComplaints);
router.post("/vote/:id", voteComplaint);




export default router;
