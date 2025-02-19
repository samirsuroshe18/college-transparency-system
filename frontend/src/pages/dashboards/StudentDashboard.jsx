import React from "react";
import { FaUserGraduate, FaCheckCircle } from "react-icons/fa";
import { useSelector } from "react-redux";

const StudentDashboard = () => {
  const { userData } = useSelector((state) => state.auth); // 🟢 Fetch data from Redux

  // ✅ Ensure userData exists before accessing properties
  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#131314] text-white">
        <p className="text-lg text-gray-300">Loading student data...</p>
      </div>
    );
  }
 console.log(userData)
  return (
    <div className="min-h-screen bg-[#131314] text-white p-6 space-y-8">
      <header className="flex justify-between items-center py-4 px-6 bg-black/20 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-amber-500">Student Dashboard</h1>
      </header>

      <section className="bg-black/20 p-6 rounded-xl shadow-md flex items-center gap-6">
        <img
          src={userData?.profilePic || "https://via.placeholder.com/100"}
          alt="Profile"
          className="w-20 h-20 rounded-full border-2 border-amber-500"
        />
        <div>
          <h2 className="text-lg font-semibold text-amber-400">{userData?.user?.name || "Student Name"}</h2>
          <p className="text-sm text-gray-300">
            {userData?.branch || "Branch"} | Year {userData?.year || "Year"} | Division {userData?.division || "Division"}
          </p>
        </div>
      </section>

      <section className="bg-black/20 p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold text-amber-400">Student Records</h2>
        <ul className="mt-4 space-y-2">
          <li className="flex items-center gap-3 bg-black/30 p-3 rounded-md">
            <FaUserGraduate className="text-amber-500" />
            <span>Class Representative: {userData?.isCR ? "Yes" : "No"}</span>
          </li>
          <li className="flex items-center gap-3 bg-black/30 p-3 rounded-md">
            <FaCheckCircle className="text-green-500" />
            <span>Applied for Election: {userData?.appliedForElection ? "Yes" : "No"}</span>
          </li>
        </ul>
      </section>

      <section className="bg-black/20 p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold text-amber-400">Performance Stats</h2>
        <p className="text-gray-300 mt-2">Coming Soon...</p>
      </section>
    </div>
  );
};

export default StudentDashboard;
