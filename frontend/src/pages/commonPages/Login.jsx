import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { login as loginRequest } from "../../api/authApi";
import { errorMessage } from "../../api/client";
import { login } from "../../redux/slices/authSlice";
import AuthFrame, { FormMessage } from "../../components/commonComponents/AuthFrame";
import { inputClass, labelClass, linkClass, primaryButtonClass, secondaryButtonClass } from "../../components/commonComponents/authStyles";

// the sample college's accounts, one for each role
const DEMO_PASSWORD = "Demo@123";
const DEMO_LOGINS = [
  { label: "Student", email: "student@campus.demo" },
  { label: "Faculty", email: "faculty@campus.demo" },
  { label: "Admin", email: "admin@campus.demo" },
  { label: "Doctor", email: "doctor@campus.demo" },
];

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const signIn = async (credentials) => {
    setError("");
    setSubmitting(true);

    try {
      const res = await loginRequest(credentials.email, credentials.password);
      dispatch(login(res.data.user));
      navigate("/", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    signIn({ email, password });
  };

  return (
    <AuthFrame
      title="Login"
      footer={<>New here? <Link to="/register" className={linkClass}>Create an account</Link></>}
    >
      <form onSubmit={handleSubmit} noValidate>
        {error && <FormMessage>{error}</FormMessage>}

        <div className="mb-4">
          <label htmlFor="email" className={labelClass}>Email</label>
          <input id="email" type="email" autoComplete="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="mb-2">
          <label htmlFor="password" className={labelClass}>Password</label>
          <input id="password" type="password" autoComplete="current-password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <p className="text-right text-sm mb-4">
          <Link to="/forgot-password" className={linkClass}>Forgot your password?</Link>
        </p>

        <button type="submit" className={primaryButtonClass} disabled={submitting}>
          {submitting ? "Logging in…" : "Login"}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-amber-500/15">
        <p className="text-sm text-gray-400 mb-3">Just looking around? Try a demo account:</p>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_LOGINS.map((demo) => (
            <button
              key={demo.email}
              type="button"
              className={secondaryButtonClass}
              disabled={submitting}
              onClick={() => signIn({ email: demo.email, password: DEMO_PASSWORD })}
            >
              {demo.label}
            </button>
          ))}
        </div>
      </div>
    </AuthFrame>
  );
};

export default Login;
