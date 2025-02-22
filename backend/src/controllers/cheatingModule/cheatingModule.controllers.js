import Cheating from "../../models/Cheating/cheating.model.js";
import User from '../../models/user.model.js'; // Corrected import

// 📋 Add a new cheating incident
export const addCheatingIncident = async (req, res) => {
    try {
        const { studentId, reason, proof } = req.body;

        // Validate input
        if (!studentId || !reason || !proof) {
            return res.status(400).json({ message: "All fields are required (studentId, reason, proof)" });
        }

        // Validate student existence
        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Create new cheating report
        const cheatingReport = new Cheating({
            student: studentId,
            reason,
            proof,
        });

        await cheatingReport.save();

        res.status(201).json({
            message: "Cheating incident reported successfully",
            cheatingReport,
        });
    } catch (error) {
        console.error("❌ Error adding cheating incident:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// 📄 Get all cheating incidents with student details
export const getAllCheatingIncidents = async (req, res) => {
    try {
        const cheatingReports = await Cheating.find()
            .populate("student", "name rollNumber classDivision department profilePic") // Updated field names
            .sort({ reportedAt: -1 }); // Latest first

        res.status(200).json(cheatingReports);
    } catch (error) {
        console.error("❌ Error fetching cheating incidents:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// ❌ Delete a cheating incident by ID
export const deleteCheatingIncident = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const deletedReport = await Cheating.findByIdAndDelete(id);

        if (!deletedReport) {
            return res.status(404).json({ message: "Cheating incident not found" });
        }

        res.status(200).json({ message: "Cheating incident deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting cheating incident:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};


// 🔍 Get a single cheating incident by ID
export const getCheatingIncidentById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const cheatingReport = await Cheating.findById(id)
            .populate("student", "name rollNumber classDivision department profilePic");

        if (!cheatingReport) {
            return res.status(404).json({ message: "Cheating incident not found" });
        }

        res.status(200).json(cheatingReport);
    } catch (error) {
        console.error("❌ Error fetching cheating incident:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
