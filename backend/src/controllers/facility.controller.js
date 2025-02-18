import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { Facility } from '../models/facility.model.js'

const createFacility = asyncHandler(async (req, res) => {
  const { name, description, available, location } = req.body;

  const facility = await Facility.create({
    createdBy: req.user._id,
    name,
    description,
    available,
    location,
  });

  if (!facility) {
    throw new ApiError(500, "Something went wrong");
  }

  return res.status(200).json(
    new ApiResponse(200, facility, "Facility creted successfully.")
  )
});

const getFacilities = asyncHandler(async (req, res) => {
  const facilities = await Facility.find();
  
  return res.status(200).json(
    new ApiResponse(200, facilities, "Facility fetched successfully.")
  )
});


export { createFacility, getFacilities };
