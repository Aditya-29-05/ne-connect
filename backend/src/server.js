require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

const authRoutes = require('./routes/authRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const vehicleLocationRoutes = require('./routes/vehicleLocationRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');
const routeRoutes = require('./routes/routeRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const { protect } = require('./middleware/authMiddleware');

// Middleware
app.use(cors());
app.use(express.json());

// Public Auth Routes
app.use('/api/auth', authRoutes);

// Protected Business Routes
app.use('/api/vehicles', protect, vehicleRoutes);
app.use('/api/vehicles', protect, vehicleLocationRoutes);
app.use('/api/shipments', protect, shipmentRoutes);
app.use('/api/routes', protect, routeRoutes);
app.use('/api/incidents', protect, incidentRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'NE-Connect API is running',
    timestamp: new Date().toISOString()
  });
});

// Connect to Database and Start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`NE-Connect API server running on port ${PORT}`);
  });
};

startServer();

module.exports = app;

