const mongoose = require('mongoose');
const { Route } = require('../models');

// @desc    Create a new route
// @route   POST /api/routes
// @access  Public
const createRoute = async (req, res) => {
  try {
    const route = await Route.create(req.body);
    return res.status(201).json({
      success: true,
      message: 'Route created successfully',
      data: route
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: `Route with routeCode '${req.body.routeCode}' already exists`
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
      message: 'Server error creating route',
      error: error.message
    });
  }
};

// @desc    Get all routes
// @route   GET /api/routes
// @access  Public
const getRoutes = async (req, res) => {
  try {
    const routes = await Route.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: routes.length,
      data: routes
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving routes',
      error: error.message
    });
  }
};

// @desc    Get single route by ID
// @route   GET /api/routes/:id
// @access  Public
const getRouteById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid route ID format: '${id}'`
      });
    }

    const route = await Route.findById(id);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: `Route not found with ID: '${id}'`
      });
    }

    return res.status(200).json({
      success: true,
      data: route
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving route',
      error: error.message
    });
  }
};

// @desc    Update route by ID
// @route   PUT /api/routes/:id
// @access  Public
const updateRoute = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid route ID format: '${id}'`
      });
    }

    const route = await Route.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: `Route not found with ID: '${id}'`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Route updated successfully',
      data: route
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: `Route with routeCode '${req.body.routeCode}' already exists`
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
      message: 'Server error updating route',
      error: error.message
    });
  }
};

// @desc    Delete route by ID
// @route   DELETE /api/routes/:id
// @access  Public
const deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid route ID format: '${id}'`
      });
    }

    const route = await Route.findByIdAndDelete(id);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: `Route not found with ID: '${id}'`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Route deleted successfully',
      data: {
        id: route._id,
        routeCode: route.routeCode
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error deleting route',
      error: error.message
    });
  }
};

module.exports = {
  createRoute,
  getRoutes,
  getRouteById,
  updateRoute,
  deleteRoute
};
