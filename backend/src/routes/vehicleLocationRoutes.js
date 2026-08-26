const express = require('express');
const router = express.Router();
const {
  addVehicleLocation,
  getVehicleLocationHistory
} = require('../controllers/vehicleLocationController');

// POST /api/vehicles/:id/location
router.post('/:id/location', addVehicleLocation);

// GET /api/vehicles/:id/location-history
router.get('/:id/location-history', getVehicleLocationHistory);

module.exports = router;
