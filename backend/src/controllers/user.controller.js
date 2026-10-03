import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import mailSender from '../utils/mailSender.js';
import { endSessions } from '../utils/sessions.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const NAME_MAX = 80;
const DUPLICATE_KEY = 11000;

// the cookie must only require https in production, otherwise it is dropped on http://localhost
const cookieOptions = () => ({
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
});

const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');

// Reads the name from a request body; anything but text is refused
const readName = (value) => {
    if (value === undefined || value === null) return '';

    if (typeof value !== 'string') {
        throw new ApiError(400, "Name must be text");
    }

    const name = value.trim();

    if (name.length > NAME_MAX) {
        throw new ApiError(400, `Name must be at most ${NAME_MAX} characters`);
    }

    return name;
};

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const name = readName(req.body.name);
    const email = normalizeEmail(req.body.email);

    if (!name || !email || !password) {
        throw new ApiError(400, "Name, email and password are required");
    }

    if (!EMAIL_PATTERN.test(email)) {
        throw new ApiError(400, "Enter a valid email address");
    }

    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
        throw new ApiError(400, "Password must be at least 6 characters");
    }

    const existedUser = await User.findOne({ email });

    if (existedUser) {
        throw new ApiError(409, 'An account with this email already exists');
    }

    let user;
    try {
        // role, profile status and duties are never taken from a sign-up
        user = await User.create({ name, email, password });
    } catch (error) {
        // two sign-ups can pass the check above at the same moment; the unique index decides
        if (error.code === DUPLICATE_KEY) {
            throw new ApiError(409, 'An account with this email already exists');
        }
        throw error;
    }

    const mailResponse = await mailSender(email, user._id, "VERIFY");

    if (!mailResponse) {
        // logging in with an unverified account sends a fresh link
        throw new ApiError(500, "Account created, but the verification email could not be sent. Log in to get a new link.");
    }

    return res.status(201).json(
        new ApiResponse(201, {}, "Verification email sent. Please verify within 10 minutes.")
    );
});

const loginUser = asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email });

    // the same answer for an unknown email and a wrong password, so accounts cannot be probed
    if (!user || !(await user.isPasswordCorrect(String(password)))) {
        throw new ApiError(401, "Invalid email or password");
    }

    if (!user.isVerified) {
        const mailResponse = await mailSender(email, user._id, "VERIFY");

        if (!mailResponse) {
            throw new ApiError(500, "Email not verified, and a new verification link could not be sent. Please try again later.");
        }

        throw new ApiError(403, "Email not verified. A new verification link has been sent.");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id);

    return res.status(200)
        .cookie('accessToken', accessToken, cookieOptions())
        .cookie('refreshToken', refreshToken, cookieOptions())
        .json(new ApiResponse(200, { user: loggedInUser }, "Logged in"));
});

const logoutUser = asyncHandler(async (req, res) => {

    // the demo account is used by many visitors at once; one of them leaving must not
    // sign out the others, so only this browser's cookies are cleared
    if (!req.user.isDemo) {
        await endSessions(req.user._id);
    }

    return res.status(200)
        .clearCookie("accessToken", cookieOptions())
        .clearCookie("refreshToken", cookieOptions())
        .json(new ApiResponse(200, {}, "Logged out"));
});

const getMe = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, { user: req.user }, "Current user")
    );
});

const forgotPassword = asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body.email);

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email });

    // the demo account has no mailbox, and its password must stay the published one
    if (user && !user.isDemo) {
        await mailSender(email, user._id, "RESET");
    }

    // the same answer either way, so the form cannot be used to find registered emails
    return res.status(200).json(
        new ApiResponse(200, {}, "If that email is registered, a reset link has been sent.")
    );
});


export {
    registerUser,
    loginUser,
    logoutUser,
    getMe,
    forgotPassword
}
