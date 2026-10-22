import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'https://buger-eats.vercel.app';
const SCENARIO_VUS = 5;
const SCENARIO_DURATION = '60s';

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: SCENARIO_VUS,
      duration: SCENARIO_DURATION,
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

export function handleSummary(data) {
  const metrics = data.metrics;
  const duration = metrics.http_req_duration && metrics.http_req_duration.values;
  const failed = metrics.http_req_failed && metrics.http_req_failed.values;
  const checks = metrics.checks && metrics.checks.values;
  const requests = metrics.http_reqs && metrics.http_reqs.values;
  const virtualUsers = metrics.vus_max && metrics.vus_max.values;
  const thresholdResults = [];

  Object.keys(metrics).forEach((name) => {
    const thresholds = metrics[name].thresholds;
    if (thresholds) {
      Object.keys(thresholds).forEach((threshold) => {
        const passed = thresholds[threshold].ok;
        thresholdResults.push({
          metric: name,
          condition: threshold,
          passed,
          status: passed ? 'PASS' : 'FAIL',
        });
      });
    }
  });

  const thresholdStatus =
    thresholdResults.length > 0 &&
    thresholdResults.every((result) => result.passed)
      ? 'PASS'
      : 'FAIL';
  const thresholdEntries = thresholdResults.map((result) => ({
    metric: result.metric,
    condition: result.condition,
    status: result.status,
  }));
  const timestamp = new Date().toISOString();
  const testDurationSeconds = data.state.testRunDurationMs / 1000;
  const requestCount = requests ? requests.count : 0;
  const failedRequestRate = failed ? failed.rate : 0;
  const checksPassed = checks ? checks.passes : 0;
  const checksFailed = checks ? checks.fails : 0;
  const scenarioUsers = virtualUsers ? virtualUsers.max : SCENARIO_VUS;
  const averageResponseTimeMs =
    duration && typeof duration.avg === 'number' ? duration.avg : null;
  const p95ResponseTimeMs =
    duration && typeof duration['p(95)'] === 'number'
      ? duration['p(95)']
      : null;
  const checkDetails = data.root_group.checks.map((checkResult) => ({
    name: checkResult.name,
    passed: checkResult.passes,
    failed: checkResult.fails,
    status: checkResult.fails === 0 ? 'PASS' : 'FAIL',
  }));
  const evidence = {
    schemaVersion: 1,
    title: 'Buger Eats performance smoke test',
    status: thresholdStatus,
    generatedAt: timestamp,
    target: BASE_URL,
    scenario: {
      name: 'smoke',
      executor: 'constant-vus',
      virtualUsers: scenarioUsers,
      configuredDuration: SCENARIO_DURATION,
      actualDurationSeconds: Number(testDurationSeconds.toFixed(2)),
      routes: ['/', '/deliver'],
    },
    results: {
      iterations: data.metrics.iterations.values.count,
      httpRequests: requestCount,
      requestsPerSecond: requests ? Number(requests.rate.toFixed(2)) : null,
      averageResponseTimeMs:
        averageResponseTimeMs === null
          ? null
          : Number(averageResponseTimeMs.toFixed(2)),
      p95ResponseTimeMs:
        p95ResponseTimeMs === null ? null : Number(p95ResponseTimeMs.toFixed(2)),
      failedRequests: Math.round(requestCount * failedRequestRate),
      failedRequestRatePercent: Number((failedRequestRate * 100).toFixed(2)),
      checksPassed,
      checksFailed,
      checksPassRatePercent: checks
        ? Number((checks.rate * 100).toFixed(2))
        : null,
    },
    thresholds: thresholdEntries,
    checks: checkDetails,
  };

  const formatNumber = (value, digits = 2) =>
    typeof value === 'number' ? value.toFixed(digits) : 'n/a';
  const thresholdLabel = (metric) => {
    const result = evidence.thresholds.find((item) => item.metric === metric);
    return result && result.status === 'PASS' ? '✅ Pass' : '❌ Fail';
  };
  const statusLabel = thresholdStatus === 'PASS' ? '✅ PASS' : '❌ FAIL';
  const generatedLabel = timestamp
    .replace('T', ' ')
    .replace(/\.\d{3}Z$/, ' UTC');
  const thresholdName = (metric) => {
    const names = {
      checks: 'Functional checks',
      http_req_duration: 'HTTP response time',
      http_req_failed: 'Failed HTTP request rate',
    };
    return names[metric] || metric;
  };
  const markdown = [
    '# Buger Eats — Performance smoke test',
    '',
    `> **${statusLabel}** · Generated ${generatedLabel}`,
    '',
    'A lightweight HTTP smoke test covering the public home page and delivery registration route.',
    '',
    '## At a glance',
    '',
    '| Metric | Result | Acceptance criteria | Status |',
    '| --- | ---: | ---: | :---: |',
    `| p95 response time | ${formatNumber(evidence.results.p95ResponseTimeMs)} ms | < 1,500 ms | ${thresholdLabel('http_req_duration')} |`,
    `| Failed HTTP requests | ${formatNumber(evidence.results.failedRequestRatePercent)}% | < 1% | ${thresholdLabel('http_req_failed')} |`,
    `| Checks passed | ${formatNumber(evidence.results.checksPassRatePercent)}% (${checksPassed}/${checksPassed + checksFailed}) | > 99% | ${thresholdLabel('checks')} |`,
    '',
    '## Run profile',
    '',
    '| Setting | Value |',
    '| --- | --- |',
    `| Target | [${BASE_URL}](${BASE_URL}) |`,
    `| Scenario | ${SCENARIO_VUS} virtual users for ${SCENARIO_DURATION} |`,
    `| Routes | \`/\`, \`/deliver\` |`,
    `| Actual duration | ${formatNumber(testDurationSeconds)} s |`,
    `| Iterations | ${evidence.results.iterations} |`,
    `| HTTP requests | ${requestCount} (${formatNumber(evidence.results.requestsPerSecond)} req/s) |`,
    '',
    '## Response-time profile',
    '',
    '| Average | p95 |',
    '| ---: | ---: |',
    `| ${formatNumber(evidence.results.averageResponseTimeMs)} ms | ${formatNumber(evidence.results.p95ResponseTimeMs)} ms |`,
    '',
    '## Functional checks',
    '',
    '| Check | Passed | Failed | Result |',
    '| --- | ---: | ---: | :---: |',
    ...checkDetails.map(
      (item) =>
        `| ${item.name} | ${item.passed} | ${item.failed} | ${item.status === 'PASS' ? '✅ Pass' : '❌ Fail'} |`
    ),
    '',
    '## Thresholds',
    '',
    ...evidence.thresholds.map(
      (item) =>
        `- ${thresholdName(item.metric)}: \`${item.condition}\` — **${item.status}**`
    ),
    '',
    '> This is a smoke-test result for one run, not a capacity or load guarantee. Performance varies with network and service conditions.',
    '',
  ].join('\n');

  return {
    'k6-summary.md': markdown,
    'k6-summary.json': `${JSON.stringify(evidence, null, 2)}\n`,
    'k6-raw.json': `${JSON.stringify(data, null, 2)}\n`,
  };
}
