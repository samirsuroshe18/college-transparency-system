import Candidate from "../../models/electionModule/candidate.model.js";
import Vote from "../../models/electionModule/vote.model.js";

// Cast a vote
export const castVote = async (req, res) => {
  try {
    const { userId, electionId, candidateId } = req.body;

    // Check if the user already voted
    const existingVote = await Vote.findOne({ userId, electionId });
    if (existingVote) return res.status(400).json({ error: "User has already voted" });

    // Record vote
    const vote = new Vote({ userId, electionId, candidateId });
    await vote.save();

    // Increment candidate's vote count
    await Candidate.findByIdAndUpdate(candidateId, { $inc: { votes: 1 } });

    res.status(201).json({ message: "Vote cast successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Get results for an election
export const getElectionResults = async (req, res) => {
  try {
    const { electionId } = req.params;
    const candidates = await Candidate.find({ electionId }).sort({ votes: -1 });

    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch results" });
  }
};
