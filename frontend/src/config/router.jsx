import { createBrowserRouter, createRoutesFromElements, Route,} from "react-router-dom";
import App from "../App.jsx";
import Layout from '../components/commonComponents/Layout.jsx';
import Home from "../pages/commonPages/Home.jsx";
import FacilityDashboard from "../pages/FacilityBooking/Dashboard.jsx";
import LoginPage from "../pages/commonPages/Login.jsx";
import NotFound from "../pages/commonPages/NotFound.jsx";
import AdminPanel from "../pages/FacilityBooking/AdminPanel.jsx";
import StudentElectionPanel from "../pages/StudentElection/Election.jsx";
import AdminElectionPanel from "../pages/StudentElection/AdminElection.jsx";
import SelectRoleScreen from "../pages/commonPages/SelectRoleScreen.jsx";
import StudentProfileFormScreen from "../pages/commonPages/StudentProfileFormScreen.jsx";
import FacultyProfileFormScreen from "../pages/commonPages/FacultyProfileFormScreen.jsx";
import PendingProfilesPage from "../pages/commonPages/PendingProfilePage.jsx";
import AdminCollegePanel from "../pages/dashboards/AdminCollegePanel.jsx";
import StudentDashboard from "../pages/dashboards/StudentDashboard.jsx";
import FacultyDashboard from "../pages/dashboards/FacultyDashboard.jsx";
import WallOfShameAdmin from "../pages/cheating/WallOfShameAdmin.jsx";
import StudentShame from "../pages/cheating/StudentShame.jsx";
import StudentComplaint from "../pages/Complaints/StudentComplaint.jsx";
import AdminComplain from "../pages/Complaints/AdminComplaint.jsx";
import ProfilePendingPage from "../pages/commonPages/ProfilePendingPage.jsx";
import ProfileRejectedPage from "../pages/commonPages/ProfileRejectedPage.jsx";

import AdminApplication from "../pages/applicationModule/AdminApplications.jsx";
import ApplicationManagement from "../pages/applicationModule/ApplicationManagement.jsx";
import ProfileInfoPage from "../pages/commonPages/ProfileInfoPage.jsx";
import SimpleStudentForm from "../pages/commonPages/StudentProfileFormScreen.jsx";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<App />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />

          {/* Facility Booking Module Routes */}
          <Route path="dashboard" element={<FacilityDashboard />}>
            <Route path="facility" element={<FacilityDashboard />} />
            <Route path="admin" element={<AdminPanel />} />
          </Route>


          {/* Student Election Module Routes */}
          <Route path="election" element={<StudentElectionPanel />} />
          <Route path="admin-election" element={<AdminElectionPanel />} />
          
          {/* Pending Request Routes */}
          <Route path="pending-request" element={<PendingProfilesPage />} />

          {/* put remaining routes here... */}
          <Route path="college-dashboard" element={<AdminCollegePanel/>} />
          <Route path="student-dashboard" element={<StudentDashboard/>} />
          <Route path="admin-dashboard" element={<StudentDashboard/>} />
          <Route path="faculty-dashboard" element={<FacultyDashboard/>} />

          <Route path="wallofshame" element={<StudentShame/>} />
          <Route path="admin-wallofshame" element={<WallOfShameAdmin/>} />

          <Route path="complaints" element={<StudentComplaint/>} />
          <Route path="admin-complaints" element={<AdminComplain/>} />

        </Route>
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/select-role-screen" element={<SelectRoleScreen />} />
      <Route path="/student-profile" element={<StudentProfileFormScreen />} />
      <Route path="/faculty-profile" element={<FacultyProfileFormScreen />} />
      <Route path="/profile-pending" element={<ProfilePendingPage />} />
      <Route path="/profile-rejected" element={<ProfileRejectedPage />} />
      <Route path="/profile-info" element={<ProfileInfoPage />} />

      <Route path="/application-page" element={<ApplicationManagement />} />
      <Route path="/admin-application" element={<AdminApplication/>}/>
      <Route path="*" element={<NotFound />} />


      <Route path="/studentform" element={<SimpleStudentForm/>}/>
    </>
  )
);

export default router;
