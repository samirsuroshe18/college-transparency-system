import { Router } from "express";
import { verifyJwt } from '../middlewares/auth.middleware.js'
import { accountLimiter } from '../middlewares/rateLimit.middleware.js'
import { forgotPassword, getMe, loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";

const router = Router();

// these three can send email or test a password, so each visitor gets a limited number of tries
router.route('/register').post(accountLimiter, registerUser);
router.route('/login').post(accountLimiter, loginUser);
router.route('/forgot-password').post(accountLimiter, forgotPassword);

//Secure routes
router.route('/logout').get(verifyJwt, logoutUser);
router.route('/me').get(verifyJwt, getMe);


export default router;
