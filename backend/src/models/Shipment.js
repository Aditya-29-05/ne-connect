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
        message: 'Coordinates must be [longitude, latitude]'
      }
    }
  },
  { _id: false }
);

const facilityLocationSchema = new mongoose.Schema(
  {
    facilityName: {
      type: String,
      required: [true, 'Facility name is required'],
      trim: true
    },
    location: {
      type: pointSchema,
      required: [true, 'Facility coordinates are required']
    }
  },
  { _id: false }
);

const shipmentSchema = new mongoose.Schema(
  {
    trackingNumber: {
      type: String,
      required: [true, 'Tracking number is required'],
      unique: true,
      trim: true
    },
    commodityType: {
      type: String,
      required: [true, 'Commodity type is required'],
      enum: {
        values: ['MEDICINE', 'FOOD', 'DRINKING_WATER', 'RESCUE_EQUIPMENT', 'GENERAL_SUPPLIES'],
        message: '{VALUE} is not a valid commodity type'
      }
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    weightKg: {
      type: Number,
      required: [true, 'Weight in kg is required'],
      min: [1, 'Weight must be at least 1 kg']
    },
    volumeM3: {
      type: Number,
      min: [0, 'Volume cannot be negative']
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: {
        values: ['CRITICAL_EMERGENCY', 'HIGH', 'STANDARD', 'LOW'],
        message: '{VALUE} is not a valid priority level'
      }
    },
    origin: {
      type: facilityLocationSchema,
      required: [true, 'Origin facility is required']
    },
    destination: {
      type: facilityLocationSchema,
      required: [true, 'Destination facility is required']
    },
    assignedVehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle'
    },
    assignedRouteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route'
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['PENDING', 'ALLOCATED', 'IN_TRANSIT', 'REROUTED', 'DELIVERED', 'CANCELLED'],
        message: '{VALUE} is not a valid shipment status'
      },
      default: 'PENDING'
    },
    expectedDeliveryTime: {
      type: Date
    },
    actualDeliveryTime: {
      type: Date
    }
  },
  {
    timestamps: true,
    collection: 'shipments'
  }
);

// Indexes
shipmentSchema.index({ status: 1, priority: 1 });
shipmentSchema.index({ assignedVehicleId: 1 });

const Shipment = mongoose.model('Shipment', shipmentSchema);

module.exports = Shipment;
