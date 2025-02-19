import CandidateApplication from "../../models/electionModule/candidateApplication.model.js";
import { User } from "../../models/user.model.js";
import Election from "../../models/electionModule/election.model.js";


export const applyForElection = async (req, res) => {
  try {
    const { electionId } = req.params;
    const { userId, name, class: userClass, agenda, experience } = req.body;

    if (!userId || !name || !agenda) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 🔍 Check if the election exists
    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    // 🔍 Prevent duplicate applications
    const existingApplication = await CandidateApplication.findOne({ electionId, userId });
    if (existingApplication) {
      return res.status(400).json({ message: "You have already applied for this election." });
    }

    // 📝 Save new application
    const newApplication = new CandidateApplication({
      electionId,
      userId,
      name,
      class: userClass,
      agenda,
      experience,
      status: "Pending",
    });

    await newApplication.save();
    res.status(201).json({ message: "Application submitted. Awaiting admin approval.", application: newApplication });
  } catch (error) {
    console.error("Error applying as candidate:", error);
    res.status(500).json({ message: "Server Error" });
  }
};




export const getApplications = async (req, res) => {
  try {
    const { electionId } = req.params;

    const applications = await CandidateApplication.find({ electionId })
      .populate("userId", "email profilePic rollNo");

    res.json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const application = await CandidateApplication.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json({ message: `Application ${status}`, application });
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
