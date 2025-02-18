import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useState } from "react";

const BookingList = () => {
    const bookings = [
      { id: 1, facility: "Tennis Court", date: "2025-02-20", timeSlot: "10:00 AM - 11:00 AM", status: "pending" },
      { id: 2, facility: "Auditorium", date: "2025-02-21", timeSlot: "2:00 PM - 4:00 PM", status: "approved" }
    ];
  
    return (
      <div className="p-4">
        <h1 className="text-2xl">Booking List</h1>
        <ul>
          {bookings.map((booking) => (
            <li key={booking.id} className="p-2 border rounded my-2">
              <p>Facility: {booking.facility}</p>
              <p>Date: {booking.date}</p>
              <p>Time Slot: {booking.timeSlot}</p>
              <p>Status: {booking.status}</p>
            </li>
          ))}
        </ul>
      </div>
    );
  }


  export default BookingList;