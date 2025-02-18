import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useState } from "react";

const ApprovePanel = () => {
    const [bookings, setBookings] = useState([
      { id: 1, facility: "Tennis Court", date: "2025-02-20", timeSlot: "10:00 AM - 11:00 AM", status: "pending" },
      { id: 2, facility: "Auditorium", date: "2025-02-21", timeSlot: "2:00 PM - 4:00 PM", status: "approved" }
    ]);
  
    const handleApproval = (id, status) => {
      setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
    };
  
    return (
      <div className="p-4">
        <h1 className="text-2xl">Approval Panel</h1>
        <ul>
          {bookings.map((booking) => (
            <li key={booking.id} className="p-2 border rounded my-2">
              <p>Facility: {booking.facility}</p>
              <p>Date: {booking.date}</p>
              <p>Time Slot: {booking.timeSlot}</p>
              <p>Status: {booking.status}</p>
              {booking.status === "pending" && (
                <>
                  <button onClick={() => handleApproval(booking.id, "approved")} className="p-2 bg-green-500 text-white rounded ml-2">Approve</button>
                  <button onClick={() => handleApproval(booking.id, "rejected")} className="p-2 bg-red-500 text-white rounded ml-2">Reject</button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }


  export default ApprovePanel;