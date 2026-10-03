import { Router } from "express";
import { verifyJwt, requireApproved, requireRole } from '../middlewares/auth.middleware.js'
import { acceptFile } from '../middlewares/upload.middleware.js'
import { profileLimiter } from '../middlewares/rateLimit.middleware.js'
import { listComplaints, resolveComplaint, submitComplaint, voteOnComplaint, voteToReveal } from "../controllers/complaint.controller.js";

const router = Router();

router.use(verifyJwt, requireApproved);

router.route('/')
    .get(listComplaints)
    // the form can carry a file, so it has the same per-user limit as the profile forms
    .post(requireRole('student'), profileLimiter, acceptFile('document'), submitComplaint);

router.route('/:id/vote').post(voteOnComplaint);
// who is on the board is checked in the handler, which has its own message for it
router.route('/:id/reveal-vote').post(voteToReveal);
router.route('/:id/resolve').patch(requireRole('admin'), resolveComplaint);


export default router;
