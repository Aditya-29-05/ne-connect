const mongoose = require('mongoose');
const { Vehicle } = require('../models');

// @desc    Create a new vehicle
// @route   POST /api/vehicles
// @access  Public
const createVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    return res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: vehicle
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: `Vehicle with vehicleNumber '${req.body.vehicleNumber}' already exists`
      });
    }
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
      message: 'Server error creating vehicle',
      error: error.message
    });
  }
};

// @desc    Get all vehicles
// @route   GET /api/vehicles
// @access  Public
const getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving vehicles',
      error: error.message
    });
  }
};

// @desc    Get single vehicle by ID
// @route   GET /api/vehicles/:id
// @access  Public
const getVehicleById = async (req, res) => {
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

    return res.status(200).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving vehicle',
      error: error.message
    });
  }
};

// @desc    Update vehicle by ID
// @route   PUT /api/vehicles/:id
// @access  Public
const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid vehicle ID format: '${id}'`
      });
    }

    const vehicle = await Vehicle.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: `Vehicle not found with ID: '${id}'`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: `Vehicle with vehicleNumber '${req.body.vehicleNumber}' already exists`
      });
    }
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
      message: 'Server error updating vehicle',
      error: error.message
    });
  }
};

// @desc    Delete vehicle by ID
// @route   DELETE /api/vehicles/:id
// @access  Public
const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid vehicle ID format: '${id}'`
      });
    }

    const vehicle = await Vehicle.findByIdAndDelete(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: `Vehicle not found with ID: '${id}'`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully',
      data: {
        id: vehicle._id,
        vehicleNumber: vehicle.vehicleNumber
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error deleting vehicle',
      error: error.message
    });
  }
};

module.exports = {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle
};
