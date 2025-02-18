import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import {Booking} from "../models/booking.model.js";

const createBooking = asyncHandler(async (req, res) => {

  const loggedInUser = await User.create({
    name, 
    email,
    profilePic,
    isGoogleVerified: true,
});

if (!loggedInUser) {
    throw new ApiError(500, "Something went wrong");
}
    const booking = new Booking({ ...req.body, status: "pending" });
    await booking.save();
    res.status(201).json(booking);

    return res.status(200).json(
      new ApiResponse(200, booking, "Booked successfully")
    )
});

const getBookings = asyncHandler(async (req, res) => {
    const bookings = await Booking.find().populate("facility user approvedBy");
    res.json(bookings);
});

const updateBookingStatus = asyncHandler(async (req, res) => {
    const { status, approvedBy } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status, approvedBy },
      { new: true }
    );
    res.json(booking);
});

export { createBooking, getBookings, updateBookingStatus}
