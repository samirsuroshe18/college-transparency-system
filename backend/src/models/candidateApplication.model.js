import mongoose from "mongoose";

const ApplicationSchema = new mongoose.Schema({
  electionId: { type: mongoose.Schema.Types.ObjectId, ref: "Election", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  class: { type: String, required: true },
  agenda: { type: String, required: true },
  experience: { type: String },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
});

const Application = mongoose.model("Application", ApplicationSchema);
export default Application;
