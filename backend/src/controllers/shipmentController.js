const mongoose = require('mongoose');
const { Shipment } = require('../models');

// @desc    Create a new shipment
// @route   POST /api/shipments
// @access  Public
const createShipment = async (req, res) => {
  try {
    const shipment = await Shipment.create(req.body);
    return res.status(201).json({
      success: true,
      message: 'Shipment created successfully',
      data: shipment
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: `Shipment with trackingNumber '${req.body.trackingNumber}' already exists`
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
      message: 'Server error creating shipment',
      error: error.message
    });
  }
};

// @desc    Get all shipments
// @route   GET /api/shipments
// @access  Public
const getShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: shipments.length,
      data: shipments
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving shipments',
      error: error.message
    });
  }
};

// @desc    Get single shipment by ID
// @route   GET /api/shipments/:id
// @access  Public
const getShipmentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid shipment ID format: '${id}'`
      });
    }

    const shipment = await Shipment.findById(id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: `Shipment not found with ID: '${id}'`
      });
    }

    return res.status(200).json({
      success: true,
      data: shipment
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving shipment',
      error: error.message
    });
  }
};

// @desc    Update shipment by ID
// @route   PUT /api/shipments/:id
// @access  Public
const updateShipment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid shipment ID format: '${id}'`
      });
    }

    const shipment = await Shipment.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: `Shipment not found with ID: '${id}'`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Shipment updated successfully',
      data: shipment
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: `Shipment with trackingNumber '${req.body.trackingNumber}' already exists`
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
      message: 'Server error updating shipment',
      error: error.message
    });
  }
};

// @desc    Delete shipment by ID
// @route   DELETE /api/shipments/:id
// @access  Public
const deleteShipment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid shipment ID format: '${id}'`
      });
    }

    const shipment = await Shipment.findByIdAndDelete(id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: `Shipment not found with ID: '${id}'`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Shipment deleted successfully',
      data: {
        id: shipment._id,
        trackingNumber: shipment.trackingNumber
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error deleting shipment',
      error: error.message
    });
  }
};

module.exports = {
  createShipment,
  getShipments,
  getShipmentById,
  updateShipment,
  deleteShipment
};
