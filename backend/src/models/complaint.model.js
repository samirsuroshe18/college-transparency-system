import mongoose, { Schema } from "mongoose";

const complaintSchema = new Schema({
    // always stored; whether it is shown depends on isAnonymous and revealedAt
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

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

    isAnonymous: {
        type: Boolean,
        default: false,
    },

    documentUrl: String,

    // one entry per user: 1 is a vote up, -1 a vote down
    votes: [new Schema({
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        value: { type: Number, enum: [1, -1], required: true },
    }, { _id: false })],

    // board members who voted to show the author of an anonymous complaint
    revealVotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    // set when more than half of the board has voted to reveal; never unset
    revealedAt: Date,

    status: {
        type: String,
        enum: ['open', 'resolved'],
        default: 'open',
    },

    resolution: new Schema({
        note: { type: String, trim: true },
        by: { type: Schema.Types.ObjectId, ref: 'User' },
        at: Date,
    }, { _id: false }),

    // part of the sample college
    isDemo: {
        type: Boolean,
        default: false,
    },

}, { timestamps: true });

export const Complaint = mongoose.model("Complaint", complaintSchema);
