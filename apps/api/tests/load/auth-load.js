import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '20s', target: 10 },
    { duration: '40s', target: 30 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.02'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  const sendRes = http.post(
    `${BASE_URL}/auth/send-otp`,
    JSON.stringify({ phone: '+5511999000000' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(sendRes, { 'send-otp 2xx': (r) => r.status >= 200 && r.status < 300 });
  sleep(2);
}
