import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";

const AdminCollegePanel = () => {
  const [collegeDomain, setCollegeDomain] = useState("");
  const [adminEmails, setAdminEmails] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [branches, setBranches] = useState([]);
  const [newBranch, setNewBranch] = useState("");
  const [divisions, setDivisions] = useState({});

  useEffect(() => {
    fetchCollegeDetails();
  }, []);

  // ✅ Fetch College Data
  const fetchCollegeDetails = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_DOMAIN}/api/v1/college`);
      const data = await response.json();
      setCollegeDomain(data.domain);
      setAdminEmails(data.adminEmails);
      setBranches(data.branches);
      setDivisions(data.divisions);
    } catch (error) {
      console.error("Error fetching college data:", error);
    }
  };

  // ✅ Add Admin Email
  const addAdminEmail = () => {
    if (newAdminEmail && !adminEmails.includes(newAdminEmail)) {
      setAdminEmails([...adminEmails, newAdminEmail]);
      setNewAdminEmail("");
    }
  };

  // ✅ Remove Admin Email
  const removeAdminEmail = (email) => {
    setAdminEmails(adminEmails.filter((admin) => admin !== email));
  };

  // ✅ Add Branch
  const addBranch = () => {
    if (newBranch && !branches.includes(newBranch)) {
      setBranches([...branches, newBranch]);
      setDivisions({ ...divisions, [newBranch]: 1 });
      setNewBranch("");
    }
  };

  // ✅ Update Divisions
  const updateDivisions = (branch, intake) => {
    const divisionCount = Math.ceil(intake / 60);
    let divs = Array.from({ length: divisionCount }, (_, i) => String.fromCharCode(65 + i));
    setDivisions({ ...divisions, [branch]: divs });
  };

  // ✅ Save College Data
  const saveCollegeDetails = async () => {
    try {
      await fetch(`${import.meta.env.VITE_DOMAIN}/api/v1/admin/college/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: collegeDomain, adminEmails, branches, divisions }),
      });
      alert("College details saved successfully!");
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 space-y-10">
  {/* Header */}
  <header className="flex justify-between items-center py-5 px-8 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl shadow-lg">
    <h1 className="text-3xl font-extrabold tracking-wide">Admin College Panel</h1>
  </header>

  {/* College Email Domain */}
  <section className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
    <h2 className="text-xl font-bold text-blue-700">College Details</h2>
    <input
      type="text"
      placeholder="Enter college email domain (e.g., example.edu)"
      value={collegeDomain}
      onChange={(e) => setCollegeDomain(e.target.value)}
      className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg outline-none w-full mt-4 border border-gray-300 focus:ring-2 focus:ring-blue-400"
    />
  </section>

  {/* Admin Emails Management */}
  <section className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
    <h2 className="text-xl font-bold text-blue-700">Admin Emails</h2>
    <div className="flex gap-4 mt-4">
      <input
        type="email"
        placeholder="Enter admin email"
        value={newAdminEmail}
        onChange={(e) => setNewAdminEmail(e.target.value)}
        className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg outline-none w-full border border-gray-300 focus:ring-2 focus:ring-blue-400"
      />
      <button
        onClick={addAdminEmail}
        className="bg-blue-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-blue-500 transition shadow-md"
      >
        <FaPlus />
      </button>
    </div>
    <ul className="mt-4 space-y-3">
      {adminEmails.map((email, index) => (
        <li key={index} className="flex justify-between bg-gray-100 p-4 rounded-lg shadow-sm border border-gray-300">
          <span>{email}</span>
          <button onClick={() => removeAdminEmail(email)} className="text-red-500 hover:text-red-700">
            <FaTrash />
          </button>
        </li>
      ))}
    </ul>
  </section>

  {/* Branches & Divisions */}
  <section className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
    <h2 className="text-xl font-bold text-blue-700">College Branches & Divisions</h2>
    <div className="flex gap-4 mt-4">
      <input
        type="text"
        placeholder="Enter branch (e.g., Computer)"
        value={newBranch}
        onChange={(e) => setNewBranch(e.target.value)}
        className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg outline-none w-full border border-gray-300 focus:ring-2 focus:ring-blue-400"
      />
      <button
        onClick={addBranch}
        className="bg-blue-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-blue-500 transition shadow-md"
      >
        <FaPlus />
      </button>
    </div>

    {branches.length > 0 && (
      <div className="mt-4 space-y-4">
        {branches.map((branch, index) => (
          <div key={index} className="bg-gray-100 p-5 rounded-lg shadow-md border border-gray-300">
            <h3 className="text-lg font-semibold text-gray-900">{branch}</h3>
            <input
              type="number"
              placeholder="Enter intake"
              className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg outline-none mt-2 w-full border border-gray-400 focus:ring-2 focus:ring-blue-400"
              onChange={(e) => updateDivisions(branch, parseInt(e.target.value))}
            />
            <p className="mt-2 text-gray-700">Divisions: {divisions[branch]?.join(", ") || "N/A"}</p>
          </div>
        ))}
      </div>
    )}
  </section>

  {/* Save Button */}
  <button
    onClick={saveCollegeDetails}
    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-500 transition shadow-lg w-full text-lg"
  >
    Save College Details
  </button>
</div>


  );
};

export default AdminCollegePanel;
