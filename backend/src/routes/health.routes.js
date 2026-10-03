import { Router } from "express";
import { verifyJwt, requireApproved, requireRole } from '../middlewares/auth.middleware.js'
import { acceptFile } from '../middlewares/upload.middleware.js'
import { profileLimiter, writeLimiter } from '../middlewares/rateLimit.middleware.js'
import { assessConcern, listConcerns, listLeaves, reportConcern } from "../controllers/health.controller.js";

const concernRouter = Router();

concernRouter.use(verifyJwt, requireApproved, writeLimiter);

concernRouter.route('/')
    .get(listConcerns)
    .post(requireRole('student'), profileLimiter, acceptFile('attachment'), reportConcern);

concernRouter.route('/:id/assess').patch(requireRole('doctor'), assessConcern);

const leaveRouter = Router();

leaveRouter.use(verifyJwt, requireApproved);

leaveRouter.route('/').get(listLeaves);


export { concernRouter, leaveRouter };
