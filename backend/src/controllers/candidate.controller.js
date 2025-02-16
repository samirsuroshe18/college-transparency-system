import Candidate from "../models/candidate.model.js";
import Election from "../models/election.model.js";

// Add a candidate to an election (Admin Only)
export const addCandidate = async (req, res) => {
  try {
    const { electionId } = req.params;
    const { name, agenda } = req.body;

    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ error: "Election not found" });

    const candidate = new Candidate({ electionId, name, agenda });
    await candidate.save();

    res.status(201).json(candidate);
  } catch (error) {
    res.status(500).json({ error: "Failed to add candidate" });
  }
};

// Get all candidates for a specific election
export const getCandidates = async (req, res) => {
  try {
    const { electionId } = req.params;
    const candidates = await Candidate.find({ electionId });

    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch candidates" });
  }
};

// Get a specific candidate
export const getCandidateById = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const candidate = await Candidate.findById(candidateId);

    if (!candidate) return res.status(404).json({ error: "Candidate not found" });


    res.json(candidate);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
