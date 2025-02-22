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
  const [isLightMode, setIsLightMode] = useState(true);

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
      setElections([]);
      setLiveElections([]);
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

  const hasUserApplied = (electionId) => {
    return userApplications.some((app) => app.electionId === electionId);
  };

  return (
    <div className={`min-h-screen p-6 transition-all duration-300 ${isLightMode ? 'bg-gray-100 text-gray-900' : 'bg-gray-900 text-white'}`}>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-blue-600">Student Election Panel</h1>
        <Button onClick={() => setIsLightMode(!isLightMode)} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-md">
          {isLightMode ? "Dark Mode" : "Light Mode"}
        </Button>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-red-500">Live Elections</h2>
        <Accordion type="single" collapsible>
          {liveElections.length > 0 ? (
            liveElections.map((election, index) => (
              <AccordionItem key={index} value={`live-${index}`} className="mt-4">
                <AccordionTrigger className="bg-white dark:bg-gray-800 p-4 text-left text-gray-800 dark:text-gray-300 font-semibold rounded-xl shadow-md border-0">
                  {election.title}
                </AccordionTrigger>
                <AccordionContent className="p-5 bg-white dark:bg-gray-800 rounded-xl mt-2 shadow-md">
                  <p className="text-gray-600 dark:text-gray-400">
                    Voting is live until <span className="text-red-500 font-medium">{formatDate(election.applicationDeadline)}</span>
                  </p>
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
                <AccordionTrigger className="bg-white dark:bg-gray-800 p-4 text-left text-gray-800 dark:text-gray-300 font-semibold rounded-xl shadow-md border-0">
                  {election.title}
                </AccordionTrigger>
                <AccordionContent className="p-5 bg-white dark:bg-gray-800 rounded-xl mt-2 shadow-md">
                  <p className="text-gray-600 dark:text-gray-400">
                    Applications open until <span className="text-blue-500 font-medium">{formatDate(election.applicationDeadline)}</span>
                  </p>
                  {hasUserApplied(election._id) ? (
                    <Button disabled className="mt-2 bg-gray-400 text-white px-4 py-2 rounded-lg shadow-md">
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
    </div>
  );
};

export default StudentElectionPanel;
