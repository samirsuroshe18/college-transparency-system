import mongoose from "mongoose";

const ApplicationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
        type: String,
        enum: ["event", "budget", "sponsorship"],
        required: true
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    comment: { type: String, default: "Under Review" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Application = mongoose.model("Application", ApplicationSchema);
export default Application;
