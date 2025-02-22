import Application from "../../models/applicationModel/application.model.js";
import  sendEmail  from "../../utils/nodemailer.js"; // ✅ Use import instead of require



// Create Application
export const createApplication = async (req, res) => {
    try {
        const { title, description, category } = req.body;

        if (!title || !description || !category ) {
            return res.status(400).json({ message: "All fields are required" });
        }
        // TODO: convert string to moongose object id and then place in the submitttedBy
        const newApplication = new Application({ title, description, category, submittedBy:req.user._id }); //submiitedBY:
        await newApplication.save();

        res.status(201).json({
            message: "Application created successfully",
            application: newApplication
        });
    } catch (error) {
        console.error("Error creating application:", error);
        res.status(500).json({ message: error.message || "Server Error" });
    }
};



// Get All Applications
export const getApplications = async (req, res) => {
    try {
        const applications = await Application.find();
        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: "Error fetching applications" });
    }
};

// Get a Single Application by ID
export const getApplicationById = async (req, res) => {
    try {
        const application = await Application.find({submittedBy:req.user._id}).populate("submittedBy", "name email");
        if (!application) return res.status(404).json({ message: "Application not found" });

        res.json(application);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

export const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminId, comment } = req.body;

        // ✅ Validate input
        if (!status || !adminId) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        if (!["approved", "rejected", "pending"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid application ID format" });
        }

        // ✅ Find application
        const application = await Application.findById(id).populate("submittedBy"); // Ensure user details are available
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        // ✅ Get user email
        const userEmail = application.submittedBy.email; // ✅ Ensure submittedBy contains user info

        // ✅ Update application
        application.comment = application.comment
            ? `${application.comment}\nAdmin: ${comment}`
            : `Admin: ${comment}`;
        application.status = status;
        await application.save();

        // ✅ Send email notification
        if (userEmail) {
            let emailSubject = `Your Application Status: ${status.toUpperCase()}`;
            let emailMessage = `Hello,\n\nYour application titled "${application.title}" has been ${status}.\n\nAdmin Comment: ${comment}\n\nThank you.`;

            sendEmail(userEmail, emailSubject, emailMessage); // 📩 Send email
        } else {
            console.warn("🚨 User email not found for sending notification.");
        }

        // // ✅ Log decision
        // const approvalRecord = new Approval({
        //     applicationId: id,
        //     approvedBy: adminId,
        //     decision: status,
        //     comment,
        // });

        // await approvalRecord.save();

        // res.json({
        //     message: "Application status updated & email sent",
        //     application,
        //     approval: approvalRecord,
        // });
    } catch (error) {
        console.error("❌ Error updating application status:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Update Application Review Status
export const updateApplicationReviewStatus = async (req, res) => {
    try {
        const { reviewed, comment } = req.body;

        const application = await Application.findByIdAndUpdate(
            req.params.id,
            { reviewed, comment },
            { new: true }
        );

        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        res.status(200).json({ message: "Application updated", application });
    } catch (error) {
        res.status(500).json({ message: "Error updating review status", error });
    }
};
