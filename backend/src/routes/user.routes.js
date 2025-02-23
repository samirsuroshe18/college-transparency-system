import { Router } from "express";
import { addFacultyProfile, addStudentProfile, approveFacultyProfile, approveStudentProfile, getCurrentUser, getPendingFacultyProfiles, getPendingStudentProfiles, googleLogin, logoutUser, rejectFacultyProfile, rejectStudentProfile, getUserById, getStudentByRollNumber } from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/google-login").post(googleLogin);
router.route("/current-user").get(verifyJwt, getCurrentUser);
router.route("/logout").get(verifyJwt, logoutUser);
router.route("/add-student-profile").post(verifyJwt, upload.single("proofImage"), addStudentProfile);
router.route("/add-faculty-profile").post(verifyJwt, upload.single("proofImage"), addFacultyProfile);
router.route("/get-pending-students").get(verifyJwt, getPendingStudentProfiles);
router.route("/get-pending-faculty").get(verifyJwt, getPendingFacultyProfiles);
router.route("/student-approve").post(verifyJwt, approveStudentProfile);
router.route("/student-reject").post(verifyJwt, rejectStudentProfile);

router.route("/faculty-approve").post(verifyJwt, approveFacultyProfile);
router.route("/faculty-reject").post(verifyJwt, rejectFacultyProfile);
router.get("/student/:rollNumber", getStudentByRollNumber);
router.route("/user/:id").get(verifyJwt, getUserById);

export default router;