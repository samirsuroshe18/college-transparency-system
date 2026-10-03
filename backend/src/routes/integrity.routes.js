import { Router } from "express";
import { verifyJwt, requireApproved, requireRole } from '../middlewares/auth.middleware.js'
import { acceptFile } from '../middlewares/upload.middleware.js'
import { profileLimiter, writeLimiter } from '../middlewares/rateLimit.middleware.js'
import { addRecord, listRecords, removeRecord } from "../controllers/integrity.controller.js";

const router = Router();

router.use(verifyJwt, requireApproved, writeLimiter);

router.route('/')
    .get(listRecords)
    .post(requireRole('faculty', 'admin'), profileLimiter, acceptFile('proof'), addRecord);

router.route('/:id').delete(requireRole('admin'), removeRecord);


export default router;
