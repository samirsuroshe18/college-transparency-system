export const getFacilities = async () => {
    const res = await fetch("http://localhost:3000/facilities");
    return res.json();
  };
  
  export const createBooking = async (bookingData) => {
    const res = await fetch("http://localhost:3000/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData),
    });
    return res.json();
  };
  