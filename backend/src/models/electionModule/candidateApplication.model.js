import mongoose from "mongoose";

const candidateApplicationSchema = new mongoose.Schema({
  electionId: { type: mongoose.Schema.Types.ObjectId, ref: "Election", required: true },
  userId: { type: String },
  name: { type: String, required: true }, 
  class: { type: String},
  agenda: { type: String, required: true },
  experience: { type: String },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Approved" },
});

const Application = mongoose.model("CandidateApplication", candidateApplicationSchema);
export default Application;
