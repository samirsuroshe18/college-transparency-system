import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { DashboardLayout, ThemeSwitcher } from "@toolpad/core/DashboardLayout";
import { PageContainer } from "@toolpad/core/PageContainer";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import LogoutIcon from "@mui/icons-material/Logout";
import { logout as logoutRequest } from "../../api/authApi";
import { logout } from "../../redux/slices/authSlice";
import NoticeBell from "./NoticeBell";
import SnackBar from "../../utils/SnackBar";

// right side of the top bar: notices, theme, who is logged in, logout
const ToolbarActions = () => {
  const user = useSelector((state) => state.auth.userData);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    // the session is over for this browser whether or not the server could be told
    await logoutRequest().catch(() => {});
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex items-center gap-1">
      <NoticeBell />
      <ThemeSwitcher />
      <span className="hidden md:inline text-sm opacity-80 mx-2 max-w-[14rem] truncate" title={user?.email}>
        {user?.name} · {user?.role}
      </span>
      {/* on a phone the label would push the bar onto a second row */}
      <span className="hidden md:inline-flex">
        <Button onClick={handleLogout} size="small" variant="outlined" startIcon={<LogoutIcon />}>
          Logout
        </Button>
      </span>
      <span className="md:hidden">
        <IconButton onClick={handleLogout} aria-label="Logout">
          <LogoutIcon />
        </IconButton>
      </span>
    </div>
  );
};

// The frame around every page of the system: side menu, top bar, page area
export default function Layout() {
  return (
    <div>
      <DashboardLayout slots={{ toolbarActions: ToolbarActions }}>
        <PageContainer>
          <Outlet />
        </PageContainer>
      </DashboardLayout>
      <SnackBar />
    </div>
  );
}
