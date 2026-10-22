import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'https://buger-eats.vercel.app';

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 5,
      duration: '60s',
      gracefulStop: '5s',
    },
  },
  thresholds: {
    checks: ['rate>0.99'],
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const home = http.get(`${BASE_URL}/`, { tags: { page: 'home' } });
  check(home, {
    'home responds with HTTP 200': (response) => response.status === 200,
    'home returns the Buger Eats application shell': (response) =>
      response.body.includes('<title>Buger Eats</title>') &&
      response.body.includes('id="root"') &&
      response.body.includes('/static/js/main.'),
  });

  sleep(1);

  const registration = http.get(`${BASE_URL}/deliver`, {
    tags: { page: 'registration' },
  });
  check(registration, {
    'registration responds with HTTP 200': (response) => response.status === 200,
    'registration returns the Buger Eats application shell': (response) =>
      response.body.includes('<title>Buger Eats</title>') &&
      response.body.includes('id="root"') &&
      response.body.includes('/static/js/main.'),
  });

  sleep(1);
}
