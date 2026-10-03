import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createElection, decideCandidate, endElection, getElection, listElections } from "../../api/electionApi";
import { errorMessage } from "../../api/client";
import useToast from "../../utils/useToast";
import { DEPARTMENTS, DIVISIONS, YEARS } from "../../lib/college";

const STAGE_LABELS = { applications: "Taking applications", voting: "Open for voting", closed: "Closed" };
const STATUS_STYLES = { Pending: "bg-amber-100 text-amber-700", Approved: "bg-green-100 text-green-700", Rejected: "bg-red-100 text-red-700" };

const fieldClass = "w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500";

const emptyForm = () => ({ title: "", description: "", applicationDeadline: "", votingDay: "", department: "", year: "", division: "" });

const formatDate = (value) => new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

const AdminElectionPanel = () => {
  const toast = useToast();
  const [elections, setElections] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadElections = useCallback(async () => {
    try {
      setElections(await listElections());
    } catch (error) {
      toast.error(error);
    }
  }, [toast]);

  const loadDetail = useCallback(async (id) => {
    if (!id) {
      setDetail(null);
      return;
    }
    try {
      setDetail(await getElection(id));
    } catch (error) {
      toast.error(error);
    }
  }, [toast]);

  useEffect(() => {
    loadElections();
  }, [loadElections]);

  useEffect(() => {
    loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const update = (field) => (e) => setForm((current) => ({ ...current, [field]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.title.trim() || !form.applicationDeadline || !form.votingDay) {
      setFormError("Title, application deadline and voting day are required.");
      return;
    }

    setCreating(true);
    try {
      const res = await createElection({
        title: form.title,
        description: form.description,
        // applications close at the end of the chosen day
        applicationDeadline: new Date(`${form.applicationDeadline}T23:59:59`).toISOString(),
        votingDay: form.votingDay,
        eligibility: { department: form.department, year: form.year, division: form.division },
      });
      toast.success(res.message);
      setForm(emptyForm());
      await loadElections();
      setSelectedId(res.data.election._id);
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setCreating(false);
    }
  };

  // runs one admin action on the selected election and shows the result
  const act = async (request) => {
    setBusy(true);
    try {
      const res = await request();
      toast.success(res.message);
      await Promise.all([loadElections(), loadDetail(selectedId)]);
    } catch (error) {
      toast.error(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4 md:p-8 space-y-8">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-center gap-3 py-4 px-4 md:px-8 bg-gray-200 rounded-lg shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-500">Admin Election Panel</h1>
        <Link to="/election" className="text-blue-600 hover:underline">View as everyone sees it</Link>
      </header>

      {/* Create Election Section */}
      <form onSubmit={handleCreate} className="bg-gray-100 p-4 md:p-8 rounded-lg shadow-lg border border-gray-300" noValidate>
        <h2 className="text-xl font-semibold text-blue-500">Create New Election</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
          <div>
            <label htmlFor="title" className="block text-sm text-gray-600 mb-1">Election title</label>
            <input id="title" type="text" maxLength={120} placeholder="Election Title" value={form.title} onChange={update("title")} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="applicationDeadline" className="block text-sm text-gray-600 mb-1">Applications close on</label>
            <input id="applicationDeadline" type="date" value={form.applicationDeadline} onChange={update("applicationDeadline")} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="votingDay" className="block text-sm text-gray-600 mb-1">Voting day</label>
            <input id="votingDay" type="date" value={form.votingDay} onChange={update("votingDay")} className={fieldClass} />
          </div>
        </div>

        <div className="mt-6">
          <label htmlFor="description" className="block text-sm text-gray-600 mb-1">Description (optional)</label>
          <input id="description" type="text" maxLength={2000} value={form.description} onChange={update("description")} className={fieldClass} />
        </div>

        <p className="text-sm text-gray-600 mt-6">Who may stand and vote. Leave a field on &quot;Any&quot; to include everyone.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-2">
          <select aria-label="Department" value={form.department} onChange={update("department")} className={fieldClass}>
            <option value="">Any department</option>
            {DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
          </select>
          <select aria-label="Year" value={form.year} onChange={update("year")} className={fieldClass}>
            <option value="">Any year</option>
            {YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
          <select aria-label="Division" value={form.division} onChange={update("division")} className={fieldClass}>
            <option value="">Any division</option>
            {DIVISIONS.map((division) => <option key={division} value={division}>{division}</option>)}
          </select>
        </div>

        {formError && <p role="alert" className="mt-4 text-red-600">{formError}</p>}

        <button
          type="submit"
          disabled={creating}
          className="w-full mt-6 py-3 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-400 transition duration-300 shadow-lg disabled:opacity-50"
        >
          {creating ? "Creating…" : "Create Election"}
        </button>
      </form>

      {/* Election Listing Section */}
      <section>
        <h2 className="text-xl font-semibold text-blue-500">Available Elections</h2>
        <div className="mt-4">
          <select aria-label="Select election" value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className={fieldClass}>
            <option value="">{elections === null ? "Loading…" : "Select Election"}</option>
            {(elections || []).map((election) => (
              <option key={election._id} value={election._id}>
                {election.title} ({STAGE_LABELS[election.stage]})
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Candidate Listings Section */}
      {detail && (
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-blue-500">Candidates Applied</h2>
              <p className="text-sm text-gray-600">
                {STAGE_LABELS[detail.election.stage]} · applications until {formatDate(detail.election.applicationDeadline)} · voting day {formatDate(detail.election.votingDay)}
              </p>
            </div>
            {detail.election.stage !== "closed" && (
              <button
                onClick={() => act(() => endElection(detail.election._id))}
                disabled={busy}
                className="px-4 py-2 rounded-md bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                End election now
              </button>
            )}
          </div>

          <div className="mt-4">
            {detail.candidates.length === 0 ? (
              <p className="text-gray-600">No candidates found for this election.</p>
            ) : (
              <ul className="space-y-2">
                {detail.candidates.map((candidate) => (
                  <li key={candidate._id} className="p-4 bg-gray-100 rounded-md shadow-md">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold">
                          {candidate.student?.name}
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[candidate.status]}`}>{candidate.status}</span>
                        </h3>
                        <p className="text-sm text-gray-600">
                          {[candidate.student?.department, candidate.student?.currentYear, candidate.student?.classDivision].filter(Boolean).join(" - ")}
                          {candidate.student?.rollNumber && ` · ${candidate.student.rollNumber}`}
                        </p>
                        <p className="mt-2 text-sm break-words"><span className="font-medium">Agenda:</span> {candidate.agenda}</p>
                        {candidate.experience && <p className="text-sm break-words"><span className="font-medium">Experience:</span> {candidate.experience}</p>}
                        {detail.election.stage !== "applications" && candidate.status === "Approved" && (
                          <p className="mt-1 text-sm text-gray-700">{candidate.votes} {candidate.votes === 1 ? "vote" : "votes"}</p>
                        )}
                      </div>

                      {detail.election.stage !== "closed" && (
                        <div className="flex gap-2">
                          {candidate.status !== "Approved" && (
                            <button onClick={() => act(() => decideCandidate(detail.election._id, candidate._id, "Approved"))} disabled={busy} className="px-3 py-1.5 rounded-md bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-50">
                              Approve
                            </button>
                          )}
                          {candidate.status !== "Rejected" && (
                            <button onClick={() => act(() => decideCandidate(detail.election._id, candidate._id, "Rejected"))} disabled={busy} className="px-3 py-1.5 rounded-md bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50">
                              Reject
                            </button>
                          )}
                        </div>
                      )}
                    </div>
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
