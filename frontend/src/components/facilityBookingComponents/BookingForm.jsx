import { useState } from "react";
import { createBooking } from "../api";

const BookingForm = ({ facility }) => {
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createBooking({ facility: facility._id, date, timeSlot });
    alert("Booking request submitted!");
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Book {facility.name}</h2>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      <input type="text" placeholder="Time Slot" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} required />
      <button type="submit">Submit Booking</button>
    </form>
  );
};

export default BookingForm;
