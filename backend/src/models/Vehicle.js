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
        message: 'Coordinates must be an array of two numbers [longitude, latitude]'
      }
    },
    updatedAt: {
      type: Date
    }
  },
  { _id: false }
);

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Driver name is required'],
      trim: true,
      validate: {
        validator: (v) => typeof v === 'string' && v.trim().length > 0,
        message: 'Driver name cannot be empty'
      }
    },
    phone: {
      type: String,
      required: [true, 'Driver phone is required'],
      trim: true,
      validate: {
        validator: (v) => typeof v === 'string' && v.trim().length > 0,
        message: 'Driver phone cannot be empty'
      }
    },
    licenseNumber: {
      type: String,
      trim: true
    }
  },
  { _id: false }
);

const vehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      unique: true,
      trim: true
    },
    type: {
      type: String,
      required: [true, 'Vehicle type is required'],
      enum: {
        values: ['TRUCK_HEAVY', 'TRUCK_MEDIUM', 'PICKUP_4X4', 'AMBULANCE', 'HELICOPTER', 'BOAT'],
        message: '{VALUE} is not a valid vehicle type'
      }
    },
    capacityKg: {
      type: Number,
      required: [true, 'Capacity in kg is required'],
      min: [0, 'Capacity cannot be negative']
    },
    capacityVolumeM3: {
      type: Number,
      min: [0, 'Volume capacity cannot be negative']
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['AVAILABLE', 'ASSIGNED', 'IN_TRANSIT', 'MAINTENANCE', 'OFFLINE'],
        message: '{VALUE} is not a valid vehicle status'
      },
      default: 'AVAILABLE'
    },
    driver: {
      type: driverSchema,
      required: [true, 'Driver information is required']
    },
    currentLocation: {
      type: pointSchema
    },
    isEmergencyReady: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  {
    timestamps: true,
    collection: 'vehicles'
  }
);

// Indexes
vehicleSchema.index({ status: 1, type: 1 });
vehicleSchema.index({ currentLocation: '2dsphere' });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
