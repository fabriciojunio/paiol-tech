import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const TOKEN = __ENV.JWT_TOKEN || 'test-token';

export default function () {
  const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

  const listRes = http.get(`${BASE_URL}/debts`, { headers });
  check(listRes, { 'list debts 200': (r) => r.status === 200 });

  const dashRes = http.get(`${BASE_URL}/debts/dashboard`, { headers });
  check(dashRes, { 'dashboard 200': (r) => r.status === 200 });

  sleep(1);
}
