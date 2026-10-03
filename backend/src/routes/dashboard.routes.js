import { Router } from "express";
import { verifyJwt, requireApproved } from '../middlewares/auth.middleware.js'
import { getDashboard } from "../controllers/dashboard.controller.js";

const router = Router();

router.route('/').get(verifyJwt, requireApproved, getDashboard);


export default router;
