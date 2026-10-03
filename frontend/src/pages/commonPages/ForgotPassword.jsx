import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../api/authApi";
import { errorMessage } from "../../api/client";
import AuthFrame, { FormMessage } from "../../components/commonComponents/AuthFrame";
import { inputClass, labelClass, linkClass, primaryButtonClass } from "../../components/commonComponents/authStyles";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const res = await forgotPassword(email);
      setMessage(res.message);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthFrame title="Forgot your password?" footer={<Link to="/login" className={linkClass}>Back to login</Link>}>
      <form onSubmit={handleSubmit} noValidate>
        {error && <FormMessage>{error}</FormMessage>}
        {message && <FormMessage tone="success">{message}</FormMessage>}

        <p className="text-sm text-gray-400 mb-4 text-left">Enter your email and we will send a link to set a new password.</p>

        <div className="mb-5">
          <label htmlFor="email" className={labelClass}>Email</label>
          <input id="email" type="email" autoComplete="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <button type="submit" className={primaryButtonClass} disabled={submitting}>
          {submitting ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthFrame>
  );
};

export default ForgotPassword;
