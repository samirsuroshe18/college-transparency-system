import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { PageContainer } from "@toolpad/core/PageContainer";
import LinearProgress from "@mui/material/LinearProgress";
import { useDispatch } from "react-redux";
import { handleAxiosError } from "../../utils/handleAxiosError";
import { getCurrentUser } from "../../api/authApi";
import { showNotificationWithTimeout } from "../../redux/slices/notificationSlice";
import { login } from "../../redux/slices/authSlice";
import SnackBar from "../../utils/SnackBar";

export default function Layout() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Call API when the page is loading
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getCurrentUser(setLoading, dispatch);
        dispatch(login(res.data));
        
        // Check if profile is not filled, then navigate to select role screen
        if (res.data.profileStatus === "NotFilled") {
          console.log('Navigating to select role screen');
          
          // Use absolute path to avoid URL issues (leading /)
          navigate('/select-role-screen');
        }
      } catch (error) {
        setLoading(false);
        dispatch(
          showNotificationWithTimeout({
            show: true,
            type: "error",
            message: handleAxiosError(error),
          })
        );
        navigate("/login"); // Navigate to login in case of error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch, navigate]); // Added `dispatch` and `navigate` to the dependency array to avoid warnings

  if (loading) {
    return (
      <div style={{ width: "100%" }}>
        <LinearProgress />
      </div>
    );
  }

  return (
    <div>
      <DashboardLayout>
        <PageContainer>
          <Outlet />
        </PageContainer>
      </DashboardLayout>
      <SnackBar />
    </div>
  );
}
