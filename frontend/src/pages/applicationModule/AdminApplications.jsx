import { useEffect, useState } from "react";
import { useSelector } from "react-redux";


const AdminApplications = () => {
    const user = useSelector((state) => state.auth.userData); // Add user selector here
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedApp, setSelectedApp] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [comment, setComment] = useState("");

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_DOMAIN}/api/v1/application`);
            const data = await response.json();
            setApplications(data);
            setLoading(false);
        } catch (err) {
            setError("Error fetching applications");
            setLoading(false);
        }
    };

    const openModal = async (app) => {
        try {
            // Send request to update review status when the modal is opened
            const response = await fetch(`${import.meta.env.VITE_DOMAIN}/api/v1/application/${app._id}/review`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reviewed: true, comment: "Viewed by Admin" }),
            });
    
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to update review status");
    
            // Fetch user details for the application
            const userId = app.userId || app.submittedBy; 
            if (!userId) {
                console.warn("User ID is missing for this application.");
                return;
            }
    
            const userResponse = await fetch(`${import.meta.env.VITE_DOMAIN}/api/v1/user/user/${userId}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });
    
            const userData = await userResponse.json();
            if (!userResponse.ok) throw new Error(userData.message || "Failed to fetch user details");
    
            console.log("Fetched User Data:", userData);
    
            // ✅ Set state in one step and open modal immediately
            setSelectedApp({
                ...app,
                reviewed: true,
                userDetails: {
                    name: userData.data.name,
                    email: userData.data.email,
                    phone: userData.data.phoneNumber || "N/A",
                    address: userData.data.address || "N/A",
                    role: userData.data.role || "N/A",
                    department: userData.data.department || "N/A",
                    employeeId: userData.data.employeeId || "N/A"
                }
            });
    
            setIsModalOpen(true); // ✅ Open modal immediately
    
        } catch (error) {
            console.error("Error opening modal:", error);
        }
    };
    

    const closeModal = () => {
        setSelectedApp(null);
        setIsModalOpen(false);
        setComment("");
    };

    const updateApplicationStatus = async (appId, status, comment = "") => {
        try {
            const adminId = user?._id; // ✅ Ensure adminId is set
            const recipientEmail = selectedApp?.userDetails?.email; // ✅ Get recipient email
    
            if (!recipientEmail) {
                console.error("Recipient email is missing");
                return;
            }
    
            // ✅ Update application status in database
            const response = await fetch(
                `${import.meta.env.VITE_DOMAIN}/api/v1/application/${appId}/status`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status, adminId, comment }),
                }
            );
    
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to update status");
    
            // ✅ Send email notification
            const emailResponse = await fetch(
                `${import.meta.env.VITE_DOMAIN}/api/v1/send-email`, // Update this with your actual email API route
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        to: recipientEmail,
                        subject: `Application Status Update: ${status}`,
                        text: `Dear ${selectedApp.userDetails.name},\n\nYour application status has been updated to: ${status}.\n\nComment: ${comment}\n\nRegards,\nAdmin`,
                    }),
                }
            );
    
            const emailData = await emailResponse.json();
            if (!emailResponse.ok) throw new Error(emailData.message || "Failed to send email");
    
            console.log("Email sent successfully:", emailData);
    
            // ✅ Update UI
            setApplications((prev) =>
                prev.map((app) => (app._id === appId ? { ...app, status } : app))
            );
        } catch (error) {
            console.error("Error updating application status:", error);
        }
    };
    

    const handleApprove = (appId) => {
        if (!user?._id) {
            console.error("Admin user ID is missing");
            return;
        }
        updateApplicationStatus(appId, "approved", `Approved: ${comment}`);
    };
    
    const handleReject = (appId) => {
        if (!comment.trim()) {
            alert("Please provide a reason for rejection.");
            return;
        }
        if (!user?._id) {
            console.error("Admin user ID is missing");
            return;
        }
        updateApplicationStatus(appId, "rejected", `Rejected: ${comment}`);
    };
    
    const handlePending = (appId) => updateApplicationStatus(appId, "pending", "Marked as pending");

    // Add these helper functions after the existing state declarations
    const pendingApplications = applications.filter(app => app.status === "pending");
    const approvedApplications = applications.filter(app => app.status === "approved");
    const rejectedApplications = applications.filter(app => app.status === "rejected");

    if (loading) return <p className="text-center text-gray-600">Loading...</p>;
    if (error) return <p className="text-center text-red-500">Error: {error}</p>;

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin - Applications</h1>
            
            {/* Pending Applications */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-yellow-600 mb-4">Pending Applications ({pendingApplications.length})</h2>
                <div className="overflow-x-auto">
                    <ApplicationTable applications={pendingApplications} openModal={openModal} />
                </div>
            </div>

            {/* Approved Applications */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-green-600 mb-4">Approved Applications ({approvedApplications.length})</h2>
                <div className="overflow-x-auto">
                    <ApplicationTable applications={approvedApplications} openModal={openModal} />
                </div>
            </div>

            {/* Rejected Applications */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-red-600 mb-4">Rejected Applications ({rejectedApplications.length})</h2>
                <div className="overflow-x-auto">
                    <ApplicationTable applications={rejectedApplications} openModal={openModal} />
                </div>
            </div>

            {/* ✅ Modal for viewing application details */}
{isModalOpen && selectedApp && (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-lg w-full shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Application Details</h2>

            {/* ✅ Application Information */}
            <div className="mb-4 border-b pb-3">
                <h3 className="text-lg font-semibold text-gray-700">📄 Application Info</h3>
                <p className="text-gray-600"><strong>Title:</strong> {selectedApp.title}</p>
                <p className="text-gray-600"><strong>Description:</strong> {selectedApp.description}</p>
                <p className="text-gray-600"><strong>Category:</strong> {selectedApp.category}</p>
                <p className="text-gray-600"><strong>Status:</strong> 
                    <span className={`px-2 py-1 rounded text-white ml-2
                        ${selectedApp.status === "pending" ? "bg-yellow-500" : ""} 
                        ${selectedApp.status === "approved" ? "bg-green-500" : ""} 
                        ${selectedApp.status === "rejected" ? "bg-red-500" : ""}`}>
                        {selectedApp.status}
                    </span>
                </p>
            </div>

            {/* ✅ User Information */}
            {selectedApp.userDetails && (
                <div className="mb-4 border-b pb-3">
                    <h3 className="text-lg font-semibold text-gray-700">👤 User Details</h3>
                    <p className="text-gray-600"><strong>Name:</strong> {selectedApp.userDetails.name || "N/A"}</p>
                    <p className="text-gray-600"><strong>Email:</strong> {selectedApp.userDetails.email || "N/A"}</p>
                    <p className="text-gray-600"><strong>Phone:</strong> {selectedApp.userDetails.phone || "N/A"}</p>
                    <p className="text-gray-600"><strong>Address:</strong> {selectedApp.userDetails.address || "N/A"}</p>
                </div>
            )}

            {/* ✅ Comment Input */}
            <div className="mb-4">
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Comment
                </label>
                <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Add your comment here..."
                />
            </div>

            {/* ✅ Action Buttons */}
            <div className="mt-6 flex justify-between space-x-4">
                <button
                    onClick={() => {
                        handleApprove(selectedApp._id);
                        closeModal();
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                >
                    Approve ✅
                </button>
                <button
                    onClick={() => {
                        handleReject(selectedApp._id);
                        closeModal();
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                    Reject ❌
                </button>
                <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
                >
                    Close ❎
                </button>
            </div>
        </div>
    </div>
)}

        </div>
    );
};

// Add this new component before the export
const ApplicationTable = ({ applications, openModal }) => (
    <table className="w-full border border-gray-300 rounded-lg">
        <thead className="bg-gray-200">
            <tr>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
            </tr>
        </thead>
        <tbody>
            {applications.map((app) => (
                <tr key={app._id} className="border-t border-gray-300">
                    <td className="p-3">{app.title}</td>
                    <td className="p-3">{app.category}</td>
                    <td className="p-3">
                        <span className={`px-2 py-1 rounded text-white 
                            ${app.status === "pending" ? "bg-yellow-500" : ""} 
                            ${app.status === "approved" ? "bg-green-500" : ""} 
                            ${app.status === "rejected" ? "bg-red-500" : ""}`}>
                            {app.status}
                        </span>
                    </td>
                    <td className="p-3">
                        <button
                            onClick={() => openModal(app)}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                        >
                            View
                        </button>
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
);

export default AdminApplications;
