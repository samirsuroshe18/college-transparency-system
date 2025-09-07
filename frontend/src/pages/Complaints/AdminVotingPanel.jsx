import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "../../components/ui/card";

const AdminComplaint = () => {
  const [complaints, setComplaints] = useState([]);

  // Fetch complaints from backend
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_DOMAIN}/api/v1/complaints/all`,
          { withCredentials: true }
        );
        setComplaints(response.data);
      } catch (error) {
        console.error("Error fetching complaints:", error);
      }
    };

    fetchComplaints();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Complaints Dashboard
        </h2>
        <p className="text-gray-600">
          View and manage all student complaints
        </p>
      </div>

      <div className="space-y-4">
        {complaints && complaints.length > 0 ? (
          complaints.map((complaint) => (
            <Card key={complaint._id} className="mb-4">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{complaint.title}</h3>
                    <p className="text-sm text-gray-500">
                      {complaint.isAnonymous ? "Anonymous" : complaint.userId} •{" "}
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      👍 {complaint.likes || 0}
                    </div>
                    <div className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-full">
                      👎 {complaint.dislikes || 0}
                    </div>
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
  );
};

export default AdminComplaint;