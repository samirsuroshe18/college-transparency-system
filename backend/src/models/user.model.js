import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';

export const ROLES = ['student', 'faculty', 'admin', 'doctor'];
export const PROFILE_STATUSES = ['NotFilled', 'Pending', 'Approved', 'Rejected'];
export const DESIGNATIONS = ["Professor", "Associate Professor", "Assistant Professor", "Lecturer", "Lab assistant", "Registrar", "Director"];

// the class a faculty member looks after as coordinator
const classSchema = new Schema({
    department: { type: String, trim: true },
    year: { type: String, trim: true },
    division: { type: String, trim: true },
}, { _id: false });

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },

    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
    },

    password: {
        type: String,
        required: true,
    },

    isVerified: {
        type: Boolean,
        default: false,
    },

    role: {
        type: String,
        enum: ROLES,
        default: "student",
    },

    // students and faculty fill a profile that an admin approves before they can use the system
    profileStatus: {
        type: String,
        enum: PROFILE_STATUSES,
        default: "NotFilled",
    },

    rejectionReason: { type: String },

    // one of the shared accounts visitors can try the app with
    isDemo: {
        type: Boolean,
        default: false,
    },

    phoneNumber: { type: String, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    department: { type: String, trim: true },
    address: { type: String, trim: true },
    emergencyContact: {
        name: { type: String, trim: true },
        relation: { type: String, trim: true },
        contact: { type: String, trim: true },
    },
    idProof: { type: String },

    // students
    currentYear: { type: String, trim: true },
    passingYear: { type: String, trim: true },
    currentSemester: { type: Number },
    classDivision: { type: String, trim: true },
    // sparse: only users who have one take part in the uniqueness rule
    rollNumber: { type: String, trim: true, unique: true, sparse: true },
    admissionType: { type: String, enum: ["regular", "lateral"] },
    admissionDate: { type: Date },
    hostelStatus: { type: String, enum: ["Hostel", "Day Scholar"] },
    bloodGroup: { type: String, trim: true },

    // faculty
    facultyId: { type: String, trim: true, unique: true, sparse: true },
    designation: { type: String, enum: DESIGNATIONS },
    joiningDate: { type: Date },
    officeRoomNumber: { type: String, trim: true },
    officePhoneNumber: { type: String, trim: true },
    qualification: { type: String, trim: true },

    // duties an admin gives to a faculty member
    isBoardMember: {
        type: Boolean,
        default: false,
    },
    coordinatorOf: classSchema,

    refreshToken: {
        type: String
    },

    // raised on logout and password reset; a token carrying an older value is refused
    tokenVersion: {
        type: Number,
        default: 0,
    },

    verifyToken: String,
    verifyTokenExpiry: Date,
    forgotPasswordToken: String,
    forgotPasswordTokenExpiry: Date,

}, { timestamps: true });

// the password is hashed whenever it changes, never stored as typed
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            name: this.name,
            role: this.role,
            tokenVersion: this.tokenVersion,
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

// never send secrets or one-time tokens to a client
userSchema.set('toJSON', {
    transform: (_, ret) => {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.tokenVersion;
        delete ret.verifyToken;
        delete ret.verifyTokenExpiry;
        delete ret.forgotPasswordToken;
        delete ret.forgotPasswordTokenExpiry;
        delete ret.__v;
        return ret;
    }
});

export const User = mongoose.model("User", userSchema);
