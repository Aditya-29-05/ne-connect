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

const runRemainingAPITests = async () => {
  console.log('=== Starting NEC-11 Remaining REST APIs Verification ===\n');

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
    const authEmail = `remaining.test.${Date.now()}@example.com`;
    const regRes = await makeRequest(
      {
        ...baseUrl,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        name: 'Remaining APIs Test User',
        email: authEmail,
        password: 'Password123'
      }
    );
    if (regRes.statusCode === 201 && regRes.body.data?.token) {
      testUserId = regRes.body.data.user.id;
      authHeaders = {
        Authorization: `Bearer ${regRes.body.data.token}`
      };
      console.log('✔ Test user authenticated for remaining API tests.\n');
    }

    // ==========================================
    // 1. HEALTH CHECK
    // ==========================================
    console.log('--- 1. Health Check Endpoint ---');
    const healthRes = await makeRequest({
      ...baseUrl,
      path: '/api/health',
      method: 'GET'
    });
    console.log(`   Status: ${healthRes.statusCode}`, healthRes.body);
    if (healthRes.statusCode !== 200 || !healthRes.body.success) {
      throw new Error(`Health check failed: expected 200, got ${healthRes.statusCode}`);
    }
    console.log('   ✔ GET /api/health PASSED (HTTP 200)\n');

    // ==========================================
    // 2. SHIPMENTS API
    // ==========================================
    console.log('--- 2. Shipments API Endpoints ---');
    const testTrackingNum = `NEC-SHIP-${Date.now()}`;
    const shipmentPayload = {
      trackingNumber: testTrackingNum,
      commodityType: 'MEDICINE',
      description: 'Emergency anti-venom and antibiotics',
      weightKg: 45.5,
      volumeM3: 0.8,
      priority: 'CRITICAL_EMERGENCY',
      origin: {
        facilityName: 'Guwahati Central Depot',
        location: {
          type: 'Point',
          coordinates: [91.7362, 26.1445]
        }
      },
      destination: {
        facilityName: 'Silchar Field Hospital',
        location: {
          type: 'Point',
          coordinates: [92.7926, 24.8333]
        }
      },
      status: 'PENDING'
    };

    // 2.1 POST /api/shipments (Create)
    console.log(`2.1 Testing POST /api/shipments (${testTrackingNum})...`);
    const createShipmentRes = await makeRequest(
      {
        ...baseUrl,
        path: '/api/shipments',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders }
      },
      shipmentPayload
    );
    console.log(`   Status: ${createShipmentRes.statusCode}`, createShipmentRes.body);
    if (createShipmentRes.statusCode !== 201 || !createShipmentRes.body.success || !createShipmentRes.body.data._id) {
      throw new Error(`POST /api/shipments failed: expected 201, got ${createShipmentRes.statusCode}`);
    }
    const createdShipmentId = createShipmentRes.body.data._id;
    console.log(`   ✔ POST /api/shipments PASSED (HTTP 201, ID: ${createdShipmentId})\n`);

    // 2.2 GET /api/shipments (List)
    console.log('2.2 Testing GET /api/shipments...');
    const listShipmentsRes = await makeRequest({
      ...baseUrl,
      path: '/api/shipments',
      method: 'GET',
      headers: { ...authHeaders }
    });
    console.log(`   Status: ${listShipmentsRes.statusCode}, Count: ${listShipmentsRes.body.count}`);
    if (listShipmentsRes.statusCode !== 200 || !Array.isArray(listShipmentsRes.body.data)) {
      throw new Error(`GET /api/shipments failed: expected 200, got ${listShipmentsRes.statusCode}`);
    }
    const shipmentInList = listShipmentsRes.body.data.some((s) => s._id === createdShipmentId);
    if (!shipmentInList) throw new Error('Created shipment not found in shipments list');
    console.log('   ✔ GET /api/shipments PASSED (HTTP 200)\n');

    // 2.3 GET /api/shipments/:id (Get by ID)
    console.log(`2.3 Testing GET /api/shipments/${createdShipmentId}...`);
    const getShipmentRes = await makeRequest({
      ...baseUrl,
      path: `/api/shipments/${createdShipmentId}`,
      method: 'GET',
      headers: { ...authHeaders }
    });
    console.log(`   Status: ${getShipmentRes.statusCode}`, getShipmentRes.body.data.trackingNumber);
    if (getShipmentRes.statusCode !== 200 || getShipmentRes.body.data.trackingNumber !== testTrackingNum) {
      throw new Error(`GET /api/shipments/:id failed: expected 200, got ${getShipmentRes.statusCode}`);
    }
    console.log('   ✔ GET /api/shipments/:id PASSED (HTTP 200)\n');

    // 2.4 PUT /api/shipments/:id (Update)
    console.log(`2.4 Testing PUT /api/shipments/${createdShipmentId}...`);
    const updateShipmentRes = await makeRequest(
      {
        ...baseUrl,
        path: `/api/shipments/${createdShipmentId}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders }
      },
      { status: 'IN_TRANSIT', weightKg: 50.0 }
    );
    console.log(`   Status: ${updateShipmentRes.statusCode}, New Status: ${updateShipmentRes.body.data.status}`);
    if (updateShipmentRes.statusCode !== 200 || updateShipmentRes.body.data.status !== 'IN_TRANSIT') {
      throw new Error(`PUT /api/shipments/:id failed: expected 200, got ${updateShipmentRes.statusCode}`);
    }
    console.log('   ✔ PUT /api/shipments/:id PASSED (HTTP 200)\n');

    // 2.5 Duplicate trackingNumber error -> HTTP 409
    console.log(`2.5 Testing duplicate trackingNumber '${testTrackingNum}'...`);
    const dupShipmentRes = await makeRequest(
      {
        ...baseUrl,
        path: '/api/shipments',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders }
      },
      shipmentPayload
    );
    console.log(`   Status: ${dupShipmentRes.statusCode}`, dupShipmentRes.body);
    if (dupShipmentRes.statusCode !== 409) {
      throw new Error(`Duplicate trackingNumber test failed: expected 409, got ${dupShipmentRes.statusCode}`);
    }
    console.log('   ✔ Duplicate trackingNumber error handling PASSED (HTTP 409)\n');

    // 2.6 Invalid shipment data (invalid commodity enum) -> HTTP 400
    console.log('2.6 Testing invalid commodityType enum...');
    const invalidShipmentRes = await makeRequest(
      {
        ...baseUrl,
        path: '/api/shipments',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders }
      },
      { ...shipmentPayload, trackingNumber: `INV-COMMODITY-${Date.now()}`, commodityType: 'INVALID_TYPE' }
    );
    console.log(`   Status: ${invalidShipmentRes.statusCode}`, invalidShipmentRes.body);
    if (invalidShipmentRes.statusCode !== 400) {
      throw new Error(`Invalid shipment data test failed: expected 400, got ${invalidShipmentRes.statusCode}`);
    }
    console.log('   ✔ Invalid shipment data error handling PASSED (HTTP 400)\n');

    // 2.7 Invalid ObjectId -> HTTP 400
    console.log('2.7 Testing invalid shipment ObjectId format...');
    const invalidShipmentIdRes = await makeRequest({
      ...baseUrl,
      path: '/api/shipments/invalid-id-xyz',
      method: 'GET',
      headers: { ...authHeaders }
    });
    console.log(`   Status: ${invalidShipmentIdRes.statusCode}`, invalidShipmentIdRes.body);
    if (invalidShipmentIdRes.statusCode !== 400) {
      throw new Error(`Invalid shipment ID test failed: expected 400, got ${invalidShipmentIdRes.statusCode}`);
    }
    console.log('   ✔ Invalid shipment ObjectId error handling PASSED (HTTP 400)\n');

    // 2.8 Non-existent shipment ID -> HTTP 404
    const nonExistentShipmentId = new mongoose.Types.ObjectId().toString();
    console.log(`2.8 Testing non-existent shipment ID ${nonExistentShipmentId}...`);
    const nonExistentShipmentRes = await makeRequest({
      ...baseUrl,
      path: `/api/shipments/${nonExistentShipmentId}`,
      method: 'GET',
      headers: { ...authHeaders }
    });
    console.log(`   Status: ${nonExistentShipmentRes.statusCode}`, nonExistentShipmentRes.body);
    if (nonExistentShipmentRes.statusCode !== 404) {
      throw new Error(`Non-existent shipment test failed: expected 404, got ${nonExistentShipmentRes.statusCode}`);
    }
    console.log('   ✔ Non-existent shipment error handling PASSED (HTTP 404)\n');

    // 2.9 DELETE /api/shipments/:id
    console.log(`2.9 Testing DELETE /api/shipments/${createdShipmentId}...`);
    const deleteShipmentRes = await makeRequest({
      ...baseUrl,
      path: `/api/shipments/${createdShipmentId}`,
      method: 'DELETE',
      headers: { ...authHeaders }
    });
    console.log(`   Status: ${deleteShipmentRes.statusCode}`, deleteShipmentRes.body);
    if (deleteShipmentRes.statusCode !== 200 || !deleteShipmentRes.body.success) {
      throw new Error(`DELETE /api/shipments/:id failed: expected 200, got ${deleteShipmentRes.statusCode}`);
    }
    console.log('   ✔ DELETE /api/shipments/:id PASSED (HTTP 200)\n');

    // 2.10 Confirm deleted shipment -> 404
    console.log(`2.10 Verifying deleted shipment returns 404...`);
    const verifyDeletedShipmentRes = await makeRequest({
      ...baseUrl,
      path: `/api/shipments/${createdShipmentId}`,
      method: 'GET',
      headers: { ...authHeaders }
    });
    if (verifyDeletedShipmentRes.statusCode !== 404) {
      throw new Error(`Deleted shipment verification failed: expected 404, got ${verifyDeletedShipmentRes.statusCode}`);
    }
    console.log('   ✔ Verification of deleted shipment PASSED (HTTP 404)\n');

    // ==========================================
    // 3. ROUTES API
    // ==========================================
    console.log('--- 3. Routes API Endpoints ---');
    const testRouteCode = `NEC-RT-${Date.now()}`;
    const routePayload = {
      routeCode: testRouteCode,
      name: 'Guwahati - Shillong Strategic Corridor',
      origin: {
        name: 'Guwahati Dispatch',
        location: {
          type: 'Point',
          coordinates: [91.7362, 26.1445]
        }
      },
      destination: {
        name: 'Shillong Medical Center',
        location: {
          type: 'Point',
          coordinates: [91.8933, 25.5788]
        }
      },
      distanceKm: 98.5,
      estimatedDurationMinutes: 180,
      pathGeometry: {
        type: 'LineString',
        coordinates: [
          [91.7362, 26.1445],
          [91.8000, 25.9000],
          [91.8933, 25.5788]
        ]
      },
      status: 'OPEN',
      riskLevel: 'LOW',
      allowedVehicleTypes: ['TRUCK_HEAVY', 'PICKUP_4X4', 'AMBULANCE']
    };

    // 3.1 POST /api/routes (Create)
    console.log(`3.1 Testing POST /api/routes (${testRouteCode})...`);
    const createRouteRes = await makeRequest(
      {
        ...baseUrl,
        path: '/api/routes',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders }
      },
      routePayload
    );
    console.log(`   Status: ${createRouteRes.statusCode}`, createRouteRes.body);
    if (createRouteRes.statusCode !== 201 || !createRouteRes.body.success || !createRouteRes.body.data._id) {
      throw new Error(`POST /api/routes failed: expected 201, got ${createRouteRes.statusCode}`);
    }
    const createdRouteId = createRouteRes.body.data._id;
    console.log(`   ✔ POST /api/routes PASSED (HTTP 201, ID: ${createdRouteId})\n`);

    // 3.2 GET /api/routes (List)
    console.log('3.2 Testing GET /api/routes...');
    const listRoutesRes = await makeRequest({
      ...baseUrl,
      path: '/api/routes',
      method: 'GET',
      headers: { ...authHeaders }
    });
    console.log(`   Status: ${listRoutesRes.statusCode}, Count: ${listRoutesRes.body.count}`);
    if (listRoutesRes.statusCode !== 200 || !Array.isArray(listRoutesRes.body.data)) {
      throw new Error(`GET /api/routes failed: expected 200, got ${listRoutesRes.statusCode}`);
    }
    const routeInList = listRoutesRes.body.data.some((r) => r._id === createdRouteId);
    if (!routeInList) throw new Error('Created route not found in routes list');
    console.log('   ✔ GET /api/routes PASSED (HTTP 200)\n');

    // 3.3 GET /api/routes/:id (Get by ID)
    console.log(`3.3 Testing GET /api/routes/${createdRouteId}...`);
    const getRouteRes = await makeRequest({
      ...baseUrl,
      path: `/api/routes/${createdRouteId}`,
      method: 'GET',
      headers: { ...authHeaders }
    });
    console.log(`   Status: ${getRouteRes.statusCode}`, getRouteRes.body.data.routeCode);
    if (getRouteRes.statusCode !== 200 || getRouteRes.body.data.routeCode !== testRouteCode) {
      throw new Error(`GET /api/routes/:id failed: expected 200, got ${getRouteRes.statusCode}`);
    }
    console.log('   ✔ GET /api/routes/:id PASSED (HTTP 200)\n');

    // 3.4 PUT /api/routes/:id (Update)
    console.log(`3.4 Testing PUT /api/routes/${createdRouteId}...`);
    const updateRouteRes = await makeRequest(
      {
        ...baseUrl,
        path: `/api/routes/${createdRouteId}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders }
      },
      { status: 'RESTRICTED', riskLevel: 'MEDIUM' }
    );
    console.log(`   Status: ${updateRouteRes.statusCode}, Status: ${updateRouteRes.body.data.status}, Risk: ${updateRouteRes.body.data.riskLevel}`);
    if (updateRouteRes.statusCode !== 200 || updateRouteRes.body.data.status !== 'RESTRICTED') {
      throw new Error(`PUT /api/routes/:id failed: expected 200, got ${updateRouteRes.statusCode}`);
    }
    console.log('   ✔ PUT /api/routes/:id PASSED (HTTP 200)\n');

    // 3.5 Duplicate routeCode error -> HTTP 409
    console.log(`3.5 Testing duplicate routeCode '${testRouteCode}'...`);
    const dupRouteRes = await makeRequest(
      {
        ...baseUrl,
        path: '/api/routes',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders }
      },
      routePayload
    );
    console.log(`   Status: ${dupRouteRes.statusCode}`, dupRouteRes.body);
    if (dupRouteRes.statusCode !== 409) {
      throw new Error(`Duplicate routeCode test failed: expected 409, got ${dupRouteRes.statusCode}`);
    }
    console.log('   ✔ Duplicate routeCode error handling PASSED (HTTP 409)\n');

    // 3.6 Invalid route data (empty allowedVehicleTypes) -> HTTP 400
    console.log('3.6 Testing invalid allowedVehicleTypes...');
    const invalidRouteRes = await makeRequest(
      {
        ...baseUrl,
        path: '/api/routes',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders }
      },
      { ...routePayload, routeCode: `INV-RT-${Date.now()}`, allowedVehicleTypes: ['SPACE_SHUTTLE'] }
    );
    console.log(`   Status: ${invalidRouteRes.statusCode}`, invalidRouteRes.body);
    if (invalidRouteRes.statusCode !== 400) {
      throw new Error(`Invalid route data test failed: expected 400, got ${invalidRouteRes.statusCode}`);
    }
    console.log('   ✔ Invalid route data error handling PASSED (HTTP 400)\n');

    // 3.7 Invalid ObjectId -> HTTP 400
    console.log('3.7 Testing invalid route ObjectId format...');
    const invalidRouteIdRes = await makeRequest({
      ...baseUrl,
      path: '/api/routes/bad-id-123',
      method: 'GET',
      headers: { ...authHeaders }
    });
    console.log(`   Status: ${invalidRouteIdRes.statusCode}`, invalidRouteIdRes.body);
    if (invalidRouteIdRes.statusCode !== 400) {
      throw new Error(`Invalid route ID test failed: expected 400, got ${invalidRouteIdRes.statusCode}`);
    }
    console.log('   ✔ Invalid route ObjectId error handling PASSED (HTTP 400)\n');

    // 3.8 Non-existent route ID -> HTTP 404
    const nonExistentRouteId = new mongoose.Types.ObjectId().toString();
    console.log(`3.8 Testing non-existent route ID ${nonExistentRouteId}...`);
    const nonExistentRouteRes = await makeRequest({
      ...baseUrl,
      path: `/api/routes/${nonExistentRouteId}`,
      method: 'GET',
      headers: { ...authHeaders }
    });
    console.log(`   Status: ${nonExistentRouteRes.statusCode}`, nonExistentRouteRes.body);
    if (nonExistentRouteRes.statusCode !== 404) {
      throw new Error(`Non-existent route test failed: expected 404, got ${nonExistentRouteRes.statusCode}`);
    }
    console.log('   ✔ Non-existent route error handling PASSED (HTTP 404)\n');

    // 3.9 DELETE /api/routes/:id
    console.log(`3.9 Testing DELETE /api/routes/${createdRouteId}...`);
    const deleteRouteRes = await makeRequest({
      ...baseUrl,
      path: `/api/routes/${createdRouteId}`,
      method: 'DELETE',
      headers: { ...authHeaders }
    });
    console.log(`   Status: ${deleteRouteRes.statusCode}`, deleteRouteRes.body);
    if (deleteRouteRes.statusCode !== 200 || !deleteRouteRes.body.success) {
      throw new Error(`DELETE /api/routes/:id failed: expected 200, got ${deleteRouteRes.statusCode}`);
    }
    console.log('   ✔ DELETE /api/routes/:id PASSED (HTTP 200)\n');

    // 3.10 Confirm deleted route -> 404
    console.log(`3.10 Verifying deleted route returns 404...`);
    const verifyDeletedRouteRes = await makeRequest({
      ...baseUrl,
      path: `/api/routes/${createdRouteId}`,
      method: 'GET',
      headers: { ...authHeaders }
    });
    if (verifyDeletedRouteRes.statusCode !== 404) {
      throw new Error(`Deleted route verification failed: expected 404, got ${verifyDeletedRouteRes.statusCode}`);
    }
    console.log('   ✔ Verification of deleted route PASSED (HTTP 404)\n');

    // ==========================================
    // 4. INCIDENTS API
    // ==========================================
    console.log('--- 4. Incidents API Endpoints ---');
    const incidentPayload = {
      type: 'LANDSLIDE',
      severity: 'SEVERE',
      title: 'NH-6 Blockage near Sonapur',
      description: 'Major rockfall and landslide blocking both lanes',
      location: {
        type: 'Point',
        coordinates: [92.3567, 25.1234]
      },
      affectedRadiusMeters: 1000,
      status: 'ACTIVE',
      reportedBy: 'Field Officer Baruah'
    };

    // 4.1 POST /api/incidents (Create)
    console.log('4.1 Testing POST /api/incidents...');
    const createIncidentRes = await makeRequest(
      {
        ...baseUrl,
        path: '/api/incidents',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders }
      },
      incidentPayload
    );
    console.log(`   Status: ${createIncidentRes.statusCode}`, createIncidentRes.body);
    if (createIncidentRes.statusCode !== 201 || !createIncidentRes.body.success || !createIncidentRes.body.data._id) {
      throw new Error(`POST /api/incidents failed: expected 201, got ${createIncidentRes.statusCode}`);
    }
    const createdIncidentId = createIncidentRes.body.data._id;
    console.log(`   ✔ POST /api/incidents PASSED (HTTP 201, ID: ${createdIncidentId})\n`);

    // 4.2 GET /api/incidents (List)
    console.log('4.2 Testing GET /api/incidents...');
    const listIncidentsRes = await makeRequest({
      ...baseUrl,
      path: '/api/incidents',
      method: 'GET',
      headers: { ...authHeaders }
    });
    console.log(`   Status: ${listIncidentsRes.statusCode}, Count: ${listIncidentsRes.body.count}`);
    if (listIncidentsRes.statusCode !== 200 || !Array.isArray(listIncidentsRes.body.data)) {
      throw new Error(`GET /api/incidents failed: expected 200, got ${listIncidentsRes.statusCode}`);
    }
    const incidentInList = listIncidentsRes.body.data.some((i) => i._id === createdIncidentId);
    if (!incidentInList) throw new Error('Created incident not found in incidents list');
    console.log('   ✔ GET /api/incidents PASSED (HTTP 200)\n');

    // 4.3 GET /api/incidents/:id (Get by ID)
    console.log(`4.3 Testing GET /api/incidents/${createdIncidentId}...`);
    const getIncidentRes = await makeRequest({
      ...baseUrl,
      path: `/api/incidents/${createdIncidentId}`,
      method: 'GET',
      headers: { ...authHeaders }
    });
    console.log(`   Status: ${getIncidentRes.statusCode}`, getIncidentRes.body.data.title);
    if (getIncidentRes.statusCode !== 200 || getIncidentRes.body.data.title !== incidentPayload.title) {
      throw new Error(`GET /api/incidents/:id failed: expected 200, got ${getIncidentRes.statusCode}`);
    }
    console.log('   ✔ GET /api/incidents/:id PASSED (HTTP 200)\n');

    // 4.4 PUT /api/incidents/:id (Update)
    console.log(`4.4 Testing PUT /api/incidents/${createdIncidentId}...`);
    const updateIncidentRes = await makeRequest(
      {
        ...baseUrl,
        path: `/api/incidents/${createdIncidentId}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders }
      },
      { status: 'RESOLVING', severity: 'MODERATE' }
    );
    console.log(`   Status: ${updateIncidentRes.statusCode}, Status: ${updateIncidentRes.body.data.status}`);
    if (updateIncidentRes.statusCode !== 200 || updateIncidentRes.body.data.status !== 'RESOLVING') {
      throw new Error(`PUT /api/incidents/:id failed: expected 200, got ${updateIncidentRes.statusCode}`);
    }
    console.log('   ✔ PUT /api/incidents/:id PASSED (HTTP 200)\n');

    // 4.5 Invalid incident data (invalid type enum) -> HTTP 400
    console.log('4.5 Testing invalid incident type enum...');
    const invalidIncidentRes = await makeRequest(
      {
        ...baseUrl,
        path: '/api/incidents',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders }
      },
      { ...incidentPayload, type: 'METEOR_SHOWER' }
    );
    console.log(`   Status: ${invalidIncidentRes.statusCode}`, invalidIncidentRes.body);
    if (invalidIncidentRes.statusCode !== 400) {
      throw new Error(`Invalid incident data test failed: expected 400, got ${invalidIncidentRes.statusCode}`);
    }
    console.log('   ✔ Invalid incident data error handling PASSED (HTTP 400)\n');

    // 4.6 Invalid incident ObjectId -> HTTP 400
    console.log('4.6 Testing invalid incident ObjectId format...');
    const invalidIncidentIdRes = await makeRequest({
      ...baseUrl,
      path: '/api/incidents/bad-incident-id',
      method: 'GET',
      headers: { ...authHeaders }
    });
    console.log(`   Status: ${invalidIncidentIdRes.statusCode}`, invalidIncidentIdRes.body);
    if (invalidIncidentIdRes.statusCode !== 400) {
      throw new Error(`Invalid incident ID test failed: expected 400, got ${invalidIncidentIdRes.statusCode}`);
    }
    console.log('   ✔ Invalid incident ObjectId error handling PASSED (HTTP 400)\n');

    // 4.7 Non-existent incident ID -> HTTP 404
    const nonExistentIncidentId = new mongoose.Types.ObjectId().toString();
    console.log(`4.7 Testing non-existent incident ID ${nonExistentIncidentId}...`);
    const nonExistentIncidentRes = await makeRequest({
      ...baseUrl,
      path: `/api/incidents/${nonExistentIncidentId}`,
      method: 'GET',
      headers: { ...authHeaders }
    });
    console.log(`   Status: ${nonExistentIncidentRes.statusCode}`, nonExistentIncidentRes.body);
    if (nonExistentIncidentRes.statusCode !== 404) {
      throw new Error(`Non-existent incident test failed: expected 404, got ${nonExistentIncidentRes.statusCode}`);
    }
    console.log('   ✔ Non-existent incident error handling PASSED (HTTP 404)\n');

    // 4.8 DELETE /api/incidents/:id
    console.log(`4.8 Testing DELETE /api/incidents/${createdIncidentId}...`);
    const deleteIncidentRes = await makeRequest({
      ...baseUrl,
      path: `/api/incidents/${createdIncidentId}`,
      method: 'DELETE',
      headers: { ...authHeaders }
    });
    console.log(`   Status: ${deleteIncidentRes.statusCode}`, deleteIncidentRes.body);
    if (deleteIncidentRes.statusCode !== 200 || !deleteIncidentRes.body.success) {
      throw new Error(`DELETE /api/incidents/:id failed: expected 200, got ${deleteIncidentRes.statusCode}`);
    }
    console.log('   ✔ DELETE /api/incidents/:id PASSED (HTTP 200)\n');

    // 4.9 Confirm deleted incident -> 404
    console.log(`4.9 Verifying deleted incident returns 404...`);
    const verifyDeletedIncidentRes = await makeRequest({
      ...baseUrl,
      path: `/api/incidents/${createdIncidentId}`,
      method: 'GET',
      headers: { ...authHeaders }
    });
    if (verifyDeletedIncidentRes.statusCode !== 404) {
      throw new Error(`Deleted incident verification failed: expected 404, got ${verifyDeletedIncidentRes.statusCode}`);
    }
    console.log('   ✔ Verification of deleted incident PASSED (HTTP 404)\n');

    // ==========================================
    // 5. VEHICLE LOCATION / TRACKING API
    // ==========================================
    console.log('--- 5. Vehicle Location Telemetry API Endpoints ---');

    // First create a temporary vehicle for location tracking
    const trackingVehNum = `NEC-TRACK-${Date.now()}`;
    const vehicleForTrackingRes = await makeRequest(
      {
        ...baseUrl,
        path: '/api/vehicles',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders }
      },
      {
        vehicleNumber: trackingVehNum,
        type: 'AMBULANCE',
        capacityKg: 800,
        capacityVolumeM3: 4.5,
        status: 'AVAILABLE',
        driver: {
          name: 'Pabitra Kalita',
          phone: '+91-9988776655',
          licenseNumber: 'AS-02-2023-9999'
        },
        currentLocation: {
          type: 'Point',
          coordinates: [91.7362, 26.1445]
        },
        isEmergencyReady: true
      }
    );
    const trackingVehicleId = vehicleForTrackingRes.body.data._id;
    console.log(`   Created test vehicle for tracking: ${trackingVehicleId}\n`);

    // 5.1 POST /api/vehicles/:id/location (Telemetry record 1)
    console.log(`5.1 Testing POST /api/vehicles/${trackingVehicleId}/location (record 1)...`);
    const loc1Payload = {
      location: {
        type: 'Point',
        coordinates: [91.7362, 26.1445]
      },
      speedKmh: 45.0,
      heading: 90,
      timestamp: new Date(Date.now() - 60000).toISOString()
    };
    const postLoc1Res = await makeRequest(
      {
        ...baseUrl,
        path: `/api/vehicles/${trackingVehicleId}/location`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders }
      },
      loc1Payload
    );
    console.log(`   Status: ${postLoc1Res.statusCode}`, postLoc1Res.body);
    if (postLoc1Res.statusCode !== 201 || !postLoc1Res.body.success || !postLoc1Res.body.data._id) {
      throw new Error(`POST location failed: expected 201, got ${postLoc1Res.statusCode}`);
    }
    console.log('   ✔ POST /api/vehicles/:id/location (record 1) PASSED (HTTP 201)\n');

    // 5.2 POST /api/vehicles/:id/location (Telemetry record 2)
    console.log(`5.2 Testing POST /api/vehicles/${trackingVehicleId}/location (record 2)...`);
    const loc2Payload = {
      location: {
        type: 'Point',
        coordinates: [91.7500, 26.1600]
      },
      speedKmh: 52.5,
      heading: 85,
      timestamp: new Date().toISOString()
    };
    const postLoc2Res = await makeRequest(
      {
        ...baseUrl,
        path: `/api/vehicles/${trackingVehicleId}/location`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders }
      },
      loc2Payload
    );
    console.log(`   Status: ${postLoc2Res.statusCode}`, postLoc2Res.body);
    if (postLoc2Res.statusCode !== 201 || !postLoc2Res.body.success) {
      throw new Error(`POST location 2 failed: expected 201, got ${postLoc2Res.statusCode}`);
    }
    console.log('   ✔ POST /api/vehicles/:id/location (record 2) PASSED (HTTP 201)\n');

    // 5.3 GET /api/vehicles/:id/location-history
    console.log(`5.3 Testing GET /api/vehicles/${trackingVehicleId}/location-history...`);
    const historyRes = await makeRequest({
      ...baseUrl,
      path: `/api/vehicles/${trackingVehicleId}/location-history`,
      method: 'GET',
      headers: { ...authHeaders }
    });
    console.log(`   Status: ${historyRes.statusCode}, Records count: ${historyRes.body.count}`);
    if (historyRes.statusCode !== 200 || !Array.isArray(historyRes.body.data) || historyRes.body.count !== 2) {
      throw new Error(`GET location history failed: expected 200 with 2 records, got ${historyRes.statusCode}`);
    }
    console.log('   ✔ GET /api/vehicles/:id/location-history PASSED (HTTP 200, 2 telemetry entries)\n');

    // 5.4 Error: Invalid vehicle ID format -> HTTP 400
    console.log('5.4 Testing invalid vehicle ID format for location...');
    const invalidVehIdRes = await makeRequest({
      ...baseUrl,
      path: '/api/vehicles/invalid-veh-id/location-history',
      method: 'GET',
      headers: { ...authHeaders }
    });
    console.log(`   Status: ${invalidVehIdRes.statusCode}`, invalidVehIdRes.body);
    if (invalidVehIdRes.statusCode !== 400) {
      throw new Error(`Invalid vehicle ID test failed: expected 400, got ${invalidVehIdRes.statusCode}`);
    }
    console.log('   ✔ Invalid vehicle ID format error handling PASSED (HTTP 400)\n');

    // 5.5 Error: Non-existent vehicle ID -> HTTP 404
    const nonExistentVehId = new mongoose.Types.ObjectId().toString();
    console.log(`5.5 Testing non-existent vehicle ID ${nonExistentVehId} for location POST...`);
    const nonExistentVehRes = await makeRequest(
      {
        ...baseUrl,
        path: `/api/vehicles/${nonExistentVehId}/location`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders }
      },
      loc1Payload
    );
    console.log(`   Status: ${nonExistentVehRes.statusCode}`, nonExistentVehRes.body);
    if (nonExistentVehRes.statusCode !== 404) {
      throw new Error(`Non-existent vehicle test failed: expected 404, got ${nonExistentVehRes.statusCode}`);
    }
    console.log('   ✔ Non-existent vehicle error handling PASSED (HTTP 404)\n');

    // 5.6 Error: Invalid location coordinates data -> HTTP 400
    console.log('5.6 Testing invalid location telemetry payload...');
    const invalidLocDataRes = await makeRequest(
      {
        ...baseUrl,
        path: `/api/vehicles/${trackingVehicleId}/location`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders }
      },
      {
        location: {
          type: 'Point',
          coordinates: [91.7362] // invalid length
        }
      }
    );
    console.log(`   Status: ${invalidLocDataRes.statusCode}`, invalidLocDataRes.body);
    if (invalidLocDataRes.statusCode !== 400) {
      throw new Error(`Invalid telemetry data test failed: expected 400, got ${invalidLocDataRes.statusCode}`);
    }
    console.log('   ✔ Invalid telemetry data error handling PASSED (HTTP 400)\n');

    // Cleanup: Delete tracking vehicle
    await makeRequest({
      ...baseUrl,
      path: `/api/vehicles/${trackingVehicleId}`,
      method: 'DELETE',
      headers: { ...authHeaders }
    });
    console.log('   Cleaned up temporary tracking vehicle.\n');

    // Cleanup: Remove test user
    if (testUserId) {
      await User.findByIdAndDelete(testUserId);
      console.log('   Cleaned up test user.\n');
    }

    console.log('===========================================================');
    console.log('=== ALL NEC-11 REMAINING REST API TESTS PASSED (100%)! ===');
    console.log('===========================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('✖ NEC-11 Remaining REST API test failed:', error);
    if (testUserId) {
      try {
        await User.findByIdAndDelete(testUserId);
      } catch (e) {}
    }
    process.exit(1);
  }
};

runRemainingAPITests();
