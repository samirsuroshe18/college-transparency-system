import { Router } from "express";
import { addFacultyProfile, addStudentProfile, getCurrentUser, googleLogin, logoutUser,} from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/google-login").post(googleLogin);
router.route("/current-user").get(verifyJwt, getCurrentUser);
router.route("/logout").get(verifyJwt, logoutUser);
router.route("/add-student-profile").post(verifyJwt, upload.single("proofImage"), addStudentProfile);
router.route("/add-faculty-profile").post(verifyJwt, upload.single("proofImage"), addFacultyProfile);

export default router;