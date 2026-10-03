import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { Facility } from '../models/facility.model.js';
import { readText } from '../utils/input.js';
import { assertReach } from '../utils/reach.js';
import { isValidObjectId } from '../utils/objectId.js';

const NAME_MAX = 120;
const TEXT_MAX = 500;

const findFacility = async (id) => {
    const facility = isValidObjectId(id) ? await Facility.findById(id) : null;

    if (!facility) {
        throw new ApiError(404, "Facility not found");
    }

    return facility;
};

const listFacilities = asyncHandler(async (req, res) => {
    const facilities = await Facility.find().sort({ name: 1 });

    return res.status(200).json(
        new ApiResponse(200, { facilities }, "Facilities")
    );
});

const createFacility = asyncHandler(async (req, res) => {
    const facility = await Facility.create({
        name: readText(req.body.name, 'Name', { max: NAME_MAX, required: true }),
        description: readText(req.body.description, 'Description', { max: TEXT_MAX, required: true }),
        location: readText(req.body.location, 'Location', { max: NAME_MAX, required: true }),
        createdBy: req.user._id,
        isDemo: req.user.isDemo,
    });

    return res.status(201).json(
        new ApiResponse(201, { facility }, "Facility added")
    );
});

// only what is sent is changed
const updateFacility = asyncHandler(async (req, res) => {
    const facility = await findFacility(req.params.id);
    assertReach(req.user, facility);

    const { name, description, location, available } = req.body;

    if (name !== undefined) facility.name = readText(name, 'Name', { max: NAME_MAX, required: true });
    if (description !== undefined) facility.description = readText(description, 'Description', { max: TEXT_MAX, required: true });
    if (location !== undefined) facility.location = readText(location, 'Location', { max: NAME_MAX, required: true });

    if (available !== undefined) {
        if (typeof available !== 'boolean') {
            throw new ApiError(400, "Available must be true or false");
        }
        facility.available = available;
    }

    await facility.save();

    return res.status(200).json(
        new ApiResponse(200, { facility }, "Facility updated")
    );
});

export { findFacility, listFacilities, createFacility, updateFacility }
