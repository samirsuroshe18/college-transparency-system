import React, { useState, useEffect } from "react";
import axios from "axios";

const BudgetSponsorshipAdmin = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // all, pending, approved, rejected

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_DOMAIN}/api/v1/budgets/`, {
        withCredentials: true
      });
      setBudgets(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to fetch budgets:", error);
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (budgetId, newStatus, approvedAmount = null) => {
    try {
      const payload = {
        status: newStatus,
        ...(approvedAmount && { approvedAmount: Number(approvedAmount) })
      };

      await axios.put(`${import.meta.env.VITE_DOMAIN}/api/v1/budgets/${budgetId}`, payload, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      });

      await fetchBudgets();
      alert("Status updated successfully!");
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  const filteredBudgets = budgets.filter(budget => {
    if (filter === "all") return true;
    return budget.status === filter;
  });

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Budget Requests Administration</h1>
        
        {/* Filter Controls */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded ${filter === "all" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded ${filter === "pending" ? "bg-yellow-500 text-white" : "bg-gray-200"}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-4 py-2 rounded ${filter === "approved" ? "bg-green-500 text-white" : "bg-gray-200"}`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter("rejected")}
            className={`px-4 py-2 rounded ${filter === "rejected" ? "bg-red-500 text-white" : "bg-gray-200"}`}
          >
            Rejected
          </button>
        </div>

        {/* Budgets List */}
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <div className="space-y-4">
            {filteredBudgets.map((budget) => (
              <div
                key={budget._id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{budget.budget}</h3>
                    <p className="text-gray-600">Category: {budget.category}</p>
                    <p className="text-gray-600">Requested Amount: ₹{budget.requestedAmount}</p>
                    {budget.approvedAmount && (
                      <p className="text-green-600">Approved Amount: ₹{budget.approvedAmount}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {budget.status === "pending" && (
                      <>
                        <input
                          type="number"
                          placeholder="Approved Amount"
                          className="border rounded px-2 py-1 w-32"
                          id={`amount-${budget._id}`}
                        />
                        <button
                          onClick={() => {
                            const amount = document.getElementById(`amount-${budget._id}`).value;
                            if (!amount) {
                              alert("Please enter an approved amount");
                              return;
                            }
                            handleStatusChange(budget._id, "approved", amount);
                          }}
                          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusChange(budget._id, "rejected")}
                          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        budget.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : budget.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
                    </span>
                  </div>
                </div>
                <p className="text-gray-700">{budget.description}</p>
                {budget.document && (
                  <a
                    href={budget.document}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 mt-2 inline-block"
                  >
                    View Document
                  </a>
                )}
              </div>
            ))}
            {filteredBudgets.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No budget requests found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetSponsorshipAdmin; 