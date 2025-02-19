import React, { useState, useEffect } from "react";
import { FaChevronDown, FaCheck, FaTimes } from "react-icons/fa";
import { Select, SelectItem, SelectTrigger, SelectContent, SelectValue } from "@/components/ui/select";

const AdminElectionPanel = () => {
  const [elections, setElections] = useState([]);
  const [title, setTitle] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [resultDate, setResultDate] = useState("");
  const [selectedElection, setSelectedElection] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState(null);
  const [votingCriteria, setVotingCriteria] = useState({ branch: "", year: "", division: "" });

  useEffect(() => {
    fetchElections();
  }, []);

  // ✅ Fetch Elections
  const fetchElections = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/v1/elections/");
      const data = await response.json();
      setElections(data);
    } catch (error) {
      console.error("Error fetching elections:", error);
    }
  };

  // ✅ Create a new Election
  const createElection = async () => {
    if (!title || !applicationDeadline || !resultDate || !votingCriteria.branch || !votingCriteria.year || !votingCriteria.division) return;

    try {
      await fetch("http://localhost:3000/api/v1/admin/elections/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, 
          applicationDeadline, 
          resultDate, 
          votingCriteria 
        }),
      });
      fetchElections(); // Refresh data after creation
      setTitle("");
      setApplicationDeadline("");
      setResultDate("");
      setVotingCriteria({ branch: "", year: "", division: "" });
    } catch (error) {
      console.error("Error creating election:", error);
    }
  };

  // ✅ Toggle Election Details
  const toggleElection = (id) => {
    setSelectedElection(selectedElection === id ? null : id);
  };

  // ✅ Handle Approve/Reject Candidate
  const handleApproval = async (candidateId, action) => {
    try {
      await fetch(`http://localhost:3000/api/v1/applications/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      fetchElections(); // Refresh data
      setShowConfirmModal(false);
    } catch (error) {
      console.error("Error updating candidate status:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#131314] text-white p-6 space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center py-4 px-6 bg-black/20 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-amber-500">Admin Election Panel</h1>
      </header>

      {/* Create Election */}
      <section className="bg-black/20 p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold text-amber-400">Create New Election</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          <input
            type="text"
            placeholder="Election Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-black/50 text-white px-4 py-2 rounded-lg outline-none"
          />
          <input
            type="date"
            value={applicationDeadline}
            onChange={(e) => setApplicationDeadline(e.target.value)}
            className="bg-black/50 text-white px-4 py-2 rounded-lg outline-none"
            placeholder="Application Deadline"
          />
          <input
            type="date"
            value={resultDate}
            onChange={(e) => setResultDate(e.target.value)}
            className="bg-black/50 text-white px-4 py-2 rounded-lg outline-none"
            placeholder="Result Announcement Date"
          />
        </div>

        {/* Voting Criteria Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          <Select onValueChange={(val) => setVotingCriteria({ ...votingCriteria, branch: val })}>
            <SelectTrigger className="w-full bg-black/50 text-white px-4 py-2 rounded-lg outline-none">
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent className="bg-black text-white">
              <SelectItem value="Computer">Computer</SelectItem>
              <SelectItem value="IT">IT</SelectItem>
              <SelectItem value="Mechanical">Mechanical</SelectItem>
              <SelectItem value="Electronics">Electronics</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(val) => setVotingCriteria({ ...votingCriteria, year: val })}>
            <SelectTrigger className="w-full bg-black/50 text-white px-4 py-2 rounded-lg outline-none">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent className="bg-black text-white">
              <SelectItem value="FE">First Year (FE)</SelectItem>
              <SelectItem value="SE">Second Year (SE)</SelectItem>
              <SelectItem value="TE">Third Year (TE)</SelectItem>
              <SelectItem value="BE">Final Year (BE)</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(val) => setVotingCriteria({ ...votingCriteria, division: val })}>
            <SelectTrigger className="w-full bg-black/50 text-white px-4 py-2 rounded-lg outline-none">
              <SelectValue placeholder="Select Division" />
            </SelectTrigger>
            <SelectContent className="bg-black text-white">
              <SelectItem value="A">A</SelectItem>
              <SelectItem value="B">B</SelectItem>
              <SelectItem value="C">C</SelectItem>
              <SelectItem value="D">D</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Create Button */}
        <button
          onClick={createElection}
          className="bg-amber-500 px-6 py-2 mt-4 rounded-lg font-semibold hover:bg-amber-400 transition"
        >
          Create Election
        </button>
      </section>
    </div>
  );
};

export default AdminElectionPanel;
