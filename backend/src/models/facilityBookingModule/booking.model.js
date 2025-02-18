import mongoose, { Schema } from "mongoose";

const BookingSchema = new Schema({
  facility: {
    type: Schema.Types.ObjectId,
    ref: "Facility",
  },

  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

  date: {
    type: Date,
  },

  timeSlot: {
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },

}, { timestamps: true });

export const Booking = mongoose.model("Booking", BookingSchema);

