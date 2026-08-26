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
        message: 'Point coordinates must be [longitude, latitude]'
      }
    }
  },
  { _id: false }
);

const lineStringSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['LineString'],
      required: true,
      default: 'LineString'
    },
    coordinates: {
      type: [[Number]], // [[longitude, latitude], ...]
      required: true,
      validate: {
        validator: function (coords) {
          return (
            Array.isArray(coords) &&
            coords.length >= 2 &&
            coords.every(
              (pt) => Array.isArray(pt) && pt.length === 2 && typeof pt[0] === 'number' && typeof pt[1] === 'number'
            )
          );
        },
        message: 'LineString coordinates must be an array of at least two [longitude, latitude] pairs'
      }
    }
  },
  { _id: false }
);

const locationNamedSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true
    },
    location: {
      type: pointSchema,
      required: [true, 'Location coordinates are required']
    }
  },
  { _id: false }
);

const routeSchema = new mongoose.Schema(
  {
    routeCode: {
      type: String,
      required: [true, 'Route code is required'],
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Route name is required'],
      trim: true
    },
    origin: {
      type: locationNamedSchema,
      required: [true, 'Origin is required']
    },
    destination: {
      type: locationNamedSchema,
      required: [true, 'Destination is required']
    },
    distanceKm: {
      type: Number,
      required: [true, 'Distance in km is required'],
      min: [0, 'Distance cannot be negative']
    },
    estimatedDurationMinutes: {
      type: Number,
      required: [true, 'Estimated duration in minutes is required'],
      min: [0, 'Estimated duration cannot be negative']
    },
    pathGeometry: {
      type: lineStringSchema,
      required: [true, 'Path geometry is required']
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['OPEN', 'RESTRICTED', 'BLOCKED'],
        message: '{VALUE} is not a valid route status'
      },
      default: 'OPEN'
    },
    riskLevel: {
      type: String,
      required: true,
      enum: {
        values: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        message: '{VALUE} is not a valid risk level'
      },
      default: 'LOW'
    },
    allowedVehicleTypes: {
      type: [String],
      required: [true, 'Allowed vehicle types are required'],
      validate: {
        validator: function (types) {
          const allowed = ['TRUCK_HEAVY', 'TRUCK_MEDIUM', 'PICKUP_4X4', 'AMBULANCE', 'HELICOPTER', 'BOAT'];
          return Array.isArray(types) && types.length > 0 && types.every((t) => allowed.includes(t));
        },
        message: 'Invalid or empty vehicle types specified in allowedVehicleTypes'
      }
    }
  },
  {
    timestamps: true,
    collection: 'routes'
  }
);

// Indexes
routeSchema.index({ status: 1, riskLevel: 1 });
routeSchema.index({ pathGeometry: '2dsphere' });

const Route = mongoose.model('Route', routeSchema);

module.exports = Route;
