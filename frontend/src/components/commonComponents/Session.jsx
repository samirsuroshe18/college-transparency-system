import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Loader2 } from "lucide-react";
import { getMe } from "../../api/authApi";
import { currentUser } from "../../redux/slices/authSlice";
import { pathForStatus } from "../../lib/college";

// The API can be asleep when the first visitor of the day arrives and needs up to a
// minute to wake. Until it answers, nobody can say whether the visitor is logged in.
const RETRY_MS = 3000;
const MAX_TRIES = 25;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const FullPageMessage = ({ children }) => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#131314] text-amber-500 px-4 text-center">
    <Loader2 className="w-10 h-10 animate-spin" />
    {children && <p className="text-sm text-gray-300 max-w-xs">{children}</p>}
  </div>
);

// Wraps every page that needs a logged-in user. It finds out who is logged in once,
// keeps the answer in the store, and sends everyone else to the login page.
export const SessionGate = () => {
  const user = useSelector((state) => state.auth.userData);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    if (user) return undefined;

    let cancelled = false;

    const load = async () => {
      for (let attempt = 1; attempt <= MAX_TRIES && !cancelled; attempt += 1) {
        try {
          const res = await getMe();
          if (!cancelled) dispatch(currentUser(res.data.user));
          return;
        } catch (error) {
          // a 401 is an answer: nobody is logged in
          if (error.response?.status === 401) break;

          if (!cancelled) setWaking(true);
          await wait(RETRY_MS);
        }
      }

      if (!cancelled) navigate("/login", { replace: true });
    };

    load();

    return () => { cancelled = true; };
  }, [user, dispatch, navigate]);

  if (!user) {
    return (
      <FullPageMessage>
        {waking ? "Waking the server. The first visit after a quiet spell can take up to a minute." : ""}
      </FullPageMessage>
    );
  }

  return <Outlet />;
};

// The system itself: only for users whose profile an admin has approved.
// Anyone else is sent to the step they are at.
export const ApprovedOnly = ({ children }) => {
  const user = useSelector((state) => state.auth.userData);
  const waitingAt = pathForStatus(user);

  return waitingAt ? <Navigate to={waitingAt} replace /> : children;
};

// The profile steps: only for users who still have one to complete
export const OnboardingOnly = () => {
  const user = useSelector((state) => state.auth.userData);

  return pathForStatus(user) ? <Outlet /> : <Navigate to="/" replace />;
};

// A page for some roles only; the server refuses the others as well
export const RequireRole = ({ roles, children }) => {
  const user = useSelector((state) => state.auth.userData);

  return roles.includes(user?.role) ? children : <Navigate to="/" replace />;
};
