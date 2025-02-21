import React, { useState } from 'react';

const PendingProfilesPage = () => {
  // Sample data - replace with your actual data
  const [activeTab, setActiveTab] = useState('faculty');
  const [facultyProfiles] = useState([
    {
      id: 1,
      name: 'Dr. John Doe',
      email: 'john.doe@university.edu',
      department: 'Computer Science',
      designation: 'Associate Professor',
      employeeId: 'FAC001',
      submittedDate: '2024-02-15'
    },
    {
      id: 2,
      name: 'Dr. Jane Smith',
      email: 'jane.smith@university.edu',
      department: 'Electrical Engineering',
      designation: 'Professor',
      employeeId: 'FAC002',
      submittedDate: '2024-02-16'
    }
  ]);

  const [studentProfiles] = useState([
    {
      id: 1,
      name: 'Alice Johnson',
      email: 'alice.j@university.edu',
      department: 'Computer Science',
      rollNumber: 'CS2024001',
      semester: '4th',
      submittedDate: '2024-02-14'
    },
    {
      id: 2,
      name: 'Bob Wilson',
      email: 'bob.w@university.edu',
      department: 'Mechanical Engineering',
      rollNumber: 'ME2024003',
      semester: '2nd',
      submittedDate: '2024-02-15'
    }
  ]);

  const handleApprove = (id, type) => {
    console.log(`Approved ${type} profile with id: ${id}`);
  };

  const handleReject = (id, type) => {
    console.log(`Rejected ${type} profile with id: ${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Pending Profile Approvals</h1>
          <p className="text-gray-600 mt-2">Review and approve pending profile requests</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('faculty')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'faculty'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Faculty Profiles
          </button>
          <button
            onClick={() => setActiveTab('student')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'student'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Student Profiles
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'faculty' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {facultyProfiles.map((profile) => (
                    <tr key={profile.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{profile.name}</div>
                        <div className="text-sm text-gray-500">{profile.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{profile.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{profile.designation}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{profile.employeeId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{profile.submittedDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleApprove(profile.id, 'faculty')}
                          className="text-green-600 hover:text-green-900 bg-green-100 px-3 py-1 rounded-full"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(profile.id, 'faculty')}
                          className="text-red-600 hover:text-red-900 bg-red-100 px-3 py-1 rounded-full"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {studentProfiles.map((profile) => (
                    <tr key={profile.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{profile.name}</div>
                        <div className="text-sm text-gray-500">{profile.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{profile.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{profile.rollNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{profile.semester}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{profile.submittedDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleApprove(profile.id, 'student')}
                          className="text-green-600 hover:text-green-900 bg-green-100 px-3 py-1 rounded-full"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(profile.id, 'student')}
                          className="text-red-600 hover:text-red-900 bg-red-100 px-3 py-1 rounded-full"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingProfilesPage;