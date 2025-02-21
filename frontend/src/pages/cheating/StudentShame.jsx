import React, { useState } from "react";
import { Card, CardContent, Typography, Avatar, Grid } from "@mui/material";
import CampaignIcon from "@mui/icons-material/Campaign";
import { amber } from "@mui/material/colors";

const StudentShame = () => {
  const [students] = useState([
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

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: "20px" }}>
      <Typography variant="h4" gutterBottom>
        <CampaignIcon fontSize="large" /> Wall of Shame
      </Typography>

      {/* Shame List */}
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
                <Typography color={amber[600]}><strong>Remark:</strong> {student.remark}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StudentShame;
