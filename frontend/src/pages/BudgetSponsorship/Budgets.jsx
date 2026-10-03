import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { decideBudget, listBudgets, requestBudget } from "../../api/budgetApi";
import { errorMessage } from "../../api/client";
import useToast from "../../utils/useToast";
import { FILE_ACCEPT, FILE_HINT, fileProblem } from "../../lib/college";

const CATEGORIES = [
    { value: "event", label: "Event" },
    { value: "department", label: "Department" },
    { value: "mess", label: "Mess" },
    { value: "other", label: "Other" },
];
const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map((category) => [category.value, category.label]));
const STATUSES = ["pending", "approved", "rejected"];
const STATUS_STYLES = { pending: "bg-amber-100 text-amber-700", approved: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700" };

const emptyRequest = () => ({ title: "", category: "event", description: "", requestedAmount: "" });
const fieldClass = "w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

const formatDate = (value) => new Date(value).toLocaleDateString();
// whole rupees as they are, anything else with both decimals: ₹48,500.50
const money = (amount) => {
    const value = Number(amount || 0);
    const decimals = Number.isInteger(value) ? 0 : 2;

    return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};

// Every request for money and what was decided about it, open to the whole college
const Budgets = () => {
    const user = useSelector((state) => state.auth.userData);
    const toast = useToast();
    const canRequest = user.role === "student" || user.role === "faculty";
    const isAdmin = user.role === "admin";

    const [activeTab, setActiveTab] = useState("view");
    const [budgets, setBudgets] = useState(null);
    const [totals, setTotals] = useState([]);
    const [loadError, setLoadError] = useState("");
    const [statusFilter, setStatusFilter] = useState("pending");

    const [request, setRequest] = useState(emptyRequest);
    const [bill, setBill] = useState(null);
    const [fileError, setFileError] = useState("");
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // what an admin is writing, per request: { amount, comment }
    const [drafts, setDrafts] = useState({});
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(async () => {
        try {
            const data = await listBudgets();
            setBudgets(data.budgets);
            setTotals(data.totals);
            setLoadError("");
        } catch (error) {
            setLoadError(errorMessage(error));
        }
    }, []);

    useEffect(() => {
        if (activeTab === "view") load();
    }, [activeTab, load]);

    const handleChange = (e) => setRequest({ ...request, [e.target.name]: e.target.value });

    const handleFileChange = (e) => {
        const chosen = e.target.files[0] || null;
        const problem = fileProblem(chosen);

        setFileError(problem);
        setBill(problem ? null : chosen);
        if (problem) e.target.value = "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        if (!request.title.trim() || !request.description.trim()) {
            setFormError("Title and description are required.");
            return;
        }

        if (!(Number(request.requestedAmount) > 0)) {
            setFormError("Enter the amount you are asking for.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await requestBudget(request, bill);
            toast.success(res.message);
            setRequest(emptyRequest());
            setBill(null);
            setStatusFilter("pending");
            setActiveTab("view");
        } catch (error) {
            setFormError(errorMessage(error));
        } finally {
            setSubmitting(false);
        }
    };

    const decide = async (budget, decision) => {
        setBusyId(budget._id);
        try {
            const res = await decideBudget(budget._id, decision);
            toast.success(res.message);
            setDrafts((current) => ({ ...current, [budget._id]: undefined }));
            await load();
        } catch (error) {
            toast.error(error);
        } finally {
            setBusyId(null);
        }
    };

    const tabClass = (tab) => `py-2 px-4 mr-2 ${activeTab === tab ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`;

    const shown = (budgets || []).filter((budget) => budget.status === statusFilter);
    const countOf = (status) => (budgets || []).filter((budget) => budget.status === status).length;

    return (
        <div className="container mx-auto p-4 relative bg-gray-50 text-gray-900 min-h-screen">
            <h1 className="text-2xl font-bold mb-2">Budgets and Sponsorships</h1>
            <p className="text-sm text-gray-600 mb-6">Every request for college money, and what was decided about it, is shown to everyone.</p>

            <div className="flex mb-6 border-b">
                <button className={tabClass("view")} onClick={() => setActiveTab("view")}>
                    All Requests
                </button>
                {canRequest && (
                    <button className={tabClass("submit")} onClick={() => setActiveTab("submit")}>
                        New Request
                    </button>
                )}
            </div>

            {activeTab === "submit" && canRequest && (
                <form onSubmit={handleSubmit} className="max-w-2xl bg-white shadow-lg rounded-lg px-4 sm:px-8 pt-6 pb-8" noValidate>
                    <div className="mb-4">
                        <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">Title</label>
                        <input id="title" name="title" type="text" maxLength={120} value={request.title} onChange={handleChange} className={fieldClass} placeholder="What is the money for?" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="category" className="block text-gray-700 text-sm font-bold mb-2">Category</label>
                            <select id="category" name="category" value={request.category} onChange={handleChange} className={fieldClass}>
                                {CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="requestedAmount" className="block text-gray-700 text-sm font-bold mb-2">Amount (₹)</label>
                            <input id="requestedAmount" name="requestedAmount" type="number" min="1" step="0.01" inputMode="decimal" value={request.requestedAmount} onChange={handleChange} className={fieldClass} placeholder="0" />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                        <textarea id="description" name="description" rows="5" maxLength={2000} value={request.description} onChange={handleChange} className={fieldClass} placeholder="What will be bought, and why" />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="bill" className="block text-gray-700 text-sm font-bold mb-2">Bill or quotation</label>
                        <input id="bill" type="file" accept={FILE_ACCEPT} onChange={handleFileChange} className="text-sm text-gray-600 max-w-full" />
                        <p className="text-xs text-gray-500 mt-1">{FILE_HINT}</p>
                        {fileError && <p className="text-sm text-red-600">{fileError}</p>}
                    </div>

                    {formError && <p role="alert" className="mb-4 text-sm text-red-600">{formError}</p>}

                    <button type="submit" disabled={submitting} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50">
                        {submitting ? "Submitting…" : "Submit Request"}
                    </button>
                    <p className="text-xs text-gray-500 mt-3">An admin approves the whole amount or a part of it, or rejects the request. You get a notice when it is decided.</p>
                </form>
            )}

            {activeTab === "view" && (
                <div>
                    {totals.length > 0 && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                            {totals.map((total) => (
                                <div key={total.category} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                                    <p className="text-sm font-semibold text-gray-700">{CATEGORY_LABELS[total.category]}</p>
                                    <p className="text-xs text-gray-500 mt-2">Requested</p>
                                    <p className="text-base font-semibold text-gray-900 break-words">{money(total.requested)}</p>
                                    <p className="text-xs text-gray-500 mt-1">Approved</p>
                                    <p className="text-base font-semibold text-green-700 break-words">{money(total.approved)}</p>
                                </div>
                            ))}
                        </div>
                    )}

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
                    </div>

                    {loadError && <p role="alert" className="text-red-600">{loadError}</p>}
                    {!loadError && budgets === null && <p className="text-gray-500">Loading requests…</p>}
                    {budgets !== null && shown.length === 0 && <p className="text-gray-500">No {statusFilter} requests.</p>}

                    <div className="space-y-4">
                        {shown.map((budget) => {
                            const busy = busyId === budget._id;
                            const draft = drafts[budget._id] || { amount: String(budget.requestedAmount), comment: "" };
                            const setDraft = (changes) => setDrafts((current) => ({ ...current, [budget._id]: { ...draft, ...changes } }));
                            const amount = Number(draft.amount);
                            const amountOk = amount > 0 && amount <= budget.requestedAmount;

                            return (
                                <div key={budget._id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 md:p-6">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="text-lg font-semibold text-gray-900 break-words">{budget.title}</h3>
                                            <p className="text-sm text-gray-500">
                                                {budget.requestedBy?.name}
                                                {budget.requestedBy?.department ? `, ${budget.requestedBy.department}` : ""} • {formatDate(budget.createdAt)}
                                                {budget.mine && " • yours"}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">{CATEGORY_LABELS[budget.category]}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[budget.status]}`}>{budget.status}</span>
                                        </div>
                                    </div>

                                    <p className="mt-3 text-gray-700 whitespace-pre-line break-words">{budget.description}</p>

                                    <p className="mt-3 text-sm text-gray-700">
                                        <span className="font-semibold">Requested:</span> {money(budget.requestedAmount)}
                                        {budget.status === "approved" && (
                                            <span className="ml-4"><span className="font-semibold">Approved:</span> <span className="text-green-700 font-semibold">{money(budget.approvedAmount)}</span></span>
                                        )}
                                    </p>

                                    {budget.billUrl && (
                                        <a href={budget.billUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-blue-500 hover:underline">
                                            View bill
                                        </a>
                                    )}

                                    {budget.decision?.at && (
                                        <div className={`mt-3 p-3 rounded-md border text-sm text-gray-700 ${budget.status === "approved" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                                            <span className="font-semibold capitalize">{budget.status}:</span> {budget.decision.comment || "No comment"}
                                            <span className="block text-xs text-gray-500 mt-1">
                                                {budget.decision.by?.name ? `${budget.decision.by.name}, ` : ""}{formatDate(budget.decision.at)}
                                            </span>
                                        </div>
                                    )}

                                    {budget.status === "pending" && isAdmin && (
                                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                                <label htmlFor={`amount-${budget._id}`} className="block text-sm font-medium text-gray-700 mb-1">Amount to approve (₹)</label>
                                                <input id={`amount-${budget._id}`} type="number" min="1" step="0.01" max={budget.requestedAmount} value={draft.amount} onChange={(e) => setDraft({ amount: e.target.value })} className={fieldClass} />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label htmlFor={`comment-${budget._id}`} className="block text-sm font-medium text-gray-700 mb-1">Comment (required to reject)</label>
                                                <input id={`comment-${budget._id}`} type="text" maxLength={500} value={draft.comment} onChange={(e) => setDraft({ comment: e.target.value })} className={fieldClass} />
                                            </div>
                                            <div className="sm:col-span-3 flex flex-wrap gap-2">
                                                <button onClick={() => decide(budget, { status: "approved", approvedAmount: amount, comment: draft.comment })} disabled={busy || !amountOk} className="px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 disabled:opacity-50">
                                                    Approve
                                                </button>
                                                <button onClick={() => decide(budget, { status: "rejected", comment: draft.comment })} disabled={busy || !draft.comment.trim()} className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 disabled:opacity-50">
                                                    Reject
                                                </button>
                                                {!amountOk && <p className="text-sm text-red-600 self-center">The amount must be above 0 and at most {money(budget.requestedAmount)}.</p>}
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

export default Budgets;
