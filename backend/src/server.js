require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

const vehicleRoutes = require('./routes/vehicleRoutes');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/vehicles', vehicleRoutes);

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

