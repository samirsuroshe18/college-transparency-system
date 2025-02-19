import React, { useState } from "react";
import { TextField, Button, Card, CardContent, Typography, Avatar, Grid } from "@mui/material";
import CampaignIcon from "@mui/icons-material/Campaign";
import { amber } from "@mui/material/colors";


const WallOfShameAdmin = () => {
    const [rollNo, setRollNo] = useState("");
    const [remark, setRemark] = useState("");
    const [students, setStudents] = useState([
        {
            rollNo: "23CS101",
            name: "Rahul Sharma",
            class: "CSE 3rd Year",
            branch: "Computer Science",
            remark: "Caught cheating in exams",
            profilePic: "https://randomuser.me/api/portraits/men/1.jpg",
        },
        {
            rollNo: "23ME207",
            name: "Anjali Patil",
            class: "ME 2nd Year",
            branch: "Mechanical",
            remark: "Misbehaved in class",
            profilePic: "https://randomuser.me/api/portraits/women/2.jpg",
        },
    ]);

    // Simulate fetching student details
    const fetchStudentDetails = (rollNo) => {
        const mockData = {
            "23CS101": { name: "Rahul Sharma", class: "CSE 3rd Year", branch: "Computer Science", profilePic: "https://randomuser.me/api/portraits/men/1.jpg" },
            "23ME207": { name: "Anjali Patil", class: "ME 2nd Year", branch: "Mechanical", profilePic: "https://randomuser.me/api/portraits/women/2.jpg" },
            "23EE305": { name: "Siddharth Deshmukh", class: "EE Final Year", branch: "Electrical", profilePic: "https://randomuser.me/api/portraits/men/3.jpg" },
        };
        return mockData[rollNo] || null;
    };

    const handleAddStudent = () => {
        const studentDetails = fetchStudentDetails(rollNo);
        if (!studentDetails) {
            alert("Student not found!");
            return;
        }

        const newStudent = {
            rollNo,
            name: studentDetails.name,
            class: studentDetails.class,
            branch: studentDetails.branch,
            remark,
            profilePic: studentDetails.profilePic,
        };

        setStudents([...students, newStudent]);
        setRollNo("");
        setRemark("");
    };

    return (
        <div style={{ maxWidth: 600, margin: "auto", padding: "20px" }}>
            <Typography variant="h4" gutterBottom>
                <CampaignIcon fontSize="large" /> Wall of Shame (Admin)
            </Typography>

            {/* Input Form */}
            <TextField fullWidth label="Roll Number" value={rollNo} onChange={(e) => setRollNo(e.target.value)} margin="normal" />
            <TextField fullWidth label="Remark" value={remark} onChange={(e) => setRemark(e.target.value)} margin="normal" multiline rows={2} />
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
                                    <strong>Roll No:</strong> {student.rollNo} | <strong>Class:</strong> {student.class} | <strong>Branch:</strong> {student.branch}
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
