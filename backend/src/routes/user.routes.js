import { Router } from "express";
import { getCurrentUser, googleLogin, logoutUser,} from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/auth.middleware.js";
import { isStudent } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/google-login").post(googleLogin);
router.route("/current-user").get(verifyJwt, getCurrentUser);
router.route("/logout").get(verifyJwt, logoutUser);


// Protected routes
router.route("/student-dashboard").get(verifyJwt, isStudent, (req, res) => {
    res.json({ message: "Welcome Student", user: req.user });
});

router.route("/admin-dashboard").get(verifyJwt, isAdmin, (req, res) => {
    res.json({ message: "Welcome Admin", user: req.user });
});

export default router;