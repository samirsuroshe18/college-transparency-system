import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { ThumbsUp, ThumbsDown } from "lucide-react";

const StudentComplaint = () => {
  const [activeTab, setActiveTab] = useState("submit");
  const [complaints, setComplaints] = useState([]);
  const [newComplaint, setNewComplaint] = useState({
    title: "",
    description: "",
    isAnonymous: false,
    document: null,
  });
  const [userId, setUserId] = useState("");
  const [currentUser, setCurrentUser] = useState({ id: "" }); // You'll need to populate this with actual user data
  const [animatingButton, setAnimatingButton] = useState(null);

  // Fetch complaints from backend
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/api/v1/complaints/all"
        );
        setComplaints(response.data);
      } catch (error) {
        console.error("Error fetching complaints:", error);
      }
    };

    if (activeTab === "view") {
      fetchComplaints();
    }
  }, [activeTab]);

  const handleVote = async (complaintId, voteType) => {
    try {
        const response = await axios.post(
            `http://localhost:8000/api/v1/complaints/vote/${complaintId}`,
            { voteType, userId: currentUser.id },
            { withCredentials: true }
        );
        
        // Update complaints state with the new votes
        if (response.data.success) {
            setComplaints(complaints.map(complaint => {
                if (complaint._id === complaintId) {
                    return {
                        ...complaint,
                        likes: response.data.complaint.likes || [],
                        dislikes: response.data.complaint.dislikes || []
                    };
                }
                return complaint;
            }));
        }
    } catch (error) {
        console.error("Error updating vote:", error);
        alert("Failed to update vote.");
    }
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Get the user's name (you'll need to implement this based on your auth system)

      // Create FormData object to handle file upload
      const formData = new FormData();
      formData.append("title", newComplaint.title);
      formData.append("description", newComplaint.description);
      formData.append("isAnonymous", newComplaint.isAnonymous);

      // Append the file if it exists
      if (newComplaint.document) {
        formData.append("document", newComplaint.document);
      }

      const response = await axios.post(
        "http://localhost:8000/api/v1/complaints/submit",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        alert("Complaint submitted successfully!");
        // Reset form
        setNewComplaint({
          title: "",
          description: "",
          isAnonymous: false,
          document: null,
        });
      }
    } catch (error) {
      console.error("Error details:", error.response?.data);
      alert(
        error.response?.data?.error ||
          "Error submitting complaint. Please check all required fields."
      );
    }
  };

  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setNewComplaint({
      ...newComplaint,
      [e.target.name]: value,
    });
  };

  const handleFileChange = (e) => {
    setNewComplaint({
      ...newComplaint,
      document: e.target.files[0],
    });
  };

  return (
    <div className="container mx-auto p-4 relative">
      {/* Tab Navigation */}
      <div className="flex mb-6 border-b">
        <button
          className={`py-2 px-4 mr-2 ${activeTab === "submit" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`}
          onClick={() => setActiveTab("submit")}
        >
          Submit Complaint
        </button>
        <button
          className={`py-2 px-4 ${activeTab === "view" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`}
          onClick={() => setActiveTab("view")}
        >
          View Complaints
        </button>
      </div>

      {/* Submit Complaint Form */}
      {activeTab === "submit" && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Submit New Complaint
            </h2>
            <p className="text-gray-600">
              Please provide details about your complaint below.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4"
          >
            <div className="mb-6">
              <Label
                htmlFor="title"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Title
              </Label>
              <Input
                type="text"
                name="title"
                value={newComplaint.title}
                onChange={handleChange}
                className="shadow-sm appearance-none border border-gray-200 rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
                required
                placeholder="Enter complaint title"
              />
            </div>

            <div className="mb-6">
              <Label
                htmlFor="description"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Description
              </Label>
              <textarea
                name="description"
                value={newComplaint.description}
                onChange={handleChange}
                className="shadow-sm appearance-none border border-gray-200 rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
                rows="4"
                required
                placeholder="Describe your complaint in detail"
              />
            </div>

            <div className="mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAnonymous"
                  name="isAnonymous"
                  checked={newComplaint.isAnonymous}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label
                  htmlFor="isAnonymous"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Submit Anonymously
                </Label>
              </div>
            </div>

            <div className="mb-6">
              <Label
                htmlFor="document"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Supporting Document (if any)
              </Label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-500 transition duration-200">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="document"
                      className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="document"
                        name="document"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX, JPG, JPEG, PNG up to 10MB
                  </p>
                  {newComplaint.document && (
                    <p className="text-sm text-green-600">
                      Selected file: {newComplaint.document.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transform transition hover:scale-105 duration-200 ease-in-out"
              >
                Submit Complaint
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Updated View Complaints section */}
      {activeTab === "view" && (
        <div className="mt-6">
          <div className="space-y-4">
            {complaints && complaints.length > 0 ? (
              complaints.map((complaint) => (
                <Card key={complaint._id} className="mb-4">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {complaint.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {complaint.isAnonymous
                            ? "Anonymous"
                            : complaint.userId}{" "}
                          • {new Date(complaint.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`flex gap-2 transition-all duration-200 ${
                              Array.isArray(complaint.likes) && 
                              complaint.likes.includes(currentUser.id.toString())
                                  ? "bg-blue-500 text-white"
                                  : ""
                          } ${
                              animatingButton === `${complaint._id}-likes`
                                  ? "scale-125 shadow-lg"
                                  : ""
                          }`}
                          onClick={() => handleVote(complaint._id, "likes")}
                          disabled={Array.isArray(complaint.dislikes) && 
                                   complaint.dislikes.includes(currentUser.id.toString())}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span>{Array.isArray(complaint.likes) ? complaint.likes.length : 0}</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className={`flex gap-2 transition-all duration-200 ${
                              Array.isArray(complaint.dislikes) && 
                              complaint.dislikes.includes(currentUser.id.toString())
                                  ? "bg-red-500 text-white"
                                  : ""
                          } ${
                              animatingButton === `${complaint._id}-dislikes`
                                  ? "scale-125 shadow-lg"
                                  : ""
                          }`}
                          onClick={() => handleVote(complaint._id, "dislikes")}
                          disabled={Array.isArray(complaint.likes) && 
                                   complaint.likes.includes(currentUser.id.toString())}
                        >
                          <ThumbsDown className="h-4 w-4" />
                          <span>{Array.isArray(complaint.dislikes) ? complaint.dislikes.length : 0}</span>
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-700">{complaint.description}</p>
                    {complaint.documentUrl && (
                      <div className="mt-4">
                        <a
                          href={complaint.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          View Document
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-gray-500">No complaints found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentComplaint;
