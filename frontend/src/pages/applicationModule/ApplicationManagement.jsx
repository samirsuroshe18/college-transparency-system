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
    const [activeTab, setActiveTab] = useState('submit'); // Add state for active tab
    const [newApplication, setNewApplication] = useState({
        title: "",
        description: "",
        category: "event",
        submittedBy: "USER_ID_PLACEHOLDER", // Replace with actual user ID if available
    });
    const [allApplications, setAllApplications] = useState({
        pending: [],
        approved: [],
        rejected: []
    });

    useEffect(() => {
        fetchAllApplications(); // Fetch all applications on mount
    }, []);

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

    // Add new function to fetch all applications
    const fetchAllApplications = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_DOMAIN}/api/v1/application`, {
                withCredentials: true,
            });
            // Categorize applications
            const categorizedApps = {
                pending: response.data.filter(app => app.status === 'pending'),
                approved: response.data.filter(app => app.status === 'approved'),
                rejected: response.data.filter(app => app.status === 'rejected')
            };
            setAllApplications(categorizedApps);
        } catch (error) {
            dispatch(showNotificationWithTimeout({show:true,type:"error",message:handleAxiosError(error)}));
        }
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

            {/* Tab Navigation */}
            <div className="flex mb-6 border-b">
                <button 
                    className={`py-2 px-4 mr-2 ${activeTab === 'submit' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('submit')}
                >
                    Submit Application
                </button>
                <button 
                    className={`py-2 px-4 ${activeTab === 'view' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                    onClick={() => {
                        setActiveTab('view');
                        fetchApplications(); // Fetch current user applications
                        fetchAllApplications(); // Fetch all applications
                    }}
                >
                    View Applications
                </button>
            </div>

            {/* Submit Application Form */}
            {activeTab === 'submit' && (
                <div className="max-w-2xl mx-auto">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mb-6">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Submit New Application</h2>
                        <p className="text-gray-600">Please fill out the form below with your application details.</p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4">
                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                                Title
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={newApplication.title}
                                onChange={handleChange}
                                className="shadow-sm appearance-none border border-gray-200 rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
                                required
                                placeholder="Enter application title"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={newApplication.description}
                                onChange={handleChange}
                                className="shadow-sm appearance-none border border-gray-200 rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
                                rows="4"
                                required
                                placeholder="Describe your application in detail"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                                Category
                            </label>
                            <select
                                name="category"
                                value={newApplication.category}
                                onChange={handleChange}
                                className="shadow-sm appearance-none border border-gray-200 rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
                            >
                                <option value="event">Event</option>
                                <option value="budget">Budget</option>
                                <option value="sponsorship">Sponsorship</option>
                            </select>
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="documents">
                                Upload Documents
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition duration-200">
                                <input
                                    type="file"
                                    name="documents"
                                    onChange={handleChange}
                                    className="hidden"
                                    multiple
                                    accept=".pdf,.doc,.docx"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <div className="text-gray-500">
                                        <i className="fas fa-cloud-upload-alt text-3xl mb-2"></i>
                                        <p>Drag and drop your files here or click to browse</p>
                                        <p className="text-sm text-gray-400 mt-1">Accepted formats: PDF, DOC, DOCX</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center justify-end">
                            <button
                                type="submit"
                                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transform transition hover:scale-105 duration-200 ease-in-out"
                            >
                                Submit Application
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* View Applications */}
            {activeTab === 'view' && (
                <div className="mt-6">
                    {/* My Applications Section */}
                    <div className="bg-gray-100 p-6 rounded-lg shadow-md mb-8">
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

                    {/* All Applications Section */}
                    <div className="bg-gray-100 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4">All Applications</h2>
                        
                        {/* Pending Applications */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold mb-3 text-yellow-600">Pending Applications</h3>
                            {allApplications.pending.length === 0 ? (
                                <p>No pending applications</p>
                            ) : (
                                <ul>
                                    {allApplications.pending.map((app) => (
                                        <li key={app._id} className="mb-4 p-4 bg-white rounded shadow border-l-4 border-yellow-400">
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

                        {/* Approved Applications */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold mb-3 text-green-600">Approved Applications</h3>
                            {allApplications.approved.length === 0 ? (
                                <p>No approved applications</p>
                            ) : (
                                <ul>
                                    {allApplications.approved.map((app) => (
                                        <li key={app._id} className="mb-4 p-4 bg-white rounded shadow border-l-4 border-green-400">
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

                        {/* Rejected Applications */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3 text-red-600">Rejected Applications</h3>
                            {allApplications.rejected.length === 0 ? (
                                <p>No rejected applications</p>
                            ) : (
                                <ul>
                                    {allApplications.rejected.map((app) => (
                                        <li key={app._id} className="mb-4 p-4 bg-white rounded shadow border-l-4 border-red-400">
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationManagement;
