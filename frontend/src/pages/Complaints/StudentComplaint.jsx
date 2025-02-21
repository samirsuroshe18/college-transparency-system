import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { TextField, Checkbox, FormControlLabel, Avatar } from "@mui/material";
import { amber } from "@mui/material/colors";
import WarningIcon from "@mui/icons-material/Warning";

const dummyComplaints = [
  { id: 1, title: "Noise in Library", description: "Too much disturbance.", anonymous: true },
  { id: 2, title: "WiFi Issues", description: "Poor connectivity in hostel.", anonymous: false },
];

const StudentComplaint = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [complaints, setComplaints] = useState(dummyComplaints);

  const handleSubmit = () => {
    const newComplaint = {
      id: complaints.length + 1,
      title,
      description,
      anonymous,
    };
    setComplaints([...complaints, newComplaint]);
    setOpen(false);
  };

  return (
    <div className="bg-[#131314] text-white p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-amber-400">Complaint Box</h2>
      <Button className="bg-amber-500 hover:bg-amber-600" onClick={() => setOpen(true)}>
        Post a Complaint
      </Button>

      {/* Complaint Submission Modal */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle className="bg-[#131314] text-amber-400">New Complaint</DialogTitle>
        <DialogContent className="bg-[#131314] text-white">
          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            margin="dense"
            variant="outlined"
            className="text-white"
            InputProps={{ style: { color: "white" } }}
          />
          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="dense"
            variant="outlined"
            multiline
            rows={3}
            InputProps={{ style: { color: "white" } }}
          />
          <FormControlLabel
            control={<Checkbox checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />}
            label="Submit Anonymously"
          />
          <Button className="bg-amber-500 hover:bg-amber-600 mt-3" fullWidth onClick={handleSubmit}>
            Submit Complaint
          </Button>
        </DialogContent>
      </Dialog>

      {/* Complaint List */}
      <div className="mt-4">
        {complaints.map((complaint) => (
          <div key={complaint.id} className="flex items-center bg-[#1E1E1E] p-4 my-2 rounded-lg">
            <Avatar sx={{ bgcolor: amber[500] }}>{complaint.anonymous ? "A" : "S"}</Avatar>
            <div className="ml-3">
              <h3 className="font-semibold">{complaint.title}</h3>
              <p className="text-gray-400">{complaint.description}</p>
              {complaint.anonymous && (
                <div className="flex items-center text-red-400 text-sm">
                  <WarningIcon fontSize="small" className="mr-1" />
                  Anonymous Submission
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentComplaint;
