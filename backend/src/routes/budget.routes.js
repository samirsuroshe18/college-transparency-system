import { Router } from "express";
import { verifyJwt, requireApproved, requireRole } from '../middlewares/auth.middleware.js'
import { acceptFile } from '../middlewares/upload.middleware.js'
import { profileLimiter, writeLimiter } from '../middlewares/rateLimit.middleware.js'
import { decideBudget, listBudgets, requestBudget } from "../controllers/budget.controller.js";

const router = Router();

router.use(verifyJwt, requireApproved, writeLimiter);

router.route('/')
    .get(listBudgets)
    // the form can carry a bill, so it has the per-user limit of the other forms with files
    .post(requireRole('student', 'faculty'), profileLimiter, acceptFile('bill'), requestBudget);

router.route('/:id/decision').patch(requireRole('admin'), decideBudget);


export default router;
