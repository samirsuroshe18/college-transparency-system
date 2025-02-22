import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
  return (
    <div>
      <h1>Facility Management</h1>
      <Outlet /> {/* This renders the nested route components */}
    </div>
  );
};

export default DashboardLayout;
