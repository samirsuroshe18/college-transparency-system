import React, { useState, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectValue,
} from "@/components/ui/select";

const AdminElectionPanel = () => {
  const [elections, setElections] = useState([]);
  const [title, setTitle] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [resultDate, setResultDate] = useState("");
  const [votingCriteria, setVotingCriteria] = useState({
    branch: "",
    year: "",
    division: "",
  });
  const [selectedElectionId, setSelectedElectionId] = useState(null);
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_DOMAIN}/api/v1/admin/elections/upcoming`
      );
      const data = await response.json();
      setElections(data);
    } catch (error) {
      console.error("Error fetching elections:", error);
    }
  };

  const fetchCandidates = async (electionId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_DOMAIN}/api/v1/admin/elections/${electionId}/candidates`
      );
      const data = await response.json();
      setCandidates(data);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    }
  };

  const createElection = async () => {
    if (!title || !applicationDeadline || !resultDate) return;

    try {
      await fetch(
        `${import.meta.env.VITE_DOMAIN}/api/v1/admin/elections/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            electionDate: resultDate,
            applicationDeadline,
            votingCriteria,
          }),
        }
      );
      fetchElections();
      setTitle("");
      setApplicationDeadline("");
      setResultDate("");
      setVotingCriteria({ branch: "", year: "", division: "" });
    } catch (error) {
      console.error("Error creating election:", error);
    }
  };

  // Handle Election Selection
  const handleElectionSelect = (electionId) => {
    setSelectedElectionId(electionId);
    fetchCandidates(electionId); // Fetch candidates when an election is selected
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 p-8 space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center py-4 px-8 bg-gray-200 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-blue-500">Admin Election Panel</h1>
      </header>

      {/* Create Election Section */}
      <section className="bg-gray-100 p-8 rounded-lg shadow-lg border border-gray-300">
        <h2 className="text-xl font-semibold text-blue-500">Create New Election</h2>

        {/* Input Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
          <input
            type="text"
            placeholder="Election Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={applicationDeadline}
            onChange={(e) => setApplicationDeadline(e.target.value)}
            className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={resultDate}
            onChange={(e) => setResultDate(e.target.value)}
            className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
          <Select onValueChange={(val) => setVotingCriteria({ ...votingCriteria, branch: val })}>
            <SelectTrigger className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent className="bg-white text-gray-900 border border-gray-300">
              <SelectItem value="Computer">Computer</SelectItem>
              <SelectItem value="IT">IT</SelectItem>
              <SelectItem value="Mechanical">Mechanical</SelectItem>
              <SelectItem value="Electronics">Electronics</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(val) => setVotingCriteria({ ...votingCriteria, year: val })}>
            <SelectTrigger className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent className="bg-white text-gray-900 border border-gray-300">
              <SelectItem value="FE">First Year (FE)</SelectItem>
              <SelectItem value="SE">Second Year (SE)</SelectItem>
              <SelectItem value="TE">Third Year (TE)</SelectItem>
              <SelectItem value="BE">Final Year (BE)</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(val) => setVotingCriteria({ ...votingCriteria, division: val })}>
            <SelectTrigger className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
              <SelectValue placeholder="Select Division" />
            </SelectTrigger>
            <SelectContent className="bg-white text-gray-900 border border-gray-300">
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
          className="w-full mt-6 py-3 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-400 transition duration-300 shadow-lg"
        >
          Create Election
        </button>
      </section>

      {/* Election Listing Section */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold text-blue-500">Available Elections</h2>
        <div className="mt-4">
          <Select onValueChange={handleElectionSelect}>
            <SelectTrigger className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
              <SelectValue placeholder="Select Election" />
            </SelectTrigger>
            <SelectContent className="bg-white text-gray-900 border border-gray-300">
              {elections.map((election) => (
                <SelectItem key={election.id} value={election.id}>
                  {election.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Candidate Listings Section */}
      {selectedElectionId && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Candidates Applied</h2>
          <div className="mt-4">
            {candidates.length === 0 ? (
              <p>No candidates found for this election.</p>
            ) : (
              <ul className="space-y-2">
                {candidates.map((candidate) => (
                  <li key={candidate.id} className="p-4 bg-gray-100 rounded-md shadow-md">
                    <h3 className="font-semibold">{candidate.name}</h3>
                    <p>{candidate.branch} - {candidate.year} - {candidate.division}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default AdminElectionPanel;
