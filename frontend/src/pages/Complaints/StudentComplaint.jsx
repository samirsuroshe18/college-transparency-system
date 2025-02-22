import React, { useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function StudentComplaint() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [complaintId, setComplaintId] = useState("");
  const [message, setMessage] = useState("");

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      setMessage("Title and description are required.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    if (file) {
      formData.append("content", file);
    }

    try {
      const res = await axios.post("http://localhost:8000/api/v1/complaints/submit-complaint", formData);
      alert("Complaint Submitted")
      console.log(alert)
    } catch (error) {
      console.error("Error submitting complaint:", error);
      setMessage(error.response?.data?.message || "Error submitting complaint.");
    }
  };

  const handleVoteToReveal = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`http://localhost:8000/api/v1/complaints/vote-to-reveal/${complaintId}`);
      alert("Vote Recorded")
      console.log(res)
    } catch (error) {
      console.error("Error voting to reveal:", error);
      setMessage(error.response?.data?.message || "Error voting to reveal.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <h2 className="text-xl font-bold">Submit Complaint</h2>
          <form onSubmit={handleComplaintSubmit} className="space-y-4">
            <Label>Title:</Label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter Title"
              required
            />
            <Label>Description:</Label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter Description"
              required
            />
            <Label>Complaint Content (File):</Label>
            <Input type="file" onChange={(e) => setFile(e.target.files[0])} />
            <Button type="submit">Submit</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <h2 className="text-xl font-bold">Vote to Reveal</h2>
          <form onSubmit={handleVoteToReveal} className="space-y-4">
            <Label>Complaint ID:</Label>
            <Input
              type="text"
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value)}
              placeholder="Enter Complaint ID"
              required
            />
            <Button type="submit">Vote</Button>
          </form>
        </CardContent>
      </Card>

      {message && (
        <div className="p-4 bg-gray-100 rounded-lg shadow-md">
          <p>{message}</p>
        </div>
      )}
    </div>
  );
}
