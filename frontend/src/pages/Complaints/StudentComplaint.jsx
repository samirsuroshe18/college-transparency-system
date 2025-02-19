import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogActions } from "@mui/material";
import { TextField, Checkbox, FormControlLabel } from "@mui/material";
import { Avatar } from "@/components/ui/avatar";

const StudentComplaint = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [anonymous, setAnonymous] = useState(false);
  const [complaints, setComplaints] = useState([]);

  const handleFileChange = (e) => setFile(e.target.files[0]);
  const handleSubmit = () => {
    if (!title || !description) return;
    const newComplaint = {
      id: complaints.length + 1,
      title,
      description,
      file,
      anonymous,
      profilePic: "https://via.placeholder.com/40", // Replace with actual user profile
    };
    setComplaints([newComplaint, ...complaints]);
    setOpen(false);
    setTitle("");
    setDescription("");
    setFile(null);
    setAnonymous(false);
  };

  return (
    <div className="p-4">
      <Button className="bg-amber-500 hover:bg-amber-600" onClick={() => setOpen(true)}>
        Post a Complaint
      </Button>

      {/* Complaint Modal */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Post a Complaint</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />
          <input type="file" onChange={handleFileChange} className="mt-2" />
          <FormControlLabel
            control={<Checkbox checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />}
            label="Send as Anonymous"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-amber-500 hover:bg-amber-600" onClick={handleSubmit}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complaint List */}
      <div className="mt-4">
        {complaints.map((complaint) => (
          <Card key={complaint.id} className="mb-2 shadow-md">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Avatar src={complaint.anonymous ? "/anonymous.png" : complaint.profilePic} />
                <h3 className="font-bold">{complaint.anonymous ? "Anonymous" : "You"}</h3>
              </div>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{complaint.title}</p>
              <p className="text-gray-600">{complaint.description}</p>
              {complaint.file && <p className="text-blue-500">📎 Attachment</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StudentComplaint;
