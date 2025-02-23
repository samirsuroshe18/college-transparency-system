import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import mongoose from 'mongoose';

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

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(existedUser._id);

    //option object is created beacause we dont want to modified the cookie to front side
    const option = {
        httpOnly: 'true' === process.env.HTTP_ONLY,
        secure: 'true' === process.env.COOKIE_SECURE,
        maxAge: Number(process.env.COOKIE_MAX_AGE),
    }

    return res.status(200).cookie('accessToken', accessToken, option).cookie('refreshToken', refreshToken, option).json(
        new ApiResponse(200, { existedUser, accessToken, refreshToken }, "User logged in sucessully")
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
    const {
        name, email, studentId, department, classDivision, rollNumber,
        admissionType, admissionDate, currentYear, passingYear, hostelStatus,
        address, bloodGroup, dateOfBirth, gender, phoneNumber, emergencyContact
    } = req.body;

    const file = req.file.path;

    const path = await uploadOnCloudinary(file);

    if (!path?.url) {
        throw new ApiError(500, "Failed to upload company logo");
    }

    // Update Student Profile
    const student = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                name,
                email,
                studentId,
                department,
                classDivision,
                rollNumber,
                admissionType,
                admissionDate,
                currentYear,
                passingYear,
                hostelStatus,
                address,
                bloodGroup,
                dateOfBirth,
                gender,
                phoneNumber,
                emergencyContact: JSON.parse(emergencyContact),
                idProof: path?.url || "",
                profileStatus: "Pending",
                role: "student"
            }
        },
        { new: true }
    );

    if (!student) {
        throw new ApiError(500, "Something went wrong");
    }

    return res.status(200).json(
        new ApiResponse(200, student, "Form submited successfully")
    );
});

const addFacultyProfile = asyncHandler(async (req, res) => {
    const { phoneNumber, joinDate, qualification, emergencyContact, address, department, designation, dateOfBirth, gender, isBoardMember, } = req.body;

    const file = req.file.path;

    const path = await uploadOnCloudinary(file);

    if (!path?.url) {
        throw new ApiError(500, "Failed to upload company logo");
    }

    const faculty = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                idProof: path?.url,
                phoneNumber,
                dateOfBirth,
                gender,
                isBoardMember,
                joiningDate: joinDate,
                qualification,
                emergencyContact: JSON.parse(emergencyContact),
                address,
                department,
                designation,
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
const getPendingStudentProfiles = asyncHandler(async (req, res) => {
    const pendingStudents = await User.find({ role: "student", profileStatus: "Pending" });

    return res.status(200).json(
        new ApiResponse(200, pendingStudents, "Facility fetched successfully.")
    )
});

// Get all rejected student profiles
const getRejectedStudentProfiles = async (req, res) => {
    try {
        const rejectedStudents = await User.find({ role: "student", profileStatus: "Rejected" });
        res.status(200).json(rejectedStudents);
    } catch (error) {
        res.status(500).json({ message: "Error fetching rejected student profiles", error });
    }
};

// Get a specific approved student profile
const getApproveStudentProfile = async (req, res) => {
    try {
        const student = await User.findOne({ _id: req.params.userId, role: "student", profileStatus: "Approved" });
        if (!student) return res.status(404).json({ message: "Student not found or not Approved" });

        res.status(200).json(student);
    } catch (error) {
        res.status(500).json({ message: "Error fetching approved student profile", error });
    }
};

// Approve a student profile
const approveStudentProfile = asyncHandler(async (req, res) => {
    const { id } = req.body;
    const userId = mongoose.Types.ObjectId.createFromHexString(id);

    const updatedStudent = await User.findByIdAndUpdate(
        userId,
        { profileStatus: "Approved" },
        { new: true }
    );

    if (!updatedStudent) {
        throw new ApiError(404, "student not found");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedStudent, "Student profile approved successfully")
    );
});

// Reject a student profile
const rejectStudentProfile = asyncHandler(async (req, res) => {
    const { id, rejectionReason } = req.body;
    const userId = mongoose.Types.ObjectId.createFromHexString(id);

    if (!rejectionReason) {
        return res.status(400).json({ message: "Rejection reason is required" });
    }

    const updatedStudent = await User.findByIdAndUpdate(
        userId,
        { profileStatus: "Rejected", rejectionReason },
        { new: true }
    );

    if (!updatedStudent) {
        throw new ApiError(404, "student not found");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedStudent, "Student profile rejected successfully")
    );
});

// Get all pending faculty profiles
const getPendingFacultyProfiles = asyncHandler(async (req, res) => {
    const pendingFaculty = await User.find({ role: "faculty", profileStatus: "Pending" });
    return res.status(200).json(
        new ApiResponse(200, pendingFaculty, "Pending faculty fetched successfully.")
    )
});

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
const approveFacultyProfile = asyncHandler(async (req, res) => {
    const { id, rejectionReason } = req.body;
    const userId = mongoose.Types.ObjectId.createFromHexString(id);

    const updatedFaculty = await User.findByIdAndUpdate(userId, { profileStatus: "Approved" }, { new: true });
    if (!updatedFaculty) {
        throw new ApiError(404, "Faculty not found");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedFaculty, "Faculty profile approved successfully")
    );
});

// Reject a faculty profile
const rejectFacultyProfile = asyncHandler(async (req, res) => {
    const { id, rejectionReason } = req.body;
    const userId = mongoose.Types.ObjectId.createFromHexString(id);

    if (!rejectionReason) {
        return res.status(400).json({ message: "Rejection reason is required" });
    }

    const updatedFaculty = await User.findByIdAndUpdate(
        userId,
        { profileStatus: "Rejected", rejectionReason },
        { new: true }
    );

    if (!updatedFaculty) {
        throw new ApiError(404, "Faculty not found");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedFaculty, "Faculty profile rejected successfully")
    );
});

const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findById(id).select("-password");
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error while fetching user",
            error: error.message
        });
    }
}

const getStudentByRollNumber = asyncHandler(async (req, res) => {
    const { rollNumber } = req.params; // Get roll number from request params

    if (!rollNumber) {
        throw new ApiError(400, "Roll number is required");
    }

    const student = await User.findOne({ rollNumber, role: "student" }, "name classDivision currentYear");

    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    return res.status(200).json(
        new ApiResponse(200, student, "Student details fetched successfully")
    );
});



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
    rejectFacultyProfile,
    getUserById,
    getStudentByRollNumber,
    
}