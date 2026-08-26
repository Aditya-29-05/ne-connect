const express = require('express');
const router = express.Router();
const {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncident,
  deleteIncident
} = require('../controllers/incidentController');

router.route('/').get(getIncidents).post(createIncident);
router.route('/:id').get(getIncidentById).put(updateIncident).delete(deleteIncident);

module.exports = router;
