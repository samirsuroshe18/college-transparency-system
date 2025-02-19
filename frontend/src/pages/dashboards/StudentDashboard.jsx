import React, { useState, useEffect } from "react";
import { FaUserGraduate, FaCheckCircle, FaClock } from "react-icons/fa";

const StudentDashboard = () => {
  const [student, setStudent] = useState({
    name: "",
    branch: "",
    year: "",
    division: "",
    profilePic: "",
    isCR: false,
    appliedForElection: false,
  });

  useEffect(() => {
    fetchStudentDetails();
  }, []);

  // ✅ Fetch Student Data
  const fetchStudentDetails = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/v1/student");
      const data = await response.json();
      setStudent(data);
    } catch (error) {
      console.error("Error fetching student data:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#131314] text-white p-6 space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center py-4 px-6 bg-black/20 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-amber-500">Student Dashboard</h1>
      </header>

      {/* Student Profile */}
      <section className="bg-black/20 p-6 rounded-xl shadow-md flex items-center gap-6">
        <img
          src={student.profilePic || "https://via.placeholder.com/100"}
          alt="Profile"
          className="w-20 h-20 rounded-full border-2 border-amber-500"
        />
        <div>
          <h2 className="text-lg font-semibold text-amber-400">{student.name || "Student Name"}</h2>
          <p className="text-sm text-gray-300">
            {student.branch} | Year {student.year} | Division {student.division}
          </p>
        </div>
      </section>

      {/* Student Records */}
      <section className="bg-black/20 p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold text-amber-400">Student Records</h2>
        <ul className="mt-4 space-y-2">
          <li className="flex items-center gap-3 bg-black/30 p-3 rounded-md">
            <FaUserGraduate className="text-amber-500" />
            <span>Class Representative: {student.isCR ? "Yes" : "No"}</span>
          </li>
          <li className="flex items-center gap-3 bg-black/30 p-3 rounded-md">
            <FaCheckCircle className="text-green-500" />
            <span>Applied for Election: {student.appliedForElection ? "Yes" : "No"}</span>
          </li>
        </ul>
      </section>

      {/* Placeholder for Future Stats */}
      <section className="bg-black/20 p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold text-amber-400">Performance Stats</h2>
        <p className="text-gray-300 mt-2">Coming Soon...</p>
      </section>
    </div>
  );
};

export default StudentDashboard;
