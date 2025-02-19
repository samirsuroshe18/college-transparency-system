import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        // when we use save() method is used then all the fields are neccesary so to avoid that we have to pass an object with property {validatBeforeSave:false}
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
};

const googleLogin = asyncHandler(async (req, res) => {
    const { name, email, profilePic } = req.body;

    if (!name || !email || !profilePic) {
        throw new ApiError(400, "Please provide all the required fields");
    }

    if (!email.endsWith("@gmail.com")) {
        throw new ApiError(400, "Access Denied");
    }

    let user = await User.findOne({ email });

    if (!user) {
        // New user created with default role
        user = await User.create({
            name,
            email,
            profilePic,
            isGoogleVerified: true,
            role: "student", // Default role for new user
        });

        if (!user) {
            throw new ApiError(500, "Something went wrong");
        }
    } else {
        // Update existing user
        user = await User.findByIdAndUpdate(
            user._id,
            {
                $set: {
                    name: name,
                    profilePic: profilePic,
                    isGoogleVerified: true,
                },
            },
            { new: true }
        ).select("-password");

        if (!user) {
            throw new ApiError(500, "Something went wrong");
        }
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    // Cookie options
    const option = {
        httpOnly: 'true' === process.env.HTTP_ONLY,
        secure: 'true' === process.env.COOKIE_SECURE,
        maxAge: Number(process.env.COOKIE_MAX_AGE),
    };

    return res
        .status(200)
        .cookie('accessToken', accessToken, option)
        .cookie('refreshToken', refreshToken, option)
        .json(
            new ApiResponse(200, { user, accessToken, refreshToken, redirectTo: user.role === "admin" ? "/admin-dashboard" : "/student-dashboard" }, "User logged in successfully")
        );
});

const logoutUser = asyncHandler(async (req, res) => {

    return res.status(200).clearCookie('accessToken').status(200).json(
        new ApiResponse(200, req.user, "User logged out successfully")
    );
});

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Determine redirection based on user role
    const redirectTo = user.role === "admin" ? "/admin-dashboard" : "/student-dashboard";

    return res.status(200).json(
        new ApiResponse(200, { user, redirectTo }, "User session is Active")
    );
});

export {
    googleLogin,
    logoutUser,
    getCurrentUser,
}