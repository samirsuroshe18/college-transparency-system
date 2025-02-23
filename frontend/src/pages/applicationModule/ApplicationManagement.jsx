import React, { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { showNotificationWithTimeout } from "../../redux/slices/notificationSlice";
import { handleAxiosError } from "../../utils/handleAxiosError";

const ApplicationManagement = () => {
    const dispatch = useDispatch();
    const [applications, setApplications] = useState([]);
    const [message, setMessage] = useState("");
    const [showPopup, setShowPopup] = useState(false);
    const [showApplications, setShowApplications] = useState(false);
    const [newApplication, setNewApplication] = useState({
        title: "",
        description: "",
        category: "event",
        submittedBy: "USER_ID_PLACEHOLDER", // Replace with actual user ID if available
    });

    // Fetch applications from the backend
    const fetchApplications = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_DOMAIN}/api/v1/application/get-specific-user`, {
                withCredentials: true, // Ensure cookies are sent if needed
            });
            dispatch(showNotificationWithTimeout({show:true,type:"success",message:"fetched"}));
            setApplications(response.data);
            setShowApplications(true);
        } catch (error) {
            dispatch(showNotificationWithTimeout({show:true,type:"error",message:handleAxiosError(error)}));
            setMessage("Failed to load applications ❌");
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 3000);
        }

        const user=useSelector(state=>state.auth.userData);
        console.log(user);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("Submitting...");

        try {
            // Create FormData object for multipart/form-data
            const formData = new FormData();

            // Append form fields
            formData.append("title", newApplication.title);
            formData.append("description", newApplication.description);
            formData.append("category", newApplication.category);
            formData.append("submittedBy", newApplication.submittedBy);

            // If you're handling file uploads (e.g., images or documents)
            if (newApplication.file) {
                formData.append("file", newApplication.file);
            }

            // Send POST request with multipart/form-data
            const response = await axios.post(
                `${import.meta.env.VITE_DOMAIN}/api/v1/application/create`,
                formData,
                {
                    withCredentials: true, // For cookies and sessions
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            console.log(response.data);
            setMessage("Application submitted successfully ✅");
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 3000);

            // Reset form
            setNewApplication({
                title: "",
                description: "",
                category: "event",
                submittedBy: "USER_ID_PLACEHOLDER",
                file: null // Reset file field if applicable
            });
        } catch (error) {
            console.error("Error submitting application:", error);
            setMessage("Error submitting application ❌");
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 3000);
        }
    };


    // Handle input change
    const handleChange = (e) => {
        setNewApplication({
            ...newApplication,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="container mx-auto p-4 relative">
            {showPopup && (
                <div className="fixed top-5 right-5 bg-white shadow-lg rounded-lg p-4 z-50 animate-fade-in">
                    <div className={`${message.includes("✅") ? "text-green-600" : "text-red-600"} font-semibold`}>
                        {message}
                    </div>
                </div>
            )}

            <h1 className="text-2xl font-bold mb-6">Application Management</h1>

            <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                            Title
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={newApplication.title}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={newApplication.description}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                            rows="4"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                            Category
                        </label>
                        <select
                            name="category"
                            value={newApplication.category}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                        >
                            <option value="event">Event</option>
                            <option value="budget">Budget</option>
                            <option value="sponsorship">Sponsorship</option>
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="documents">
                            Upload Documents
                        </label>
                        <input
                            type="file"
                            name="documents"
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                            multiple
                            accept=".pdf,.doc,.docx"
                        />
                        <p className="text-sm text-gray-500 mt-1">Accepted formats: PDF, DOC, DOCX</p>
                    </div>

                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Submit Application
                        </button>
                    </div>
                </form>
            </div>

            {/* Fetch Applications Button */}
            <div className="text-center mt-6">
                <button
                    onClick={fetchApplications}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                    Show My Applications
                </button>
            </div>

            {/* Applications List */}
            {showApplications && (
                <div className="mt-6 bg-gray-100 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">My Applications</h2>
                    {applications.length === 0 ? (
                        <p>No applications found.</p>
                    ) : (
                        <ul>
                            {applications.map((app) => (
                                <li key={app._id} className="mb-4 p-4 bg-white rounded shadow">
                                    <h3 className="text-lg font-semibold">{app.title}</h3>
                                    <p>{app.description}</p>
                                    <p className="text-gray-600">Category: {app.category}</p>
                                    <p className="text-gray-700">Status: {app.status}</p>
                                    {app.comment && (
                                        <p className="mt-2 text-gray-700">
                                            <span className="font-semibold">Admin Comment:</span> {app.comment}
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default ApplicationManagement;
