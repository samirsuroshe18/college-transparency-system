import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { approveStudent, getPendingFaculty, getPendingStudents, rejectStudent } from "../../api/authApi";
import { useDispatch } from "react-redux";
import { handleAxiosError } from "../../utils/handleAxiosError";
import { showNotificationWithTimeout } from "../../redux/slices/notificationSlice";

const PendingProfilesPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("faculty");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const dispatch = useDispatch();
  const [profiles, setProfiles] = useState({});

  // Update the table rendering to use the new data structure
  const currentProfiles = profiles[activeTab] || [];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const students = await getPendingStudents(setLoading, dispatch);
        const faculty = await getPendingFaculty(setLoading, dispatch);
        console.log(students.data);
        setProfiles({student: students.data, faculty: faculty.data});
      } catch (error) {
        setLoading(false);
        dispatch(
          showNotificationWithTimeout({
            show: true,
            type: "error",
            message: handleAxiosError(error),
          })
        );
        navigate("/login"); // Navigate to login in case of error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch, navigate]);

  const handleViewProfile = (profile) => {
    setSelectedProfile(profile);
    setIsDialogOpen(true);
  };

  const onApprove = async (id) => {
    console.log("Profile approved with id:", id);
    try {
      const approve = await approveStudent({id}, setLoading, dispatch);
      showNotificationWithTimeout({ show: true, type: "success", message: approve.message });
      setIsDialogOpen(false);
    } catch (error) {
      setLoading(false);
        dispatch(
          showNotificationWithTimeout({
            show: true,
            type: "error",
            message: handleAxiosError(error),
          })
        );
    }
  }

  const onReject = async (id, message) => {
    console.log("Profile rejected with id:", id, "and message:", message);
    try {
      const approve = await rejectStudent({id, rejectionReason: message}, setLoading, dispatch);
      setIsRejectDialogOpen(false);
      setIsDialogOpen(false);
    } catch (error) {
      setLoading(false);
        dispatch(
          showNotificationWithTimeout({
            show: true,
            type: "error",
            message: handleAxiosError(error),
          })
        );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-700 mb-2">
          Pending Profile Approvals
        </h1>
        <p className="text-gray-500 mb-6">
          Review and approve pending profile requests
        </p>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab("faculty")}
            className={`px-4 py-2 rounded-lg ${
              activeTab === "faculty"
                ? "bg-gray-700 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            Faculty Profiles
          </button>
          <button
            onClick={() => setActiveTab("student")}
            className={`px-4 py-2 rounded-lg ${
              activeTab === "student"
                ? "bg-gray-700 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            Student Profiles
          </button>
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Designation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentProfiles.map((profile) => (
                <tr key={profile.email} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {profile.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {profile.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {profile.designation || profile.rollNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewProfile(profile)}
                      className="text-gray-600 hover:text-gray-900 bg-gray-100 px-3 py-1 rounded-full"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Dialog - Updated to handle both faculty and student profiles */}
        {isDialogOpen && selectedProfile && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-lg bg-white">
              {/* Dialog Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-700">
                  {selectedProfile.role === 'student' ? 'Student Profile' : 'Faculty Profile'}
                </h3>
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              {/* Images Section */}
              <div className="flex justify-center gap-8 mb-6">
                <div className="text-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 mx-auto">
                    <img
                      src={selectedProfile.profilePic}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-600">Profile Picture</p>
                </div>
                <div className="text-center">
                  <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200 mx-auto">
                    <img
                      src={selectedProfile.idProof}
                      alt="ID Proof"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-600">ID Proof</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* Personal Information */}
                <div>
                  <h4 className="text-lg font-medium text-gray-700 mb-3 pb-2 border-b">
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Full Name</p>
                      <p className="text-gray-700">{selectedProfile.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-gray-700">{selectedProfile.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone Number</p>
                      <p className="text-gray-700">{selectedProfile.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                      <p className="text-gray-700">
                        {selectedProfile.dateOfBirth ? new Date(selectedProfile.dateOfBirth).toLocaleDateString() : 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Gender</p>
                      <p className="text-gray-700 capitalize">{selectedProfile.gender || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Blood Group</p>
                      <p className="text-gray-700">{selectedProfile.bloodGroup || 'Not provided'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-500">Address</p>
                      <p className="text-gray-700">{selectedProfile.address || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Academic Information - For Students */}
                {selectedProfile.role === 'student' && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-700 mb-3 pb-2 border-b">
                      Academic Information
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Department</p>
                        <p className="text-gray-700 capitalize">
                          {selectedProfile.department ? selectedProfile.department.replace(/-/g, ' ') : 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Semester</p>
                        <p className="text-gray-700">{selectedProfile.semester || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Division</p>
                        <p className="text-gray-700">{selectedProfile.division || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Roll Number</p>
                        <p className="text-gray-700">{selectedProfile.rollNumber || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Admission Year</p>
                        <p className="text-gray-700">{selectedProfile.admissionYear || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">CGPA</p>
                        <p className="text-gray-700">{selectedProfile.cgpa || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Category</p>
                        <p className="text-gray-700">{selectedProfile.category || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Scholarship Status</p>
                        <p className="text-gray-700">{selectedProfile.scholarshipStatus || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Parent Information - For Students */}
                {selectedProfile.role === 'student' && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-700 mb-3 pb-2 border-b">
                      Parent Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Parent Name</p>
                        <p className="text-gray-700">{selectedProfile.parentName || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Parent Contact</p>
                        <p className="text-gray-700">{selectedProfile.parentContact || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Professional Information - For Faculty */}
                {selectedProfile.role === 'faculty' && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-700 mb-3 pb-2 border-b">
                      Professional Information
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Department</p>
                        <p className="text-gray-700 capitalize">
                          {selectedProfile.department ? selectedProfile.department.replace(/-/g, ' ') : 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Designation</p>
                        <p className="text-gray-700 capitalize">{selectedProfile.designation || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Qualification</p>
                        <p className="text-gray-700 uppercase">{selectedProfile.qualification || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Joining Date</p>
                        <p className="text-gray-700">
                          {selectedProfile.joiningDate ? new Date(selectedProfile.joiningDate).toLocaleDateString() : 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Board Member</p>
                        <p className="text-gray-700">
                          {selectedProfile.isBoardMember !== undefined ? (selectedProfile.isBoardMember ? "Yes" : "No") : 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Role</p>
                        <p className="text-gray-700 capitalize">{selectedProfile.role || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex justify-end space-x-3">
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
                <button
                  onClick={() => setIsRejectDialogOpen(true)}
                  className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                >
                  Reject
                </button>
                <button onClick={() => onApprove(selectedProfile._id)} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800">
                  Approve Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Reason Dialog */}
        {isRejectDialogOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[60]">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-lg bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700">
                  Rejection Reason
                </h3>
                <button
                  onClick={() => {
                    setIsRejectDialogOpen(false);
                    setRejectionReason("");
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Please provide a reason for rejection
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-gray-700 placeholder-gray-400"
                  rows="4"
                  placeholder="Enter the reason for rejection..."
                ></textarea>
                <p className="mt-1 text-sm text-gray-500">
                  This reason will be shared with the faculty member.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsRejectDialogOpen(false);
                    setRejectionReason("");
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onReject(selectedProfile._id, rejectionReason)}
                  disabled={!rejectionReason.trim()}
                  className={`px-4 py-2 bg-red-600 text-white rounded-lg ${
                    rejectionReason.trim() 
                      ? 'hover:bg-red-700' 
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingProfilesPage;