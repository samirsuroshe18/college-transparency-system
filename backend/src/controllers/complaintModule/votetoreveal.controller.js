import Complaint from "../../models/ComplaintModule/complaint.model.js";
export async function voteToReveal(req, res) {
    try {
        const { complaintId } = req.params;

        const complaint = await Complaint.findById(complaintId);
        if (!complaint || !complaint.isAnonymous) {
            return res.status(404).json({ message: "Anonymous complaint not found." });
        }

        // Increase vote count
        complaint.votesToReveal += 1;

        // Reveal if votes meet threshold
        if (complaint.votesToReveal >= complaint.revealThreshold) {
            complaint.isAnonymous = false; // Reveal
        }

        await complaint.save();

        res.status(200).json({
            message: complaint.isAnonymous
                ? "Vote recorded."
                : "Complaint has been revealed.",
            votes: complaint.votesToReveal
        });

    } catch (error) {
        console.error("Error voting to reveal:", error);
        res.status(500).json({ message: "Error processing vote" });
    }
}
