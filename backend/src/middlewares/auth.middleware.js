import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asynchandler.js";
import jwt from 'jsonwebtoken';
import { User } from "../models/user.model.js";

const verifyJwt = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorised request");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid access token");
        }

        // logout and password reset raise the version, which ends every older session
        if (decodedToken.tokenVersion !== user.tokenVersion) {
            throw new ApiError(401, "Session expired");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
})

const PROFILE_MESSAGES = {
    NotFilled: "Complete your profile first",
    Pending: "Your profile is waiting for approval",
    Rejected: "Your profile was rejected",
};

// Use after verifyJwt. Students and faculty need a profile an admin has approved;
// admin and doctor accounts are made by the college and need no approval.
const requireApproved = (req, _, next) => {
    const { role, profileStatus } = req.user;

    if (role === 'admin' || role === 'doctor' || profileStatus === 'Approved') {
        return next();
    }

    next(new ApiError(403, PROFILE_MESSAGES[profileStatus] || PROFILE_MESSAGES.NotFilled));
};

// use after verifyJwt
const requireRole = (...roles) => (req, _, next) =>
    roles.includes(req.user?.role) ? next() : next(new ApiError(403, "You are not allowed to do this"));

export { verifyJwt, requireApproved, requireRole };
