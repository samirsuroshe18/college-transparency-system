import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { applyAsCandidate, castVote, getElection, listElections } from "../../api/electionApi";
import { errorMessage } from "../../api/client";
import useToast from "../../utils/useToast";

const STAGES = ["applications", "voting", "closed"];
const TAB_LABELS = ["Upcoming", "Live", "Completed"];

const formatDate = (value) => new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

// who an election is for, in words
const describeEligibility = (rules = {}) => {
  const parts = [rules.department, rules.year, rules.division && `Division ${rules.division}`].filter(Boolean);
  return parts.length > 0 ? `For ${parts.join(", ")}` : "Open to all students";
};

const share = (votes, total) => (total > 0 ? Math.round((votes / total) * 100) : 0);

const Bar = ({ value, color }) => (
  <div className="mt-2 h-2 w-full rounded-full bg-gray-200" role="img" aria-label={`${value} percent`}>
    <div className={`h-2 rounded-full ${color}`} style={{ width: `${value}%` }} />
  </div>
);

const STATUS_STYLES = { Pending: "bg-amber-100 text-amber-700", Approved: "bg-green-100 text-green-700", Rejected: "bg-red-100 text-red-700" };

// One election with its candidates. "detail" is what the server says about it for this user.
const ElectionCard = ({ detail, onApply, onVote, busy }) => {
  const { election, candidates, myCandidacy, winners, eligible, hasVoted } = detail;
  const totalVotes = candidates.reduce((sum, candidate) => sum + candidate.votes, 0);
  const winnerIds = winners.map((winner) => winner._id);

  return (
    <motion.div whileHover={{ scale: 1.02 }}>
      <Card className="shadow-lg bg-white border-gray-200 h-full">
        <CardContent className="p-6">
          <h2 className={`text-xl font-semibold ${election.stage === "voting" ? "text-green-600" : election.stage === "closed" ? "text-gray-700" : "text-blue-500"}`}>
            {election.title}
          </h2>
          {election.description && <p className="text-gray-600 mt-1">{election.description}</p>}
          <p className="text-sm text-gray-500 mt-1">{describeEligibility(election.eligibility)}</p>

          {election.stage === "applications" && (
            <>
              <p className="text-gray-600 mt-2">Applications close: {formatDate(election.applicationDeadline)}</p>
              <p className="text-gray-600">Voting day: {formatDate(election.votingDay)}</p>
              <p className="text-sm text-gray-500 mt-2">
                {candidates.length} approved {candidates.length === 1 ? "candidate" : "candidates"} so far
              </p>

              {myCandidacy ? (
                <p className="mt-4 text-sm text-gray-700">
                  Your application:{" "}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[myCandidacy.status]}`}>{myCandidacy.status}</span>
                </p>
              ) : eligible ? (
                <button onClick={() => onApply(election)} className="mt-4 px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600">
                  Apply Now
                </button>
              ) : null}
            </>
          )}

          {election.stage === "voting" && (
            <>
              <p className="text-gray-600 mt-2">Voting ends: {formatDate(election.votingDay)}</p>
              {hasVoted && <p className="mt-2 text-sm font-semibold text-green-600">You have voted in this election.</p>}
              {!eligible && <p className="mt-2 text-sm text-gray-500">You can follow this election; voting is for eligible students.</p>}
            </>
          )}

          {election.stage === "closed" && (
            <>
              <p className="text-gray-600 mt-2">Completed on: {formatDate(election.endedAt || election.votingDay)}</p>
              <p className="mt-2 text-sm font-semibold text-gray-800">
                {winners.length === 0 && "No votes were cast."}
                {winners.length === 1 && `Winner: ${winners[0].student?.name}`}
                {winners.length > 1 && `Tie between: ${winners.map((winner) => winner.student?.name).join(", ")}`}
              </p>
            </>
          )}

          {election.stage !== "applications" && candidates.map((candidate) => (
            <div key={candidate._id} className="mt-4">
              <div className="flex justify-between items-center gap-3">
                <div className="min-w-0">
                  <span className="font-medium text-gray-900">
                    {candidate.student?.name}
                    {winnerIds.includes(candidate._id) && <span className="ml-2 text-xs font-semibold text-green-700">Winner</span>}
                  </span>
                  <p className="text-sm text-gray-500 break-words">{candidate.agenda}</p>
                </div>
                {election.stage === "voting" && eligible && !hasVoted ? (
                  <button
                    onClick={() => onVote(election, candidate)}
                    disabled={busy}
                    className="shrink-0 px-3 py-1.5 rounded-md bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                  >
                    Vote
                  </button>
                ) : (
                  <span className="shrink-0 text-sm text-gray-700">{candidate.votes} {candidate.votes === 1 ? "vote" : "votes"}</span>
                )}
              </div>
              <Bar value={share(candidate.votes, totalVotes)} color={election.stage === "voting" ? "bg-green-500" : "bg-gray-500"} />
            </div>
          ))}

          {election.stage !== "applications" && candidates.length === 0 && (
            <p className="mt-4 text-sm text-gray-500">No approved candidates.</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const StudentElectionPanel = () => {
  const user = useSelector((state) => state.auth.userData);
  const toast = useToast();
  const [details, setDetails] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [tabValue, setTabValue] = useState(1);
  const [busy, setBusy] = useState(false);

  // the application dialog
  const [applyingTo, setApplyingTo] = useState(null);
  const [applicationData, setApplicationData] = useState({ agenda: "", experience: "" });
  const [applicationError, setApplicationError] = useState("");

  // the vote to confirm
  const [pendingVote, setPendingVote] = useState(null);

  const load = useCallback(async () => {
    try {
      const elections = await listElections();
      // the list has the stages; candidates and this user's part come with each election
      // an election that cannot be loaded (removed a moment ago, say) is left out; the others still show
      const answers = await Promise.allSettled(elections.map((election) => getElection(election._id)));
      setDetails(answers.filter((answer) => answer.status === 'fulfilled').map((answer) => answer.value));
      setLoadError("");
    } catch (error) {
      setLoadError(errorMessage(error));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openApplication = (election) => {
    setApplyingTo(election);
    setApplicationData({ agenda: "", experience: "" });
    setApplicationError("");
  };

  const submitApplication = async (e) => {
    e.preventDefault();

    if (!applicationData.agenda.trim()) {
      setApplicationError("Agenda is required");
      return;
    }

    setBusy(true);
    try {
      const res = await applyAsCandidate(applyingTo._id, applicationData);
      toast.success(res.message);
      setApplyingTo(null);
      await load();
    } catch (error) {
      setApplicationError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const confirmVote = async () => {
    setBusy(true);
    try {
      const res = await castVote(pendingVote.election._id, pendingVote.candidate._id);
      toast.success(res.message);
      await load();
    } catch (error) {
      toast.error(error);
    } finally {
      setBusy(false);
      setPendingVote(null);
    }
  };

  const shown = (details || []).filter((detail) => detail.election.stage === STAGES[tabValue]);
  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen p-6 bg-gray-50 text-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-3xl font-bold text-blue-600">Student Election Panel</h1>
        {user.role === "admin" && (
          <Link to="/admin-election" className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600">Manage elections</Link>
        )}
      </div>

      {/* the page is light whatever the theme of the frame, so the tabs carry their own colours */}
      <div className="flex border-b border-gray-200" role="tablist">
        {TAB_LABELS.map((label, index) => (
          <button
            key={label}
            role="tab"
            aria-selected={tabValue === index}
            onClick={() => setTabValue(index)}
            className={`py-2 px-4 mr-2 ${tabValue === index ? "border-b-2 border-blue-500 text-blue-600 font-medium" : "text-gray-500 hover:text-gray-700"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loadError && <p role="alert" className="mt-6 text-red-600">{loadError}</p>}
      {!loadError && details === null && <p className="mt-6 text-gray-500">Loading elections…</p>}
      {details !== null && shown.length === 0 && (
        <p className="mt-6 text-gray-500">
          {tabValue === 0 && "No election is taking applications right now."}
          {tabValue === 1 && "No election is open for voting right now."}
          {tabValue === 2 && "No election has been completed yet."}
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shown.map((detail) => (
          <ElectionCard
            key={detail.election._id}
            detail={detail}
            busy={busy}
            onApply={openApplication}
            onVote={(election, candidate) => setPendingVote({ election, candidate })}
          />
        ))}
      </div>

      {/* Apply as a candidate */}
      {applyingTo && (
        <div className="fixed inset-0 bg-gray-600/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <form onSubmit={submitApplication} className="mt-16 w-full max-w-md bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800">Apply for {applyingTo.title}</h3>
            <div className="space-y-4 mt-4">
              <div>
                <label htmlFor="candidate-name" className="block text-sm font-medium text-gray-700">Name</label>
                <input id="candidate-name" type="text" value={user.name} disabled className={`${inputClass} bg-gray-200`} />
              </div>
              <div>
                <label htmlFor="agenda" className="block text-sm font-medium text-gray-700">Agenda</label>
                <textarea id="agenda" rows={3} maxLength={2000} value={applicationData.agenda} onChange={(e) => setApplicationData({ ...applicationData, agenda: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700">Experience</label>
                <textarea id="experience" rows={2} maxLength={2000} value={applicationData.experience} onChange={(e) => setApplicationData({ ...applicationData, experience: e.target.value })} className={inputClass} />
              </div>
              {applicationError && <p role="alert" className="text-sm text-red-600">{applicationError}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setApplyingTo(null)} className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200">Cancel</button>
              <button type="submit" disabled={busy} className="px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 disabled:opacity-50">
                {busy ? "Submitting…" : "Submit"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm a vote: it cannot be changed afterwards */}
      {pendingVote && (
        <div className="fixed inset-0 bg-gray-600/50 z-50 flex items-start justify-center p-4">
          <div className="mt-24 w-full max-w-md bg-white rounded-lg shadow-lg p-6" role="alertdialog" aria-labelledby="confirm-vote">
            <h3 id="confirm-vote" className="text-lg font-semibold text-gray-800">Vote for {pendingVote.candidate.student?.name}?</h3>
            <p className="mt-2 text-sm text-gray-600">
              In {pendingVote.election.title}. You can vote once, and a vote cannot be changed.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setPendingVote(null)} className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200">Cancel</button>
              <button onClick={confirmVote} disabled={busy} className="px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 disabled:opacity-50">
                {busy ? "Voting…" : "Confirm vote"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentElectionPanel;
