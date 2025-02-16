import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";

const StudentElectionPanel = () => {
  const [openModal, setOpenModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [applyModal, setApplyModal] = useState(false);

  const upcomingElections = [
    { title: "Class Representative", electionDate: "2025-03-15", applyBefore: "2025-03-10" },
  ];

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

  return (
    <div className="min-h-screen bg-[#131314] text-white p-6">
      <h1 className="text-3xl font-bold text-amber-500">Student Election Panel</h1>
      
      {/* Upcoming Elections */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-amber-400">Upcoming Elections</h2>
        {upcomingElections.map((election, index) => (
          <Card key={index} className="mt-4 bg-[#1a1a1d] shadow-lg rounded-xl">
            <CardContent className="p-5 flex justify-between items-center">
              <div>
                <h3 className="text-xl text-gray-300 font-semibold">{election.title}</h3>
                <p className="text-gray-400">Election Date: {election.electionDate}</p>
                <p className="text-gray-400">Apply Before: {election.applyBefore}</p>
              </div>
              <Button onClick={() => setApplyModal(true)} className="bg-amber-500 hover:bg-amber-600 text-black px-5 py-2 rounded-lg shadow-md">Apply</Button>
            </CardContent>
          </Card>
        ))}
      </section>
      
      {/* Ongoing Elections */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-amber-400">Ongoing Elections</h2>
        <Accordion type="single" collapsible>
          {ongoingElections.map((election, index) => (
            <AccordionItem key={index} value={`election-${index}`} className="mt-4 border-none">
              <AccordionTrigger className="bg-[#1a1a1d] p-4 text-left text-gray-300 font-semibold rounded-xl shadow-md border-0">{election.title}</AccordionTrigger>
              <AccordionContent className="p-5 bg-[#1a1a1d] rounded-xl mt-2 shadow-md">
                {election.candidates.map((candidate, idx) => (
                  <div key={idx} className="mt-4 bg-[#222] p-4 rounded-lg shadow-md">
                    <p className="text-lg text-gray-300 font-semibold">{candidate.name}</p>
                    <p className="text-gray-400">{candidate.agenda}</p>
                    <Button onClick={() => handleVoteClick(candidate)} className="mt-2 bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-lg shadow-md">
                      Vote
                    </Button>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Vote Confirmation Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="bg-[#1a1a1d] rounded-lg shadow-lg text-white">
          <DialogHeader>
            <h2 className="text-xl font-semibold">Confirm Your Vote</h2>
          </DialogHeader>
          <p className="text-gray-400">Are you sure you want to vote for {selectedCandidate?.name}?</p>
          <DialogFooter>
            <Button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-md" onClick={() => setOpenModal(false)}>
              Cancel
            </Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-lg shadow-md">Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Modal */}
      <Dialog open={applyModal} onOpenChange={setApplyModal}>
        <DialogContent className="bg-[#1a1a1d] rounded-lg shadow-lg text-white">
          <DialogHeader>
            <h2 className="text-xl font-semibold">Apply for Election</h2>
          </DialogHeader>
          <p className="text-gray-400">Fill out the form to apply for this election.</p>
          <DialogFooter>
            <Button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-md" onClick={() => setApplyModal(false)}>
              Cancel
            </Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-lg shadow-md">Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentElectionPanel;
