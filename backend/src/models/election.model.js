import mongoose, { Schema } from "mongoose";

const electionSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },

    description: {
        type: String,
        trim: true,
    },

    // students apply as candidates until this moment; voting starts with it
    applicationDeadline: {
        type: Date,
        required: true,
    },

    // voting runs to the end of this day
    votingDay: {
        type: Date,
        required: true,
    },

    // who may stand and vote; a rule that is not set does not limit anyone
    eligibility: new Schema({
        department: { type: String, trim: true },
        year: { type: String, trim: true },
        division: { type: String, trim: true },
    }, { _id: false }),

    // set when an admin ends the election before its voting day is over
    endedAt: Date,
    endedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },

    // part of the sample college
    isDemo: {
        type: Boolean,
        default: false,
    },

}, { timestamps: true });

export const Election = mongoose.model("Election", electionSchema);
