const express = require('express');
const router = express.Router();
const {
  createShipment,
  getShipments,
  getShipmentById,
  updateShipment,
  deleteShipment
} = require('../controllers/shipmentController');

router.route('/').get(getShipments).post(createShipment);
router.route('/:id').get(getShipmentById).put(updateShipment).delete(deleteShipment);

module.exports = router;
