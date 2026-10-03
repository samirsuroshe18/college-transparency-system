import { Router } from "express";
import { verifyJwt, requireApproved, requireRole } from '../middlewares/auth.middleware.js'
import { acceptFile } from '../middlewares/upload.middleware.js'
import { profileLimiter } from '../middlewares/rateLimit.middleware.js'
import { decideApplication, listApplications, reviewApplication, submitApplication } from "../controllers/application.controller.js";

const router = Router();

router.use(verifyJwt, requireApproved);

router.route('/')
    .get(listApplications)
    // the form can carry a file, so it has the per-user limit of the other forms with files
    .post(requireRole('student'), profileLimiter, acceptFile('file'), submitApplication);

router.route('/:id/review').patch(requireRole('faculty'), reviewApplication);
router.route('/:id/decision').patch(requireRole('admin'), decideApplication);


export default router;
