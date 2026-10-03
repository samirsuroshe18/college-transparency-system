import mongoose, { Schema } from "mongoose";

// That a student voted in an election, and for whom. It exists to allow one vote per
// student; it is never sent to anyone.
const voteSchema = new Schema({
    election: {
        type: Schema.Types.ObjectId,
        ref: 'Election',
        required: true,
    },

    voter: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    candidate: {
        type: Schema.Types.ObjectId,
        ref: 'Candidate',
        required: true,
    },

}, { timestamps: true });

// one vote per student per election, enforced by the database
voteSchema.index({ election: 1, voter: 1 }, { unique: true });

export const Vote = mongoose.model("Vote", voteSchema);
