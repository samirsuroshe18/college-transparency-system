import express from "express";
import { sendEmail } from "../utils/nodemailer.js"; // Ensure this is correctly implemented

const router = express.Router();

router.post("/send-email", async (req, res) => {
    try {
        const { to, subject, text } = req.body;

        if (!to || !subject || !text) {
            return res.status(400).json({ message: "Missing email parameters" });
        }

        await sendEmail(to, subject, text);
        res.json({ message: "Email sent successfully" });

    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ message: "Email sending failed", error: error.message });
    }
});

export default router;
