import React, { useState } from "react";
import { googleLoginUser } from "../../api/authApi";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { Loader2 } from "lucide-react";
import { useDispatch } from 'react-redux'
import { login } from "../../redux/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { showNotificationWithTimeout } from "../../redux/slices/notificationSlice";
import { handleAxiosError } from "../../utils/handleAxiosError";
import SnackBar from "../../utils/SnackBar";
import { motion } from "framer-motion";
import iitBombayLogo from "../../assets/college.png";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSuccess = async (response) => {
    const token = response.credential;
    const decoded = jwtDecode(token);

    try {
      const { userData, redirectTo } = await googleLoginUser(decoded, setLoading, dispatch);
      dispatch(login(userData));
      navigate(redirectTo); // Navigate based on user role
    } catch (error) {
      setLoading(false);
      dispatch(showNotificationWithTimeout({ show: true, type: "error", message: handleAxiosError(error) }));
    }
  };
  const handleError = (error) => {
    dispatch(showNotificationWithTimeout({show:true, type:"error", message:handleAxiosError(error)}));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#131314] text-amber-500">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-gradient-to-r from-[#131314] to-[#1C1C1E] text-white p-4 overflow-hidden">
      
      {/* Animated Background Waves */}
      {/*ok*/}
      <motion.div 
        className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,_#1C1C1E_0%,_#131314_100%)] opacity-30"
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.img 
        src={iitBombayLogo} 
        alt="IIT Bombay Logo" 
        className="w-50 h-24 mb-4" 
        
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      />

      <motion.h1 
        className="text-3xl font-bold text-amber-500 mb-2"
        initial={{ opacity: 0, x: -50 }} 
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        Welcome to the Transparent College System
      </motion.h1>

      <motion.p 
        className="text-lg text-gray-400 mb-6 text-center px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        Access various student resources, manage events, and stay updated with your college's student activities.
      </motion.p>

      {/* Login Card with Centered Google Login */}
      <motion.div 
        className="bg-[#1C1C1E] p-6 rounded-lg shadow-lg w-[350px] text-center relative flex flex-col items-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        whileHover={{ y: -5, boxShadow: "0px 5px 15px rgba(255, 196, 0, 0.4)" }}
      >
        <h2 className="text-xl font-semibold text-amber-500 mb-4">Login</h2>
        
        <GoogleOAuthProvider clientId={import.meta.env.VITE_CLIENT_ID}>
          <div className="flex justify-center w-full py-6">
            <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
          </div>
        </GoogleOAuthProvider>

        <p className="text-sm text-gray-400 mt-2 py-4">Only your College Email Login is supported.</p>
      </motion.div>
      
      <SnackBar />
    </div>
  );
};

export default Login;