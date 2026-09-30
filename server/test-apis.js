import http from 'http';

const BASE_URL = 'http://localhost:5000/api';

async function fetchJSON(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(BASE_URL + path, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting API Tests ---');
  let token = '';
  let userId = '';
  let scenarioId = '';

  const email = `testuser${Date.now()}@example.com`;

  // 1. Register
  console.log('Testing POST /auth/register...');
  const regRes = await fetchJSON('/auth/register', {
    method: 'POST',
    body: { name: 'Test User', email, password: 'password123' }
  });
  console.log('Register Response:', regRes.status, regRes.data.success);
  if (regRes.data.token) {
    token = regRes.data.token;
  }

  // 2. Login
  console.log('Testing POST /auth/login...');
  const loginRes = await fetchJSON('/auth/login', {
    method: 'POST',
    body: { email, password: 'password123' }
  });
  console.log('Login Response:', loginRes.status, loginRes.data.success);
  if (loginRes.data.token) {
    token = loginRes.data.token;
  }

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 3. Get Me
  console.log('Testing GET /auth/me...');
  const meRes = await fetchJSON('/auth/me', { headers: authHeaders });
  console.log('Get Me Response:', meRes.status, meRes.data.success);

  // 4. Create Scenario
  console.log('Testing POST /scenarios...');
  const createRes = await fetchJSON('/scenarios', {
    method: 'POST',
    headers: authHeaders,
    body: {
      name: 'My Test Scenario',
      loanInput: {
        principal: 100000,
        annualRate: 10,
        tenureMonths: 120,
        startDate: '2026-01-01T00:00:00Z'
      }
    }
  });
  console.log('Create Scenario Response:', createRes.status, createRes.data.success);
  if (createRes.data.data && createRes.data.data._id) {
    scenarioId = createRes.data.data._id;
  }

  // 5. Get Scenarios
  console.log('Testing GET /scenarios...');
  const getRes = await fetchJSON('/scenarios', { headers: authHeaders });
  console.log('Get Scenarios Response:', getRes.status, getRes.data.success, 'Count:', getRes.data.data ? getRes.data.data.length : 0);

  // 6. Get Scenario By ID
  console.log(`Testing GET /scenarios/${scenarioId}...`);
  const getByIdRes = await fetchJSON(`/scenarios/${scenarioId}`, { headers: authHeaders });
  console.log('Get Scenario By ID Response:', getByIdRes.status, getByIdRes.data.success);

  // 7. Delete Scenario
  console.log(`Testing DELETE /scenarios/${scenarioId}...`);
  const delRes = await fetchJSON(`/scenarios/${scenarioId}`, { method: 'DELETE', headers: authHeaders });
  console.log('Delete Scenario Response:', delRes.status, delRes.data.success);

  console.log('--- All tests completed ---');
}

runTests().catch(console.error);
