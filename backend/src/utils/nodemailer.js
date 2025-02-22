import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, text) => {
    const transporter = nodemailer.createTransport({
        service: "gmail", // Use your email provider
        auth: {
            user: process.env.EMAIL_USER, // Admin email
            pass: process.env.EMAIL_PASS, // Admin email password (use environment variables)
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
    };

    return transporter.sendMail(mailOptions);
};


export default sendEmail; // ✅ Use `export default`
