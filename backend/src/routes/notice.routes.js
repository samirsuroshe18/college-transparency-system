import { Router } from "express";
import { verifyJwt } from '../middlewares/auth.middleware.js'
import { listNotices, markAllRead, markRead } from "../controllers/notice.controller.js";

const router = Router();

// a user whose profile is still pending must be able to read the decision about it,
// so notices only need a login
router.use(verifyJwt);

router.route('/').get(listNotices);
router.route('/read-all').patch(markAllRead);
router.route('/:id/read').patch(markRead);


export default router;
