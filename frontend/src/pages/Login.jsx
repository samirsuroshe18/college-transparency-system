import React, { useState } from "react";
import { googleLoginUser } from "../api/authApi";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { Loader2 } from "lucide-react";
import { useDispatch } from 'react-redux'
import { login } from "../redux/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { showNotificationWithTimeout } from "../redux/slices/notificationSlice";
import { handleAxiosError } from "../utils/handleAxiosError";
import SnackBar from "../utils/SnackBar";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch()

  const handleSuccess = async (response) => {
    const token = response.credential;
    const decoded = jwtDecode(token);
    try {
      const res = await googleLoginUser(decoded, setLoading, dispatch);
      dispatch(login(res.data));
      navigate('/');
    } catch (error) {
      setLoading(false);
      dispatch(showNotificationWithTimeout({show:true, type:"error", message:handleAxiosError(error)}));
    } finally {
      setLoading(false);
    }
  };

  const handleError = (error) => {
    dispatch(showNotificationWithTimeout({show:true, type:"error", message:handleAxiosError(error)}));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_CLIENT_ID}>
        <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
      </GoogleOAuthProvider>
      <SnackBar />
    </div>
  );
};

export default Login;
