import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const StudentElectionPanel = () => {
  const { userData } = useSelector((state) => state.auth);
  const [elections, setElections] = useState([]);
  const [liveElections, setLiveElections] = useState([]);
  const [userApplications, setUserApplications] = useState([]);
  const [isApplying, setIsApplying] = useState(false);
  const [applicationData, setApplicationData] = useState({ agenda: "", experience: "" });
  const [selectedElectionId, setSelectedElectionId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchElections();
    fetchUserApplications();
  }, []);

  const fetchElections = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/v1/admin/elections/upcoming");
      const data = await response.json();

      const today = new Date();
      const upcoming = [];
      const live = [];

      data.forEach((election) => {
        const deadline = new Date(election.applicationDeadline);
        if (deadline < today) {
          live.push(election);
        } else {
          upcoming.push(election);
        }
      });

      setElections(upcoming);
      setLiveElections(live);
    } catch (error) {
      console.error("Error fetching elections:", error);
      setElections([]);
      setLiveElections([]);
    }
  };

  const fetchUserApplications = async () => {
    if (!userData?.user?._id) return;

    try {
      const response = await fetch(`http://localhost:3000/api/v1/applications/user/${userData.user._id}`);
      const data = await response.json();
      setUserApplications(data || []);
    } catch (error) {
      console.error("Error fetching user applications:", error);
      setUserApplications([]);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateString));
  };

  const handleApplyClick = (electionId) => {
    setSelectedElectionId(electionId);
    setIsApplying(true);
  };

  const handleApplySubmit = async () => {
    if (!userData?.user) {
      setError("User not logged in.");
      return;
    }

    const payload = {
      electionId: selectedElectionId,
      userId: userData.user._id,
      name: userData.user.name,
      class: userData.user.class || "N/A",
      agenda: applicationData.agenda,
      experience: applicationData.experience,
    };

    try {
      const response = await fetch(`http://localhost:3000/api/v1/applications/${selectedElectionId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok) {
        setSuccess("Application submitted! Waiting for admin approval.");
        setIsApplying(false);
        setApplicationData({ agenda: "", experience: "" });
        fetchUserApplications();
      } else {
        setError(result.message || "Failed to submit application.");
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      setError("Server Error.");
    }
  };

  // ✅ Function to check if the user has already applied
  const hasUserApplied = (electionId) => {
    return userApplications.some((app) => app.electionId === electionId);
  };

  return (
    <div className="min-h-screen bg-[#131314] text-white p-6">
      <h1 className="text-3xl font-bold text-amber-500">Student Election Panel</h1>

      {/* 📅 Upcoming Elections */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-amber-400">Upcoming Elections</h2>
        <Accordion type="single" collapsible>
          {elections.length > 0 ? (
            elections.map((election, index) => (
              <AccordionItem key={index} value={`upcoming-${index}`} className="mt-4">
                <AccordionTrigger className="bg-[#1a1a1d] p-4 text-left text-gray-300 font-semibold rounded-xl shadow-md border-0">
                  {election.title}
                </AccordionTrigger>
                <AccordionContent className="p-5 bg-[#1a1a1d] rounded-xl mt-2 shadow-md">
                  <p className="text-gray-400">
                    Applications open until <span className="text-amber-300 font-medium">{formatDate(election.applicationDeadline)}</span>
                  </p>

                  {/* ✅ Disable Apply button if the user has already applied */}
                  {hasUserApplied(election._id) ? (
                    <Button disabled className="mt-2 bg-gray-500 text-white px-4 py-2 rounded-lg shadow-md">
                      Already Applied
                    </Button>
                  ) : (
                    <Button onClick={() => handleApplyClick(election._id)} className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md">
                      Apply Now
                    </Button>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))
          ) : (
            <p className="text-gray-500 mt-4">No upcoming elections.</p>
          )}
        </Accordion>
      </section>

      {/* 📝 Apply Modal */}
      {isApplying && (
        <Dialog open={isApplying} onOpenChange={setIsApplying}>
          <DialogContent className="bg-[#1a1a1d] border border-gray-700 text-white p-6 rounded-lg">
            <DialogHeader>
              <h3 className="text-lg font-bold text-gray-300">Apply as Candidate</h3>
            </DialogHeader>

            <div className="space-y-4">
              <Input value={userData.user.name} readOnly className="bg-[#2a2a2d] text-gray-300 border border-gray-600 px-3 py-2 w-full rounded-lg" />
              <Input placeholder="Your Agenda..." onChange={(e) => setApplicationData({ ...applicationData, agenda: e.target.value })} className="bg-[#2a2a2d] text-gray-300 border border-gray-600 px-3 py-2 w-full rounded-lg" />
              <textarea placeholder="Your Experience..." onChange={(e) => setApplicationData({ ...applicationData, experience: e.target.value })} className="bg-[#2a2a2d] text-gray-300 border border-gray-600 px-3 py-2 w-full rounded-lg h-24 resize-none" />
            </div>

            <DialogFooter className="mt-4">
              <Button onClick={handleApplySubmit} className="bg-blue-500 hover:bg-blue-600 w-full">
                Submit Application
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 📌 Live Elections Section */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-green-400">Live Elections</h2>
        <Accordion type="single" collapsible>
          {liveElections.length > 0 ? (
            liveElections.map((election, index) => (
              <AccordionItem key={index} value={`live-${index}`} className="mt-4">
                <AccordionTrigger className="bg-[#1a1a1d] p-4 text-left text-gray-300 font-semibold rounded-xl shadow-md border-0">
                  {election.title}
                </AccordionTrigger>
                <AccordionContent className="p-5 bg-[#1a1a1d] rounded-xl mt-2 shadow-md">
                  <p className="text-gray-400">
                    Voting ends on{" "}
                    <span className="text-green-300 font-medium">{formatDate(election.votingDeadline)}</span>
                  </p>
                  <Button className="mt-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md">
                    Vote Now
                  </Button>
                </AccordionContent>
              </AccordionItem>
            ))
          ) : (
            <p className="text-gray-500 mt-4">No live elections at the moment.</p>
          )}
        </Accordion>
      </section>

    </div>
  );
};

export default StudentElectionPanel;
