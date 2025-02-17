import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

const StudentElectionPanel = () => {
  const [openModal, setOpenModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [applyModal, setApplyModal] = useState(false);
  const [selectedElection, setSelectedElection] = useState(null);
  const [candidateName, setCandidateName] = useState("");
  const [department, setDepartment] = useState("");

  const ongoingElections = [
    {
      title: "Class Representative - CMPN A",
      candidates: [
        { name: "Rahul Sharma", agenda: "Improve sports facilities" },
        { name: "Priya Verma", agenda: "Organize more tournaments" },
      ],
    },
    {
      title: "Sports Secretary",
      candidates: [
        { name: "Amit Khanna", agenda: "Upgrade gym and sports equipment" },
        { name: "Neha Gupta", agenda: "Host more inter-college competitions" },
      ],
    },
    {
      title: "Cultural Coordinator",
      candidates: [
        { name: "Sanya Mehta", agenda: "Organize more cultural fests" },
        { name: "Kunal Desai", agenda: "Promote regional arts and music" },
      ],
    },
  ];

  const handleVoteClick = (candidate) => {
    setSelectedCandidate(candidate);
    setOpenModal(true);
  };

  const [upcomingElections, setUpcomingElections] = useState([]);

  useEffect(() => {
    fetchUpcomingElections();
  }, []);

  const fetchUpcomingElections = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/v1/admin/elections/upcoming");
      const data = await response.json();
      setUpcomingElections(data);
    } catch (error) {
      console.error("Error fetching upcoming elections:", error);
    }
  };

  const handleApplyClick = (election) => {
    setSelectedElection(election);
    setApplyModal(true);
  };

  const applyForElection = async () => {
    if (!candidateName || !department) {
      alert("Please fill all fields!");
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/v1/candidates/${selectedElection._id}/candidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: candidateName, department }),
      });
      const data = await response.json();
      alert(data.message);
      setApplyModal(false);
      setCandidateName("");
      setDepartment("");
    } catch (error) {
      console.error("Error applying for election:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#131314] text-white p-6">
      <h1 className="text-3xl font-bold text-amber-500">Student Election Panel</h1>

      <header className="flex justify-between items-center py-4 px-6 bg-black/20 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-amber-500">Upcoming Elections</h1>
      </header>

      <section className="bg-black/20 p-6 rounded-xl shadow-md">
        {upcomingElections.length === 0 ? (
          <p className="text-gray-400">No upcoming elections.</p>
        ) : (
          upcomingElections.map((election) => (
            <div key={election._id} className="bg-black/30 p-4 rounded-lg mt-4">
              <h3 className="text-lg font-medium">{election.title}</h3>
              <p className="text-gray-400">Election Date: {election.electionDate}</p>
              <Button
                onClick={() => handleApplyClick(election)}
                className="mt-2 bg-amber-500 px-4 py-2 rounded-lg font-semibold hover:bg-amber-400 transition"
              >
                Apply as Candidate
              </Button>
            </div>
          ))
        )}
      </section>

      {/* Ongoing Elections */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-amber-400">Ongoing Elections</h2>
        <Accordion type="single" collapsible>
          {ongoingElections.map((election, index) => (
            <AccordionItem key={index} value={`election-${index}`} className="mt-4">
              <AccordionTrigger className="bg-[#1a1a1d] p-4 text-left text-gray-300 font-semibold rounded-xl shadow-md border-0">
                {election.title}
              </AccordionTrigger>
              <AccordionContent className="p-5 bg-[#1a1a1d] rounded-xl mt-2 shadow-md">
                {election.candidates.map((candidate, idx) => (
                  <div key={idx} className="mt-4 bg-[#222] p-4 rounded-lg shadow-md">
                    <p className="text-lg text-gray-300 font-semibold">{candidate.name}</p>
                    <p className="text-gray-400">{candidate.agenda}</p>
                    <Button
                      onClick={() => handleVoteClick(candidate)}
                      className="mt-2 bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-lg shadow-md"
                    >
                      Vote
                    </Button>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Apply Modal */}
      <Dialog open={applyModal} onOpenChange={setApplyModal}>
        <DialogContent className="bg-[#1a1a1d] rounded-lg shadow-lg text-white w-[90%] max-w-md p-6">
          <DialogHeader>
            <h2 className="text-xl font-semibold">Apply for {selectedElection?.title}</h2>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <label className="text-gray-300">Candidate Name</label>
            <Input
              type="text"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="Enter your name"
              className="p-2 bg-[#222] border border-gray-500 rounded-lg text-white"
            />
            <label className="text-gray-300">Department</label>
            <Input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Enter your department"
              className="p-2 bg-[#222] border border-gray-500 rounded-lg text-white"
            />
          </div>
          <DialogFooter className="mt-4 flex justify-end gap-4">
            <Button
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-md"
              onClick={() => setApplyModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-lg shadow-md"
              onClick={applyForElection}
            >
              Submit Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentElectionPanel;
