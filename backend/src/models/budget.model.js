import mongoose, { Schema } from "mongoose";

export const BUDGET_CATEGORIES = ['event', 'department', 'mess', 'other'];

// A request for money, and what was decided about it. Every request and decision is
// visible to the whole college.
const budgetSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },

    category: {
        type: String,
        enum: BUDGET_CATEGORIES,
        required: true,
    },

    description: {
        type: String,
        required: true,
        trim: true,
    },

    requestedAmount: {
        type: Number,
        required: true,
    },

    // set only when the request is approved
    approvedAmount: Number,

    billUrl: String,

    requestedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },

    decision: new Schema({
        comment: { type: String, trim: true },
        by: { type: Schema.Types.ObjectId, ref: 'User' },
        at: Date,
    }, { _id: false }),

    // part of the sample college
    isDemo: {
        type: Boolean,
        default: false,
    },

}, { timestamps: true });

export const Budget = mongoose.model("Budget", budgetSchema);
