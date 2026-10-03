import mongoose, { Schema } from "mongoose";

// A case of academic dishonesty, visible to the whole college. The student's details
// are copied in when the record is made, so the record stays as it was written.
const integrityRecordSchema = new Schema({
    student: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    studentName: {
        type: String,
        required: true,
        trim: true,
    },

    rollNumber: {
        type: String,
        required: true,
        trim: true,
    },

    department: String,

    year: String,

    reason: {
        type: String,
        required: true,
        trim: true,
    },

    proofUrl: String,

    recordedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },

    // part of the sample college
    isDemo: {
        type: Boolean,
        default: false,
    },

}, { timestamps: true });

export const IntegrityRecord = mongoose.model("IntegrityRecord", integrityRecordSchema);
