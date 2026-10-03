import mongoose, { Schema } from "mongoose";

export const URGENCIES = ['normal', 'urgent'];

// What a student tells the college doctor, and the doctor's answer. Only the student
// and the doctor read it; a class coordinator learns of the leave and nothing else.
const healthConcernSchema = new Schema({
    student: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    symptoms: {
        type: String,
        required: true,
        trim: true,
    },

    description: {
        type: String,
        trim: true,
    },

    urgency: {
        type: String,
        enum: URGENCIES,
        default: 'normal',
    },

    attachmentUrl: String,

    status: {
        type: String,
        enum: ['open', 'assessed'],
        default: 'open',
    },

    assessment: new Schema({
        diagnosis: { type: String, trim: true },
        leaveDays: { type: Number, default: 0 },
        by: { type: Schema.Types.ObjectId, ref: 'User' },
        at: Date,
    }, { _id: false }),

    // first and last day of the leave, as days at the college ("2026-11-12");
    // set only when the doctor gives leave
    leaveFrom: String,
    leaveUntil: String,

    // part of the sample college
    isDemo: {
        type: Boolean,
        default: false,
    },

}, { timestamps: true });

export const HealthConcern = mongoose.model("HealthConcern", healthConcernSchema);
