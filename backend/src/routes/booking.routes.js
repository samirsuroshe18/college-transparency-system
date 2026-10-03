import { Router } from "express";
import { verifyJwt, requireApproved, requireRole } from '../middlewares/auth.middleware.js'
import { cancelBooking, decideBooking, listBookings, requestBooking } from "../controllers/booking.controller.js";

const router = Router();

router.use(verifyJwt, requireApproved);

router.route('/').get(listBookings).post(requireRole('student', 'faculty'), requestBooking);
router.route('/:id').patch(requireRole('admin'), decideBooking).delete(cancelBooking);


export default router;
