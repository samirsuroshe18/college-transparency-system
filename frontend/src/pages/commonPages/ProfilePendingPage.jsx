import React from "react";
import { useSelector } from "react-redux";
import { Loader2, Clock, Mail, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ProfilePendingPage = () => {
  const user = useSelector((state) => state.auth.userData);
  const role = user?.role || "student";

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
                We're currently reviewing your profile to ensure everything meets our standards.
                This process typically takes 1-2 business days.
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
                Please ensure your contact information is up to date while we process your profile.
              </AlertDescription>
            </Alert>

            {/* Support Options */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4 border border-gray-200 hover:border-blue-200 transition-colors">
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-blue-600 mt-1" />
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Email Support</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Need immediate assistance? Our support team is here to help.
                    </p>
                    <a
                      href="mailto:support@college.edu"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mt-2"
                    >
                      Contact Support
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </a>
                  </div>
                </div>
              </Card>

              <Card className="p-4 border border-gray-200 hover:border-blue-200 transition-colors">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-1" />
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">FAQ</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Check our frequently asked questions about the review process.
                    </p>
                    <Button
                      variant="link"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mt-2 p-0"
                    >
                      View FAQ
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
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