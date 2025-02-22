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

  const fetchElections = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_DOMAIN}/api/v1/admin/elections/`);
      const data = await response.json();
      setElections(data);
    } catch (error) {
      console.error("Error fetching elections:", error);
    }
  };

  const createElection = async () => {
    if (!title || !applicationDeadline || !resultDate) return;
  
    try {
      await fetch(`${import.meta.env.VITE_DOMAIN}/api/v1/admin/elections/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          electionDate: resultDate,
          applicationDeadline,
          votingCriteria,
        }),
      });
      fetchElections();
      setTitle("");
      setApplicationDeadline("");
      setResultDate("");
      setVotingCriteria({ branch: "", year: "", division: "" });
    } catch (error) {
      console.error("Error creating election:", error);
    }
  };

  const toggleElection = (id) => {
    setSelectedElection(selectedElection === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 space-y-8">
      <header className="flex justify-between items-center py-4 px-8 bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-amber-400">Admin Election Panel</h1>
      </header>

      <section className="bg-gray-800 p-8 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-amber-300">Create New Election</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
          <input
            type="text"
            placeholder="Election Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-gray-700 text-white px-4 py-3 rounded-md outline-none focus:ring focus:ring-amber-400"
          />
          <input
            type="date"
            value={applicationDeadline}
            onChange={(e) => setApplicationDeadline(e.target.value)}
            className="bg-gray-700 text-white px-4 py-3 rounded-md outline-none focus:ring focus:ring-amber-400"
          />
          <input
            type="date"
            value={resultDate}
            onChange={(e) => setResultDate(e.target.value)}
            className="bg-gray-700 text-white px-4 py-3 rounded-md outline-none focus:ring focus:ring-amber-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
          <Select onValueChange={(val) => setVotingCriteria({ ...votingCriteria, branch: val })}>
            <SelectTrigger className="w-full bg-gray-700 text-white px-4 py-3 rounded-md focus:ring focus:ring-amber-400">
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white">
              <SelectItem value="Computer">Computer</SelectItem>
              <SelectItem value="IT">IT</SelectItem>
              <SelectItem value="Mechanical">Mechanical</SelectItem>
              <SelectItem value="Electronics">Electronics</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(val) => setVotingCriteria({ ...votingCriteria, year: val })}>
            <SelectTrigger className="w-full bg-gray-700 text-white px-4 py-3 rounded-md focus:ring focus:ring-amber-400">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white">
              <SelectItem value="FE">First Year (FE)</SelectItem>
              <SelectItem value="SE">Second Year (SE)</SelectItem>
              <SelectItem value="TE">Third Year (TE)</SelectItem>
              <SelectItem value="BE">Final Year (BE)</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(val) => setVotingCriteria({ ...votingCriteria, division: val })}>
            <SelectTrigger className="w-full bg-gray-700 text-white px-4 py-3 rounded-md focus:ring focus:ring-amber-400">
              <SelectValue placeholder="Select Division" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white">
              <SelectItem value="A">A</SelectItem>
              <SelectItem value="B">B</SelectItem>
              <SelectItem value="C">C</SelectItem>
              <SelectItem value="D">D</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <button
          onClick={createElection}
          className="bg-amber-500 px-6 py-3 mt-6 rounded-md font-semibold hover:bg-amber-400 transition"
        >
          Create Election
        </button>
      </section>
    </div>
  );
};

export default AdminElectionPanel;
