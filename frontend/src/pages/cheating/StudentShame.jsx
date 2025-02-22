import React, { useState, useEffect } from "react";
import { Card, CardContent, Typography, Avatar, Grid, CircularProgress, Link } from "@mui/material";
import CampaignIcon from "@mui/icons-material/Campaign";
import { amber } from "@mui/material/colors";
import axios from "axios";

const StudentShame = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCheatingIncidents = async () => {
      try {
        const response = await axios.get("/api/cheating"); // Updated endpoint
        const data = response.data;

        if (Array.isArray(data)) {
          setIncidents(data);
        } else {
          throw new Error("Invalid data format from server");
        }
      } catch (err) {
        setError(err.message || "Failed to fetch cheating incidents");
      } finally {
        setLoading(false);
      }
    };

    fetchCheatingIncidents();
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: "20px" }}>
      <Typography variant="h4" gutterBottom>
        <CampaignIcon fontSize="large" /> Wall of Shame
      </Typography>

      {incidents.length > 0 ? (
        incidents.map((incident, index) => (
          <Card key={index} variant="outlined" style={{ margin: "10px 0" }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item>
                  <Avatar src={incident.student?.profilePic || ""} alt={incident.student?.name || "Student"} />
                </Grid>
                <Grid item xs>
                  <Typography variant="h6">{incident.student?.name}</Typography>
                  <Typography variant="body2">
                    <strong>Roll No:</strong> {incident.student?.rollNo} | <strong>Class:</strong> {incident.student?.class} | <strong>Branch:</strong> {incident.student?.branch}
                  </Typography>
                  <Typography color={amber[600]}>
                    <strong>Remark:</strong> {incident.reason}
                  </Typography>
                  {incident.proof && (
                    <Typography variant="body2" style={{ marginTop: "8px" }}>
                      <strong>Proof:</strong>{" "}
                      <Link href={incident.proof} target="_blank" rel="noopener">
                        View Proof
                      </Link>
                    </Typography>
                  )}
                  <Typography variant="caption" display="block" color="textSecondary" style={{ marginTop: "8px" }}>
                    Reported on: {new Date(incident.reportedAt).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))
      ) : (
        <Typography>No cheating incidents found.</Typography>
      )}
    </div>
  );
};

export default StudentShame;
