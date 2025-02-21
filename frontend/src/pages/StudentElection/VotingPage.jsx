import { useState, useEffect } from "react";
import { Card, CardContent, Button } from "@windmill/react-ui";
import { toast } from "react-hot-toast";
import axios from "axios";

export default function VotingPage() {
    const [candidates, setCandidates] = useState([]);
    const [selectedCandidate, setSelectedCandidate] = useState(null);

    useEffect(() => {
        // Fetch candidates from API
        axios.get("/api/candidates")
            .then((res) => setCandidates(res.data))
            .catch(() => toast.error("Failed to load candidates"));
    }, []);

    const handleVote = async () => {
        if (!selectedCandidate) {
            toast.error("Please select a candidate to vote!");
            return;
        }

        try {
            await axios.post("/api/vote", { candidateId: selectedCandidate });
            toast.success("Vote submitted successfully!");
        } catch (error) {
            toast.error("Failed to submit vote");
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Vote for Your Candidate</h1>
            <div className="space-y-4">
                {candidates.map((candidate) => (
                    <Card
                        key={candidate.id}
                        className={`p-4 cursor-pointer ${selectedCandidate === candidate.id ? "border-blue-500" : "border-gray-300"
                            }`}
                        onClick={() => setSelectedCandidate(candidate.id)}
                    >
                        <CardContent>
                            <h2 className="text-lg font-semibold">{candidate.name}</h2>
                            <p className="text-sm text-gray-600">{candidate.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Button className="mt-4 w-full" onClick={handleVote}>
                Submit Vote
            </Button>
        </div>
    );
}
