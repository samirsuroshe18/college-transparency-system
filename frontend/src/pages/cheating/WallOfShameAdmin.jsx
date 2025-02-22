import React, { useState } from "react";
import { TextField, Button, Card, CardContent, Typography, Avatar, Grid } from "@mui/material";
import CampaignIcon from "@mui/icons-material/Campaign";
import { amber } from "@mui/material/colors";
import axios from "axios";

const WallOfShameAdmin = () => {
    const [studentId, setStudentId] = useState("");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState(null);
    const [students, setStudents] = useState([]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleAddStudent = async () => {
        if (!studentId || !description) {
            alert("Student ID and Description are required!");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("studentId", studentId);
            formData.append("description", description);
            if (file) formData.append("file", file);

            // Fetch student details from the backend
            const response = await axios.post("/api/v1/fetch", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            const studentDetails = response.data;

            if (!studentDetails) {
                alert("Student not found!");
                return;
            }

            const newStudent = {
                studentId,
                name: studentDetails.name,
                class: studentDetails.class,
                branch: studentDetails.branch,
                remark: description,
                profilePic: studentDetails.profilePic,
            };

            setStudents([...students, newStudent]);
            setStudentId("");
            setDescription("");
            setFile(null);
        } catch (error) {
            console.error("Error fetching student details:", error);
            alert("Failed to fetch student details.");
        }
    };

    return (
        <div style={{ maxWidth: 600, margin: "auto", padding: "20px" }}>
            <Typography variant="h4" gutterBottom>
                <CampaignIcon fontSize="large" /> Wall of Shame (Admin)
            </Typography>

            {/* Input Form */}
            <TextField fullWidth label="Student ID" value={studentId} onChange={(e) => setStudentId(e.target.value)} margin="normal" />
            <TextField fullWidth label="Description" value={description} onChange={(e) => setDescription(e.target.value)} margin="normal" multiline rows={2} />
            <input type="file" onChange={handleFileChange} style={{ margin: "10px 0" }} />
            <Button
                variant="contained"
                sx={{ backgroundColor: amber[600], "&:hover": { backgroundColor: amber[800] } }}
                onClick={handleAddStudent}
                fullWidth
            >
                <b> Add to Wall of Shame </b>
            </Button>

            {/* Shame List */}
            <Typography variant="h5" gutterBottom style={{ marginTop: "20px" }}>
                Shame List
            </Typography>
            {students.map((student, index) => (
                <Card key={index} variant="outlined" style={{ margin: "10px 0" }}>
                    <CardContent>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item>
                                <Avatar src={student.profilePic} alt={student.name} />
                            </Grid>
                            <Grid item xs>
                                <Typography variant="h6">{student.name}</Typography>
                                <Typography variant="body2">
                                    <strong>Student ID:</strong> {student.studentId} | <strong>Class:</strong> {student.class} | <strong>Branch:</strong> {student.branch}
                                </Typography>
                                <Typography color="error" style={{ color: amber[600] }}><strong>Remark:</strong> {student.remark}</Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default WallOfShameAdmin;
