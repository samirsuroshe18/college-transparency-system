import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { Notice } from '../models/notice.model.js';
import { isValidObjectId } from '../utils/objectId.js';

const LIST_LIMIT = 50;

const listNotices = asyncHandler(async (req, res) => {
    const [notices, unread] = await Promise.all([
        Notice.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(LIST_LIMIT),
        Notice.countDocuments({ user: req.user._id, readAt: null }),
    ]);

    return res.status(200).json(
        new ApiResponse(200, { notices, unread }, "Notices")
    );
});

const markRead = asyncHandler(async (req, res) => {
    // someone else's notice and an id that is not an id look the same from outside
    if (!isValidObjectId(req.params.id)) {
        throw new ApiError(404, "Notice not found");
    }

    const notice = await Notice.findOne({ _id: req.params.id, user: req.user._id });

    if (!notice) {
        throw new ApiError(404, "Notice not found");
    }

    if (!notice.readAt) {
        notice.readAt = new Date();
        await notice.save();
    }

    return res.status(200).json(
        new ApiResponse(200, { notice }, "Notice marked as read")
    );
});

const markAllRead = asyncHandler(async (req, res) => {
    await Notice.updateMany({ user: req.user._id, readAt: null }, { $set: { readAt: new Date() } });

    return res.status(200).json(
        new ApiResponse(200, {}, "All notices marked as read")
    );
});

export {
    listNotices,
    markRead,
    markAllRead
}
