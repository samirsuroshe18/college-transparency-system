import mongoose from "mongoose";

const VoteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  electionId: { type: mongoose.Schema.Types.ObjectId, ref: "Election", required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true },
  division: { type: String, required: true },
});

const Vote = mongoose.model("Vote", VoteSchema);
export default Vote;
