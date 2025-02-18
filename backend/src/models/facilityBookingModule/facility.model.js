import mongoose, { Schema } from "mongoose";

const FacilitySchema = new Schema({
  createBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

  name: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  location: {
    type: String,
    required: true
  },

  available: {
    type: Boolean,
    default: true
  },

}, { timestamps: true });

export const Facility = mongoose.model("Facility", FacilitySchema);


