import { Schema, model } from "mongoose";

const complaintSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User" }, // Hidden unless approved
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    createdAt: { type: Date, default: Date.now },
    votesForIdentityReveal: { type: Number, default: 0 }, // Number of votes to reveal identity
    reviewers: [{ type: Schema.Types.ObjectId, ref: "User" }], // Board members
});

export default model("Complaint", complaintSchema);
