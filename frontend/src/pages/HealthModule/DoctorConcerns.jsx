import { useCallback, useEffect, useState } from "react";
import { assessConcern, listConcerns } from "../../api/healthApi";
import { errorMessage } from "../../api/client";
import useToast from "../../utils/useToast";
import { fieldClass, formatDate, formatDay } from "./format";
import UrgencyBadge from "./UrgencyBadge.jsx";

const FILTERS = [
    { value: "open", label: "Waiting" },
    { value: "assessed", label: "Assessed" },
];
const MAX_LEAVE_DAYS = 30;

const classOf = (student) => [student?.department, student?.currentYear, student?.classDivision].filter(Boolean).join(" ");

// The doctor reads what students reported, answers, and gives leave where it is needed
const DoctorConcerns = () => {
    const toast = useToast();

    const [concerns, setConcerns] = useState(null);
    const [loadError, setLoadError] = useState("");
    const [filter, setFilter] = useState("open");

    // what the doctor is writing, per concern: { diagnosis, leaveDays }
    const [drafts, setDrafts] = useState({});
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(async () => {
        try {
            setConcerns(await listConcerns());
            setLoadError("");
        } catch (error) {
            setLoadError(errorMessage(error));
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const assess = async (concern, draft) => {
        setBusyId(concern._id);
        try {
            const res = await assessConcern(concern._id, draft.diagnosis, Number(draft.leaveDays));
            toast.success(res.message);
            setConcerns((current) => current.map((item) => (item._id === concern._id ? res.data.concern : item)));
        } catch (error) {
            toast.error(error);
        } finally {
            setBusyId(null);
        }
    };

    const shown = (concerns || []).filter((concern) => concern.status === filter);
    const countOf = (status) => (concerns || []).filter((concern) => concern.status === status).length;

    return (
        <div className="container mx-auto p-4 relative bg-gray-50 text-gray-900 min-h-screen">
            <h1 className="text-2xl font-bold mb-2">Health Concerns</h1>
            <p className="text-sm text-gray-600 mb-6">Urgent concerns come first. When you give leave, the student and the class coordinator are told the days; the coordinator is not told the diagnosis.</p>

            <div className="flex flex-wrap items-center gap-2 mb-6">
                {FILTERS.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => setFilter(option.value)}
                        className={`px-4 py-2 rounded-lg ${filter === option.value ? "bg-gray-700 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"}`}
                    >
                        {option.label} ({countOf(option.value)})
                    </button>
                ))}
            </div>

            {loadError && <p role="alert" className="text-red-600">{loadError}</p>}
            {!loadError && concerns === null && <p className="text-gray-500">Loading concerns…</p>}
            {concerns !== null && shown.length === 0 && <p className="text-gray-500">{filter === "open" ? "Nobody is waiting." : "Nothing assessed yet."}</p>}

            <div className="space-y-4">
                {shown.map((concern) => {
                    const busy = busyId === concern._id;
                    const draft = drafts[concern._id] || { diagnosis: "", leaveDays: "0" };
                    const setDraft = (changes) => setDrafts((current) => ({ ...current, [concern._id]: { ...draft, ...changes } }));
                    const days = Number(draft.leaveDays);
                    const daysOk = draft.leaveDays !== "" && Number.isInteger(days) && days >= 0 && days <= MAX_LEAVE_DAYS;

                    return (
                        <div key={concern._id} className={`bg-white border rounded-lg shadow-sm p-4 md:p-6 ${concern.urgency === "urgent" && concern.status === "open" ? "border-red-300" : "border-gray-200"}`}>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h3 className="text-lg font-semibold text-gray-900 break-words">{concern.symptoms}</h3>
                                    <p className="text-sm text-gray-500 break-words">
                                        {[concern.student?.name, concern.student?.rollNumber, classOf(concern.student)].filter(Boolean).join(" • ")} • {formatDate(concern.createdAt)}
                                    </p>
                                </div>
                                <UrgencyBadge urgency={concern.urgency} />
                            </div>

                            {concern.description && <p className="mt-3 text-gray-700 whitespace-pre-line break-words">{concern.description}</p>}

                            {concern.attachmentUrl && (
                                <a href={concern.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-blue-500 hover:underline">
                                    View file
                                </a>
                            )}

                            {concern.status === "assessed" && (
                                <div className="mt-3 p-3 rounded-md border bg-green-50 border-green-200 text-sm text-gray-700">
                                    <span className="font-semibold">Diagnosis:</span> <span className="whitespace-pre-line break-words">{concern.assessment?.diagnosis}</span>
                                    <span className="block mt-2 font-semibold">
                                        {concern.assessment?.leaveDays > 0
                                            ? `Leave: ${formatDay(concern.leaveFrom)} to ${formatDay(concern.leaveUntil)}`
                                            : "No leave given"}
                                    </span>
                                    <span className="block text-xs text-gray-500 mt-1">
                                        {concern.assessment?.by?.name ? `${concern.assessment.by.name}, ` : ""}{formatDate(concern.assessment?.at)}
                                    </span>
                                </div>
                            )}

                            {concern.status === "open" && (
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
                                    <div className="sm:col-span-3">
                                        <label htmlFor={`diagnosis-${concern._id}`} className="block text-sm font-medium text-gray-700 mb-1">Diagnosis and advice</label>
                                        <textarea id={`diagnosis-${concern._id}`} rows="2" maxLength={2000} value={draft.diagnosis} onChange={(e) => setDraft({ diagnosis: e.target.value })} className={fieldClass} />
                                    </div>
                                    <div>
                                        <label htmlFor={`leave-${concern._id}`} className="block text-sm font-medium text-gray-700 mb-1">Leave days (0 to {MAX_LEAVE_DAYS})</label>
                                        <input id={`leave-${concern._id}`} type="number" min="0" max={MAX_LEAVE_DAYS} step="1" value={draft.leaveDays} onChange={(e) => setDraft({ leaveDays: e.target.value })} className={fieldClass} />
                                    </div>
                                    <div className="sm:col-span-4 flex flex-wrap items-center gap-3">
                                        <button onClick={() => assess(concern, draft)} disabled={busy || !draft.diagnosis.trim() || !daysOk} className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50">
                                            {busy ? "Saving…" : "Save Assessment"}
                                        </button>
                                        <p className="text-xs text-gray-500">Leave starts today. An assessment cannot be changed afterwards.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DoctorConcerns;
