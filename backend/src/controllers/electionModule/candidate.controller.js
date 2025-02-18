import Election from "../../models/electionModule/election.model.js";
import Candidate from "../../models/electionModule/candidate.model.js";

import mongoose from "mongoose";

export const addCandidate = async (req, res) => {
    try {
        const { name, className, agenda, experience } = req.body;
        const { electionId } = req.params;
        console.log("Received electionId:", electionId);

        // ✅ Validate MongoDB ObjectId format
        if (!mongoose.Types.ObjectId.isValid(electionId)) {
            return res.status(400).json({ message: "Invalid election ID format" });
        }

        // ✅ Check if the election exists
        const election = await Election.findById(electionId);
        if (!election) {
            return res.status(404).json({ message: "Election not found" });
        }

        // ✅ Create new candidate
        const newCandidate = new Candidate({ name, className, agenda, experience, electionId });
        await newCandidate.save();

        res.status(201).json({ message: "Candidate applied successfully!", candidate: newCandidate });
    } catch (error) {
        console.error("Error applying as candidate:", error);
        res.status(500).json({ message: "Server Error" });
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
