require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/server');
const { User, Vehicle } = require('../src/models');
const bcrypt = require('bcryptjs');

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

const runAuthTests = async () => {
  console.log('=== Starting NEC-12 Authentication & Authorization Verification ===\n');

  const PORT = process.env.PORT || 5000;
  const baseUrl = {
    hostname: '127.0.0.1',
    port: PORT
  };

  const createdUserIds = [];

  try {
    console.log('Waiting for Express server and MongoDB Atlas connection...');
    await waitForServer(baseUrl);
    console.log('✔ Server is online and responding.\n');

    // ==========================================
    // 1. PUBLIC HEALTH CHECK
    // ==========================================
    console.log('--- 1. Health Check Endpoint (Public) ---');
    const healthRes = await makeRequest({
      ...baseUrl,
      path: '/api/health',
      method: 'GET'
    });
    console.log(`   Status: ${healthRes.statusCode}`, healthRes.body);
    if (healthRes.statusCode !== 200 || !healthRes.body.success) {
      throw new Error(`Health check failed: expected 200, got ${healthRes.statusCode}`);
    }
    console.log('   ✔ GET /api/health is publicly accessible (HTTP 200)\n');

    // ==========================================
    // 2. USER REGISTRATION
    // ==========================================
    console.log('--- 2. User Registration ---');
    const testEmail = `test.driver.${Date.now()}@example.com`;
    const regPayload = {
      name: 'Rupesh Das',
      email: testEmail,
      password: 'SecurePassword123'
    };

    // 2.1 Successful registration
    console.log(`2.1 Testing POST /api/auth/register (${testEmail})...`);
    const regRes = await makeRequest(
      {
        ...baseUrl,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      regPayload
    );
    console.log(`   Status: ${regRes.statusCode}`, regRes.body);
    if (regRes.statusCode !== 201 || !regRes.body.success || !regRes.body.data.token) {
      throw new Error(`Registration failed: expected 201, got ${regRes.statusCode}`);
    }
    const registeredUserId = regRes.body.data.user.id;
    createdUserIds.push(registeredUserId);
    console.log(`   ✔ Registration successful (HTTP 201, User ID: ${registeredUserId})\n`);

    // 2.2 Verify password is not in response
    console.log('2.2 Verifying password and hash are not returned in response...');
    if (regRes.body.data.user.password || regRes.body.data.user.passwordHash) {
      throw new Error('Password or passwordHash exposed in registration response!');
    }
    console.log('   ✔ Password is not exposed in API response\n');

    // 2.3 Verify role defaults to DRIVER even if ADMIN attempted
    console.log('2.3 Testing role cannot be escalated to ADMIN on public registration...');
    const adminAttemptEmail = `admin.attempt.${Date.now()}@example.com`;
    const adminRegRes = await makeRequest(
      {
        ...baseUrl,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        name: 'Hacker Admin',
        email: adminAttemptEmail,
        password: 'Password123',
        role: 'ADMIN' // Trying to register as ADMIN
      }
    );
    if (adminRegRes.statusCode !== 201 || adminRegRes.body.data.user.role !== 'DRIVER') {
      throw new Error(`Role escalation not prevented! User role: ${adminRegRes.body.data?.user?.role}`);
    }
    createdUserIds.push(adminRegRes.body.data.user.id);
    console.log(`   ✔ Role escalation prevented: user role is '${adminRegRes.body.data.user.role}'\n`);

    // 2.4 Verify password is stored hashed in MongoDB
    console.log('2.4 Verifying password is stored as bcrypt hash in MongoDB...');
    const dbUser = await User.findById(registeredUserId).select('+password');
    if (!dbUser || !dbUser.password || dbUser.password === 'SecurePassword123') {
      throw new Error('Password is stored in plaintext or not found!');
    }
    const isBcryptHash = await bcrypt.compare('SecurePassword123', dbUser.password);
    if (!isBcryptHash) {
      throw new Error('Password in database does not match bcrypt hash comparison!');
    }
    console.log('   ✔ Password securely stored as bcrypt hash\n');

    // 2.5 Duplicate email -> HTTP 409
    console.log(`2.5 Testing duplicate email registration '${testEmail}'...`);
    const dupRegRes = await makeRequest(
      {
        ...baseUrl,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      regPayload
    );
    console.log(`   Status: ${dupRegRes.statusCode}`, dupRegRes.body);
    if (dupRegRes.statusCode !== 409) {
      throw new Error(`Duplicate registration expected 409, got ${dupRegRes.statusCode}`);
    }
    console.log('   ✔ Duplicate email rejected (HTTP 409)\n');

    // 2.6 Missing fields -> HTTP 400
    console.log('2.6 Testing missing required fields on registration...');
    const missingNameRes = await makeRequest(
      {
        ...baseUrl,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: 'no.name@example.com', password: 'Password123' }
    );
    if (missingNameRes.statusCode !== 400) {
      throw new Error(`Missing name expected 400, got ${missingNameRes.statusCode}`);
    }
    console.log('   ✔ Missing required fields rejected (HTTP 400)\n');

    // 2.7 Invalid email format -> HTTP 400
    console.log('2.7 Testing invalid email format...');
    const invalidEmailRes = await makeRequest(
      {
        ...baseUrl,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { name: 'Bad Email User', email: 'not-an-email', password: 'Password123' }
    );
    if (invalidEmailRes.statusCode !== 400) {
      throw new Error(`Invalid email expected 400, got ${invalidEmailRes.statusCode}`);
    }
    console.log('   ✔ Invalid email format rejected (HTTP 400)\n');

    // 2.8 Short password (< 6 chars) -> HTTP 400
    console.log('2.8 Testing short password (< 6 chars)...');
    const shortPassRes = await makeRequest(
      {
        ...baseUrl,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { name: 'Short Pass', email: `short.${Date.now()}@example.com`, password: '123' }
    );
    if (shortPassRes.statusCode !== 400) {
      throw new Error(`Short password expected 400, got ${shortPassRes.statusCode}`);
    }
    console.log('   ✔ Short password rejected (HTTP 400)\n');

    // ==========================================
    // 3. USER LOGIN & JWT
    // ==========================================
    console.log('--- 3. User Login & JWT Generation ---');

    // 3.1 Successful login
    console.log(`3.1 Testing POST /api/auth/login with valid credentials...`);
    const loginRes = await makeRequest(
      {
        ...baseUrl,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: testEmail, password: 'SecurePassword123' }
    );
    console.log(`   Status: ${loginRes.statusCode}`, loginRes.body);
    if (loginRes.statusCode !== 200 || !loginRes.body.success || !loginRes.body.data.token) {
      throw new Error(`Login failed: expected 200, got ${loginRes.statusCode}`);
    }
    const authToken = loginRes.body.data.token;
    console.log('   ✔ Login successful and JWT returned (HTTP 200)\n');

    // 3.2 Wrong password -> HTTP 401
    console.log('3.2 Testing login with wrong password...');
    const wrongPassRes = await makeRequest(
      {
        ...baseUrl,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: testEmail, password: 'WrongPassword999' }
    );
    console.log(`   Status: ${wrongPassRes.statusCode}`, wrongPassRes.body);
    if (wrongPassRes.statusCode !== 401) {
      throw new Error(`Wrong password expected 401, got ${wrongPassRes.statusCode}`);
    }
    console.log('   ✔ Wrong password rejected with generic error (HTTP 401)\n');

    // 3.3 Unknown email -> HTTP 401
    console.log('3.3 Testing login with non-existent email...');
    const unknownEmailRes = await makeRequest(
      {
        ...baseUrl,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: 'nonexistent.user.123@example.com', password: 'Password123' }
    );
    if (unknownEmailRes.statusCode !== 401) {
      throw new Error(`Unknown email expected 401, got ${unknownEmailRes.statusCode}`);
    }
    console.log('   ✔ Non-existent email rejected with generic error (HTTP 401)\n');

    // 3.4 Inactive user login -> HTTP 401
    console.log('3.4 Testing login with inactive user account...');
    const inactiveEmail = `inactive.${Date.now()}@example.com`;
    const inactiveUser = await User.create({
      name: 'Inactive User',
      email: inactiveEmail,
      password: 'Password123',
      role: 'DRIVER',
      isActive: false
    });
    createdUserIds.push(inactiveUser._id);
    const inactiveLoginRes = await makeRequest(
      {
        ...baseUrl,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: inactiveEmail, password: 'Password123' }
    );
    if (inactiveLoginRes.statusCode !== 401) {
      throw new Error(`Inactive user login expected 401, got ${inactiveLoginRes.statusCode}`);
    }
    console.log('   ✔ Inactive user login rejected (HTTP 401)\n');

    // ==========================================
    // 4. CURRENT USER ENDPOINT (/api/auth/me)
    // ==========================================
    console.log('--- 4. Current User Profile Endpoint ---');

    // 4.1 Valid token -> 200
    console.log('4.1 Testing GET /api/auth/me with valid Bearer token...');
    const meRes = await makeRequest({
      ...baseUrl,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`   Status: ${meRes.statusCode}`, meRes.body);
    if (meRes.statusCode !== 200 || !meRes.body.success || meRes.body.data.email !== testEmail) {
      throw new Error(`GET /api/auth/me failed: expected 200, got ${meRes.statusCode}`);
    }
    if (meRes.body.data.password || meRes.body.data.passwordHash) {
      throw new Error('Password or hash exposed in /api/auth/me response!');
    }
    console.log('   ✔ GET /api/auth/me returned user profile safely (HTTP 200)\n');

    // 4.2 Missing Authorization header -> 401
    console.log('4.2 Testing GET /api/auth/me without Authorization header...');
    const noAuthMeRes = await makeRequest({
      ...baseUrl,
      path: '/api/auth/me',
      method: 'GET'
    });
    if (noAuthMeRes.statusCode !== 401) {
      throw new Error(`Missing auth header expected 401, got ${noAuthMeRes.statusCode}`);
    }
    console.log('   ✔ Missing token rejected (HTTP 401)\n');

    // 4.3 Malformed token -> 401
    console.log('4.3 Testing GET /api/auth/me with malformed token header...');
    const malformedMeRes = await makeRequest({
      ...baseUrl,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: 'Basic dXNlcjpwYXNz' }
    });
    if (malformedMeRes.statusCode !== 401) {
      throw new Error(`Malformed header expected 401, got ${malformedMeRes.statusCode}`);
    }
    console.log('   ✔ Malformed token rejected (HTTP 401)\n');

    // 4.4 Invalid/tampered JWT -> 401
    console.log('4.4 Testing GET /api/auth/me with invalid JWT token...');
    const invalidTokenMeRes = await makeRequest({
      ...baseUrl,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: 'Bearer invalid.tampered.token123' }
    });
    if (invalidTokenMeRes.statusCode !== 401) {
      throw new Error(`Invalid JWT expected 401, got ${invalidTokenMeRes.statusCode}`);
    }
    console.log('   ✔ Invalid JWT token rejected (HTTP 401)\n');

    // ==========================================
    // 5. PROTECTED BUSINESS APIS
    // ==========================================
    console.log('--- 5. Protection of Business APIs ---');

    // 5.1 Vehicles API
    console.log('5.1 Testing /api/vehicles protection...');
    const unauthVehRes = await makeRequest({
      ...baseUrl,
      path: '/api/vehicles',
      method: 'GET'
    });
    if (unauthVehRes.statusCode !== 401) {
      throw new Error(`Unauthenticated vehicles expected 401, got ${unauthVehRes.statusCode}`);
    }
    const authVehRes = await makeRequest({
      ...baseUrl,
      path: '/api/vehicles',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (authVehRes.statusCode !== 200) {
      throw new Error(`Authenticated vehicles expected 200, got ${authVehRes.statusCode}`);
    }
    console.log('   ✔ /api/vehicles: Unauth -> 401, Auth -> 200\n');

    // 5.2 Shipments API
    console.log('5.2 Testing /api/shipments protection...');
    const unauthShipRes = await makeRequest({
      ...baseUrl,
      path: '/api/shipments',
      method: 'GET'
    });
    if (unauthShipRes.statusCode !== 401) {
      throw new Error(`Unauthenticated shipments expected 401, got ${unauthShipRes.statusCode}`);
    }
    const authShipRes = await makeRequest({
      ...baseUrl,
      path: '/api/shipments',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (authShipRes.statusCode !== 200) {
      throw new Error(`Authenticated shipments expected 200, got ${authShipRes.statusCode}`);
    }
    console.log('   ✔ /api/shipments: Unauth -> 401, Auth -> 200\n');

    // 5.3 Routes API
    console.log('5.3 Testing /api/routes protection...');
    const unauthRtRes = await makeRequest({
      ...baseUrl,
      path: '/api/routes',
      method: 'GET'
    });
    if (unauthRtRes.statusCode !== 401) {
      throw new Error(`Unauthenticated routes expected 401, got ${unauthRtRes.statusCode}`);
    }
    const authRtRes = await makeRequest({
      ...baseUrl,
      path: '/api/routes',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (authRtRes.statusCode !== 200) {
      throw new Error(`Authenticated routes expected 200, got ${authRtRes.statusCode}`);
    }
    console.log('   ✔ /api/routes: Unauth -> 401, Auth -> 200\n');

    // 5.4 Incidents API
    console.log('5.4 Testing /api/incidents protection...');
    const unauthIncRes = await makeRequest({
      ...baseUrl,
      path: '/api/incidents',
      method: 'GET'
    });
    if (unauthIncRes.statusCode !== 401) {
      throw new Error(`Unauthenticated incidents expected 401, got ${unauthIncRes.statusCode}`);
    }
    const authIncRes = await makeRequest({
      ...baseUrl,
      path: '/api/incidents',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (authIncRes.statusCode !== 200) {
      throw new Error(`Authenticated incidents expected 200, got ${authIncRes.statusCode}`);
    }
    console.log('   ✔ /api/incidents: Unauth -> 401, Auth -> 200\n');

    // 5.5 Vehicle Telemetry API
    console.log('5.5 Testing /api/vehicles/:id/location protection...');
    const dummyVehId = new mongoose.Types.ObjectId().toString();
    const unauthLocRes = await makeRequest({
      ...baseUrl,
      path: `/api/vehicles/${dummyVehId}/location-history`,
      method: 'GET'
    });
    if (unauthLocRes.statusCode !== 401) {
      throw new Error(`Unauthenticated telemetry expected 401, got ${unauthLocRes.statusCode}`);
    }
    console.log('   ✔ /api/vehicles/:id/location: Unauth -> 401\n');

    // ==========================================
    // 6. CLEANUP
    // ==========================================
    console.log('--- 6. Test Data Cleanup ---');
    if (createdUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: createdUserIds } });
      console.log(`   ✔ Cleaned up ${createdUserIds.length} test users from database.\n`);
    }

    console.log('================================================================');
    console.log('=== ALL NEC-12 AUTHENTICATION & AUTHORIZATION TESTS PASSED! ===');
    console.log('================================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('✖ NEC-12 Authentication test failed:', error);
    if (createdUserIds.length > 0) {
      try {
        await User.deleteMany({ _id: { $in: createdUserIds } });
      } catch (e) {
        // ignore
      }
    }
    process.exit(1);
  }
};

runAuthTests();
