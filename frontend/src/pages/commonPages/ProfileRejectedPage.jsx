import React from "react";
import { useSelector } from "react-redux";
import { AlertCircle, Mail, ArrowRight, RefreshCw, FileEdit, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ProfileRejectedPage = () => {
  const user = useSelector((state) => state.auth.userData);
  const role = user?.role || "student";
  const rejectionReason = user?.rejectionReason || "Your profile did not meet the required criteria.";

  const nextSteps = [
    {
      icon: FileEdit,
      title: "Review and Update",
      description: "Review the rejection reason and update your profile accordingly.",
      action: "Edit Profile",
      link: "/edit-profile"
    },
    {
      icon: RefreshCw,
      title: "Resubmit",
      description: "Submit your profile again after making the necessary changes.",
      action: "Resubmit",
      link: user?.role == "student" ? "/student-profile" : "/student-profile"
    },
    {
      icon: Mail,
      title: "Need Help?",
      description: "Contact our support team for guidance and assistance.",
      action: "Contact Support",
      link: "mailto:support@college.edu"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto pt-8 md:pt-16">
        {/* Main Card */}
        <Card className="bg-white shadow-xl border-0">
          <CardContent className="p-6 md:p-8">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="rounded-full bg-red-100 p-4">
                <AlertCircle className="h-12 w-12 text-red-600" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mt-6 text-gray-900">
                {role === "faculty" ? "Faculty Profile Not Approved" : "Student Profile Not Approved"}
              </h1>
              <p className="text-gray-600 mt-2 max-w-xl">
                We apologize, but we couldn't approve your profile at this time. 
                Don't worry - we'll guide you through the next steps.
              </p>
            </div>

            {/* Rejection Reason */}
            <Alert className="mb-8 bg-red-50 border-red-200">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertDescription className="ml-2">
                <span className="font-semibold text-red-700">Reason for rejection:</span>
                <p className="mt-1 text-red-600">{rejectionReason}</p>
              </AlertDescription>
            </Alert>

            {/* Next Steps Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Next Steps</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {nextSteps.map((step, index) => (
                  <Card key={index} className="border border-gray-200 hover:border-blue-200 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center">
                        <div className="rounded-full bg-blue-50 p-3 mb-4">
                          <step.icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="font-medium text-gray-900 mb-2">{step.title}</h3>
                        <p className="text-sm text-gray-500 mb-4">{step.description}</p>
                        <Button
                          variant="outline"
                          className="w-full flex items-center justify-center"
                          onClick={() => window.location.href = step.link}
                        >
                          {step.action}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Requirements Checklist */}
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                  Profile Requirements Checklist
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    Complete all required fields in your profile
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    Upload necessary documents in the correct format
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    Ensure information accuracy and up-to-date details
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    Review guidelines for profile submission
                  </li>
                </ul>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">
          Need additional help? Contact our support team at support@college.edu
        </p>
      </div>
    </div>
  );
};

export default ProfileRejectedPage;