# Buger Eats — Performance smoke test

> **✅ PASS** · Generated 2026-10-22 19:15:22 UTC · Local reference run

A lightweight HTTP smoke test covering the public home page and delivery registration route.

## At a glance

| Metric | Result | Acceptance criteria | Status |
| --- | ---: | ---: | :---: |
| p95 response time | 82.08 ms | < 1,500 ms | ✅ Pass |
| Failed HTTP requests | 0.00% | < 1% | ✅ Pass |
| Checks passed | 100.00% (584/584) | > 99% | ✅ Pass |

## Run profile

| Setting | Value |
| --- | --- |
| Target | [https://buger-eats.vercel.app](https://buger-eats.vercel.app) |
| Scenario | 5 virtual users for 60s |
| Routes | `/`, `/deliver` |
| Actual duration | 61.94 s |
| Iterations | 146 |
| HTTP requests | 292 (4.71 req/s) |

## Response-time profile

| Average | p95 |
| ---: | ---: |
| 33.62 ms | 82.08 ms |

## Functional checks

| Check | Passed | Failed | Result |
| --- | ---: | ---: | :---: |
| home responds with HTTP 200 | 146 | 0 | ✅ Pass |
| home returns the Buger Eats application shell | 146 | 0 | ✅ Pass |
| registration responds with HTTP 200 | 146 | 0 | ✅ Pass |
| registration returns the Buger Eats application shell | 146 | 0 | ✅ Pass |

## Thresholds

- HTTP response time: `p(95)<1500` — **PASS**
- Failed HTTP request rate: `rate<0.01` — **PASS**
- Functional checks: `rate>0.99` — **PASS**

> This is a smoke-test result for one run, not a capacity or load guarantee. Performance varies with network and service conditions.
