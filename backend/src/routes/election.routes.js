import { Router } from "express";
import { verifyJwt, requireApproved, requireRole } from '../middlewares/auth.middleware.js'
import { writeLimiter } from '../middlewares/rateLimit.middleware.js'
import { applyAsCandidate, castVote, createElection, decideCandidate, endElection, getElection, listElections } from "../controllers/election.controller.js";

const router = Router();

router.use(verifyJwt, requireApproved, writeLimiter);

router.route('/').get(listElections).post(requireRole('admin'), createElection);
router.route('/:id').get(getElection);
router.route('/:id/end').patch(requireRole('admin'), endElection);

// who may stand and vote depends on the election's own rules, checked in the handlers
router.route('/:id/candidates').post(applyAsCandidate);
router.route('/:id/candidates/:candidateId').patch(requireRole('admin'), decideCandidate);
router.route('/:id/vote').post(castVote);


export default router;
