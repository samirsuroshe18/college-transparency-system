import Application from "../../models/applicationModel/application.model.js";

// Create Application
export const createApplication = async (req, res) => {
    console.log("Request Body:", req.body);
    try {
        const { title, description, category, submittedBy } = req.body;

        if (!title || !description || !category || !submittedBy) {
            return res.status(400).json({ message: "All fields are required" });
        }
        // TODO: convert string to moongose object id and then place in the submitttedBy
        const newApplication = new Application({ title, description, category, submittedBy }); //submiitedBY:
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
        const { id } = req.params;
        const application = await Application.findById(id).populate("submittedBy", "name email");

        if (!application) return res.status(404).json({ message: "Application not found" });

        res.json(application);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// Update Application Status
export const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminId, comment } = req.body;

        // ✅ 1. Validate input
        if (!status || !adminId) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        if (!["approved", "rejected", "pending"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        // ✅ 2. Validate application ID format (Prevent MongoDB error)
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid application ID format" });
        }

        // ✅ 3. Find application
        const application = await Application.findById(id);
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        // ✅ 4. Update status and append comment
        application.comment = application.comment
            ? `${application.comment}\nAdmin: ${comment}`
            : `Admin: ${comment}`;

        application.status = status;
        await application.save();

        // ✅ 5. Log approval/rejection in Approval Model
        const approvalRecord = new Approval({
            applicationId: id,
            approvedBy: adminId,
            decision: status,
            comment,
        });

        await approvalRecord.save();

        res.json({
            message: "Application status updated",
            application,
            approval: approvalRecord,
        });
    } catch (error) {
        console.error("Error updating application status:", error);
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
