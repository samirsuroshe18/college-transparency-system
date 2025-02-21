import React from "react";
import { useSelector } from "react-redux";
import { Loader2 } from "lucide-react";

const ProfilePendingPage = () => {
  const user = useSelector((state) => state.auth.userData);
  const role = user?.role || "student";

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
      <div className="max-w-lg bg-white shadow-lg rounded-lg p-6 text-center">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
        <h2 className="text-2xl font-semibold mt-4 text-gray-800">
          {role === "faculty" ? "Faculty Profile Pending" : "Student Profile Pending"}
        </h2>
        <p className="text-gray-600 mt-2">
          Your profile is under review. Please wait for approval from the administration.
        </p>
        <p className="mt-4 text-gray-500 text-sm">
          If you think this is taking too long, please contact support.
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

export default ProfilePendingPage;
