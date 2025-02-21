import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js'

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

    const existedUser = await User.findOne({ email });

    if (!existedUser) {
        const loggedInUser = await User.create({
            name,
            email,
            profilePic,
        });

        if (!loggedInUser) {
            throw new ApiError(500, "Something went wrong");
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(loggedInUser._id);

        //option object is created beacause we dont want to modified the cookie to front side
        const option = {
            httpOnly: 'true' === process.env.HTTP_ONLY,
            secure: 'true' === process.env.COOKIE_SECURE,
            maxAge: Number(process.env.COOKIE_MAX_AGE),
        }

        return res.status(200).cookie('accessToken', accessToken, option).cookie('refreshToken', refreshToken, option).json(
            new ApiResponse(200, { loggedInUser, accessToken, refreshToken }, "User logged in sucessully")
        );
    }

    const isUpdate = await User.findByIdAndUpdate(
        existedUser._id,
        {
            $set: {
                name: name,
                profilePic: profilePic,
                isGoogleVerified: true,
            }
        },
        { new: true }
    );

    if (!isUpdate) {
        throw new ApiError(500, "Something went wrong");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(isUpdate._id);

    //option object is created beacause we dont want to modified the cookie to front side
    const option = {
        httpOnly: 'true' === process.env.HTTP_ONLY,
        secure: 'true' === process.env.COOKIE_SECURE,
        maxAge: Number(process.env.COOKIE_MAX_AGE),
    }

    return res.status(200).cookie('accessToken', accessToken, option).cookie('refreshToken', refreshToken, option).json(
        new ApiResponse(200, { isUpdate, accessToken, refreshToken }, "User logged in sucessully")
    );
});

const logoutUser = asyncHandler(async (req, res) => {

    return res.status(200).clearCookie('accessToken').status(200).json(
        new ApiResponse(200, req.user, "User logged out successfully")
    );
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, req.user, "User session is Active")
    );
});

const addStudentProfile = asyncHandler(async (req, res) => {
    const { fullName, email, studentId, department, year } = req.body;

    const file = req.file.path;
    const path = await uploadOnCloudinary(file);

    if (!path?.url) {
        throw new ApiError(500, "Failed to upload company logo");
    }

    const student = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                name: fullName,
                email,
                studentId,
                department,
                year,
                idProof: path?.url,
                profileStatus: "Pending",
                role: "student"
            }
        },
        { new: true }
    )

    if (!student) {
        throw new ApiError(500, "Something went wrong");
    }

    return res.status(200).json(
        new ApiResponse(200, student, "Form submited successfully")
    );
});

const addFacultyProfile = asyncHandler(async (req, res) => {
    const { fullName, email, employeeId, department, designation } = req.body;

    const file = req.file.path;

    const path = await uploadOnCloudinary(file);

    if (!path?.url) {
        throw new ApiError(500, "Failed to upload company logo");
    }

    const faculty = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                name: fullName,
                email,
                employeeId,
                department,
                designation,
                idProof: path?.url,
                profileStatus: "Pending",
                role: "faculty"
            }
        },
        { new: true }
    )

    if (!faculty) {
        throw new ApiError(500, "Something went wrong");
    }

    return res.status(200).json(
        new ApiResponse(200, faculty, "Form submited successfully")
    );
});

// Get all pending student profiles
const getPendingStudentProfiles = async (req, res) => {
    try {
        const pendingStudents = await User.find({ role: "student", status: "Pending" });
        res.status(200).json(pendingStudents);
    } catch (error) {
        res.status(500).json({ message: "Error fetching pending student profiles", error });
    }
};

// Get all rejected student profiles
const getRejectedStudentProfiles = async (req, res) => {
    try {
        const rejectedStudents = await User.find({ role: "student", status: "Rejected" });
        res.status(200).json(rejectedStudents);
    } catch (error) {
        res.status(500).json({ message: "Error fetching rejected student profiles", error });
    }
};

// Get a specific approved student profile
const getApproveStudentProfile = async (req, res) => {
    try {
        const student = await User.findOne({ _id: req.params.userId, role: "student", status: "Approved" });
        if (!student) return res.status(404).json({ message: "Student not found or not Approved" });

        res.status(200).json(student);
    } catch (error) {
        res.status(500).json({ message: "Error fetching approved student profile", error });
    }
};

// Approve a student profile
const approveStudentProfile = async (req, res) => {
    try {
        const updatedStudent = await User.findByIdAndUpdate(req.params.userId, { status: "Approved" }, { new: true });
        if (!updatedStudent) return res.status(404).json({ message: "Student not found" });

        res.status(200).json({ message: "Student profile approved successfully", user: updatedStudent });
    } catch (error) {
        res.status(500).json({ message: "Error approving student profile", error });
    }
};

// Reject a student profile
const rejectStudentProfile = async (req, res) => {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
        return res.status(400).json({ message: "Rejection reason is required" });
    }

    try {
        const updatedStudent = await User.findByIdAndUpdate(
            req.params.userId,
            { status: "Rejected", rejectionReason },
            { new: true }
        );

        if (!updatedStudent) return res.status(404).json({ message: "Student not found" });

        res.status(200).json({ message: "Student profile rejected successfully", user: updatedStudent });
    } catch (error) {
        res.status(500).json({ message: "Error rejecting student profile", error });
    }
};

// Get all pending faculty profiles
const getPendingFacultyProfiles = async (req, res) => {
    try {
        const pendingFaculty = await User.find({ role: "faculty", status: "Pending" });
        res.status(200).json(pendingFaculty);
    } catch (error) {
        res.status(500).json({ message: "Error fetching pending faculty profiles", error });
    }
};

// Get all rejected faculty profiles
const getRejectedFacultyProfiles = async (req, res) => {
    try {
        const rejectedFaculty = await User.find({ role: "faculty", status: "Rejected" });
        res.status(200).json(rejectedFaculty);
    } catch (error) {
        res.status(500).json({ message: "Error fetching rejected faculty profiles", error });
    }
};

// Get a specific approved faculty profile
const getApproveFacultyProfile = async (req, res) => {
    try {
        const faculty = await User.findOne({ _id: req.params.userId, role: "faculty", status: "Approved" });
        if (!faculty) return res.status(404).json({ message: "Faculty not found or not approved" });

        res.status(200).json(faculty);
    } catch (error) {
        res.status(500).json({ message: "Error fetching approved faculty profile", error });
    }
};

// Approve a faculty profile
const approveFacultyProfile = async (req, res) => {
    try {
        const updatedFaculty = await User.findByIdAndUpdate(req.params.userId, { status: "Approved" }, { new: true });
        if (!updatedFaculty) return res.status(404).json({ message: "Faculty not found" });

        res.status(200).json({ message: "Faculty profile approved successfully", user: updatedFaculty });
    } catch (error) {
        res.status(500).json({ message: "Error approving faculty profile", error });
    }
};

// Reject a faculty profile
const rejectFacultyProfile = async (req, res) => {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
        return res.status(400).json({ message: "Rejection reason is required" });
    }

    try {
        const updatedFaculty = await User.findByIdAndUpdate(
            req.params.userId,
            { status: "Rejected", rejectionReason },
            { new: true }
        );

        if (!updatedFaculty) return res.status(404).json({ message: "Faculty not found" });

        res.status(200).json({ message: "Faculty profile rejected successfully", user: updatedFaculty });
    } catch (error) {
        res.status(500).json({ message: "Error rejecting faculty profile", error });
    }
};


export {
    googleLogin,
    logoutUser,
    getCurrentUser,
    addStudentProfile,
    addFacultyProfile,
    getPendingStudentProfiles,
    getRejectedStudentProfiles,
    getApproveStudentProfile,
    approveStudentProfile,
    rejectStudentProfile,
    getPendingFacultyProfiles,
    getRejectedFacultyProfiles,
    getApproveFacultyProfile,
    approveFacultyProfile,
    rejectFacultyProfile
}