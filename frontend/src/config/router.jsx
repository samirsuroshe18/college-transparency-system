import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import App from "../App.jsx";
import Layout from "../components/Layout.jsx";
import Home from "../pages/Home.jsx";
import FacilityDashboard from "../pages/FacilityBooking/Dashboard.jsx";
import LoginPage from "../pages/Login.jsx";
import NotFound from "../pages/NotFound.jsx";
import AdminPanel from "../pages/FacilityBooking/AdminPanel.jsx";

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

        </Route>
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<NotFound />} />
    </>
  )
);

export default router;
