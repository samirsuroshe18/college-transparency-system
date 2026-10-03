import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { decideApplication, listApplications, reviewApplication, submitApplication } from "../../api/applicationApi";
import { errorMessage } from "../../api/client";
import useToast from "../../utils/useToast";
import { FILE_ACCEPT, FILE_HINT, fileProblem } from "../../lib/college";

const CATEGORIES = [
    { value: "event", label: "Event" },
    { value: "budget", label: "Budget" },
    { value: "sponsorship", label: "Sponsorship" },
];
const STATUSES = ["pending", "approved", "rejected"];
const STATUS_STYLES = { pending: "bg-amber-100 text-amber-700", approved: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700" };

const emptyApplication = () => ({ title: "", description: "", category: "event" });
const fieldClass = "w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

const formatDate = (value) => new Date(value).toLocaleDateString();

// what was said about an application, and by whom
const Remark = ({ label, remark, tone }) => (
    <div className={`mt-3 p-3 rounded-md border text-sm text-gray-700 ${tone}`}>
        <span className="font-semibold">{label}:</span> {remark.comment || "No comment"}
        <span className="block text-xs text-gray-500 mt-1">
            {remark.by?.name ? `${remark.by.name}, ` : ""}{formatDate(remark.at)}
        </span>
    </div>
);

const ApplicationManagement = () => {
    const user = useSelector((state) => state.auth.userData);
    const toast = useToast();
    const isStudent = user.role === "student";
    const isFaculty = user.role === "faculty";
    const isAdmin = user.role === "admin";

    const [activeTab, setActiveTab] = useState(isStudent ? "submit" : "view");
    const [applications, setApplications] = useState(null);
    const [loadError, setLoadError] = useState("");
    const [statusFilter, setStatusFilter] = useState("pending");
    const [onlyMine, setOnlyMine] = useState(false);

    const [newApplication, setNewApplication] = useState(emptyApplication);
    const [file, setFile] = useState(null);
    const [fileError, setFileError] = useState("");
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // what a faculty member or an admin is writing, per application
    const [comments, setComments] = useState({});
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(async () => {
        try {
            setApplications(await listApplications());
            setLoadError("");
        } catch (error) {
            setLoadError(errorMessage(error));
        }
    }, []);

    useEffect(() => {
        if (activeTab === "view") load();
    }, [activeTab, load]);

    const handleChange = (e) => setNewApplication({ ...newApplication, [e.target.name]: e.target.value });

    const handleFileChange = (e) => {
        const chosen = e.target.files[0] || null;
        const problem = fileProblem(chosen);

        setFileError(problem);
        setFile(problem ? null : chosen);
        if (problem) e.target.value = "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        if (!newApplication.title.trim() || !newApplication.description.trim()) {
            setFormError("Title and description are required.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await submitApplication(newApplication, file);
            toast.success(res.message);
            setNewApplication(emptyApplication());
            setFile(null);
            setOnlyMine(true);
            setStatusFilter("pending");
            setActiveTab("view");
        } catch (error) {
            setFormError(errorMessage(error));
        } finally {
            setSubmitting(false);
        }
    };

    // sends a review or a decision and puts the server's version back into the list
    const act = async (application, request) => {
        setBusyId(application._id);
        try {
            const res = await request(comments[application._id] || "");
            toast.success(res.message);
            setApplications((current) => current.map((item) => (item._id === application._id ? res.data.application : item)));
            setComments((current) => ({ ...current, [application._id]: "" }));
        } catch (error) {
            toast.error(error);
        } finally {
            setBusyId(null);
        }
    };

    const tabClass = (tab) => `py-2 px-4 mr-2 ${activeTab === tab ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`;

    const shown = (applications || []).filter((application) => application.status === statusFilter && (!onlyMine || application.mine));
    const countOf = (status) => (applications || []).filter((application) => application.status === status && (!onlyMine || application.mine)).length;

    return (
        <div className="container mx-auto p-4 relative bg-gray-50 text-gray-900 min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Application Management</h1>

            {/* Tab Navigation */}
            <div className="flex mb-6 border-b">
                {isStudent && (
                    <button className={tabClass("submit")} onClick={() => setActiveTab("submit")}>
                        Submit Application
                    </button>
                )}
                <button className={tabClass("view")} onClick={() => setActiveTab("view")}>
                    View Applications
                </button>
            </div>

            {/* Submit Application */}
            {activeTab === "submit" && isStudent && (
                <form onSubmit={handleSubmit} className="max-w-2xl bg-white shadow-lg rounded-lg px-4 sm:px-8 pt-6 pb-8" noValidate>
                    <div className="mb-4">
                        <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">Title</label>
                        <input id="title" name="title" type="text" maxLength={120} value={newApplication.title} onChange={handleChange} className={fieldClass} placeholder="What are you asking for?" />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="category" className="block text-gray-700 text-sm font-bold mb-2">Category</label>
                        <select id="category" name="category" value={newApplication.category} onChange={handleChange} className={fieldClass}>
                            {CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                        <textarea id="description" name="description" rows="5" maxLength={2000} value={newApplication.description} onChange={handleChange} className={fieldClass} placeholder="Explain the request: what, when, how much" />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="file" className="block text-gray-700 text-sm font-bold mb-2">Supporting file</label>
                        <input id="file" type="file" accept={FILE_ACCEPT} onChange={handleFileChange} className="text-sm text-gray-600" />
                        <p className="text-xs text-gray-500 mt-1">{FILE_HINT}</p>
                        {fileError && <p className="text-sm text-red-600">{fileError}</p>}
                    </div>

                    {formError && <p role="alert" className="mb-4 text-sm text-red-600">{formError}</p>}

                    <button type="submit" disabled={submitting} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50">
                        {submitting ? "Submitting…" : "Submit Application"}
                    </button>
                    <p className="text-xs text-gray-500 mt-3">A faculty member may add a review; an admin approves or rejects. You get a notice and an email.</p>
                </form>
            )}

            {/* View Applications */}
            {activeTab === "view" && (
                <div>
                    <div className="flex flex-wrap items-center gap-2 mb-6">
                        {STATUSES.map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-lg capitalize ${statusFilter === status ? "bg-gray-700 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"}`}
                            >
                                {status} ({countOf(status)})
                            </button>
                        ))}
                        {isStudent && (
                            <label className="ml-2 inline-flex items-center gap-2 text-sm text-gray-700">
                                <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
                                Only mine
                            </label>
                        )}
                    </div>

                    {loadError && <p role="alert" className="text-red-600">{loadError}</p>}
                    {!loadError && applications === null && <p className="text-gray-500">Loading applications…</p>}
                    {applications !== null && shown.length === 0 && <p className="text-gray-500">No {statusFilter} applications.</p>}

                    <div className="space-y-4">
                        {shown.map((application) => {
                            const busy = busyId === application._id;
                            const comment = comments[application._id] || "";
                            const setComment = (value) => setComments((current) => ({ ...current, [application._id]: value }));
                            const pending = application.status === "pending";

                            return (
                                <div key={application._id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 md:p-6">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="text-lg font-semibold text-gray-900 break-words">{application.title}</h3>
                                            <p className="text-sm text-gray-500">
                                                {application.submittedBy?.name}
                                                {application.submittedBy?.department ? `, ${application.submittedBy.department}` : ""} • {formatDate(application.createdAt)}
                                                {application.mine && " • yours"}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold capitalize">{application.category}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[application.status]}`}>{application.status}</span>
                                        </div>
                                    </div>

                                    <p className="mt-3 text-gray-700 whitespace-pre-line break-words">{application.description}</p>

                                    {application.fileUrl && (
                                        <a href={application.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-blue-500 hover:underline">
                                            View supporting file
                                        </a>
                                    )}

                                    {application.review?.at && <Remark label="Faculty review" remark={application.review} tone="bg-blue-50 border-blue-200" />}
                                    {application.decision?.at && (
                                        <Remark
                                            label={application.status === "approved" ? "Approved" : "Rejected"}
                                            remark={application.decision}
                                            tone={application.status === "approved" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}
                                        />
                                    )}

                                    {pending && (isFaculty || isAdmin) && (
                                        <div className="mt-4">
                                            <label htmlFor={`comment-${application._id}`} className="block text-sm font-medium text-gray-700 mb-1">
                                                {isFaculty ? "Your review" : "Comment (required to reject)"}
                                            </label>
                                            <textarea id={`comment-${application._id}`} rows="2" maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} className={fieldClass} />
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {isFaculty && (
                                                    <button onClick={() => act(application, (text) => reviewApplication(application._id, text))} disabled={busy || !comment.trim()} className="px-4 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-50">
                                                        {application.review?.at ? "Replace review" : "Save review"}
                                                    </button>
                                                )}
                                                {isAdmin && (
                                                    <>
                                                        <button onClick={() => act(application, (text) => decideApplication(application._id, "approved", text))} disabled={busy} className="px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 disabled:opacity-50">
                                                            Approve
                                                        </button>
                                                        <button onClick={() => act(application, (text) => decideApplication(application._id, "rejected", text))} disabled={busy || !comment.trim()} className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 disabled:opacity-50">
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationManagement;
