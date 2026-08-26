const mongoose = require('mongoose');
const { Incident } = require('../models');

// @desc    Create a new incident
// @route   POST /api/incidents
// @access  Public
const createIncident = async (req, res) => {
  try {
    const incident = await Incident.create(req.body);
    return res.status(201).json({
      success: true,
      message: 'Incident created successfully',
      data: incident
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate incident record'
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
      message: 'Server error creating incident',
      error: error.message
    });
  }
};

// @desc    Get all incidents
// @route   GET /api/incidents
// @access  Public
const getIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ reportedAt: -1 });
    return res.status(200).json({
      success: true,
      count: incidents.length,
      data: incidents
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving incidents',
      error: error.message
    });
  }
};

// @desc    Get single incident by ID
// @route   GET /api/incidents/:id
// @access  Public
const getIncidentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid incident ID format: '${id}'`
      });
    }

    const incident = await Incident.findById(id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: `Incident not found with ID: '${id}'`
      });
    }

    return res.status(200).json({
      success: true,
      data: incident
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving incident',
      error: error.message
    });
  }
};

// @desc    Update incident by ID
// @route   PUT /api/incidents/:id
// @access  Public
const updateIncident = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid incident ID format: '${id}'`
      });
    }

    const incident = await Incident.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: `Incident not found with ID: '${id}'`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Incident updated successfully',
      data: incident
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
      message: 'Server error updating incident',
      error: error.message
    });
  }
};

// @desc    Delete incident by ID
// @route   DELETE /api/incidents/:id
// @access  Public
const deleteIncident = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid incident ID format: '${id}'`
      });
    }

    const incident = await Incident.findByIdAndDelete(id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: `Incident not found with ID: '${id}'`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Incident deleted successfully',
      data: {
        id: incident._id,
        title: incident.title
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error deleting incident',
      error: error.message
    });
  }
};

module.exports = {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncident,
  deleteIncident
};
