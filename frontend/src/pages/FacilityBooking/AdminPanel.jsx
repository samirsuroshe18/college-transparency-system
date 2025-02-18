import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getBookings } from "../../api/facilityBookingApi";
import { useDispatch } from "react-redux";
import { showNotificationWithTimeout } from "../../redux/slices/notificationSlice";
import { handleAxiosError } from "../../utils/handleAxiosError";

const AdminPanel = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();
  
    useEffect(() => {
      fetch("http://localhost:3000/bookings")
        .then((res) => res.json())
        .then((data) => setBookings(data));
    }, []);

    useEffect(() => {
      const fetchData = async () => {
        try {
          const res = await getBookings(setLoading, dispatch);
          // dispatch(login(res.data));
          setBookings(res.data);
        } catch (error) {
          setLoading(false);
          dispatch(
            showNotificationWithTimeout({
              show: true,
              type: "error",
              message: handleAxiosError(error),
            })
          );
        } finally {
          setLoading(false);
        }
      };
  
      fetchData();
    }, []);
  
    const handleApproval = async (id, status) => {
      await fetch(`http://localhost:3000/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setBookings(bookings.map((b) => (b._id === id ? { ...b, status } : b)));
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
      <div className="p-4">
        <h1 className="text-2xl">Admin Panel</h1>
        <ul>
          {bookings.map((booking) => (
            <li key={booking._id} className="p-2 border rounded my-2">
              <p>Facility: {booking.facility.name}</p>
              <p>Date: {booking.date}</p>
              <p>Time Slot: {booking.timeSlot}</p>
              <p>Status: {booking.status}</p>
              {booking.status === "pending" && (
                <>
                  <button onClick={() => handleApproval(booking._id, "approved")} className="p-2 bg-green-500 text-white rounded ml-2">Approve</button>
                  <button onClick={() => handleApproval(booking._id, "rejected")} className="p-2 bg-red-500 text-white rounded ml-2">Reject</button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  export default AdminPanel;