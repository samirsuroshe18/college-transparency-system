import Application from "../../models/candidateApplication.model.js";
import User from "../models/User.js";
import Election from "../../models/election.model.js";


export const applyForElection = async (req, res) => {
  try {
      const { electionId } = req.params;
      const { name } = req.body; // ✅ Extract name from request body

      console.log("Received electionId:", electionId);
      console.log("Received name:", name);

      if (!name) {
          return res.status(400).json({ message: "Candidate name is required" });
      }

      if (!mongoose.Types.ObjectId.isValid(electionId)) {
          return res.status(400).json({ message: "Invalid election ID format" });
      }

      const election = await Election.findById(electionId);
      if (!election) {
          return res.status(404).json({ message: "Election not found" });
      }

      const newCandidate = new Candidate({
          name,
          electionId
      });

      await newCandidate.save();
      res.status(201).json({ message: "Candidate applied successfully!", candidate: newCandidate });
  } catch (error) {
      console.error("Error applying as candidate:", error);
      res.status(500).json({ message: "Server Error" });
  }
};



// Get Applications for a Specific Election
export const getApplications = async (req, res) => {
  try {
    const { electionId } = req.params;
    const applications = await Application.find({ electionId }).populate("userId", "email profilePic rollNo");
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Approve or Reject Application
export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const application = await Application.findByIdAndUpdate(id, { status }, { new: true });
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
