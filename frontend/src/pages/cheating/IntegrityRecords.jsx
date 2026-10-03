import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { addRecord, listRecords, removeRecord } from "../../api/integrityApi";
import { errorMessage } from "../../api/client";
import useToast from "../../utils/useToast";
import { FILE_ACCEPT, FILE_HINT, fileProblem } from "../../lib/college";

const emptyRecord = () => ({ rollNumber: "", reason: "" });
const fieldClass = "w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

const formatDate = (value) => new Date(value).toLocaleDateString();

// Cases of academic dishonesty, open to the whole college. Faculty and admins add
// them; an admin can remove one.
const IntegrityRecords = () => {
    const user = useSelector((state) => state.auth.userData);
    const toast = useToast();
    const canRecord = user.role === "faculty" || user.role === "admin";
    const isAdmin = user.role === "admin";

    const [activeTab, setActiveTab] = useState("view");
    const [records, setRecords] = useState(null);
    const [loadError, setLoadError] = useState("");

    const [record, setRecord] = useState(emptyRecord);
    const [proof, setProof] = useState(null);
    const [fileError, setFileError] = useState("");
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(async () => {
        try {
            setRecords(await listRecords());
            setLoadError("");
        } catch (error) {
            setLoadError(errorMessage(error));
        }
    }, []);

    useEffect(() => {
        if (activeTab === "view") load();
    }, [activeTab, load]);

    const handleChange = (e) => setRecord({ ...record, [e.target.name]: e.target.value });

    const handleFileChange = (e) => {
        const chosen = e.target.files[0] || null;
        const problem = fileProblem(chosen);

        setFileError(problem);
        setProof(problem ? null : chosen);
        if (problem) e.target.value = "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        if (!record.rollNumber.trim() || !record.reason.trim()) {
            setFormError("Roll number and reason are required.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await addRecord(record, proof);
            toast.success(res.message);
            setRecord(emptyRecord());
            setProof(null);
            setActiveTab("view");
        } catch (error) {
            setFormError(errorMessage(error));
        } finally {
            setSubmitting(false);
        }
    };

    const remove = async (item) => {
        if (!window.confirm(`Remove the record about ${item.studentName}? This cannot be undone.`)) return;

        setBusyId(item._id);
        try {
            const res = await removeRecord(item._id);
            toast.success(res.message);
            setRecords((current) => current.filter((one) => one._id !== item._id));
        } catch (error) {
            toast.error(error);
        } finally {
            setBusyId(null);
        }
    };

    const tabClass = (tab) => `py-2 px-4 mr-2 ${activeTab === tab ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`;

    return (
        <div className="container mx-auto p-4 relative bg-gray-50 text-gray-900 min-h-screen">
            <h1 className="text-2xl font-bold mb-2">Academic Integrity Records</h1>
            <p className="text-sm text-gray-600 mb-6">Cases of cheating in examinations and assignments, recorded by faculty and shown to everyone.</p>

            {canRecord && (
                <div className="flex mb-6 border-b">
                    <button className={tabClass("view")} onClick={() => setActiveTab("view")}>
                        All Records
                    </button>
                    <button className={tabClass("add")} onClick={() => setActiveTab("add")}>
                        Add Record
                    </button>
                </div>
            )}

            {activeTab === "add" && canRecord && (
                <form onSubmit={handleSubmit} className="max-w-2xl bg-white shadow-lg rounded-lg px-4 sm:px-8 pt-6 pb-8" noValidate>
                    <div className="mb-4">
                        <label htmlFor="rollNumber" className="block text-gray-700 text-sm font-bold mb-2">Student&apos;s roll number</label>
                        <input id="rollNumber" name="rollNumber" type="text" maxLength={40} value={record.rollNumber} onChange={handleChange} className={fieldClass} placeholder="For example DEMO-IT-SE-A-01" />
                        <p className="text-xs text-gray-500 mt-1">The name, department and year are taken from the student&apos;s profile.</p>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="reason" className="block text-gray-700 text-sm font-bold mb-2">What happened</label>
                        <textarea id="reason" name="reason" rows="4" maxLength={500} value={record.reason} onChange={handleChange} className={fieldClass} placeholder="The examination or assignment, and what the student did" />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="proof" className="block text-gray-700 text-sm font-bold mb-2">Proof</label>
                        <input id="proof" type="file" accept={FILE_ACCEPT} onChange={handleFileChange} className="text-sm text-gray-600 max-w-full" />
                        <p className="text-xs text-gray-500 mt-1">{FILE_HINT}</p>
                        {fileError && <p className="text-sm text-red-600">{fileError}</p>}
                    </div>

                    {formError && <p role="alert" className="mb-4 text-sm text-red-600">{formError}</p>}

                    <button type="submit" disabled={submitting} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50">
                        {submitting ? "Saving…" : "Add Record"}
                    </button>
                    <p className="text-xs text-gray-500 mt-3">The record is public, and the student gets a notice about it.</p>
                </form>
            )}

            {activeTab === "view" && (
                <div>
                    {loadError && <p role="alert" className="text-red-600">{loadError}</p>}
                    {!loadError && records === null && <p className="text-gray-500">Loading records…</p>}
                    {records !== null && records.length === 0 && <p className="text-gray-500">No records.</p>}

                    <div className="space-y-4">
                        {(records || []).map((item) => (
                            <div key={item._id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 md:p-6">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-semibold text-gray-900 break-words">{item.studentName}</h3>
                                        <p className="text-sm text-gray-500 break-words">
                                            {[item.rollNumber, item.department, item.year].filter(Boolean).join(" • ")}
                                        </p>
                                    </div>
                                    {isAdmin && (
                                        <button onClick={() => remove(item)} disabled={busyId === item._id} className="px-3 py-1 rounded-md text-sm bg-red-500 text-white hover:bg-red-600 disabled:opacity-50">
                                            Remove
                                        </button>
                                    )}
                                </div>

                                <p className="mt-3 text-gray-700 whitespace-pre-line break-words">{item.reason}</p>

                                {item.proofUrl && (
                                    <a href={item.proofUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-blue-500 hover:underline">
                                        View proof
                                    </a>
                                )}

                                <p className="mt-3 text-xs text-gray-500">
                                    Recorded{item.recordedBy?.name ? ` by ${item.recordedBy.name}` : ""} on {formatDate(item.createdAt)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default IntegrityRecords;
