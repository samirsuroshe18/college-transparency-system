import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Loader2, Clock, AlertCircle, CheckCircle2, RefreshCw, LogOut } from "lucide-react";
import { getMe, logout as logoutRequest } from "../../api/authApi";
import { currentUser, logout } from "../../redux/slices/authSlice";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ProfilePendingPage = () => {
  const user = useSelector((state) => state.auth.userData);
  const role = user?.role || "student";
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // asks the server for the latest status; an approved or rejected profile moves on by itself
  const checkAgain = async () => {
    setChecking(true);
    setNotice("");
    try {
      const res = await getMe();
      dispatch(currentUser(res.data.user));
      if (res.data.user.profileStatus === "Pending") {
        setNotice("Still under review. An admin has not decided yet.");
      } else {
        navigate("/", { replace: true });
      }
    } catch {
      setNotice("The status could not be checked. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await logoutRequest().catch(() => {});
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const steps = [
    { status: "completed", title: "Profile Submitted", icon: CheckCircle2 },
    { status: "current", title: "Under Review", icon: Clock },
    { status: "waiting", title: "Approval", icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto pt-8 md:pt-16">
        {/* Main Card */}
        <Card className="bg-white shadow-xl border-0">
          <CardContent className="p-6 md:p-8">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="relative">
                <Loader2 className="animate-spin h-16 w-16 text-blue-600" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-blue-100"></div>
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mt-6 text-gray-900">
                {role === "faculty" ? "Faculty Profile Under Review" : "Student Profile Under Review"}
              </h1>
              <p className="text-gray-600 mt-2 max-w-xl">
                An admin is reviewing your profile. You get a notice here as soon as it is decided.
              </p>
            </div>

            {/* Progress Steps */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center w-full max-w-2xl">
                {steps.map((step, index) => (
                  <React.Fragment key={step.title}>
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        step.status === 'completed' ? 'bg-green-100 text-green-600' :
                        step.status === 'current' ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        <step.icon className="w-5 h-5" />
                      </div>
                      <p className={`mt-2 text-sm font-medium ${
                        step.status === 'current' ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="flex-1 h-px bg-gray-200 mx-4 my-5" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Info Alert */}
            <Alert className="mb-6 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-600 ml-2">
                You can use the system once your profile is approved.
              </AlertDescription>
            </Alert>

            {/* What a waiting user can do */}
            {notice && <p className="text-center text-sm text-gray-600 mb-4" role="status">{notice}</p>}
            <div className="grid md:grid-cols-2 gap-4">
              <Button onClick={checkAgain} disabled={checking} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <RefreshCw className={`mr-2 h-4 w-4 ${checking ? "animate-spin" : ""}`} />
                {checking ? "Checking…" : "Check again"}
              </Button>
              <Button onClick={handleLogout} variant="outline" className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">
          © {new Date().getFullYear()} College Portal. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default ProfilePendingPage;