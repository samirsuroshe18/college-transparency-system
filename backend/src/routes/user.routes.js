import { Router } from "express";
import { getCurrentUser, googleLogin, logoutUser,} from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/google-login").post(googleLogin);
router.route("/current-user").get(verifyJwt, getCurrentUser);
router.route("/logout").get(verifyJwt, logoutUser);

export default router;