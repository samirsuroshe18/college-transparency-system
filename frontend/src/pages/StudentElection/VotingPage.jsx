import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const VotingPage = () => {
    const { electionId } = useParams();
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState([]);
    const [hasVoted, setHasVoted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedCandidate, setSelectedCandidate] = useState(null);

    useEffect(() => {
        fetchCandidates();
        checkVotingStatus();
    }, []);

    // ✅ Fetch Candidates API Call
    const fetchCandidates = async () => {
        try {
            const res = await axios.get(`http://localhost:8000/api/v1/admin/elections/live`, { withCredentials: true });
            const response = await fetch(`${import.meta.env.VITE_DOMAIN}/api/v1/admin/elections/upcoming`);
            console.log(response);
            console.log(res);
        } catch (error) {
            console.error("Error fetching candidates:", error);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Check if User has Already Voted
    const checkVotingStatus = async () => {
        try {
            const res = await axios.get(`/api/elections/has-voted/${electionId}`, { withCredentials: true });
            setHasVoted(res.data.hasVoted);
        } catch (error) {
            console.error("Error checking vote status:", error);
        }
    };

    // ✅ Vote Submission Handler
    const handleVote = async () => {
        if (!selectedCandidate) {
            alert("Please select a candidate before voting.");
            return;
        }

        const confirmVote = window.confirm(`Are you sure you want to vote for ${selectedCandidate.name}?`);
        if (!confirmVote) return;

        try {
            await axios.post("/api/elections/vote", { electionId, candidateId: selectedCandidate._id }, { withCredentials: true });
            alert("Vote submitted successfully!");
            setHasVoted(true);
        } catch (error) {
            console.error("Error submitting vote:", error);
            alert("Failed to submit vote. Please try again.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-gray-900 text-white rounded-lg shadow-md mt-10">
            <h1 className="text-3xl font-bold text-center mb-6">Vote for Your Candidate</h1>

            {loading ? (
                <p className="text-center text-gray-400">Loading candidates...</p>
            ) : (
                <>
                    {hasVoted ? (
                        <p className="text-center text-green-500 font-semibold">You have already voted in this election.</p>
                    ) : (
                        <>
                            {candidates.length === 0 ? (
                                <p className="text-center text-gray-400">No candidates available for this election.</p>
                            ) : (
                                <div className="space-y-4">
                                    {candidates.map((candidate) => (
                                        <div 
                                            key={candidate._id} 
                                            className={`flex items-center gap-4 p-4 border border-gray-700 rounded-lg cursor-pointer ${selectedCandidate?._id === candidate._id ? "border-blue-500 bg-gray-800" : "hover:bg-gray-800"}`}
                                            onClick={() => setSelectedCandidate(candidate)}
                                        >
                                            <img src={candidate.profilePic} alt="Profile" className="w-14 h-14 rounded-full object-cover border-2 border-gray-500" />
                                            <div>
                                                <h2 className="text-lg font-semibold">{candidate.name}</h2>
                                                <p className="text-gray-400 text-sm">{candidate.classDivision}, {candidate.department}</p>
                                                <p className="text-gray-400 text-sm">Agenda: <span className="text-white">{candidate.agenda}</span></p>
                                                <p className="text-gray-400 text-xs">{candidate.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <button 
                                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg disabled:bg-gray-500"
                                onClick={handleVote}
                                disabled={!selectedCandidate}
                            >
                                Submit Vote
                            </button>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default VotingPage;
