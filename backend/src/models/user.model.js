import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true, lowercase: true },
    password: { type: String },

    profilePic: { type: String },
    isGoogleVerified: { type: Boolean, default: false },

    role: { type: String, enum: ["student", "faculty", "admin"], default: "student" },

    // Authentication Tokens
    refreshToken: { type: String },
    verifyToken: String,
    verifyTokenExpiry: Date,
    forgotPasswordToken: String,
    forgotPasswordTokenExpiry: Date,

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
