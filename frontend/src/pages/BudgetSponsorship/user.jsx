import React, { useState, useEffect } from "react";
import axios from "axios";

const BudgetSponsorshipUser = () => {
  const [activeTab, setActiveTab] = useState("submit");
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    budget: "",
    requestedAmount: "",
    document: null,
    category: "",
    description: "",
    status: "pending"
  });
  const [editId, setEditId] = useState(null);
  const categories = [
    "event",
    "department",
    "mess",
    "other"
  ];

  useEffect(() => {
    fetchBudgets(formData);
  }, []);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/budgets");
      setBudgets(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to fetch budgets:", error);
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Basic validation
      console.log("Current formData:", formData);

      if (!formData.budget || !formData.requestedAmount || !formData.category || !formData.description) {
        alert("Please fill in all required fields (Budget Title, Amount, Category, and Description)");
        return;
      }

      // Prepare budget data (excluding document)
      const payload = {
        budget: formData.budget,
        requestedAmount: Number(formData.requestedAmount),
        category: formData.category,
        description: formData.description,
        status: "pending"
      };

      console.log("Sending payload:", payload);

      // Updated endpoint
      const response = await axios.post("/api/v1/budgets/", payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      console.log("Response:", response.data);

      if (response.data.success) {
        await fetchBudgets();
        setModalOpen(false);
        setFormData({
          budget: "",
          requestedAmount: "",
          document: null,
          category: "",
          description: "",
          status: "pending"
        });
        alert("Budget submitted successfully!");
      } else {
        throw new Error(response.data.error || "Failed to submit budget");
      }
    } catch (error) {
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        formData: formData,
        payload: payload
      });
      alert(
        error.response?.data?.error || 
        error.response?.data?.message || 
        error.message || 
        "Failed to submit budget. Please try again."
      );
    }
  };
  
  
  

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/budgets/${id}`);
      fetchBudgets();
    } catch (error) {
      console.error("Failed to delete budget");
    }
  };

  return (
    <div className="container mx-auto p-4 relative">
      {/* Tab Navigation */}
      <div className="flex mb-6 border-b">
        <button
          className={`py-2 px-4 mr-2 ${activeTab === "submit" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`}
          onClick={() => setActiveTab("submit")}
        >
          Submit Budget Request
        </button>
        <button
          className={`py-2 px-4 ${activeTab === "view" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`}
          onClick={() => setActiveTab("view")}
        >
          View Requests
        </button>
      </div>

      {/* Submit Budget Form */}
      {activeTab === "submit" && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Submit New Budget Request
            </h2>
            <p className="text-gray-600">
              Please provide details about your budget request below.
            </p>
          </div>

          <div className="bg-white shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4">
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Budget Title
              </label>
              <input
                type="text"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="shadow-sm appearance-none border border-gray-200 rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
                placeholder="Enter budget title"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Requested Amount
              </label>
              <input
                type="number"
                value={formData.requestedAmount}
                onChange={(e) => setFormData({ ...formData, requestedAmount: e.target.value })}
                className="shadow-sm appearance-none border border-gray-200 rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
                placeholder="Enter amount"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="shadow-sm appearance-none border border-gray-200 rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="shadow-sm appearance-none border border-gray-200 rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
                rows="4"
                placeholder="Describe your budget request"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Supporting Document
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-500 transition duration-200">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload a file</span>
                      <input
                        type="file"
                        className="sr-only"
                        onChange={(e) => setFormData({ ...formData, document: e.target.files[0] })}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX, JPG, JPEG, PNG up to 10MB
                  </p>
                  {formData.document && (
                    <p className="text-sm text-green-600">
                      Selected file: {formData.document.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={handleSave}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transform transition hover:scale-105 duration-200 ease-in-out"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Budgets */}
      {activeTab === "view" && (
        <div className="mt-6">
          <div className="space-y-4">
            {budgets.length > 0 ? (
              budgets.map((budget) => (
                <div key={budget._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{budget.budget}</h3>
                      <p className="text-sm text-gray-500">
                        Category: {budget.category} • Status: {budget.status}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        ₹{budget.requestedAmount}
                      </span>
                      {budget.approvedAmount > 0 && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          Approved: ₹{budget.approvedAmount}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{budget.description}</p>
                  {budget.document && (
                    <a
                      href={budget.document}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Document
                    </a>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                No budget requests found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetSponsorshipUser;
