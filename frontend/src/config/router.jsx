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

const Router = createBrowserRouter(
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
          <Route path="collegeadmin" element={<AdminCollegePanel />} />
          {/* put remaining routes here... */}

        </Route>
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<NotFound />} />
    </>
  )
);

export default Router;
