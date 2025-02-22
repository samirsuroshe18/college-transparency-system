import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";

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
    department: { type: String },
    currentYear: { type: String },
    passingYear: { type: String },
    currentSemester: { type: Number },
    classDivision: { type: String },
    rollNumber: { type: String, unique: true },
    admissionType: { type: String, enum: ["regular", "lateral"]},
    admissionDate: { type: Date },
    hostelStatus: { type: String, enum: ["Hostel", "Day Scholar"] },
    bloodGroup: {type: String},

    // Fields specific to Faculty
    facultyId: { type: String, unique: true, sparse: true},
    department: { type: String },
    designation: { type: String, enum: ["Professor", "Associate Professor", "Assistant Professor", "Lecturer", "Lab assistant", "Registrar", "Director"] },
    isBoardMember: { type: Boolean },
    joiningDate: { type: Date },
    officeRoomNumber: { type: String },
    officePhoneNumber: { type: String },
    qualification: { type: String },

    // Common Fields
    address: { type: String },
    emergencyContact: {
        name: { type: String },
        relation: { type: String },
        contact: { type: String }
    },

    idProof: { type: String },

    profileStatus: {
        type: String,
        enum: ["Pending", "Rejected", "Approved", "NotFilled"],
        default: "NotFilled",
    },

    rejectionReason: { type: String },

    refreshToken: {
        type: String
    },

    verifyToken: String,
    verifyTokenExpiry: Date,

}, { timestamps: true });

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
