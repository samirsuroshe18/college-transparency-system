import mongoose, { Schema } from "mongoose";

export const CANDIDATE_STATUSES = ['Pending', 'Approved', 'Rejected'];

// A student standing in an election. An admin approves the candidacy before the
// student can be voted for.
const candidateSchema = new Schema({
    election: {
        type: Schema.Types.ObjectId,
        ref: 'Election',
        required: true,
    },

    student: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    agenda: {
        type: String,
        required: true,
        trim: true,
    },

    experience: {
        type: String,
        trim: true,
    },

    status: {
        type: String,
        enum: CANDIDATE_STATUSES,
        default: 'Pending',
    },

    // how many votes; who cast them is kept apart, in Vote
    votes: {
        type: Number,
        default: 0,
    },

    decidedBy: { type: Schema.Types.ObjectId, ref: 'User' },

}, { timestamps: true });

// a student stands once in an election
candidateSchema.index({ election: 1, student: 1 }, { unique: true });

export const Candidate = mongoose.model("Candidate", candidateSchema);
