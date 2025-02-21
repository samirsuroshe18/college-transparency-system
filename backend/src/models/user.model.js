import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';

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
    
    phoneNumber: { type: String,  },
    dateOfBirth: { type: Date,  },
    gender: { type: String, enum: ["Male", "Female", "Other"],  },

    role: {
        type: String,
        enum: ["student", "faculty", "admin"],
        default: "student"
    },

    // Fields specific to Students
    studentId: { type: String, unique: true, sparse: true },
    course: { type: String },
    department: { type: String },
    year: { type: Number },
    semester: { type: Number },
    classDivision: { type: String },
    rollNumber: { type: String },
    hostelStatus: { type: String, enum: ["Hostel", "Day Scholar"] },

    // Fields specific to Faculty
    employeeId: { type: String, unique: true, sparse: true},
    department: { type: String },
    designation: { type: String },
    joiningDate: { type: Date },
    qualification: { type: String },
    subjectsTaught: [{ type: String }],
    officeRoomNumber: { type: String },

    // Common Fields
    address: { type: String },
    emergencyContact: { type: String },
    profilePicture: { type: String }, // URL of profile picture
    idProof: { type: String }, // URL of ID proof document

    profileStatus: {
        type: String,
        enum: ["Pending", "Rejected", "Approved", "NotFilled"],
        default: "NotFilled",
    },

    isGoogleVerified: {
        type: Boolean,
        default: false,
    },

    refreshToken: {
        type: String
    },

    verifyToken: String,
    verifyTokenExpiry: Date,
    forgotPasswordToken: String,
    forgotPasswordTokenExpiry: Date,

}, { timestamps: true });

//pre hooks allow us to do any operation before saving the data in database
//in pre hook the first parameter on which event you have to do the operation like save, validation, etc
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

//you can create your custom methods as well by using methods object
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

//jwt is a bearer token it means the person bear this token we give the access to that person its kind of chavi
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            userName: this.userName,
        }, process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
}

export const User = mongoose.model("User", userSchema);