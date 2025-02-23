import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Tabs, Tab } from "@mui/material";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import axios from 'axios'

const StudentElectionPanel = () => {
  const { userData } = useSelector((state) => state.auth);
  const [elections, setElections] = useState([]);
  const [liveElections, setLiveElections] = useState([]);
  const [completedElections, setCompletedElections] = useState([]);
  const [userApplications, setUserApplications] = useState([]);
  const [isApplying, setIsApplying] = useState(false);
  const [applicationData, setApplicationData] = useState({ agenda: "", experience: "" });
  const [selectedElectionId, setSelectedElectionId] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_DOMAIN}/api/v1/admin/elections/get`);
      const today = new Date();
      const upcoming = [], live = [], completed = [];

      response.data.forEach((election) => {
        const electionDate = new Date(election.electionDate);
        const applicationDeadline = new Date(election.applicationDeadline);

        if (isNaN(electionDate) || isNaN(applicationDeadline)) {
          console.warn(`Invalid date found in election: ${election.title}`);
          return;
        }

        console.log("todays Date", today)
        console.log("electionDate Date", electionDate)
        console.log("electionDate Date", applicationDeadline)
        console.log(today >= electionDate && today <= applicationDeadline)

        if (election.ended) {
          completed.push(election);
        } else if (today >= electionDate && today <= applicationDeadline) {
          live.push(election);
        } else if (today < electionDate) {
          upcoming.push(election);
        } else if (today > applicationDeadline) {
          completed.push(election);
        }
      });

      setElections(upcoming);
      setLiveElections(live);
      setCompletedElections(completed);
    } catch (error) {
      console.error("Error fetching elections:", error);
    }
  };

  const handleApplyClick = (electionId) => {
    setSelectedElectionId(electionId);
    setIsApplying(true);
  };

  const handleInputChange = (e) => {
    setApplicationData({ ...applicationData, [e.target.name]: e.target.value });
  };

  const handleSubmitApplication = async () => {
    if (!selectedElectionId || !userData?._id) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_DOMAIN}/api/v1/applications/${selectedElectionId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData?._id,
          name: userData?.name || "John Doe",
          agenda: applicationData.agenda,
          experience: applicationData.experience,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to submit application");

      setIsApplying(false);
    } catch (error) {
      console.error("Error submitting application:", error.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 text-gray-900">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">Student Election Panel</h1>
      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
        <Tab label="Upcoming" />
        <Tab label="Live" />
        <Tab label="Completed" />
      </Tabs>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tabValue === 0 && elections.map((election) => (
          <motion.div whileHover={{ scale: 1.05 }} key={election._id}>
            <Card className="shadow-lg">
              <CardContent>
                <h2 className="text-xl font-semibold text-blue-500">{election.title}</h2>
                <p className="text-gray-600">Applications close: {election.applicationDeadline ? formatDate(election.applicationDeadline) : 'Date not available'}</p>
                <Button onClick={() => handleApplyClick(election._id)} className="mt-4 bg-blue-500 text-white">
                  Apply Now
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {tabValue === 1 && liveElections.map((election) => (
          <motion.div whileHover={{ scale: 1.05 }} key={election._id}>
            <Card className="shadow-lg">
              <CardContent>
                <h2 className="text-xl font-semibold text-green-500">{election.title}</h2>
                <p className="text-gray-600">Voting ends: {election.electionDate ? formatDate(election.electionDate) : 'Date not available'}</p>
                {(election.candidates || []).map((candidate) => (
                  <div key={candidate._id} className="mt-4">
                    <div className="flex justify-between items-center">
                      <span>{candidate.name}</span>
                      <Button className="bg-green-500 text-white">Vote</Button>
                    </div>
                    <Progress value={candidate.votePercentage || 0} className="mt-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {tabValue === 2 && completedElections.map((election) => (
          <motion.div whileHover={{ scale: 1.05 }} key={election._id}>
            <Card className="shadow-lg">
              <CardContent>
                <h2 className="text-xl font-semibold text-gray-700">{election.title}</h2>
                <p className="text-gray-600">Completed on: {election.electionDate ? formatDate(election.electionDate) : 'Date not available'}</p>
                {(election.candidates || []).map((candidate) => (
                  <div key={candidate._id} className="mt-4">
                    <div className="flex justify-between items-center">
                      <span>{candidate.name}</span>
                      <span>{candidate.votes} votes</span>
                    </div>
                    <Progress value={candidate.votePercentage || 0} className="mt-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={isApplying} onOpenChange={setIsApplying}>
        <DialogContent>
          <DialogHeader>Apply for Election</DialogHeader>
          <div className="space-y-4">
            <label className="block text-sm font-medium">Name</label>
            <Input type="text" value={userData?.name || ""} disabled className="bg-gray-200" />

            <label className="block text-sm font-medium">Agenda</label>
            <Input type="text" name="agenda" value={applicationData.agenda} onChange={handleInputChange} />

            <label className="block text-sm font-medium">Experience</label>
            <Input type="text" name="experience" value={applicationData.experience} onChange={handleInputChange} />
          </div>
          <DialogFooter>
            <Button onClick={handleSubmitApplication} className="bg-green-500 text-white">Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentElectionPanel;
