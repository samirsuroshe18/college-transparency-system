import mongoose, { Schema } from "mongoose";

export const APPLICATION_CATEGORIES = ['event', 'budget', 'sponsorship'];

// who said what, and when
const remarkSchema = new Schema({
    comment: { type: String, trim: true },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    at: Date,
}, { _id: false });

// A request a student puts to the college: to hold an event, for a budget, for a sponsor
const applicationSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },

    description: {
        type: String,
        required: true,
        trim: true,
    },

    category: {
        type: String,
        enum: APPLICATION_CATEGORIES,
        required: true,
    },

    fileUrl: String,

    submittedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },

    // a faculty member's opinion, before the decision
    review: remarkSchema,

    // the admin's decision
    decision: remarkSchema,

    // part of the sample college
    isDemo: {
        type: Boolean,
        default: false,
    },

}, { timestamps: true });

export const Application = mongoose.model("Application", applicationSchema);
