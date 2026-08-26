const express = require('express');
const router = express.Router();
const {
  createRoute,
  getRoutes,
  getRouteById,
  updateRoute,
  deleteRoute
} = require('../controllers/routeController');

router.route('/').get(getRoutes).post(createRoute);
router.route('/:id').get(getRouteById).put(updateRoute).delete(deleteRoute);

module.exports = router;
