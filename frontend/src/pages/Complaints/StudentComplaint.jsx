import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Card, CardContent } from "../../components/ui/card";
import { ThumbsUp, ThumbsDown, Eye, CheckCircle2 } from "lucide-react";
import { listComplaints, resolveComplaint, submitComplaint, voteOnComplaint, voteToReveal } from "../../api/complaintApi";
import { errorMessage } from "../../api/client";
import useToast from "../../utils/useToast";
import { FILE_ACCEPT, FILE_HINT, fileProblem } from "../../lib/college";

const emptyComplaint = () => ({ title: "", description: "", isAnonymous: false });

const fieldClass = "shadow-sm appearance-none border border-gray-200 rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

// who a complaint is from, as this user may know it
const authorLine = (complaint) => {
  if (complaint.author) {
    const revealed = complaint.revealed ? " (name revealed by the board)" : "";
    return `${complaint.author.name}${complaint.author.department ? `, ${complaint.author.department}` : ""}${revealed}`;
  }
  return complaint.mine ? "Anonymous (yours)" : "Anonymous";
};

const StudentComplaint = () => {
  const user = useSelector((state) => state.auth.userData);
  const toast = useToast();
  const isStudent = user.role === "student";
  const isAdmin = user.role === "admin";
  const isBoardMember = user.role === "faculty" && user.isBoardMember;

  const [activeTab, setActiveTab] = useState(isStudent ? "submit" : "view");
  const [complaints, setComplaints] = useState(null);
  const [loadError, setLoadError] = useState("");

  const [newComplaint, setNewComplaint] = useState(emptyComplaint);
  const [document, setDocument] = useState(null);
  const [fileError, setFileError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // the complaint whose answer is waiting, so its buttons can be disabled
  const [busyId, setBusyId] = useState(null);
  // the complaint an admin is writing a resolution for
  const [resolving, setResolving] = useState(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    try {
      setComplaints(await listComplaints());
      setLoadError("");
    } catch (error) {
      setLoadError(errorMessage(error));
    }
  }, []);

  useEffect(() => {
    if (activeTab === "view") load();
  }, [activeTab, load]);

  // puts the server's latest version of one complaint into the list
  const replace = (updated) => setComplaints((current) => current.map((item) => (item._id === updated._id ? updated : item)));

  const act = async (id, request) => {
    setBusyId(id);
    try {
      const res = await request();
      replace(res.data.complaint);
      return res;
    } catch (error) {
      toast.error(error);
      return null;
    } finally {
      setBusyId(null);
    }
  };

  // pressing the vote you already gave takes it back
  const handleVote = (complaint, value) => act(complaint._id, () => voteOnComplaint(complaint._id, complaint.myVote === value ? "none" : value));

  const handleReveal = async (complaint) => {
    const res = await act(complaint._id, () => voteToReveal(complaint._id));
    if (res) toast.success(res.data.complaint.revealed ? "The board has revealed the name" : res.message);
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;

    const res = await act(resolving._id, () => resolveComplaint(resolving._id, note));
    if (res) {
      toast.success(res.message);
      setResolving(null);
      setNote("");
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setNewComplaint({ ...newComplaint, [e.target.name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0] || null;
    const problem = fileProblem(file);

    setFileError(problem);
    setDocument(problem ? null : file);
    if (problem) e.target.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!newComplaint.title.trim() || !newComplaint.description.trim()) {
      setFormError("Title and description are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitComplaint(newComplaint, document);
      toast.success(res.message);
      setNewComplaint(emptyComplaint());
      setDocument(null);
      setActiveTab("view");
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const tabClass = (tab) => `py-2 px-4 mr-2 ${activeTab === tab ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`;

  return (
    <div className="container mx-auto p-4 relative bg-gray-50 text-gray-900 min-h-screen">
      {/* Tab Navigation */}
      <div className="flex mb-6 border-b">
        {isStudent && (
          <button className={tabClass("submit")} onClick={() => setActiveTab("submit")}>
            Submit Complaint
          </button>
        )}
        <button className={tabClass("view")} onClick={() => setActiveTab("view")}>
          View Complaints
        </button>
      </div>

      {/* Submit Complaint Form */}
      {activeTab === "submit" && isStudent && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Submit New Complaint
            </h2>
            <p className="text-gray-600">
              Please provide details about your complaint below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg px-4 sm:px-8 pt-6 pb-8 mb-4" noValidate>
            <div className="mb-6">
              <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">Title</label>
              <input id="title" type="text" name="title" maxLength={120} value={newComplaint.title} onChange={handleChange} className={fieldClass} placeholder="Enter complaint title" />
            </div>

            <div className="mb-6">
              <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description</label>
              <textarea id="description" name="description" maxLength={2000} value={newComplaint.description} onChange={handleChange} className={fieldClass} rows="4" placeholder="Describe your complaint in detail" />
            </div>

            <div className="mb-6">
              <div className="flex items-center">
                <input type="checkbox" id="isAnonymous" name="isAnonymous" checked={newComplaint.isAnonymous} onChange={handleChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                <label htmlFor="isAnonymous" className="ml-2 block text-sm text-gray-700">Submit Anonymously</label>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Your name is hidden from everyone. It is shown only if more than half of the board members vote to reveal it.
              </p>
            </div>

            <div className="mb-6">
              <label htmlFor="document" className="block text-gray-700 text-sm font-bold mb-2">Supporting Document (if any)</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-500 transition duration-200">
                <div className="space-y-1 text-center">
                  <input id="document" name="document" type="file" className="text-sm text-gray-600" onChange={handleFileChange} accept={FILE_ACCEPT} />
                  <p className="text-xs text-gray-500">{FILE_HINT}</p>
                  {document && <p className="text-sm text-green-600">Selected file: {document.name}</p>}
                  {fileError && <p className="text-sm text-red-600">{fileError}</p>}
                </div>
              </div>
            </div>

            {formError && <p role="alert" className="mb-4 text-sm text-red-600">{formError}</p>}

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit Complaint"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Complaints */}
      {activeTab === "view" && (
        <div className="mt-6">
          {loadError && <p role="alert" className="text-red-600">{loadError}</p>}
          {!loadError && complaints === null && <p className="text-gray-500">Loading complaints…</p>}
          {complaints !== null && complaints.length === 0 && <p className="text-gray-500">No complaints have been submitted.</p>}

          <div className="space-y-4">
            {(complaints || []).map((complaint) => {
              const busy = busyId === complaint._id;
              const canReveal = isBoardMember && complaint.isAnonymous && !complaint.revealed;

              return (
                <Card key={complaint._id} className="mb-4 bg-white border-gray-200">
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 break-words">
                          {complaint.title}
                          {complaint.status === "resolved" && (
                            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold align-middle">
                              <CheckCircle2 className="h-3 w-3" /> Resolved
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {authorLine(complaint)} • {new Date(complaint.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVote(complaint, "up")}
                          disabled={busy}
                          aria-label={`Support this complaint, ${complaint.upvotes} so far`}
                          aria-pressed={complaint.myVote === "up"}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm disabled:opacity-50 ${complaint.myVote === "up" ? "bg-blue-500 text-white border-blue-500" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span>{complaint.upvotes}</span>
                        </button>
                        <button
                          onClick={() => handleVote(complaint, "down")}
                          disabled={busy}
                          aria-label={`Disagree with this complaint, ${complaint.downvotes} so far`}
                          aria-pressed={complaint.myVote === "down"}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm disabled:opacity-50 ${complaint.myVote === "down" ? "bg-red-500 text-white border-red-500" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
                        >
                          <ThumbsDown className="h-4 w-4" />
                          <span>{complaint.downvotes}</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-700 whitespace-pre-line break-words">{complaint.description}</p>

                    {complaint.documentUrl && (
                      <div className="mt-4">
                        <a href={complaint.documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          View supporting document
                        </a>
                      </div>
                    )}

                    {complaint.resolution && (
                      <div className="mt-4 p-3 rounded-md bg-green-50 border border-green-200 text-sm text-gray-700">
                        <span className="font-semibold">Resolution:</span> {complaint.resolution.note}
                        <span className="block text-xs text-gray-500 mt-1">
                          {complaint.resolution.by?.name ? `${complaint.resolution.by.name}, ` : ""}{new Date(complaint.resolution.at).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {/* the board's vote on an anonymous complaint; only the board and admins see the count */}
                    {complaint.isAnonymous && !complaint.revealed && complaint.revealNeeded !== undefined && (
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <span>Votes to reveal the name: {complaint.revealVotes} of {complaint.revealNeeded} needed</span>
                        {canReveal && (
                          complaint.myRevealVote ? (
                            <span className="text-gray-500">You have voted to reveal.</span>
                          ) : (
                            <button onClick={() => handleReveal(complaint)} disabled={busy} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200 disabled:opacity-50">
                              <Eye className="h-4 w-4" /> Vote to reveal
                            </button>
                          )
                        )}
                      </div>
                    )}

                    {isAdmin && complaint.status === "open" && (
                      <div className="mt-4">
                        <button onClick={() => { setResolving(complaint); setNote(""); }} className="px-3 py-1.5 rounded-md bg-gray-700 text-white hover:bg-gray-800 text-sm">
                          Mark as resolved
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Resolution note */}
      {resolving && (
        <div className="fixed inset-0 bg-gray-600/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <form onSubmit={handleResolve} className="mt-20 w-full max-w-md bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800">Resolve: {resolving.title}</h3>
            <label htmlFor="resolution-note" className="block text-sm font-medium text-gray-600 mt-4 mb-2">What was done about it?</label>
            <textarea id="resolution-note" rows={4} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400" />
            <p className="mt-1 text-xs text-gray-500">The note is shown to everyone under the complaint.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setResolving(null)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">Cancel</button>
              <button type="submit" disabled={!note.trim() || busyId === resolving._id} className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-50">
                Resolve
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default StudentComplaint;
