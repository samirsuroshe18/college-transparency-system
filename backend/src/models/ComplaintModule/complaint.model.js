import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    isAnonymous: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // 🗳 Users who voted
    revealThreshold: { type: Number, default: 5 }, // 🎯 Number of votes needed to reveal
    isRevealed: { type: Boolean, default: false },// 🔓 Track if complaint is revealed
    imagevideo: { type: String, required: false }, // 🖼 Cloudinary image
    createdAt: { type: Date, default: Date.now }
});

const Complaint = mongoose.model("Complaint", complaintSchema);
export default Complaint;
