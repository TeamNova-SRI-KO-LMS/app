// authRoutes keeps its own reference to sendPasswordResetOtp, so the module is
// replaced before the app loads; no test can reach a real SMTP server.
jest.mock('../../services/emailService', () => ({ sendPasswordResetOtp: jest.fn() }));

const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../../models/User');
const emailService = require('../../services/emailService');
const {
  api, createStudent, createAdmin, createInstructor, authHeader, DEFAULT_PASSWORD,
} = require('../helpers/factories');

const register = (body) => api().post('/api/auth/register').send(body);
const login = (body) => api().post('/api/auth/login').send(body);

describe('POST /api/auth/register', () => {
  const body = { name: 'Nimali Perera', email: 'nimali@example.com', password: 'Password123' };

  test('TC-AUTH-01 registers a student and returns a signed JWT [FR-001]', async () => {
    const res = await register(body);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ success: true, message: 'User registered successfully', user: { name: 'Nimali Perera', email: 'nimali@example.com', role: 'student' } });
    expect(jwt.verify(res.body.token, process.env.JWT_SECRET).id).toBe(String(res.body.user.id));
  });

  test('TC-AUTH-02 never returns the password or its hash [NFR-004]', async () => {
    const res = await register(body);

    expect(JSON.stringify(res.body)).not.toMatch(/Password123|\$2[aby]\$/);
  });

  test('TC-AUTH-03 rejects a duplicate email with 400 [FR-001]', async () => {
    await register(body);
    const res = await register({ ...body, name: 'Someone Else' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: 'User with this email already exists' });
  });

  test('TC-AUTH-04 treats email addresses case-insensitively [FR-001]', async () => {
    await register(body);
    const res = await register({ ...body, email: 'NIMALI@EXAMPLE.COM' });

    expect(res.status).toBe(400);
  });

  test('TC-AUTH-05 rejects invalid input with field errors [FR-001]', async () => {
    const res = await register({ name: '', email: 'bad', password: '1' });

    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThanOrEqual(3);
  });

  test('TC-AUTH-06 refuses to create an administrator through public sign-up [OWASP-A01]', async () => {
    const res = await register({ ...body, role: 'admin' });

    expect(res.status).toBe(400);
    expect(await User.countDocuments({ role: 'admin' })).toBe(0);
  });

  test('TC-AUTH-07 answers 500 without leaking details when the database fails [NFR-002]', async () => {
    jest.spyOn(User, 'findOne').mockRejectedValue(new Error('primary stepped down'));

    const res = await register(body);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: 'Server error during registration' });
  });
});

describe('POST /api/auth/login', () => {
  test('TC-AUTH-08 signs in with valid credentials and records the login time [FR-002]', async () => {
    const user = await createStudent({ email: 'kamal@example.com' });

    const res = await login({ email: 'kamal@example.com', password: DEFAULT_PASSWORD, portal: 'user' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, message: 'Login successful', user: { email: 'kamal@example.com', role: 'student' } });
    expect((await User.findById(user._id)).lastLogin).toBeInstanceOf(Date);
  });

  test('TC-AUTH-09 gives the same answer for a wrong password and an unknown email [OWASP-A07]', async () => {
    await createStudent({ email: 'kamal@example.com' });

    const wrongPassword = await login({ email: 'kamal@example.com', password: 'nope' });
    const unknown = await login({ email: 'ghost@example.com', password: 'nope' });

    expect(wrongPassword.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknown.body);
  });

  test('TC-AUTH-10 refuses a deactivated account [FR-009]', async () => {
    await createStudent({ email: 'old@example.com', isActive: false });

    const res = await login({ email: 'old@example.com', password: DEFAULT_PASSWORD });

    expect(res.status).toBe(401);
  });

  test('TC-AUTH-11 keeps administrators out of the user portal and users out of the admin portal [FR-009]', async () => {
    await createAdmin({ email: 'admin@example.com' });
    await createStudent({ email: 'student@example.com' });

    const adminAsUser = await login({ email: 'admin@example.com', password: DEFAULT_PASSWORD, portal: 'user' });
    const userAsAdmin = await login({ email: 'student@example.com', password: DEFAULT_PASSWORD, portal: 'admin' });
    const adminAsAdmin = await login({ email: 'admin@example.com', password: DEFAULT_PASSWORD, portal: 'admin' });

    expect(adminAsUser.status).toBe(403);
    expect(userAsAdmin.status).toBe(403);
    expect(adminAsAdmin.status).toBe(200);
  });

  test('TC-AUTH-12 rejects a login request without a password [FR-002]', async () => {
    const res = await login({ email: 'kamal@example.com' });

    expect(res.status).toBe(400);
  });

  test('TC-AUTH-13 answers 500 when the database fails during login [NFR-002]', async () => {
    jest.spyOn(User, 'findOne').mockImplementation(() => { throw new Error('timeout'); });

    const res = await login({ email: 'kamal@example.com', password: 'x' });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Server error during login');
  });
});

describe('GET /api/auth/me', () => {
  test('TC-AUTH-14 returns the signed-in user [FR-002]', async () => {
    const user = await createInstructor({ name: 'Teacher Kim' });

    const res = await api().get('/api/auth/me').set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ name: 'Teacher Kim', role: 'instructor' });
  });

  test('TC-AUTH-15 requires a token [FR-002]', async () => {
    expect((await api().get('/api/auth/me')).status).toBe(401);
  });

  test('TC-AUTH-16 answers 404 if the account disappears between authentication and lookup [NFR-002]', async () => {
    const user = await createStudent();
    const original = User.findById.bind(User);
    jest.spyOn(User, 'findById').mockImplementationOnce(original).mockResolvedValueOnce(null);

    const res = await api().get('/api/auth/me').set(authHeader(user));

    expect(res.status).toBe(404);
  });
});

describe('Password reset with an emailed one-time code', () => {
  const requestCode = (email) => api().post('/api/auth/forgot-password').send({ email });
  const send = emailService.sendPasswordResetOtp;

  beforeEach(() => {
    send.mockReset();
    send.mockResolvedValue();
  });

  test('TC-AUTH-17 sends a code and stores only its hash [FR-023]', async () => {
    const user = await createStudent({ email: 'reset@example.com' });

    const res = await requestCode('Reset@Example.com');
    const stored = await User.findById(user._id);
    const otp = send.mock.calls[0][1];

    expect(res.status).toBe(200);
    expect(otp).toMatch(/^\d{6}$/);
    expect(stored.resetPasswordToken).toMatch(/^[a-f0-9]{64}$/);
    expect(stored.resetPasswordToken).not.toBe(otp);
    expect(stored.resetPasswordExpire.getTime()).toBeGreaterThan(Date.now() + 9 * 60 * 1000);
  });

  test('TC-AUTH-18 answers identically for unknown addresses so accounts cannot be enumerated [OWASP-A07]', async () => {
    await createStudent({ email: 'reset@example.com' });

    const known = await requestCode('reset@example.com');
    const unknown = await requestCode('nobody@example.com');

    expect(unknown.status).toBe(known.status);
    expect(unknown.body).toEqual(known.body);
  });

  test('TC-AUTH-19 rejects a malformed email address [FR-023]', async () => {
    expect((await requestCode('not-an-email')).status).toBe(400);
    expect((await api().post('/api/auth/forgot-password').send({})).status).toBe(400);
  });

  test('TC-AUTH-20 clears the code and answers 503 when the email cannot be sent [FR-023]', async () => {
    const user = await createStudent({ email: 'reset@example.com' });
    send.mockRejectedValue(new Error('SMTP connection refused'));

    const res = await requestCode('reset@example.com');
    const stored = await User.findById(user._id);

    expect(res.status).toBe(503);
    expect(stored.resetPasswordToken).toBeUndefined();
  });

  test('TC-AUTH-21 completes the reset: verify the code, set a new password, sign in [FR-023]', async () => {
    await createStudent({ email: 'reset@example.com' });
    await requestCode('reset@example.com');
    const otp = send.mock.calls[0][1];

    const verified = await api().post('/api/auth/verify-reset-otp').send({ email: 'reset@example.com', otp });
    const reset = await api().post('/api/auth/reset-password').send({ resetToken: verified.body.resetToken, password: 'NewPassword456' });
    const oldLogin = await login({ email: 'reset@example.com', password: DEFAULT_PASSWORD });
    const newLogin = await login({ email: 'reset@example.com', password: 'NewPassword456' });

    expect(verified.status).toBe(200);
    expect(reset.status).toBe(200);
    expect(oldLogin.status).toBe(401);
    expect(newLogin.status).toBe(200);
  });

  test('TC-AUTH-22 rejects a wrong or expired code [FR-023]', async () => {
    const user = await createStudent({ email: 'reset@example.com' });
    await requestCode('reset@example.com');
    const otp = send.mock.calls[0][1];
    const wrong = otp === '111111' ? '222222' : '111111';

    const wrongCode = await api().post('/api/auth/verify-reset-otp').send({ email: 'reset@example.com', otp: wrong });
    await User.updateOne({ _id: user._id }, { resetPasswordExpire: new Date(Date.now() - 1000) });
    const expired = await api().post('/api/auth/verify-reset-otp').send({ email: 'reset@example.com', otp });
    const malformed = await api().post('/api/auth/verify-reset-otp').send({ email: 'reset@example.com', otp: '12ab' });

    expect(wrongCode.status).toBe(400);
    expect(expired.status).toBe(400);
    expect(malformed.status).toBe(400);
  });

  test('TC-AUTH-23 the reset credential cannot be reused or replaced by a login token [FR-023]', async () => {
    const user = await createStudent({ email: 'reset@example.com' });
    await requestCode('reset@example.com');
    const verified = await api().post('/api/auth/verify-reset-otp').send({ email: 'reset@example.com', otp: send.mock.calls[0][1] });

    const first = await api().post('/api/auth/reset-password').send({ resetToken: verified.body.resetToken, password: 'NewPassword456' });
    const replay = await api().post('/api/auth/reset-password').send({ resetToken: verified.body.resetToken, password: 'Another789' });
    const loginToken = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET);
    const wrongPurpose = await api().post('/api/auth/reset-password').send({ resetToken: loginToken, password: 'Another789' });
    const garbage = await api().post('/api/auth/reset-password').send({ resetToken: 'garbage', password: 'Another789' });
    const tooShort = await api().post('/api/auth/reset-password').send({ resetToken: verified.body.resetToken, password: '123' });

    expect(first.status).toBe(200);
    expect(replay.status).toBe(401);
    expect(wrongPurpose.status).toBe(401);
    expect(garbage.status).toBe(401);
    expect(tooShort.status).toBe(400);
  });

  test('TC-AUTH-24 answers 500 when the database fails during a reset request [NFR-002]', async () => {
    jest.spyOn(User, 'findOne').mockImplementation(() => { throw new Error('down'); });

    expect((await requestCode('reset@example.com')).status).toBe(500);
    expect((await api().post('/api/auth/verify-reset-otp').send({ email: 'reset@example.com', otp: '123456' })).status).toBe(500);
  });
});

describe('POST /api/auth/google', () => {
  const googlePayload = (overrides = {}) => ({
    getPayload: () => ({ sub: 'google-sub-1', email: 'gamage@gmail.com', name: 'Ruwan Gamage', picture: 'https://lh3.googleusercontent.com/a/photo', ...overrides }),
  });

  test('TC-AUTH-25 registers a new Google user as a verified student and issues a JWT [FR-013][FR-014]', async () => {
    jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue(googlePayload());

    const res = await api().post('/api/auth/google').send({ idToken: 'valid-google-token' });
    const user = await User.findOne({ email: 'gamage@gmail.com' });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Account registered successfully with Google');
    expect(jwt.verify(res.body.token, process.env.JWT_SECRET).id).toBe(user._id.toString());
    expect(user).toMatchObject({ googleId: 'google-sub-1', role: 'student', emailVerified: true });
  });

  test('TC-AUTH-26 links Google to an existing local account and keeps its avatar [FR-013]', async () => {
    const existing = await createStudent({ email: 'gamage@gmail.com', avatar: 'data:image/png;base64,AAA' });
    jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue(googlePayload());

    const res = await api().post('/api/auth/google').send({ idToken: 'valid-google-token' });
    const user = await User.findById(existing._id);

    expect(res.status).toBe(200);
    expect(user.googleId).toBe('google-sub-1');
    expect(user.avatar).toBe('data:image/png;base64,AAA');
  });

  test('TC-AUTH-27 registers an instructor only when requested, never an admin [FR-013]', async () => {
    jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue(googlePayload({ sub: 'g-2', email: 'teacher@gmail.com' }));

    const res = await api().post('/api/auth/google').send({ idToken: 't', role: 'admin' });

    expect(res.body.user.role).toBe('student');
  });

  test('TC-AUTH-28 refuses administrators on the Google sign-in path [FR-009]', async () => {
    await createAdmin({ email: 'gamage@gmail.com' });
    jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue(googlePayload());

    const res = await api().post('/api/auth/google').send({ idToken: 't' });

    expect(res.status).toBe(403);
  });

  test('TC-AUTH-29 rejects a missing or invalid Google ID token [FR-013]', async () => {
    jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockRejectedValue(new Error('Wrong recipient'));

    const missing = await api().post('/api/auth/google').send({});
    const invalid = await api().post('/api/auth/google').send({ idToken: 'forged' });

    expect(missing.status).toBe(400);
    expect(invalid.status).toBe(401);
    expect(invalid.body.message).toBe('Invalid Google ID token');
  });
});
