import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chip, Avatar } from "@mui/material";
import { AlertTriangle, CheckCircle } from "lucide-react";

const AdminComplaint = () => {
  const [complaints, setComplaints] = useState([
    {
      id: 1,
      title: "Unfair Exam Marks",
      description: "Marks distribution seems unfair. Need clarification.",
      anonymous: false,
      status: "Pending",
    },
    {
      id: 2,
      title: "Library Issue",
      description: "Books are not available in the library for our syllabus.",
      anonymous: true,
      status: "Pending",
    },
    {
      id: 3,
      title: "Ragging Incident",
      description: "There was a ragging incident in the hostel last night.",
      anonymous: false,
      status: "Important",
    },
  ]);

  const handleStatusChange = (id, status) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Admin - Manage Complaints</h2>

      <div className="space-y-4">
        {complaints.map((c) => (
          <Card key={c.id} className="p-4 border border-gray-300">
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {!c.anonymous ? <Avatar>{c.title.charAt(0)}</Avatar> : <Avatar>?</Avatar>}
                <div>
                  <h4 className="font-semibold">{c.title}</h4>
                  <p className="text-gray-600 text-sm">{c.description}</p>
                </div>
              </div>

              {/* Admin Actions */}
              <div className="space-x-2">
                <Chip
                  label="Important"
                  color="warning"
                  icon={<AlertTriangle size={16} />}
                  onClick={() => handleStatusChange(c.id, "Important")}
                  className={c.status === "Important" ? "bg-amber-500 text-white" : ""}
                />
                <Chip
                  label="Resolved"
                  color="success"
                  icon={<CheckCircle size={16} />}
                  onClick={() => handleStatusChange(c.id, "Resolved")}
                  className={c.status === "Resolved" ? "bg-green-500 text-white" : ""}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminComplaint;
