import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPendingStudents } from "../../api/authApi";
import { useDispatch } from "react-redux";

const PendingProfilesPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("faculty");
  const dispatch = useDispatch();
  const [studentProfiles, setStudentProfiles] = useState([{}]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getPendingStudents(setLoading, dispatch);
        console.log(res.data);
        setStudentProfiles(res.data.data);
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

  const facultyProfiles = [
    {
      id: 1,
      name: "Dr. John Doe",
      email: "john.doe@university.edu",
      department: "Computer Science",
      designation: "Associate Professor",
      employeeId: "FAC001",
      submittedDate: "2024-02-15",
    },
    {
      id: 2,
      name: "Dr. Jane Smith",
      email: "jane.smith@university.edu",
      department: "Electrical Engineering",
      designation: "Professor",
      employeeId: "FAC002",
      submittedDate: "2024-02-16",
    },
  ];

  const handleViewProfile = (profile, type) => {
    navigate(`/profile/${type}/${profile.id}`, { state: { profile, type } });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800">
          Pending Profile Approvals
        </h1>
        <p className="text-gray-600 mt-2">
          Review and approve pending profile requests
        </p>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab("faculty")}
            className={`px-4 py-2 rounded-lg ${activeTab === "faculty" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
          >
            Faculty Profiles
          </button>
          <button
            onClick={() => setActiveTab("student")}
            className={`px-4 py-2 rounded-lg ${activeTab === "student" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
          >
            Student Profiles
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(activeTab === "faculty"
                  ? facultyProfiles
                  : studentProfiles
                ).map((profile) => (
                  <tr key={profile._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {profile.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {profile.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {profile.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activeTab === "faculty"
                        ? profile.facultyId
                        : profile.rollNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {profile.createdAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link to="/profile-info" state={profile}>
                        <button className="text-blue-600 hover:text-blue-900 bg-blue-100 px-3 py-1 rounded-full">
                          View
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingProfilesPage;
