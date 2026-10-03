import { Router } from "express";
import { verifyJwt, requireApproved, requireRole } from '../middlewares/auth.middleware.js'
import { createFacility, listFacilities, updateFacility } from "../controllers/facility.controller.js";

const router = Router();

router.use(verifyJwt, requireApproved);

router.route('/').get(listFacilities).post(requireRole('admin'), createFacility);
router.route('/:id').patch(requireRole('admin'), updateFacility);


export default router;
