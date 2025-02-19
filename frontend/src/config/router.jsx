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
import AdminCollegePanel from "../pages/dashboards/AdminCollegePanel.jsx";
import StudentDashboard from "../pages/dashboards/StudentDashboard.jsx";
import FacultyDashboard from "../pages/dashboards/FacultyDashboard.jsx";
import WallOfShameAdmin from "../pages/cheating/WallOfShameAdmin.jsx";
import StudentShame from "../pages/cheating/StudentShame.jsx";

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

          {/* put remaining routes here... */}
          <Route path="college-dashboard" element={<AdminCollegePanel/>} />
          <Route path="student-dashboard" element={<StudentDashboard/>} />
          <Route path="admin-dashboard" element={<StudentDashboard/>} />
          <Route path="faculty-dashboard" element={<FacultyDashboard/>} />

          <Route path="wallofshame" element={<StudentShame/>} />
          <Route path="admin-wallofshame" element={<WallOfShameAdmin/>} />

        </Route>
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<NotFound />} />
    </>
  )
);

export default router;
