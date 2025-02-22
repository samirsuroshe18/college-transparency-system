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

  console.log("User Data:", userData);
  useEffect(() => {
    fetchElections();
    fetchUserApplications();
  }, []);

  const fetchElections = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_DOMAIN}/api/v1/admin/elections/upcoming`);
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
    }
  };

  const fetchUserApplications = async () => {
    if (!userData?.user?._id) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_DOMAIN}/api/v1/applications/user/${userData.user._id}`);
      const data = await response.json();
      setUserApplications(data || []);
    } catch (error) {
      console.error("Error fetching user applications:", error);
    }
  };

  const formatDate = (dateString) => {
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

  const handleInputChange = (e) => {
    setApplicationData({ ...applicationData, [e.target.name]: e.target.value });
  };

  const handleSubmitApplication = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_DOMAIN}/api/v1/applications/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          electionId: selectedElectionId,
          userId: userData.user._id,
          agenda: applicationData.agenda,
          experience: applicationData.experience,
        }),
      });
      if (response.ok) {
        setIsApplying(false);
        fetchUserApplications();
      }
    } catch (error) {
      console.error("Error submitting application:", error);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100 text-gray-900">
      <h1 className="text-3xl font-bold text-blue-600">Student Election Panel</h1>
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-red-500">Live Elections</h2>
        <Accordion type="single" collapsible>
          {liveElections.length > 0 ? (
            liveElections.map((election, index) => (
              <AccordionItem key={index} value={`live-${index}`} className="mt-4">
                <AccordionTrigger>{election.title}</AccordionTrigger>
                <AccordionContent>
                  Voting is live until {formatDate(election.applicationDeadline)}
                </AccordionContent>
              </AccordionItem>
            ))
          ) : (
            <p className="text-gray-500 mt-4">No live elections.</p>
          )}
        </Accordion>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-blue-500">Upcoming Elections</h2>
        <Accordion type="single" collapsible>
          {elections.length > 0 ? (
            elections.map((election, index) => (
              <AccordionItem key={index} value={`upcoming-${index}`} className="mt-4">
                <AccordionTrigger>{election.title}</AccordionTrigger>
                <AccordionContent>
                  Applications open until {formatDate(election.applicationDeadline)}
                  <Button onClick={() => handleApplyClick(election._id)} className="mt-2 bg-blue-500 text-white">Apply Now</Button>
                </AccordionContent>
              </AccordionItem>
            ))
          ) : (
            <p className="text-gray-500 mt-4">No upcoming elections.</p>
          )}
        </Accordion>
      </section>

      {/* Apply Now Modal */}
      <Dialog open={isApplying} onOpenChange={setIsApplying}>
        <DialogContent>
          <DialogHeader>Apply for Election</DialogHeader>
          <div className="space-y-4">
            <label className="block text-sm font-medium">Name</label>
            <Input type="text" value={userData?.user?.name || ""} disabled className="bg-gray-200" />

            <label className="block text-sm font-medium">Agenda</label>
            <Input type="text" name="agenda" value={applicationData.agenda} onChange={handleInputChange} />

            <label className="block text-sm font-medium">Description</label>
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
