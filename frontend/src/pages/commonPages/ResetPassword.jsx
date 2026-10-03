import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { checkResetToken, setNewPassword } from "../../api/authApi";
import { errorMessage } from "../../api/client";
import AuthFrame, { FormMessage } from "../../components/commonComponents/AuthFrame";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "../../components/commonComponents/authStyles";

const MIN_PASSWORD_LENGTH = 6;

// Landing page for the link in the password reset email
const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("checking"); // checking | ready | invalid | done
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    checkResetToken(token)
      .then(() => { if (!cancelled) setStatus("ready"); })
      .catch((err) => {
        if (cancelled) return;
        setError(errorMessage(err));
        setStatus("invalid");
      });

    return () => { cancelled = true; };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      await setNewPassword(token, password, confirmPassword);
      setStatus("done");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthFrame title="Set a new password">
      {status === "checking" && (
        <p className="flex items-center justify-center gap-3 text-sm text-gray-300">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" /> Checking your link…
        </p>
      )}

      {status === "invalid" && (
        <>
          <FormMessage>{error}</FormMessage>
          <Link to="/forgot-password" className={`${secondaryButtonClass} block`}>Request a new link</Link>
        </>
      )}

      {status === "done" && (
        <>
          <FormMessage tone="success">Your password is updated. You can log in with it now.</FormMessage>
          <Link to="/login" className={`${primaryButtonClass} block`}>Go to login</Link>
        </>
      )}

      {status === "ready" && (
        <form onSubmit={handleSubmit} noValidate>
          {error && <FormMessage>{error}</FormMessage>}

          <div className="mb-4">
            <label htmlFor="password" className={labelClass}>New password</label>
            <input id="password" type="password" autoComplete="new-password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} required />
            <p className="text-xs text-gray-500 mt-1 text-left">At least 6 characters</p>
          </div>

          <div className="mb-5">
            <label htmlFor="confirmPassword" className={labelClass}>Confirm new password</label>
            <input id="confirmPassword" type="password" autoComplete="new-password" className={inputClass} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>

          <button type="submit" className={primaryButtonClass} disabled={submitting}>
            {submitting ? "Saving…" : "Save new password"}
          </button>
        </form>
      )}
    </AuthFrame>
  );
};

export default ResetPassword;
