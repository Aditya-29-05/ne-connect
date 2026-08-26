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
        message: 'Incident location coordinates must be [longitude, latitude]'
      }
    }
  },
  { _id: false }
);

const incidentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Incident type is required'],
      enum: {
        values: [
          'FLOOD',
          'LANDSLIDE',
          'ROAD_BLOCKAGE',
          'BRIDGE_COLLAPSE',
          'SEVERE_WEATHER',
          'TRAFFIC_CONGESTION',
          'OTHER'
        ],
        message: '{VALUE} is not a valid incident type'
      }
    },
    severity: {
      type: String,
      required: [true, 'Severity level is required'],
      enum: {
        values: ['LOW', 'MODERATE', 'SEVERE', 'CRITICAL'],
        message: '{VALUE} is not a valid severity level'
      }
    },
    title: {
      type: String,
      required: [true, 'Incident title is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    location: {
      type: pointSchema,
      required: [true, 'Incident location is required']
    },
    affectedRadiusMeters: {
      type: Number,
      required: true,
      default: 500,
      min: [0, 'Affected radius cannot be negative']
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['ACTIVE', 'VERIFIED', 'RESOLVING', 'RESOLVED', 'FALSE_REPORT'],
        message: '{VALUE} is not a valid incident status'
      },
      default: 'ACTIVE'
    },
    reportedBy: {
      type: String,
      trim: true
    },
    affectedRoutes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route'
      }
    ],
    reportedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    resolvedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    collection: 'incidents'
  }
);

// Indexes
incidentSchema.index({ location: '2dsphere' });
incidentSchema.index({ status: 1, severity: 1 });
incidentSchema.index({ affectedRoutes: 1 });

const Incident = mongoose.model('Incident', incidentSchema);

module.exports = Incident;
