import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import App from "../App.jsx";
import Layout from "../components/commonComponents/Layout.jsx";
import { ApprovedOnly, OnboardingOnly, RequireRole, SessionGate } from "../components/commonComponents/Session.jsx";
import Home from "../pages/commonPages/Home.jsx";
import LoginPage from "../pages/commonPages/Login.jsx";
import Register from "../pages/commonPages/Register.jsx";
import VerifyEmail from "../pages/commonPages/VerifyEmail.jsx";
import ForgotPassword from "../pages/commonPages/ForgotPassword.jsx";
import ResetPassword from "../pages/commonPages/ResetPassword.jsx";
import NotFound from "../pages/commonPages/NotFound.jsx";
import SelectRoleScreen from "../pages/commonPages/SelectRoleScreen.jsx";
import StudentProfileFormScreen from "../pages/commonPages/StudentProfileFormScreen.jsx";
import FacultyProfileFormScreen from "../pages/commonPages/FacultyProfileFormScreen.jsx";
import PendingProfilesPage from "../pages/commonPages/PendingProfilePage.jsx";
import ProfilePendingPage from "../pages/commonPages/ProfilePendingPage.jsx";
import ProfileRejectedPage from "../pages/commonPages/ProfileRejectedPage.jsx";
import StudentElectionPanel from "../pages/StudentElection/Election.jsx";
import AdminElectionPanel from "../pages/StudentElection/AdminElection.jsx";
import StudentComplaint from "../pages/Complaints/StudentComplaint.jsx";
import FacilityDashboard from "../pages/FacilityBooking/Dashboard.jsx";
import BookingPage from "../pages/FacilityBooking/BookingPage.jsx";
import BookingRequests from "../pages/FacilityBooking/AdminPanel.jsx";
import ApplicationManagement from "../pages/applicationModule/ApplicationManagement.jsx";
import Budgets from "../pages/BudgetSponsorship/Budgets.jsx";
import IntegrityRecords from "../pages/cheating/IntegrityRecords.jsx";
import HealthPage from "../pages/HealthModule/HealthPage.jsx";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* open to everyone */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* needs a login */}
      <Route element={<SessionGate />}>
        {/* the system, for approved users */}
        <Route path="/" element={<ApprovedOnly><App /></ApprovedOnly>}>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="pending-request" element={<RequireRole roles={["admin"]}><PendingProfilesPage /></RequireRole>} />

            <Route path="election" element={<StudentElectionPanel />} />
            <Route path="admin-election" element={<RequireRole roles={["admin"]}><AdminElectionPanel /></RequireRole>} />

            <Route path="complaints" element={<StudentComplaint />} />

            <Route path="facility" element={<FacilityDashboard />} />
            <Route path="facility-booking" element={<RequireRole roles={["student", "faculty"]}><BookingPage /></RequireRole>} />
            <Route path="facility-bookings" element={<BookingRequests />} />

            <Route path="application-page" element={<ApplicationManagement />} />

            <Route path="budgets" element={<Budgets />} />
            <Route path="integrity" element={<IntegrityRecords />} />
            <Route path="health" element={<RequireRole roles={["student", "faculty", "doctor"]}><HealthPage /></RequireRole>} />
          </Route>
        </Route>

        {/* the steps before approval */}
        <Route element={<OnboardingOnly />}>
          <Route path="/select-role-screen" element={<SelectRoleScreen />} />
          <Route path="/student-profile" element={<StudentProfileFormScreen />} />
          <Route path="/faculty-profile" element={<FacultyProfileFormScreen />} />
          <Route path="/profile-pending" element={<ProfilePendingPage />} />
          <Route path="/profile-rejected" element={<ProfileRejectedPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </>
  )
);

export default router;
