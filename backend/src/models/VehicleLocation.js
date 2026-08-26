const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length === 2 && typeof val[0] === 'number' && typeof val[1] === 'number';
        },
        message: 'Telemetry coordinates must be [longitude, latitude]'
      }
    }
  },
  { _id: false }
);

const vehicleLocationSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle ID is required']
    },
    location: {
      type: pointSchema,
      required: [true, 'Location is required']
    },
    speedKmh: {
      type: Number,
      min: [0, 'Speed cannot be negative']
    },
    heading: {
      type: Number,
      min: [0, 'Heading must be between 0 and 360 degrees'],
      max: [360, 'Heading must be between 0 and 360 degrees']
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    }
  },
  {
    timestamps: false,
    collection: 'vehicle_locations'
  }
);

// Indexes
vehicleLocationSchema.index({ vehicleId: 1, timestamp: -1 });
vehicleLocationSchema.index({ location: '2dsphere' });

const VehicleLocation = mongoose.model('VehicleLocation', vehicleLocationSchema);

module.exports = VehicleLocation;
