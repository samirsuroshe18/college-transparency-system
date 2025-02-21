import { useEffect, useState } from "react";

const AdminApplications = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedApp, setSelectedApp] = useState(null);
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

            // Update local state
            setApplications((prev) =>
                prev.map((application) =>
                    application._id === app._id ? { ...application, reviewed: true } : application
                )
            );

            // Open modal
            setSelectedApp({ ...app, reviewed: true });
            setIsModalOpen(true);
        } catch (error) {
            console.error("Error updating review status:", error);
        }
    };


    const closeModal = () => {
        setSelectedApp(null);
        setIsModalOpen(false);
        setComment("");
    };

    const updateApplicationStatus = async (appId, status, comment = "") => {
        try {
            const adminId = "ADMIN_USER_ID"; // Replace with actual admin ID

            const response = await fetch(`${import.meta.env.VITE_DOMAIN}/api/v1/application/${appId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, adminId, comment }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || "Failed to update status");

            setApplications((prev) =>
                prev.map((app) => (app._id === appId ? { ...app, status } : app))
            );
        } catch (error) {
            console.error("Error updating application status:", error);
        }
    };

    const handleApprove = (appId) => {
        updateApplicationStatus(appId, "approved", ` Approved: ${comment}`);
    };

    const handleReject = (appId) => {
        if (!comment.trim()) {
            alert("Please provide a reason for rejection.");
            return;
        }
        updateApplicationStatus(appId, "rejected", ` Rejected: ${comment}`);
    };

    const handlePending = (appId) => updateApplicationStatus(appId, "pending", "Marked as pending");

    if (loading) return <p className="text-center text-gray-600">Loading...</p>;
    if (error) return <p className="text-center text-red-500">Error: {error}</p>;

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin - Applications</h1>
            <div className="overflow-x-auto">
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
                                    <span
                                        className={`px-2 py-1 rounded text-white 
                      ${app.status === "pending" ? "bg-yellow-500" : ""} 
                      ${app.status === "approved" ? "bg-green-500" : ""} 
                      ${app.status === "rejected" ? "bg-red-500" : ""}`}
                                    >
                                        {app.status}
                                    </span>
                                </td>
                                <td className="p-3 flex space-x-2">
                                    {/* <button
                    onClick={() => handleApprove(app._id)}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(app._id)}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handlePending(app._id)}
                    className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
                  >
                    Pending
                  </button> */}
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
            </div>

            {/* ✅ Modal for viewing application details */}
            {isModalOpen && selectedApp && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-lg w-full shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-800">{selectedApp.title}</h2>
                        <p className="mt-2 text-gray-600">{selectedApp.description}</p>
                        <p className="mt-2 text-gray-500">Category: {selectedApp.category}</p>
                        <p className="mt-2 text-gray-500">
                            Submitted By: {selectedApp.submittedBy?.name || "Unknown"}
                        </p>
                        <p className="mt-2 text-gray-500">Status: {selectedApp.status}</p>

                        <div className="mt-4">
                            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                                Comment
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

                        <div className="mt-6 flex justify-between space-x-4">
                            <button
                                onClick={() => {
                                    handleApprove(selectedApp._id);
                                    closeModal();
                                }}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                            >
                                Approve
                            </button>
                            <button
                                onClick={() => {
                                    handleReject(selectedApp._id);
                                    closeModal();
                                }}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                            >
                                Reject
                            </button>
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminApplications;
