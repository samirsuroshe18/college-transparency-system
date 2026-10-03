import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { decideBooking, listBookings } from "../../api/bookingApi";
import { errorMessage } from "../../api/client";
import useToast from "../../utils/useToast";

const STATUS_STYLES = { pending: "bg-amber-100 text-amber-700", approved: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700", cancelled: "bg-gray-200 text-gray-600" };
const FILTERS = ["pending", "approved", "rejected", "all"];

// Every booking request, for everyone to see. An admin approves or rejects the pending ones.
const AdminPanel = () => {
  const user = useSelector((state) => state.auth.userData);
  const toast = useToast();
  const isAdmin = user.role === "admin";

  const [bookings, setBookings] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState(isAdmin ? "pending" : "all");
  const [busyId, setBusyId] = useState(null);
  // the request an admin is writing a rejection reason for
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    try {
      setBookings(await listBookings());
      setLoadError("");
    } catch (error) {
      setLoadError(errorMessage(error));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (booking, status, why) => {
    setBusyId(booking._id);
    try {
      const res = await decideBooking(booking._id, status, why);
      toast.success(res.message);
      setRejecting(null);
      setReason("");
      await load();
    } catch (error) {
      toast.error(error);
    } finally {
      setBusyId(null);
    }
  };

  if (bookings === null && !loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const shown = (bookings || []).filter((booking) => filter === "all" || booking.status === filter);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto bg-gray-50 text-gray-900 min-h-screen">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{isAdmin ? "Booking Requests" : "Facility Bookings"}</h1>
          <p className="text-gray-600 mt-1">Who has asked for which facility, and what was decided.</p>
        </div>
        <Link to="/facility" className="text-blue-600 hover:underline">Facilities</Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((name) => (
          <button
            key={name}
            onClick={() => setFilter(name)}
            className={`px-4 py-2 rounded-lg capitalize ${filter === name ? "bg-gray-700 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"}`}
          >
            {name}
          </button>
        ))}
      </div>

      {loadError && <p role="alert" className="text-red-600">{loadError}</p>}
      {bookings !== null && shown.length === 0 && <p className="text-gray-500">Nothing here.</p>}

      <ul>
        {shown.map((booking) => (
          <li key={booking._id} className="p-4 bg-white border border-gray-200 rounded-lg my-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">
                  {booking.facility?.name}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[booking.status]}`}>{booking.status}</span>
                </p>
                <p className="text-sm text-gray-700">{booking.date}, {booking.startTime} to {booking.endTime}</p>
                <p className="text-sm text-gray-600 break-words">{booking.purpose}</p>
                <p className="text-sm text-gray-500">
                  Requested by {booking.user?.name}{booking.user?.role ? ` (${booking.user.role})` : ""}
                  {booking.decidedBy?.name && ` · decided by ${booking.decidedBy.name}`}
                </p>
                {booking.reason && <p className="text-sm text-red-600">Reason: {booking.reason}</p>}
              </div>

              {isAdmin && booking.status === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => decide(booking, "approved")} disabled={busyId === booking._id} className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50">
                    Approve
                  </button>
                  <button onClick={() => { setRejecting(booking); setReason(""); }} disabled={busyId === booking._id} className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50">
                    Reject
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Reason for a rejection */}
      {rejecting && (
        <div className="fixed inset-0 bg-gray-600/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <form
            onSubmit={(e) => { e.preventDefault(); if (reason.trim()) decide(rejecting, "rejected", reason); }}
            className="mt-20 w-full max-w-md bg-white rounded-lg shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800">Reject the request for {rejecting.facility?.name}</h3>
            <label htmlFor="reject-reason" className="block text-sm font-medium text-gray-600 mt-4 mb-2">Reason</label>
            <textarea id="reject-reason" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400" />
            <p className="mt-1 text-xs text-gray-500">The requester sees this reason.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setRejecting(null)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">Cancel</button>
              <button type="submit" disabled={!reason.trim() || busyId === rejecting._id} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                Confirm rejection
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
