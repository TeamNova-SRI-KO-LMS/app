#!/usr/bin/env node
/**
 * Load test for the SRI-KO API (NFR-001 response time, NFR-005 concurrency).
 *
 *   PERF_BASE_URL=http://127.0.0.1:5055 node tests/performance/loadTest.js [smoke|load|spike|stress|all]
 *
 * Virtual users repeatedly send a weighted mix of real requests (public catalogue,
 * student dashboard, notifications, admin attendance overview and sign-in) for a fixed
 * time. It signs in with the demo accounts from tests/fixtures/seedDemoData.js and
 * refuses non-local targets unless PERF_ALLOW_REMOTE=true, so it cannot be pointed at
 * the production deployment by accident.
 */
const fs = require('fs');
const http = require('http');
const https = require('https');
const os = require('os');
const path = require('path');

const BASE_URL = (process.env.PERF_BASE_URL || 'http://127.0.0.1:5055').replace(/\/+$/, '');
const PASSWORD = process.env.PERF_PASSWORD || 'Demo@1234';
const STUDENT = process.env.PERF_STUDENT || 'student@sriko.demo';
const ADMIN = process.env.PERF_ADMIN || 'admin@sriko.demo';
const P95_LIMIT_MS = 2000; // NFR-001: 95% of requests within 2 seconds
const ERROR_LIMIT = 0.01; // at most 1% failed requests

const SCENARIOS = {
  smoke: { users: 1, seconds: 15 },
  load: { users: 50, seconds: 30 },
  spike: { users: 200, seconds: 20 },
  stress: { users: 400, seconds: 20 },
};

if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE_URL) && process.env.PERF_ALLOW_REMOTE !== 'true') {
  console.error(`Refusing to load-test ${BASE_URL}: set PERF_ALLOW_REMOTE=true for a staging environment.`);
  process.exit(1);
}

// Plain http(s) with keep-alive: fetch() on Node 25 intermittently crashed the
// generator itself (EINVAL from setTypeOfService) under high concurrency.
const client = BASE_URL.startsWith('https') ? https : http;
const agent = new client.Agent({ keepAlive: true, maxSockets: Infinity });

const send = ({ path: route, method = 'GET', headers = {}, body }) => new Promise((resolve) => {
  const request = client.request(`${BASE_URL}${route}`, { method, headers, agent }, (response) => {
    response.resume();
    response.on('end', () => resolve(response.statusCode));
    response.on('error', () => resolve(0));
  });
  request.on('error', () => resolve(0));
  if (body) request.write(body);
  request.end();
});

const percentile = (sorted, p) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)] : 0);

const signIn = async (email, portal) => {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: PASSWORD, portal }),
  });
  const body = await res.json();
  if (!body.token) throw new Error(`Could not sign in as ${email}: ${body.message}`);
  return body.token;
};

const buildMix = (studentToken, adminToken) => {
  const asStudent = { Authorization: `Bearer ${studentToken}` };
  const asAdmin = { Authorization: `Bearer ${adminToken}` };
  return [
    { name: 'GET /api/health', weight: 5, path: '/api/health' },
    { name: 'GET /api/courses', weight: 25, path: '/api/courses?published=true&limit=50' },
    { name: 'GET /api/events', weight: 10, path: '/api/events' },
    { name: 'GET /api/announcements', weight: 10, path: '/api/announcements' },
    { name: 'GET /api/forums', weight: 5, path: '/api/forums' },
    { name: 'GET /api/users/dashboard', weight: 15, path: '/api/users/dashboard', headers: asStudent },
    { name: 'GET /api/notifications/unread-count', weight: 15, path: '/api/notifications/unread-count', headers: asStudent },
    { name: 'GET /api/attendance/admin/overview', weight: 10, path: '/api/attendance/admin/overview', headers: asAdmin },
    {
      name: 'POST /api/auth/login', weight: 5, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: STUDENT, password: PASSWORD, portal: 'user' }),
    },
  ];
};

const pick = (mix, total) => {
  let roll = Math.random() * total;
  for (const entry of mix) {
    roll -= entry.weight;
    if (roll <= 0) return entry;
  }
  return mix[mix.length - 1];
};

async function runScenario(name, { users, seconds }, mix) {
  const totalWeight = mix.reduce((sum, entry) => sum + entry.weight, 0);
  const samples = [];
  const deadline = Date.now() + seconds * 1000;

  const virtualUser = async () => {
    while (Date.now() < deadline) {
      const entry = pick(mix, totalWeight);
      const started = performance.now();
      const status = await send(entry);
      samples.push({ name: entry.name, ms: performance.now() - started, ok: status >= 200 && status < 400, status });
    }
  };

  const started = Date.now();
  await Promise.all(Array.from({ length: users }, virtualUser));
  const elapsed = (Date.now() - started) / 1000;

  const summarize = (rows) => {
    const sorted = rows.map((row) => row.ms).sort((a, b) => a - b);
    const failed = rows.filter((row) => !row.ok).length;
    // HTTP status counts; 0 means the connection itself failed (refused or reset).
    const statuses = rows.reduce((counts, row) => ({ ...counts, [row.status]: (counts[row.status] || 0) + 1 }), {});
    return {
      statuses,
      requests: rows.length,
      throughput: Number((rows.length / elapsed).toFixed(1)),
      errorRate: rows.length ? Number((failed / rows.length).toFixed(4)) : 0,
      p50: Math.round(percentile(sorted, 50)),
      p90: Math.round(percentile(sorted, 90)),
      p95: Math.round(percentile(sorted, 95)),
      p99: Math.round(percentile(sorted, 99)),
      max: Math.round(sorted[sorted.length - 1] || 0),
    };
  };

  const overall = summarize(samples);
  const endpoints = Object.fromEntries(mix.map((entry) => [entry.name, summarize(samples.filter((row) => row.name === entry.name))]));
  const passed = overall.p95 < P95_LIMIT_MS && overall.errorRate <= ERROR_LIMIT;
  return { scenario: name, users, seconds, overall, endpoints, passed };
}

(async () => {
  const requested = process.argv[2] || 'all';
  const names = requested === 'all' ? Object.keys(SCENARIOS) : [requested];
  const [studentToken, adminToken] = await Promise.all([signIn(STUDENT, 'user'), signIn(ADMIN, 'admin')]);
  const mix = buildMix(studentToken, adminToken);

  const results = [];
  for (const [index, name] of names.entries()) {
    // Let sockets from the previous scenario close so scenarios do not interfere.
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, 10000));
    process.stdout.write(`Running ${name} (${SCENARIOS[name].users} users, ${SCENARIOS[name].seconds}s)... `);
    const result = await runScenario(name, SCENARIOS[name], mix);
    results.push(result);
    const { overall } = result;
    console.log(`${overall.requests} requests, ${overall.throughput} req/s, p95 ${overall.p95} ms, p99 ${overall.p99} ms, errors ${(overall.errorRate * 100).toFixed(2)}% -> ${result.passed ? 'PASS' : 'FAIL'}`);
  }

  const report = {
    target: BASE_URL,
    generatedAt: new Date().toISOString(),
    environment: { node: process.version, platform: `${os.type()} ${os.release()} ${os.arch()}`, cpu: os.cpus()[0]?.model, cores: os.cpus().length, memoryGb: Math.round(os.totalmem() / 2 ** 30) },
    thresholds: { p95Ms: P95_LIMIT_MS, maxErrorRate: ERROR_LIMIT },
    results,
  };
  const outFile = process.env.PERF_OUTPUT || path.join(__dirname, '..', '..', 'coverage', 'performance-results.json');
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Results written to ${outFile}`);
  process.exit(results.every((result) => result.passed) ? 0 : 1);
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
