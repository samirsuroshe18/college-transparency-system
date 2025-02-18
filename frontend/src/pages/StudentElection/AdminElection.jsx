import React, { useState, useEffect } from "react";
import { FaChevronDown, FaCheck, FaTimes } from "react-icons/fa";

const AdminElectionPanel = () => {
  const [elections, setElections] = useState([]);
  const [title, setTitle] = useState("");
  const [electionDate, setElectionDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedElection, setSelectedElection] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  useEffect(() => {
    fetchElections();
  }, []);

  // ✅ Fetch Elections
  const fetchElections = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/v1/elections");
      const data = await response.json();
      setElections(data);
    } catch (error) {
      console.error("Error fetching elections:", error);
    }
  };

  // ✅ Create a new Election
  const createElection = async () => {
    if (!title || !electionDate || !deadline) return;

    try {
      await fetch("http://localhost:3000/api/v1/admin/elections/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, electionDate, applicationDeadline: deadline }),
      });
      fetchElections(); // Refresh data after creation
      setTitle("");
      setElectionDate("");
      setDeadline("");
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
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <input
            type="text"
            placeholder="Election Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-black/50 text-white px-4 py-2 rounded-lg outline-none w-full sm:w-auto"
          />
          <input
            type="date"
            value={electionDate}
            onChange={(e) => setElectionDate(e.target.value)}
            className="bg-black/50 text-white px-4 py-2 rounded-lg outline-none w-full sm:w-auto"
          />
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="bg-black/50 text-white px-4 py-2 rounded-lg outline-none w-full sm:w-auto"
          />
          <button
            onClick={createElection}
            className="bg-amber-500 px-6 py-2 rounded-lg font-semibold hover:bg-amber-400 transition"
          >
            Create
          </button>
        </div>
      </section>

      {/* Ongoing Elections */}
      <section className="bg-black/20 p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold text-amber-400">Ongoing Elections</h2>
        {elections.length === 0 ? (
          <p className="text-gray-400 mt-2">No ongoing elections.</p>
        ) : (
          <div className="space-y-4 mt-4">
            {elections.map((election) => (
              <div key={election._id} className="bg-black/30 p-4 rounded-lg">
                <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleElection(election._id)}>
                  <h3 className="text-lg font-medium">{election.title}</h3>
                  <FaChevronDown className="text-amber-400" />
                </div>
                {selectedElection === election._id && (
                  <div className="mt-4 space-y-2">
                    {election.applications.length === 0 ? (
                      <p className="text-gray-400">No applications submitted.</p>
                    ) : (
                      election.applications.map((applicant) => (
                        <div key={applicant._id} className="flex justify-between bg-black/50 p-3 rounded-md">
                          <span>{applicant.name}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setShowConfirmModal(true);
                                setConfirmData({ id: applicant._id, action: "approved" });
                              }}
                              className="bg-green-500 px-3 py-1 rounded-md"
                            >
                              <FaCheck />
                            </button>
                            <button
                              onClick={() => {
                                setShowConfirmModal(true);
                                setConfirmData({ id: applicant._id, action: "rejected" });
                              }}
                              className="bg-red-500 px-3 py-1 rounded-md"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[#1a1a1a] p-6 rounded-lg shadow-lg w-96 text-center">
            <h2 className="text-lg font-semibold text-amber-400">Confirm Action</h2>
            <p className="mt-2">Are you sure you want to {confirmData.action} this application?</p>
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={() => handleApproval(confirmData.id, confirmData.action)}
                className="bg-amber-500 px-6 py-2 rounded-lg font-semibold hover:bg-amber-400 transition"
              >
                Yes
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="bg-gray-500 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminElectionPanel;
