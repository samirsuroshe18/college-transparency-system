import Application from "../models/candidateApplication.model.js";
import User from "../models/User.js";

// Apply for Election
export const applyForElection = async (req, res) => {
  try {
    const { electionId, userId } = req.body;
    const application = new Application({ electionId, userId });
    await application.save();
    res.status(201).json(application);
  } catch (error) {
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
