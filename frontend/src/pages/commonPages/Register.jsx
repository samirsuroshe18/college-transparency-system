import { useState } from "react";
import { Link } from "react-router-dom";
import { register } from "../../api/authApi";
import { errorMessage } from "../../api/client";
import AuthFrame, { FormMessage } from "../../components/commonComponents/AuthFrame";
import { inputClass, labelClass, linkClass, primaryButtonClass } from "../../components/commonComponents/authStyles";

const MIN_PASSWORD_LENGTH = 6;

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // the address the verification link went to, once sign-up has worked
  const [sentTo, setSentTo] = useState("");

  const update = (field) => (e) => setForm((current) => ({ ...current, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      setSentTo(form.email.trim());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (sentTo) {
    return (
      <AuthFrame title="Check your email" footer={<Link to="/login" className={linkClass}>Go to login</Link>}>
        <p className="text-sm text-gray-300">
          We sent a verification link to <span className="text-white font-medium break-all">{sentTo}</span>. It is
          valid for 10 minutes. If it does not arrive, log in and a new link is sent.
        </p>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      title="Create your account"
      footer={<>Already have an account? <Link to="/login" className={linkClass}>Login</Link></>}
    >
      <form onSubmit={handleSubmit} noValidate>
        {error && <FormMessage>{error}</FormMessage>}

        <div className="mb-4">
          <label htmlFor="name" className={labelClass}>Full name</label>
          <input id="name" autoComplete="name" maxLength={80} className={inputClass} value={form.name} onChange={update("name")} required />
        </div>

        <div className="mb-4">
          <label htmlFor="email" className={labelClass}>Email</label>
          <input id="email" type="email" autoComplete="email" className={inputClass} value={form.email} onChange={update("email")} required />
        </div>

        <div className="mb-4">
          <label htmlFor="password" className={labelClass}>Password</label>
          <input id="password" type="password" autoComplete="new-password" className={inputClass} value={form.password} onChange={update("password")} required />
          <p className="text-xs text-gray-500 mt-1 text-left">At least 6 characters</p>
        </div>

        <div className="mb-5">
          <label htmlFor="confirmPassword" className={labelClass}>Confirm password</label>
          <input id="confirmPassword" type="password" autoComplete="new-password" className={inputClass} value={form.confirmPassword} onChange={update("confirmPassword")} required />
        </div>

        <button type="submit" className={primaryButtonClass} disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>

        <p className="text-xs text-gray-500 mt-4">
          After verifying your email you choose student or faculty and fill in your profile. An admin approves it.
        </p>
      </form>
    </AuthFrame>
  );
};

export default Register;
