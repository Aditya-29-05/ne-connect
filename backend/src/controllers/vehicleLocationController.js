const mongoose = require('mongoose');
const { Vehicle, VehicleLocation } = require('../models');

// @desc    Record a new location telemetry entry for a vehicle
// @route   POST /api/vehicles/:id/location
// @access  Public
const addVehicleLocation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid vehicle ID format: '${id}'`
      });
    }

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: `Vehicle not found with ID: '${id}'`
      });
    }

    const locationData = {
      ...req.body,
      vehicleId: id
    };

    const locationRecord = await VehicleLocation.create(locationData);

    return res.status(201).json({
      success: true,
      message: 'Vehicle location recorded successfully',
      data: locationRecord
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error recording vehicle location',
      error: error.message
    });
  }
};

// @desc    Get location history for a vehicle
// @route   GET /api/vehicles/:id/location-history
// @access  Public
const getVehicleLocationHistory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid vehicle ID format: '${id}'`
      });
    }

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: `Vehicle not found with ID: '${id}'`
      });
    }

    // Return in ascending chronological order (oldest first)
    const history = await VehicleLocation.find({ vehicleId: id }).sort({ timestamp: 1 });

    return res.status(200).json({
      success: true,
      count: history.length,
      vehicleId: id,
      data: history
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving vehicle location history',
      error: error.message
    });
  }
};

module.exports = {
  addVehicleLocation,
  getVehicleLocationHistory
};
