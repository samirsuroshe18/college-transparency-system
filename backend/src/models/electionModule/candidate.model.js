import mongoose from "mongoose";

const CandidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  electionId: { type: mongoose.Schema.Types.ObjectId, ref: "Election", required: true },
  votes: { type: Number, default: 0 },
});

const Candidate = mongoose.models.Candidate || mongoose.model("Candidate", CandidateSchema);

export default Candidate;
