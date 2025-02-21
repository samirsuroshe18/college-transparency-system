import React from "react";
import { useSelector } from "react-redux";
import { AlertCircle } from "lucide-react";

const ProfileRejectedPage = () => {
  const user = useSelector((state) => state.auth.userData);
  const role = user?.role || "student"; // Default to "student" if role is missing
  const rejectionReason = user?.rejectionReason || "Your profile did not meet the required criteria.";

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
      <div className="max-w-lg bg-white shadow-lg rounded-lg p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
        <h2 className="text-2xl font-semibold mt-4 text-gray-800">
          {role === "faculty" ? "Faculty Profile Rejected" : "Student Profile Rejected"}
        </h2>
        <p className="text-gray-600 mt-2">
          Unfortunately, your profile has been rejected. Please check the reason below.
        </p>
        <div className="mt-4 bg-red-100 text-red-700 p-3 rounded-lg border border-red-400">
          <strong>Reason:</strong> {rejectionReason}
        </div>
        <p className="mt-4 text-gray-500 text-sm">
          If you believe this was a mistake or need further assistance, please contact support.
        </p>
        <div className="mt-4">
          <a
            href="mailto:support@college.edu"
            className="text-blue-600 hover:underline font-medium"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProfileRejectedPage;
