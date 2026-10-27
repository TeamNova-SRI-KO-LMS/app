const { api } = require('../helpers/factories');

describe('System endpoints', () => {
  test('TC-SYS-01 GET / identifies the API and points to the health check [NFR-002]', async () => {
    const res = await api().get('/');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, name: 'SRI-KO LMS API', status: 'running', docs: '/api/health' });
  });

  test('TC-SYS-02 GET /api/health reports the database as connected [NFR-002]', async () => {
    const res = await api().get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, status: 'ok', database: 'connected', environment: 'test' });
    expect(new Date(res.body.timestamp).toString()).not.toBe('Invalid Date');
  });

  test('TC-SYS-03 unknown API routes return a JSON 404 instead of an HTML page [NFR-002]', async () => {
    const res = await api().get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({ success: false, message: 'Route not found: GET /api/does-not-exist' });
  });

  test('TC-SYS-04 malformed JSON bodies are rejected with 400 and a JSON message [NFR-002]', async () => {
    const res = await api()
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "broken"');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: 'Malformed JSON in request body.' });
  });

  test('TC-SYS-05 the X-Powered-By header is not disclosed [OWASP-A05]', async () => {
    const res = await api().get('/');

    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  test('TC-SYS-06 CORS allows the configured frontend origin [NFR-004]', async () => {
    const res = await api()
      .options('/api/courses')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  test('TC-SYS-07 CORS does not allow an unknown origin [OWASP-A05]', async () => {
    const res = await api()
      .options('/api/courses')
      .set('Origin', 'https://attacker.example')
      .set('Access-Control-Request-Method', 'GET');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('TC-SYS-08 request bodies above the size limit are rejected with 413 [NFR-002]', async () => {
    const res = await api()
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ email: 'a@example.com', password: 'x'.repeat(51 * 1024 * 1024) }));

    expect(res.status).toBe(413);
    expect(res.body).toEqual({ success: false, message: 'Request body is too large.' });
  });
});

describe('Database unavailable', () => {
  const original = process.env.MONGODB_URI;

  afterEach(() => {
    process.env.MONGODB_URI = original;
  });

  test('TC-SYS-09 API routes answer 503 with a retry hint when the database is not configured [NFR-002]', async () => {
    delete process.env.MONGODB_URI;

    let isolatedApp;
    jest.isolateModules(() => {
      isolatedApp = require('../../app');
    });
    const res = await require('supertest')(isolatedApp).get('/api/courses');

    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ success: false, error: 'DATABASE_CONNECTION_ERROR', retryAfter: 5 });
  });

  test('TC-SYS-10 the health check reports a degraded status when the database is unavailable [NFR-002]', async () => {
    delete process.env.MONGODB_URI;

    let isolatedApp;
    jest.isolateModules(() => {
      isolatedApp = require('../../app');
    });
    const res = await require('supertest')(isolatedApp).get('/api/health');

    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ success: false, status: 'degraded', database: 'disconnected' });
  });
});
