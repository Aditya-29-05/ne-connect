require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/server');
const { User } = require('../src/models');

const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
};

const waitForServer = async (baseUrl, retries = 20) => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await makeRequest({
        ...baseUrl,
        path: '/api/health',
        method: 'GET'
      });
      if (res.statusCode === 200) {
        return true;
      }
    } catch (e) {
      // Wait and retry
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Server did not start in time');
};

const runAPITests = async () => {
  console.log('=== Starting NEC-10 Vehicle REST API Verification ===\n');

  const PORT = process.env.PORT || 5000;
  const baseUrl = {
    hostname: '127.0.0.1',
    port: PORT
  };

  let testUserId = null;
  let authHeaders = {};

  try {
    console.log('Waiting for Express server and MongoDB Atlas connection...');
    await waitForServer(baseUrl);
    console.log('✔ Server is online and responding.\n');

    // Setup: Register test user for authenticated API calls
    const authEmail = `vehicle.test.${Date.now()}@example.com`;
    const regRes = await makeRequest(
      {
        ...baseUrl,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        name: 'Vehicle Test User',
        email: authEmail,
        password: 'Password123'
      }
    );
    if (regRes.statusCode === 201 && regRes.body.data?.token) {
      testUserId = regRes.body.data.user.id;
      authHeaders = {
        Authorization: `Bearer ${regRes.body.data.token}`
      };
      console.log('✔ Test user authenticated for vehicle API tests.\n');
    }

    // 1. Test GET /api/health
    console.log('1. Testing GET /api/health...');
    const healthRes = await makeRequest({
      ...baseUrl,
      path: '/api/health',
      method: 'GET'
    });
    console.log(`   Status: ${healthRes.statusCode}`, healthRes.body);
    if (healthRes.statusCode !== 200 || !healthRes.body.success) {
      throw new Error(`Health check failed with status ${healthRes.statusCode}`);
    }
    console.log('   ✔ GET /api/health PASSED (HTTP 200)\n');

    // 2. Test POST /api/vehicles (Create Vehicle)
    const testVehNum = `NEC-TEST-VEH-${Date.now()}`;
    const newVehiclePayload = {
      vehicleNumber: testVehNum,
      type: 'PICKUP_4X4',
      capacityKg: 1500,
      capacityVolumeM3: 7.2,
      status: 'AVAILABLE',
      driver: {
        name: 'Suresh Das',
        phone: '+91-9876543210',
        licenseNumber: 'AS-01-2024-0012'
      },
      currentLocation: {
        type: 'Point',
        coordinates: [91.7362, 26.1445]
      },
      isEmergencyReady: true
    };

    console.log(`2. Testing POST /api/vehicles (vehicleNumber: ${testVehNum})...`);
    const createRes = await makeRequest(
      {
        ...baseUrl,
        path: '/api/vehicles',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders }
      },
      newVehiclePayload
    );
    console.log(`   Status: ${createRes.statusCode}`, createRes.body);
    if (createRes.statusCode !== 201 || !createRes.body.success || !createRes.body.data._id) {
      throw new Error(`POST /api/vehicles failed: status ${createRes.statusCode}`);
    }
    const createdId = createRes.body.data._id;
    console.log(`   ✔ POST /api/vehicles PASSED (HTTP 201, Created ID: ${createdId})\n`);

    // 3. Test GET /api/vehicles (List Vehicles)
    console.log('3. Testing GET /api/vehicles...');
    const listRes = await makeRequest({
      ...baseUrl,
      path: '/api/vehicles',
      method: 'GET',
      headers: { ...authHeaders }
    });
    console.log(`   Status: ${listRes.statusCode}, Count: ${listRes.body.count}`);
    if (listRes.statusCode !== 200 || !Array.isArray(listRes.body.data)) {
      throw new Error(`GET /api/vehicles failed: status ${listRes.statusCode}`);
    }
    const foundInList = listRes.body.data.some((v) => v._id === createdId);
    if (!foundInList) throw new Error('Created vehicle not found in vehicle list!');
    console.log('   ✔ GET /api/vehicles PASSED (HTTP 200)\n');

    // 4. Test GET /api/vehicles/:id (Get Single Vehicle)
    console.log(`4. Testing GET /api/vehicles/${createdId}...`);
    const getSingleRes = await makeRequest({
      ...baseUrl,
      path: `/api/vehicles/${createdId}`,
      method: 'GET',
      headers: { ...authHeaders }
    });
    console.log(`   Status: ${getSingleRes.statusCode}`, getSingleRes.body.data.vehicleNumber);
    if (getSingleRes.statusCode !== 200 || getSingleRes.body.data.vehicleNumber !== testVehNum) {
      throw new Error(`GET /api/vehicles/:id failed: status ${getSingleRes.statusCode}`);
    }
    console.log('   ✔ GET /api/vehicles/:id PASSED (HTTP 200)\n');

    // 5. Test PUT /api/vehicles/:id (Update Vehicle)
    console.log(`5. Testing PUT /api/vehicles/${createdId}...`);
    const updatePayload = {
      status: 'IN_TRANSIT',
      capacityKg: 1800,
      'driver.phone': '+91-9123456789'
    };
    const updateRes = await makeRequest(
      {
        ...baseUrl,
        path: `/api/vehicles/${createdId}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders }
      },
      updatePayload
    );
    console.log(`   Status: ${updateRes.statusCode}, Updated Status: ${updateRes.body.data.status}`);
    if (updateRes.statusCode !== 200 || updateRes.body.data.status !== 'IN_TRANSIT') {
      throw new Error(`PUT /api/vehicles/:id failed: status ${updateRes.statusCode}`);
    }
    console.log('   ✔ PUT /api/vehicles/:id PASSED (HTTP 200)\n');

    // 6. Test Error: Duplicate vehicleNumber -> HTTP 409
    console.log(`6. Testing POST /api/vehicles with duplicate vehicleNumber '${testVehNum}'...`);
    const dupRes = await makeRequest(
      {
        ...baseUrl,
        path: '/api/vehicles',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders }
      },
      newVehiclePayload
    );
    console.log(`   Status: ${dupRes.statusCode}`, dupRes.body);
    if (dupRes.statusCode !== 409) {
      throw new Error(`Duplicate vehicleNumber test failed: expected HTTP 409, got ${dupRes.statusCode}`);
    }
    console.log('   ✔ Duplicate vehicleNumber error handling PASSED (HTTP 409)\n');

    // 7. Test Error: Missing required fields -> HTTP 400
    console.log('7. Testing POST /api/vehicles with missing required fields...');
    const missingFieldRes = await makeRequest(
      {
        ...baseUrl,
        path: '/api/vehicles',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders }
      },
      { vehicleNumber: `MISSING-FIELDS-${Date.now()}` }
    );
    console.log(`   Status: ${missingFieldRes.statusCode}`, missingFieldRes.body);
    if (missingFieldRes.statusCode !== 400) {
      throw new Error(`Missing fields test failed: expected HTTP 400, got ${missingFieldRes.statusCode}`);
    }
    console.log('   ✔ Missing required fields error handling PASSED (HTTP 400)\n');

    // 8. Test Error: Invalid vehicle type enum -> HTTP 400
    console.log('8. Testing POST /api/vehicles with invalid vehicle type enum...');
    const invalidTypeRes = await makeRequest(
      {
        ...baseUrl,
        path: '/api/vehicles',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders }
      },
      {
        ...newVehiclePayload,
        vehicleNumber: `INV-TYPE-${Date.now()}`,
        type: 'SUPER_ROCKET'
      }
    );
    console.log(`   Status: ${invalidTypeRes.statusCode}`, invalidTypeRes.body);
    if (invalidTypeRes.statusCode !== 400) {
      throw new Error(`Invalid type enum test failed: expected HTTP 400, got ${invalidTypeRes.statusCode}`);
    }
    console.log('   ✔ Invalid type enum error handling PASSED (HTTP 400)\n');

    // 9. Test Error: Invalid status enum -> HTTP 400
    console.log('9. Testing PUT /api/vehicles/:id with invalid status enum...');
    const invalidStatusRes = await makeRequest(
      {
        ...baseUrl,
        path: `/api/vehicles/${createdId}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders }
      },
      { status: 'FLYING_AWAY' }
    );
    console.log(`   Status: ${invalidStatusRes.statusCode}`, invalidStatusRes.body);
    if (invalidStatusRes.statusCode !== 400) {
      throw new Error(`Invalid status enum test failed: expected HTTP 400, got ${invalidStatusRes.statusCode}`);
    }
    console.log('   ✔ Invalid status enum error handling PASSED (HTTP 400)\n');

    // 10. Test Error: Invalid MongoDB ID format -> HTTP 400
    console.log('10. Testing GET /api/vehicles/invalid_mongo_id...');
    const invalidIdRes = await makeRequest({
      ...baseUrl,
      path: '/api/vehicles/not-a-valid-id-123',
      method: 'GET',
      headers: { ...authHeaders }
    });
    console.log(`   Status: ${invalidIdRes.statusCode}`, invalidIdRes.body);
    if (invalidIdRes.statusCode !== 400) {
      throw new Error(`Invalid MongoDB ID test failed: expected HTTP 400, got ${invalidIdRes.statusCode}`);
    }
    console.log('   ✔ Invalid MongoDB ID format error handling PASSED (HTTP 400)\n');

    // 11. Test Error: Non-existent vehicle ID -> HTTP 404
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    console.log(`11. Testing GET /api/vehicles/${nonExistentId} (non-existent)...`);
    const nonExistentRes = await makeRequest({
      ...baseUrl,
      path: `/api/vehicles/${nonExistentId}`,
      method: 'GET',
      headers: { ...authHeaders }
    });
    console.log(`   Status: ${nonExistentRes.statusCode}`, nonExistentRes.body);
    if (nonExistentRes.statusCode !== 404) {
      throw new Error(`Non-existent ID test failed: expected HTTP 404, got ${nonExistentRes.statusCode}`);
    }
    console.log('   ✔ Non-existent vehicle ID error handling PASSED (HTTP 404)\n');

    // 12. Test DELETE /api/vehicles/:id (Delete Vehicle)
    console.log(`12. Testing DELETE /api/vehicles/${createdId}...`);
    const deleteRes = await makeRequest({
      ...baseUrl,
      path: `/api/vehicles/${createdId}`,
      method: 'DELETE',
      headers: { ...authHeaders }
    });
    console.log(`   Status: ${deleteRes.statusCode}`, deleteRes.body);
    if (deleteRes.statusCode !== 200 || !deleteRes.body.success) {
      throw new Error(`DELETE /api/vehicles/:id failed: status ${deleteRes.statusCode}`);
    }
    console.log('   ✔ DELETE /api/vehicles/:id PASSED (HTTP 200)\n');

    // 13. Confirm Vehicle is deleted -> HTTP 404
    console.log(`13. Verifying deleted vehicle ${createdId} returns 404...`);
    const verifyDeletedRes = await makeRequest({
      ...baseUrl,
      path: `/api/vehicles/${createdId}`,
      method: 'GET',
      headers: { ...authHeaders }
    });
    console.log(`   Status: ${verifyDeletedRes.statusCode}`, verifyDeletedRes.body);
    if (verifyDeletedRes.statusCode !== 404) {
      throw new Error(`Deleted vehicle verification failed: expected 404, got ${verifyDeletedRes.statusCode}`);
    }
    console.log('   ✔ Verification of deleted vehicle PASSED (HTTP 404)\n');

    // Cleanup: Remove test user
    if (testUserId) {
      await User.findByIdAndDelete(testUserId);
      console.log('   Cleaned up test user.\n');
    }

    console.log('=== ALL 13 VEHICLE REST API TESTS PASSED SUCCESSFULLY! ===\n');
    process.exit(0);
  } catch (error) {
    console.error('✖ Vehicle REST API test failed:', error);
    if (testUserId) {
      try {
        await User.findByIdAndDelete(testUserId);
      } catch (e) {}
    }
    process.exit(1);
  }
};

runAPITests();
