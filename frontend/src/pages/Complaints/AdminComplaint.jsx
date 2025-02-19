import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, Chip } from "@mui/material";
import { amber, red } from "@mui/material/colors";
import GavelIcon from "@mui/icons-material/Gavel";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";

const dummyComplaints = [
  { id: 1, title: "Noise in Library", description: "Too much disturbance.", anonymous: true, votes: 1 },
  { id: 2, title: "WiFi Issues", description: "Poor connectivity in hostel.", anonymous: false, votes: 0 },
];

const AdminComplaint = () => {
  const [complaints, setComplaints] = useState(dummyComplaints);

  const handleVoteReveal = (id) => {
    setComplaints((prev) =>
      prev.map((complaint) =>
        complaint.id === id ? { ...complaint, votes: complaint.votes + 1 } : complaint
      )
    );
  };

  return (
    <div className="bg-[#131314] text-white p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-amber-400">Admin Complaint Management</h2>
      
      {/* Complaint List */}
      {complaints.map((complaint) => (
        <div key={complaint.id} className="flex items-center bg-[#1E1E1E] p-4 my-2 rounded-lg">
          <Avatar sx={{ bgcolor: complaint.anonymous ? amber[500] : red[500] }}>
            {complaint.anonymous ? "A" : "S"}
          </Avatar>
          <div className="ml-3 flex-1">
            <h3 className="font-semibold">{complaint.title}</h3>
            <p className="text-gray-400">{complaint.description}</p>
            {complaint.anonymous && (
              <div className="flex items-center text-red-400 text-sm">
                <ReportProblemIcon fontSize="small" className="mr-1" />
                Anonymous Submission
              </div>
            )}
          </div>

          {/* Mark Important */}
          <Chip
            label="Important"
            color="warning"
            icon={<ReportProblemIcon />}
            className="mr-2 cursor-pointer"
          />

          {/* Vote to Reveal */}
          {complaint.anonymous && (
            <Button
              className="bg-red-500 hover:bg-red-600 text-white ml-2"
              onClick={() => handleVoteReveal(complaint.id)}
            >
              <GavelIcon className="mr-1" />
              Vote to Reveal ({complaint.votes})
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminComplaint;
