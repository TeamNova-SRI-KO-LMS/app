const express = require('express');
const request = require('supertest');
const {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateProfileUpdate,
  validateReview,
  validateCourseCreation,
} = require('../../../middleware/validation');

// Runs a validation chain the way a route does and returns the HTTP result.
const run = async (chain, body) => {
  const app = express();
  app.use(express.json());
  app.post('/', chain, handleValidationErrors, (req, res) => res.json({ ok: true, body: req.body }));
  return request(app).post('/').send(body);
};

const fieldsIn = (res) => res.body.errors.map((error) => error.path);

describe('Registration validation', () => {
  const valid = { name: 'Nimali Perera', email: 'Nimali@Example.com', password: 'secret12' };

  test('TC-UNIT-VAL-01 accepts a valid registration and normalizes the email [FR-001]', async () => {
    const res = await run(validateUserRegistration, valid);

    expect(res.status).toBe(200);
    expect(res.body.body.email).toBe('nimali@example.com');
  });

  test('TC-UNIT-VAL-02 rejects a one-letter name, an invalid email and a short password [FR-001]', async () => {
    const res = await run(validateUserRegistration, { name: 'N', email: 'not-an-email', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
    expect(fieldsIn(res)).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });

  test('TC-UNIT-VAL-03 refuses a self-assigned admin role on public sign-up [OWASP-A01]', async () => {
    const res = await run(validateUserRegistration, { ...valid, role: 'admin' });

    expect(res.status).toBe(400);
    expect(res.body.errors[0]).toMatchObject({ path: 'role', msg: 'Role must be student or instructor' });
  });

  test('TC-UNIT-VAL-04 accepts names at the 2 and 50 character boundaries and rejects 51 [FR-001]', async () => {
    expect((await run(validateUserRegistration, { ...valid, name: 'Ab' })).status).toBe(200);
    expect((await run(validateUserRegistration, { ...valid, name: 'a'.repeat(50) })).status).toBe(200);
    expect((await run(validateUserRegistration, { ...valid, name: 'a'.repeat(51) })).status).toBe(400);
  });
});

describe('Login validation', () => {
  test('TC-UNIT-VAL-05 requires a valid email and a password [FR-002]', async () => {
    const res = await run(validateUserLogin, { email: 'nope' });

    expect(res.status).toBe(400);
    expect(fieldsIn(res)).toEqual(expect.arrayContaining(['email', 'password']));
  });

  test('TC-UNIT-VAL-06 rejects a NoSQL operator object in place of the email [OWASP-A03]', async () => {
    const res = await run(validateUserLogin, { email: { $ne: null }, password: 'x' });

    expect(res.status).toBe(400);
  });
});

describe('Profile validation', () => {
  test('TC-UNIT-VAL-07 accepts Sri Lankan phone formats and rejects others [FR-012]', async () => {
    expect((await run(validateProfileUpdate, { phone: '0771234567' })).status).toBe(200);
    expect((await run(validateProfileUpdate, { phone: '+94771234567' })).status).toBe(200);
    expect((await run(validateProfileUpdate, { phone: '' })).status).toBe(200);
    expect((await run(validateProfileUpdate, { phone: '12345' })).status).toBe(400);
  });

  test('TC-UNIT-VAL-08 requires http(s) websites and LinkedIn profile URLs [FR-012]', async () => {
    expect((await run(validateProfileUpdate, { website: 'https://sriko.lk' })).status).toBe(200);
    expect((await run(validateProfileUpdate, { website: 'javascript:alert(1)' })).status).toBe(400);
    expect((await run(validateProfileUpdate, { socialLinks: { linkedin: 'https://www.linkedin.com/in/nimali-p' } })).status).toBe(200);
    expect((await run(validateProfileUpdate, { socialLinks: { linkedin: 'https://example.com/me' } })).status).toBe(400);
  });

  test('TC-UNIT-VAL-09 limits bio and location length [FR-012]', async () => {
    const res = await run(validateProfileUpdate, { bio: 'a'.repeat(501), location: 'b'.repeat(101) });

    expect(res.status).toBe(400);
    expect(fieldsIn(res)).toEqual(expect.arrayContaining(['bio', 'location']));
  });
});

describe('Review and course validation', () => {
  test('TC-UNIT-VAL-10 accepts ratings 1 to 5 only [FR-003]', async () => {
    expect((await run(validateReview, { rating: 1 })).status).toBe(200);
    expect((await run(validateReview, { rating: 5, comment: 'Great' })).status).toBe(200);
    expect((await run(validateReview, { rating: 0 })).status).toBe(400);
    expect((await run(validateReview, { rating: 6 })).status).toBe(400);
  });

  test('TC-UNIT-VAL-11 validates course title, description, category, level, duration and price [FR-006]', async () => {
    const ok = await run(validateCourseCreation, {
      title: 'TOPIK I', description: 'Preparation for TOPIK level 1 and 2.', category: 'Language', level: 'beginner', duration: 12, price: 15000,
    });
    const bad = await run(validateCourseCreation, {
      title: 'AB', description: 'short', category: 'Cooking', level: 'expert', duration: 53, price: -1,
    });

    expect(ok.status).toBe(200);
    expect(bad.status).toBe(400);
    expect(fieldsIn(bad)).toEqual(expect.arrayContaining(['title', 'description', 'category', 'level', 'duration', 'price']));
  });
});
