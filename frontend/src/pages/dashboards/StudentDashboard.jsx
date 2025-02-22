import React from "react";
import { FaUserGraduate, FaCheckCircle, FaMapMarkerAlt, FaIdCard, FaUniversity, FaPhone } from "react-icons/fa";
import { useSelector } from "react-redux";

const StudentDashboard = () => {
  const { userData } = useSelector((state) => state.auth);

  if (!userData || !userData.user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <p className="text-lg">Loading student data...</p>
      </div>
    );
  }

  const student = userData.user; // Extract user object

  return (
    <div className="min-h-screen bg-[#131314] text-white p-6 space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center py-4 px-6 bg-blue-600 text-white rounded-xl shadow-md">
        <h1 className="text-2xl font-bold">Admin College Panel</h1>
      </header>

      {/* College Email Domain */}
      <section className="bg-black/20 p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold text-blue-400">College Details</h2>
        <input
          type="text"
          placeholder="Enter college email domain (e.g., example.edu)"
          value={collegeDomain}
          onChange={(e) => setCollegeDomain(e.target.value)}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg outline-none w-full mt-4"
        />
      </section>

      {/* Admin Emails Management */}
      <section className="bg-black/20 p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold text-blue-400">Admin Emails</h2>
        <div className="flex gap-4 mt-4">
          <input
            type="email"
            placeholder="Enter admin email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg outline-none w-full"
          />
          <button
            onClick={addAdminEmail}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-500 transition"
          >
            <FaPlus />
          </button>
        </div>
        <ul className="mt-4 space-y-2">
          {adminEmails.map((email, index) => (
            <li key={index} className="flex justify-between bg-gray-800 p-3 rounded-md">
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
        <h2 className="text-lg font-semibold text-blue-400">College Branches & Divisions</h2>
        <div className="flex gap-4 mt-4">
          <input
            type="text"
            placeholder="Enter branch (e.g., Computer)"
            value={newBranch}
            onChange={(e) => setNewBranch(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg outline-none w-full"
          />
          <button
            onClick={addBranch}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-500 transition"
          >
            <FaPlus />
          </button>
        </div>

        {branches.length > 0 && (
          <div className="mt-4 space-y-4">
            {branches.map((branch, index) => (
              <div key={index} className="bg-gray-800 p-4 rounded-md">
                <h3 className="text-lg font-medium text-white">{branch}</h3>
                <input
                  type="number"
                  placeholder="Enter intake"
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg outline-none mt-2 w-full"
                  onChange={(e) => updateDivisions(branch, parseInt(e.target.value))}
                />
                <p className="mt-2 text-gray-400">Divisions: {divisions[branch]?.join(", ") || "N/A"}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Save Button */}
      <button
        onClick={saveCollegeDetails}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-500 transition w-full"
      >
        Save College Details
      </button>
    </div>

  );
};

export default StudentDashboard;
