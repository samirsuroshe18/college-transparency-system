import Complaint from "../models/complaint.model.js";

export async function submitComplaint(req, res) {
    try {
        const { title, description } = req.body;
        const studentId = req.user.id; // Authenticated user ID

        // Create a new complaint
        const newComplaint = new Complaint({
            title,
            description,
            studentId, // Kept hidden unless identity reveal is voted for
        });

        await newComplaint.save();
        res.status(201).json({ message: "Complaint submitted successfully", complaint: newComplaint });
    } catch (error) {
        console.error("Error submitting complaint:", error);
        res.status(500).json({ message: "Error submitting complaint" });
    }
}
