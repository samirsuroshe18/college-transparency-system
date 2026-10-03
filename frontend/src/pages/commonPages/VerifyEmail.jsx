import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { verifyEmail } from "../../api/authApi";
import { errorMessage } from "../../api/client";
import AuthFrame, { FormMessage } from "../../components/commonComponents/AuthFrame";
import { primaryButtonClass, secondaryButtonClass } from "../../components/commonComponents/authStyles";

// Landing page for the link in the verification email
const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("verifying"); // verifying | verified | failed
  const [message, setMessage] = useState("");
  // the link works once; StrictMode runs effects twice in development
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    verifyEmail(token)
      .then(() => setStatus("verified"))
      .catch((err) => {
        setMessage(errorMessage(err));
        setStatus("failed");
      });
  }, [token]);

  return (
    <AuthFrame title="Email verification">
      {status === "verifying" && (
        <p className="flex items-center justify-center gap-3 text-sm text-gray-300">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" /> Verifying…
        </p>
      )}

      {status === "verified" && (
        <>
          <FormMessage tone="success">Your email is verified. You can log in now.</FormMessage>
          <Link to="/login" className={`${primaryButtonClass} block`}>Go to login</Link>
        </>
      )}

      {status === "failed" && (
        <>
          <FormMessage>{message}</FormMessage>
          <p className="text-sm text-gray-400 mb-4">Log in to get a new link.</p>
          <Link to="/login" className={`${secondaryButtonClass} block`}>Go to login</Link>
        </>
      )}
    </AuthFrame>
  );
};

export default VerifyEmail;
