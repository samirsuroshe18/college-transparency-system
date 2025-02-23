import { Router } from "express";
import healthController from "../controllers/healthModule/health.controller.js";

import leaveController from "../controllers/healthModule/leave.controller.js";

import notificationController from "../controllers/healthModule/notification.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Health record routes
router.route("/health/create")
    .post(
        verifyJwt, 
        upload.single("attachments"), 
        healthController.createHealthRecord
    );

router.route("/health/student/:studentId")
    .get(
        verifyJwt, 
        healthController.getStudentHealthRecords
    );

// router.route("/health/notify/:healthRecordId")
//     .post(
//         verifyJwt, 
//         healthController.sendHealthNotification
//     );

// Leave record routes
router.route("/leave/create")
    .post(
        verifyJwt, 
        upload.single("leaveDocuments"), 
        leaveController.createLeaveRecord
    );

router.route("/leave/student/:studentId")
    .get(
        verifyJwt, 
        leaveController.getStudentLeaveRecords
    );

// router.route("/leave/notify/:leaveRecordId")
//     .post(
//         verifyJwt, 
//         leaveController.sendLeaveNotification
//     );

// Additional utility routes
// router.route("/health/dashboard")
//     .get(
//         verifyJwt,
//         healthController.getHealthDashboard
//     );

// router.route("/leave/dashboard")
//     .get(
//         verifyJwt,
//         leaveController.getLeaveDashboard
//     );

// router.route("/health/stats")
//     .get(
//         verifyJwt,
//         healthController.getHealthStats
//     );

// router.route("/leave/stats")
//     .get(
//         verifyJwt,
//         leaveController.getLeaveStats
    // );

export default router;