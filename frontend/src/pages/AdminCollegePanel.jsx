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
      const response = await fetch("http://localhost:3000/api/v1/college");
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
      await fetch("http://localhost:3000/api/v1/admin/college/save", {
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
    <div className="min-h-screen bg-[#131314] text-white p-6 space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center py-4 px-6 bg-black/20 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-amber-500">Admin College Panel</h1>
      </header>

      {/* College Email Domain */}
      <section className="bg-black/20 p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold text-amber-400">College Details</h2>
        <input
          type="text"
          placeholder="Enter college email domain (e.g., example.edu)"
          value={collegeDomain}
          onChange={(e) => setCollegeDomain(e.target.value)}
          className="bg-black/50 text-white px-4 py-2 rounded-lg outline-none w-full mt-4"
        />
      </section>

      {/* Admin Emails Management */}
      <section className="bg-black/20 p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold text-amber-400">Admin Emails</h2>
        <div className="flex gap-4 mt-4">
          <input
            type="email"
            placeholder="Enter admin email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            className="bg-black/50 text-white px-4 py-2 rounded-lg outline-none w-full"
          />
          <button
            onClick={addAdminEmail}
            className="bg-amber-500 px-4 py-2 rounded-lg font-semibold hover:bg-amber-400 transition"
          >
            <FaPlus />
          </button>
        </div>
        <ul className="mt-4 space-y-2">
          {adminEmails.map((email, index) => (
            <li key={index} className="flex justify-between bg-black/30 p-3 rounded-md">
              <span>{email}</span>
              <button onClick={() => removeAdminEmail(email)} className="text-red-500">
                <FaTrash />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Branches & Divisions */}
      <section className="bg-black/20 p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold text-amber-400">College Branches & Divisions</h2>
        <div className="flex gap-4 mt-4">
          <input
            type="text"
            placeholder="Enter branch (e.g., Computer)"
            value={newBranch}
            onChange={(e) => setNewBranch(e.target.value)}
            className="bg-black/50 text-white px-4 py-2 rounded-lg outline-none w-full"
          />
          <button
            onClick={addBranch}
            className="bg-amber-500 px-4 py-2 rounded-lg font-semibold hover:bg-amber-400 transition"
          >
            <FaPlus />
          </button>
        </div>

        {branches.length > 0 && (
          <div className="mt-4 space-y-4">
            {branches.map((branch, index) => (
              <div key={index} className="bg-black/30 p-4 rounded-md">
                <h3 className="text-lg font-medium">{branch}</h3>
                <input
                  type="number"
                  placeholder="Enter intake"
                  className="bg-black/50 text-white px-4 py-2 rounded-lg outline-none mt-2 w-full"
                  onChange={(e) => updateDivisions(branch, parseInt(e.target.value))}
                />
                <p className="mt-2">Divisions: {divisions[branch]?.join(", ") || "N/A"}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Save Button */}
      <button
        onClick={saveCollegeDetails}
        className="bg-amber-500 px-6 py-2 rounded-lg font-semibold hover:bg-amber-400 transition w-full"
      >
        Save College Details
      </button>
    </div>
  );
};

export default AdminCollegePanel;
