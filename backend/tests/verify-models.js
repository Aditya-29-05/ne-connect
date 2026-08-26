require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const { Vehicle, Route, Incident, Shipment, VehicleLocation } = require('../src/models');

const runVerification = async () => {
  console.log('=== Starting NEC-9 Mongoose Schema Verification ===\n');

  try {
    // 1. Connect to MongoDB Atlas
    await connectDB();
    console.log('✔ MongoDB Atlas connected successfully.\n');

    // 2. Ensure indexes are built
    await Vehicle.init();
    await Route.init();
    await Incident.init();
    await Shipment.init();
    await VehicleLocation.init();
    console.log('✔ Mongoose model indexes initialized successfully.\n');

    // 3. Test Sample Vehicle Creation
    const testVehicleNumber = `TEST-VEH-${Date.now()}`;
    const sampleVehicle = await Vehicle.create({
      vehicleNumber: testVehicleNumber,
      type: 'PICKUP_4X4',
      capacityKg: 1200,
      capacityVolumeM3: 6.5,
      status: 'AVAILABLE',
      driver: {
        name: 'Test Driver A',
        phone: '+91-9876543210',
        licenseNumber: 'DL-99887766'
      },
      currentLocation: {
        type: 'Point',
        coordinates: [91.7362, 26.1445], // [lng, lat]
        updatedAt: new Date()
      },
      isEmergencyReady: true
    });
    console.log(`✔ Vehicle created: ${sampleVehicle.vehicleNumber} (ID: ${sampleVehicle._id})`);

    // 4. Test Sample Route Creation
    const testRouteCode = `TEST-RT-${Date.now()}`;
    const sampleRoute = await Route.create({
      routeCode: testRouteCode,
      name: 'Guwahati - Shillong NH-6',
      origin: {
        name: 'Guwahati Dispatch Base',
        location: {
          type: 'Point',
          coordinates: [91.7362, 26.1445]
        }
      },
      destination: {
        name: 'Shillong Relief Camp',
        location: {
          type: 'Point',
          coordinates: [91.8933, 25.5788]
        }
      },
      distanceKm: 99.4,
      estimatedDurationMinutes: 160,
      pathGeometry: {
        type: 'LineString',
        coordinates: [
          [91.7362, 26.1445],
          [91.8150, 25.8600],
          [91.8933, 25.5788]
        ]
      },
      status: 'OPEN',
      riskLevel: 'LOW',
      allowedVehicleTypes: ['PICKUP_4X4', 'TRUCK_MEDIUM', 'AMBULANCE']
    });
    console.log(`✔ Route created: ${sampleRoute.routeCode} (ID: ${sampleRoute._id})`);

    // 5. Test Sample Incident Creation
    const sampleIncident = await Incident.create({
      type: 'LANDSLIDE',
      severity: 'SEVERE',
      title: 'Landslide on Hill Road Segment',
      description: 'Single lane blocked by mud and debris.',
      location: {
        type: 'Point',
        coordinates: [91.8150, 25.8600]
      },
      affectedRadiusMeters: 800,
      status: 'ACTIVE',
      reportedBy: 'Field Officer Assam-04',
      affectedRoutes: [sampleRoute._id]
    });
    console.log(`✔ Incident created: ${sampleIncident.title} (ID: ${sampleIncident._id})`);

    // 6. Test Sample Shipment Creation
    const testTrackingNumber = `TEST-SHP-${Date.now()}`;
    const sampleShipment = await Shipment.create({
      trackingNumber: testTrackingNumber,
      commodityType: 'MEDICINE',
      description: 'Emergency anti-venom and surgical kits',
      weightKg: 150,
      volumeM3: 0.8,
      priority: 'CRITICAL_EMERGENCY',
      origin: {
        facilityName: 'Guwahati Medical Warehouse',
        location: {
          type: 'Point',
          coordinates: [91.7362, 26.1445]
        }
      },
      destination: {
        facilityName: 'Shillong Emergency Hospital',
        location: {
          type: 'Point',
          coordinates: [91.8933, 25.5788]
        }
      },
      assignedVehicleId: sampleVehicle._id,
      assignedRouteId: sampleRoute._id,
      status: 'ALLOCATED',
      expectedDeliveryTime: new Date(Date.now() + 4 * 3600 * 1000)
    });
    console.log(`✔ Shipment created: ${sampleShipment.trackingNumber} (ID: ${sampleShipment._id})`);

    // 7. Test Sample VehicleLocation Telemetry
    const sampleTelemetry = await VehicleLocation.create({
      vehicleId: sampleVehicle._id,
      location: {
        type: 'Point',
        coordinates: [91.7500, 26.1500]
      },
      speedKmh: 45.2,
      heading: 120.5,
      timestamp: new Date()
    });
    console.log(`✔ VehicleLocation logged for Vehicle ID ${sampleTelemetry.vehicleId} (ID: ${sampleTelemetry._id})\n`);

    // 8. Test Validation: Invalid Enum Rejection
    let enumRejected = false;
    try {
      await Vehicle.create({
        vehicleNumber: `FAIL-VEH-${Date.now()}`,
        type: 'SPACESHIP', // Invalid enum
        capacityKg: 500,
        status: 'AVAILABLE',
        driver: { name: 'A', phone: '123' },
        isEmergencyReady: false
      });
    } catch (err) {
      enumRejected = true;
      console.log(`✔ Enum validation working (rejected invalid type 'SPACESHIP'): ${err.message}`);
    }
    if (!enumRejected) throw new Error('Enum validation failed to reject invalid type!');

    // 9. Test Validation: Required Field Enforcement
    let requiredFieldRejected = false;
    try {
      await Shipment.create({
        trackingNumber: `FAIL-SHP-${Date.now()}`,
        commodityType: 'MEDICINE'
        // Missing required fields
      });
    } catch (err) {
      requiredFieldRejected = true;
      console.log(`✔ Required fields validation working: ${err.message}`);
    }
    if (!requiredFieldRejected) throw new Error('Required field validation failed!');

    // 10. Test Validation: Duplicate Unique Key Rejection
    let duplicateRejected = false;
    try {
      await Vehicle.create({
        vehicleNumber: testVehicleNumber, // Duplicate!
        type: 'TRUCK_MEDIUM',
        capacityKg: 3000,
        status: 'AVAILABLE',
        driver: { name: 'Driver B', phone: '9876543210' },
        isEmergencyReady: false
      });
    } catch (err) {
      duplicateRejected = true;
      console.log(`✔ Duplicate unique key rejected for vehicleNumber '${testVehicleNumber}': ${err.message}`);
    }
    if (!duplicateRejected) throw new Error('Duplicate vehicleNumber was not rejected!');

    // Cleanup test documents
    await Vehicle.deleteOne({ _id: sampleVehicle._id });
    await Route.deleteOne({ _id: sampleRoute._id });
    await Incident.deleteOne({ _id: sampleIncident._id });
    await Shipment.deleteOne({ _id: sampleShipment._id });
    await VehicleLocation.deleteOne({ _id: sampleTelemetry._id });
    console.log('\n✔ Test data cleaned up successfully.');

    console.log('\n=== ALL MODEL & SCHEMA TESTS PASSED (10/10) ===');
    process.exit(0);
  } catch (error) {
    console.error('\n✖ Verification failed:', error);
    process.exit(1);
  }
};

runVerification();
