import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useEffect, useState } from "react";

const BookingPage = () => {
    const [date, setDate] = useState("");
    const [timeSlot, setTimeSlot] = useState("");
    const [facilities, setFacilities] = useState([]);
    const [selectedFacility, setSelectedFacility] = useState(null);
  
    useEffect(() => {
      fetch("http://localhost:3000/facilities")
        .then((res) => res.json())
        .then((data) => setFacilities(data));
    }, []);
  
    const handleBooking = async (e) => {
      e.preventDefault();
      const response = await fetch("http://localhost:3000/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facility: "67b0fa2df1d350aae3ecfed3", date, timeSlot }),
      });
      if (response.ok) alert("Booking request submitted!");
    };
  
    return (
      <div className="p-4">
        <h1 className="text-2xl">Book a Facility</h1>
        <form className="mt-4" onSubmit={handleBooking}>
          <select onChange={(e) => setSelectedFacility(e.target.value)} className="p-2 border rounded">
            <option value="">Select Facility</option>
            {facilities.map((facility) => (
              <option key={facility._id} value={facility._id}>{facility.name}</option>
            ))}
          </select>
          <input type="date" className="p-2 border rounded ml-2" value={date} onChange={(e) => setDate(e.target.value)} required />
          <input type="text" placeholder="Time Slot" className="p-2 border rounded ml-2" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} required />
          <button className="p-2 bg-blue-500 text-white rounded ml-2">Submit</button>
        </form>
      </div>
    );
  }

  export default BookingPage;