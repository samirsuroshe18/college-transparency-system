import React from "react";
import { FaUserGraduate, FaCheckCircle, FaMapMarkerAlt, FaIdCard, FaUniversity, FaPhone } from "react-icons/fa";
import { useSelector } from "react-redux";

const StudentDashboard = () => {
  const { userData } = useSelector((state) => state.auth);

  if (!userData || !userData.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#131314] text-white">
        <p className="text-lg text-gray-300">Loading student data...</p>
      </div>
    );
  }

  const student = userData.user; // Extract user object

  return (
    <div className="min-h-screen bg-[#131314] text-white p-6 space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center py-4 px-6 bg-black/20 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-amber-500">Student Dashboard</h1>
      </header>

      {/* Profile Section */}
      <section className="bg-black/20 p-6 rounded-xl shadow-md flex items-center gap-6">
        <img
          src={student.profilePic || "https://via.placeholder.com/100"}
          alt="Profile"
          className="w-20 h-20 rounded-full border-2 border-amber-500"
        />
        <div>
          <h2 className="text-lg font-semibold text-amber-400">{student.name || "Student Name"}</h2>
          <p className="text-sm text-gray-300">
            {student.department} | Year {student.passingYear - student.admissionYear} | Division {student.division}
          </p>
          <p className="text-sm text-gray-300">Roll No: {student.rollno}</p>
        </div>
      </section>

      {/* Student Details */}
      <section className="bg-black/20 p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold text-amber-400">Student Details</h2>
        <ul className="mt-4 space-y-2">
          <li className="flex items-center gap-3 bg-black/30 p-3 rounded-md">
            <FaIdCard className="text-blue-500" />
            <span>Student ID: {student.studentId}</span>
          </li>
          <li className="flex items-center gap-3 bg-black/30 p-3 rounded-md">
            <FaUniversity className="text-purple-500" />
            <span>Admission Type: {student.admissionType} (Year {student.admissionYear})</span>
          </li>
          <li className="flex items-center gap-3 bg-black/30 p-3 rounded-md">
            <FaCheckCircle className="text-green-500" />
            <span>Current Semester: {student.currentSemester}</span>
          </li>
          <li className="flex items-center gap-3 bg-black/30 p-3 rounded-md">
            <FaMapMarkerAlt className="text-red-500" />
            <span>Address: {student.address}</span>
          </li>
        </ul>
      </section>

      {/* Contact Information */}
      <section className="bg-black/20 p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold text-amber-400">Contact Information</h2>
        <ul className="mt-4 space-y-2">
          <li className="flex items-center gap-3 bg-black/30 p-3 rounded-md">
            <FaPhone className="text-green-500" />
            <span>Mobile: {student.mobileNo}</span>
          </li>
          <li className="flex items-center gap-3 bg-black/30 p-3 rounded-md">
            <FaPhone className="text-green-500" />
            <span>Parent Mobile: {student.parentMobileNo}</span>
          </li>
          <li className="flex items-center gap-3 bg-black/30 p-3 rounded-md">
            <FaCheckCircle className="text-blue-500" />
            <span>Emergency Contact: {student.emergencyContact.name} ({student.emergencyContact.relation}) - {student.emergencyContact.contactNo}</span>
          </li>
        </ul>
      </section>

      {/* Additional Information */}
      <section className="bg-black/20 p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold text-amber-400">Additional Information</h2>
        <ul className="mt-4 space-y-2">
          <li className="flex items-center gap-3 bg-black/30 p-3 rounded-md">
            <FaUserGraduate className="text-amber-500" />
            <span>Hostel Resident: {student.hostelResident ? "Yes" : "No"}</span>
          </li>
          <li className="flex items-center gap-3 bg-black/30 p-3 rounded-md">
            <FaCheckCircle className="text-green-500" />
            <span>Blood Group: {student.bloodGroup}</span>
          </li>
          <li className="flex items-center gap-3 bg-black/30 p-3 rounded-md">
            <FaUniversity className="text-purple-500" />
            <span>Previous School: {student.previousSchool}</span>
          </li>
        </ul>
      </section>
    </div>
  );
};

export default StudentDashboard;
