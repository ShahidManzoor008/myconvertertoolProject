import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 }, // ramp up to 20 users over 30 seconds
    { duration: '1m', target: 20 },  // stay at 20 users for 1 minute
    { duration: '20s', target: 0 },  // ramp down to 0 users over 20 seconds
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests should be below 500ms
    'http_req_failed': ['rate<0.01'],    // http errors should be less than 1%
  },
};

export default function () {
  const BASE_URL = 'http://localhost:3000'; // Assuming your server runs on port 3000

  // Simulate a login request
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'test@example.com',
    password: 'password123',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'is status 200': (r) => r.status === 200,
    'has token': (r) => r.json() && r.json().token !== '',
  });

  sleep(1);
}
