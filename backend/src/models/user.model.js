import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    name: {
        type: String,
        trim: true,
    },

    email: {
        type: String,
        trim: true,
        unique: true,
        lowercase: true,
    },

    profilePic: {
        type: String,
    },

    role: {
        type: String,
        enum: ["student", "faculty", "admin"],
        default: "student"
    },
    
    phoneNumber: { type: String,  },
    dateOfBirth: { type: Date,  },
    gender: { type: String, enum: ["Male", "Female", "Other"],  },

    
    // Fields specific to Students
    studentId: { type: String, unique: true, sparse: true },
    course: { type: String },
    department: { type: String },
    currentYear: { type: Number },
    passingYear: { type: Number },
    currentSemester: { type: Number },
    classDivision: { type: String },
    rollNumber: { type: String },
    admissionType: { type: String },
    admissionDate: { type: Date },
    hostelStatus: { type: String, enum: ["Hostel", "Day Scholar"] },
    bloodGroup: {type: String},

    // Fields specific to Faculty
    facultyId: { type: String, unique: true, sparse: true},
    department: { type: String },
    designation: { type: String },
    joiningDate: { type: Date },
    qualification: { type: String },
    subjectsTaught: [{ type: String }],
    officeRoomNumber: { type: String },
    officePhoneNumber: { type: String },

    // Common Fields
    address: { type: String },
    emergencyContact: { type: String },
    idProof: { type: String },

    profileStatus: {
        type: String,
        enum: ["Pending", "Rejected", "Approved", "NotFilled"],
        default: "NotFilled",
    },

    refreshToken: {
        type: String
    },

    // Authentication Tokens
    refreshToken: { type: String },
    verifyToken: String,
    verifyTokenExpiry: Date,

    // Student Details
    studentId: { type: String, unique: true },
    rollno: { type: String, unique: true },
    department: { type: String },
    address: { type: String },
    mobileNo: { type: String },
    parentMobileNo: { type: String },
    bloodGroup: { type: String },
    dob: { type: Date },
    admissionYear: { type: Number },
    passingYear: { type: Number },
    division: { type: String },
    currentSemester: { type: Number },
    hostelResident: { type: Boolean, default: false },
    emergencyContact: {
        name: { type: String },
        relation: { type: String },
        contactNo: { type: String }
    },
    studentStatus: { type: String, enum: ["Active", "Alumni"] },
    admissionType: { type: String, enum: ["Regular", "Direct"] },
    previousSchool: { type: String },

}, { timestamps: true });

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Check password
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// Generate JWT Tokens
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        { _id: this._id, email: this.email, name: this.name, role: this.role },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { _id: this._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};

export const User = mongoose.model("User", userSchema);
