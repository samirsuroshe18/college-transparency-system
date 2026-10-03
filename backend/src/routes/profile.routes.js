import { Router } from "express";
import { verifyJwt, requireRole } from '../middlewares/auth.middleware.js'
import { acceptFile } from '../middlewares/upload.middleware.js'
import { approveProfile, getApprovedFaculty, getPendingProfiles, rejectProfile, setDuties, submitFacultyProfile, submitStudentProfile } from "../controllers/profile.controller.js";

const router = Router();

router.use(verifyJwt);

// filling in a profile is what a new user does before being approved
router.route('/student').post(acceptFile('idProof'), submitStudentProfile);
router.route('/faculty').post(acceptFile('idProof'), submitFacultyProfile);

// decisions are an admin's
router.route('/pending').get(requireRole('admin'), getPendingProfiles);
router.route('/faculty').get(requireRole('admin'), getApprovedFaculty);
router.route('/:userId/approve').patch(requireRole('admin'), approveProfile);
router.route('/:userId/reject').patch(requireRole('admin'), rejectProfile);
router.route('/:userId/duties').patch(requireRole('admin'), setDuties);


export default router;
