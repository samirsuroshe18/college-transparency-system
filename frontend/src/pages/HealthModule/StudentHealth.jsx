import { useCallback, useEffect, useState } from "react";
import { listConcerns, reportConcern } from "../../api/healthApi";
import { errorMessage } from "../../api/client";
import useToast from "../../utils/useToast";
import { FILE_ACCEPT, FILE_HINT, fileProblem } from "../../lib/college";
import { fieldClass, formatDate, formatDay, STATUS_STYLES } from "./format";
import UrgencyBadge from "./UrgencyBadge.jsx";

const emptyConcern = () => ({ symptoms: "", description: "", urgency: "normal" });

// A student tells the college doctor what is wrong and reads the doctor's answer
const StudentHealth = () => {
    const toast = useToast();

    const [activeTab, setActiveTab] = useState("view");
    const [concerns, setConcerns] = useState(null);
    const [loadError, setLoadError] = useState("");

    const [concern, setConcern] = useState(emptyConcern);
    const [file, setFile] = useState(null);
    const [fileError, setFileError] = useState("");
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(async () => {
        try {
            setConcerns(await listConcerns());
            setLoadError("");
        } catch (error) {
            setLoadError(errorMessage(error));
        }
    }, []);

    useEffect(() => {
        if (activeTab === "view") load();
    }, [activeTab, load]);

    const handleChange = (e) => setConcern({ ...concern, [e.target.name]: e.target.value });

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

        if (!concern.symptoms.trim()) {
            setFormError("Describe your symptoms.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await reportConcern(concern, file);
            toast.success(res.message);
            setConcern(emptyConcern());
            setFile(null);
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
            <h1 className="text-2xl font-bold mb-2">Health and Leave</h1>
            <p className="text-sm text-gray-600 mb-6">Only you and the college doctor can read what you write here. Your class coordinator is told about a leave, never about the illness.</p>

            <div className="flex mb-6 border-b">
                <button className={tabClass("view")} onClick={() => setActiveTab("view")}>
                    My Concerns
                </button>
                <button className={tabClass("report")} onClick={() => setActiveTab("report")}>
                    Report a Concern
                </button>
            </div>

            {activeTab === "report" && (
                <form onSubmit={handleSubmit} className="max-w-2xl bg-white shadow-lg rounded-lg px-4 sm:px-8 pt-6 pb-8" noValidate>
                    <div className="mb-4">
                        <label htmlFor="symptoms" className="block text-gray-700 text-sm font-bold mb-2">Symptoms</label>
                        <input id="symptoms" name="symptoms" type="text" maxLength={300} value={concern.symptoms} onChange={handleChange} className={fieldClass} placeholder="For example: fever and headache since yesterday" />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Details</label>
                        <textarea id="description" name="description" rows="4" maxLength={2000} value={concern.description} onChange={handleChange} className={fieldClass} placeholder="Anything the doctor should know (optional)" />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="urgency" className="block text-gray-700 text-sm font-bold mb-2">How urgent is it?</label>
                        <select id="urgency" name="urgency" value={concern.urgency} onChange={handleChange} className={fieldClass}>
                            <option value="normal">Normal</option>
                            <option value="urgent">Urgent</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">In an emergency, go to the medical room or call the college ambulance. Do not wait for an answer here.</p>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="attachment" className="block text-gray-700 text-sm font-bold mb-2">Report or prescription</label>
                        <input id="attachment" type="file" accept={FILE_ACCEPT} onChange={handleFileChange} className="text-sm text-gray-600 max-w-full" />
                        <p className="text-xs text-gray-500 mt-1">{FILE_HINT}</p>
                        {fileError && <p className="text-sm text-red-600">{fileError}</p>}
                    </div>

                    {formError && <p role="alert" className="mb-4 text-sm text-red-600">{formError}</p>}

                    <button type="submit" disabled={submitting} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50">
                        {submitting ? "Sending…" : "Send to the Doctor"}
                    </button>
                </form>
            )}

            {activeTab === "view" && (
                <div>
                    {loadError && <p role="alert" className="text-red-600">{loadError}</p>}
                    {!loadError && concerns === null && <p className="text-gray-500">Loading your concerns…</p>}
                    {concerns !== null && concerns.length === 0 && <p className="text-gray-500">You have not reported anything.</p>}

                    <div className="space-y-4">
                        {(concerns || []).map((item) => (
                            <div key={item._id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 md:p-6">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-semibold text-gray-900 break-words">{item.symptoms}</h3>
                                        <p className="text-sm text-gray-500">{formatDate(item.createdAt)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <UrgencyBadge urgency={item.urgency} />
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[item.status]}`}>
                                            {item.status === "open" ? "Waiting for the doctor" : "Assessed"}
                                        </span>
                                    </div>
                                </div>

                                {item.description && <p className="mt-3 text-gray-700 whitespace-pre-line break-words">{item.description}</p>}

                                {item.attachmentUrl && (
                                    <a href={item.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-blue-500 hover:underline">
                                        View file
                                    </a>
                                )}

                                {item.status === "assessed" && (
                                    <div className="mt-3 p-3 rounded-md border bg-green-50 border-green-200 text-sm text-gray-700">
                                        <span className="font-semibold">Doctor&apos;s answer:</span> <span className="whitespace-pre-line break-words">{item.assessment?.diagnosis}</span>
                                        <span className="block mt-2 font-semibold">
                                            {item.assessment?.leaveDays > 0
                                                ? `Medical leave: ${formatDay(item.leaveFrom)} to ${formatDay(item.leaveUntil)} (${item.assessment.leaveDays} ${item.assessment.leaveDays === 1 ? "day" : "days"})`
                                                : "No leave given"}
                                        </span>
                                        <span className="block text-xs text-gray-500 mt-1">
                                            {item.assessment?.by?.name ? `${item.assessment.by.name}, ` : ""}{formatDate(item.assessment?.at)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentHealth;
