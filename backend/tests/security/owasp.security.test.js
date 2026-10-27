// Stripe is replaced so the payment-integrity tests never contact the gateway.
const mockStripe = { paymentIntents: { create: jest.fn(), retrieve: jest.fn() } };
jest.mock('stripe', () => jest.fn(() => mockStripe));

const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Settings = require('../../models/Settings');
const LectureMaterial = require('../../models/LectureMaterial');
const Assignment = require('../../models/Assignment');
const AssignmentSubmission = require('../../models/AssignmentSubmission');
const {
  api, createStudent, createAdmin, createInstructor, createCourse, enrol, createEvent, authHeader, DEFAULT_PASSWORD,
} = require('../helpers/factories');

describe('A02 Cryptographic failures', () => {
  test('TC-SEC-A02-01 passwords are stored as salted bcrypt hashes [OWASP-A02][NFR-004]', async () => {
    const a = await createStudent({ password: 'SamePassword1' });
    const b = await createStudent({ password: 'SamePassword1' });
    const [hashA, hashB] = await Promise.all([a, b].map(async (u) => (await User.findById(u._id).select('+password')).password));

    expect(hashA).toMatch(/^\$2[aby]\$/);
    expect(hashA).not.toBe(hashB);
  });

  // The guideline asks for a bcrypt cost factor of at least 12; the model uses 10.
  test.failing('TC-SEC-A02-02 [KNOWN DEFECT DEF-06] uses a bcrypt cost factor of at least 12 [OWASP-A02]', async () => {
    const user = await createStudent();
    const { password } = await User.findById(user._id).select('+password');

    expect(Number(password.split('$')[2])).toBeGreaterThanOrEqual(12);
  });

  // DEF-04 (fixed): stored secrets are replaced by a mask in every settings response.
  test('TC-SEC-A02-03 settings responses never contain stored secrets [OWASP-A02]', async () => {
    const admin = await createAdmin();
    await Settings.create({ emailSettings: { smtpPass: 'smtp-secret' }, paymentSettings: { stripeSecretKey: 'sk_live_secret' } });

    const res = await api().get('/api/admin/settings').set(authHeader(admin));

    expect(JSON.stringify(res.body)).not.toMatch(/smtp-secret|sk_live_secret/);
  });

  test('TC-SEC-A02-04 saving the masked form keeps stored secrets and a new value replaces them [OWASP-A02][FR-024]', async () => {
    const admin = await createAdmin();
    await Settings.create({ emailSettings: { smtpHost: 'smtp.example.com', smtpPass: 'smtp-secret' }, paymentSettings: { stripeSecretKey: 'sk_live_secret' } });
    const read = await api().get('/api/admin/settings').set(authHeader(admin));
    const form = read.body.settings;

    const saved = await api().put('/api/admin/settings').set(authHeader(admin)).send({ ...form, emailSettings: { ...form.emailSettings, smtpHost: 'mail.sriko.lk' } });
    const section = await api().put('/api/admin/settings/paymentSettings').set(authHeader(admin)).send({ stripeSecretKey: 'sk_live_new' });
    const exported = await api().get('/api/admin/settings/export/json').set(authHeader(admin));
    const stored = await Settings.findOne();

    expect(form.emailSettings.smtpPass).toBe('********');
    expect(JSON.stringify([saved.body, section.body, exported.body])).not.toMatch(/smtp-secret|sk_live/);
    expect(stored.emailSettings).toMatchObject({ smtpHost: 'mail.sriko.lk', smtpPass: 'smtp-secret' });
    expect(stored.paymentSettings.stripeSecretKey).toBe('sk_live_new');
    expect((await api().get('/api/admin/settings/emailSettings').set(authHeader(admin))).body.data.smtpPass).toBe('********');
  });
});

describe('A03 Injection', () => {
  test('TC-SEC-A03-01 rejects MongoDB operators in login credentials [OWASP-A03]', async () => {
    await createStudent({ email: 'victim@example.com' });

    const res = await api().post('/api/auth/login').send({ email: { $gt: '' }, password: { $gt: '' } });

    expect(res.status).toBe(400);
    expect(res.body.token).toBeUndefined();
  });

  test('TC-SEC-A03-02 search parameters are matched literally, not as regular expressions [OWASP-A03]', async () => {
    const admin = await createAdmin();
    await createCourse({ title: 'Korean A+ Class' });

    for (const path of ['/api/courses?search=.*', '/api/announcements?search=(', '/api/forums?search=[', '/api/attendance/admin/records?search=*']) {
      const res = await api().get(path).set(authHeader(admin));
      expect(res.status).toBe(200);
    }
    expect((await api().get('/api/courses?search=.*')).body.total).toBe(0);
    expect((await api().get(`/api/courses?search=${encodeURIComponent('A+')}`)).body.total).toBe(1);
  });

  // The public event search passes the raw query string to new RegExp().
  test.failing('TC-SEC-A03-03 [KNOWN DEFECT DEF-05] the public event search treats regex symbols literally [OWASP-A03]', async () => {
    await createEvent({ title: 'Hangul (Day) celebration' });

    const res = await api().get('/api/events?search=(Day');

    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(1);
  });
});

describe('A04 Insecure design: payment and enrolment integrity', () => {
  beforeAll(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
  });

  afterAll(() => {
    delete process.env.STRIPE_SECRET_KEY;
  });

  test('TC-SEC-A04-01 a paid course cannot be entered without a completed payment [OWASP-A04][FR-011]', async () => {
    const student = await createStudent();
    const course = await createCourse({ price: 15000 });

    const res = await api().post(`/api/courses/${course._id}/enroll`).set(authHeader(student));

    expect(res.status).toBe(402);
  });

  // DEF-01 (fixed): a student who starts a Stripe checkout but never pays cannot mark the
  // pending payment "completed" and so cannot enter the paid course.
  test('TC-SEC-A04-02 a student cannot mark their own course payment as paid [OWASP-A04][FR-011]', async () => {
    const student = await createStudent();
    const course = await createCourse({ price: 15000 });
    mockStripe.paymentIntents.create.mockResolvedValue({ id: 'pi_unpaid', client_secret: 's', status: 'requires_payment_method' });

    const checkout = await api().post('/api/payments/create-course-payment-intent').set(authHeader(student)).send({ courseId: course._id });
    const complete = await api().put(`/api/payments/${checkout.body.paymentId}/complete`).set(authHeader(student)).send({ gatewayTransactionId: 'fake' });
    const enrolment = await api().post(`/api/courses/${course._id}/enroll`).set(authHeader(student));

    expect(complete.status).toBe(403);
    expect(enrolment.status).toBe(402);
  });

  // DEF-08 (fixed): instructors may still register (FR-001), but a course they create keeps
  // the platform-managed fields and stays unpublished until an administrator publishes it.
  test('TC-SEC-A04-03 a self-registered instructor cannot publish a course with forged fields [OWASP-A04]', async () => {
    const victim = await createStudent();
    const signup = await api().post('/api/auth/register').send({ name: 'Mallory', email: 'mallory@example.com', password: 'Password123', role: 'instructor' });

    const res = await api().post('/api/courses').set('Authorization', `Bearer ${signup.body.token}`).send({
      title: 'Fake course', description: 'Looks official to students', price: 1, duration: 4, isPublished: true, enrolledStudents: [victim._id], averageRating: 5,
    });

    expect(res.status).toBe(201);
    expect(res.body.course).toMatchObject({ isPublished: false, enrolledStudents: [], averageRating: 0 });
  });

  test('TC-SEC-A04-05 instructors cannot publish or forge fields when updating; administrators can publish [OWASP-A04][FR-006]', async () => {
    const instructor = await createInstructor();
    const admin = await createAdmin();
    const victim = await createStudent();
    const course = await createCourse({ instructor: instructor._id, isPublished: false });

    const forged = await api().put(`/api/courses/${course._id}`).set(authHeader(instructor)).send({
      price: 9000, isPublished: true, enrolledStudents: [victim._id], averageRating: 5,
    });
    const published = await api().put(`/api/courses/${course._id}`).set(authHeader(admin)).send({ isPublished: true });

    expect(forged.status).toBe(200);
    expect(forged.body.course).toMatchObject({ price: 9000, isPublished: false, enrolledStudents: [], averageRating: 0 });
    expect(published.body.course.isPublished).toBe(true);
  });

  // DEF-15 (fixed on develop): a student who is not enrolled in the course cannot submit.
  test('TC-SEC-A04-04 only enrolled students can submit an assignment [OWASP-A04][FR-020]', async () => {
    const course = await createCourse();
    const assignment = await Assignment.create({ course: course._id, title: 'Essay', description: 'Write' });

    const res = await api().post(`/api/assignments/${assignment._id}/submit`).set(authHeader(await createStudent()))
      .attach('files', Buffer.from('MZ'), { filename: 'payload.exe', contentType: 'application/x-msdownload' });

    expect(res.status).toBe(403);
    expect(await AssignmentSubmission.countDocuments()).toBe(0);
  });
});

describe('A01 Broken access control: course content', () => {
  // DEF-03 (fixed, DDP-#95): visitors see a paid course's outline, but no file or video
  // address of a lesson outside the free previews.
  test('TC-SEC-A01-01 lecture materials of a paid course are not public [OWASP-A01][FR-007]', async () => {
    const course = await createCourse({ price: 25000 });
    await LectureMaterial.create({
      course: course._id, lessonTitle: 'Week 1', title: 'Full lesson video', type: 'video', driveFileId: 'videos/full.mp4',
      viewUrl: 'https://cdn.example/videos/full.mp4', embedUrl: 'https://cdn.example/videos/full.mp4', downloadUrl: 'https://cdn.example/videos/full.mp4?download=full.mp4',
    });

    const res = await api().get(`/api/lectures/course/${course._id}`);

    expect(res.body).toMatchObject({ hasFullAccess: false, materials: [{ title: 'Full lesson video', isLocked: true }] });
    expect(JSON.stringify(res.body)).not.toMatch(/cdn\.example|videos\/full/);
  });

  test('TC-SEC-A01-03 previews are public; every material opens for enrolled students, the instructor and administrators [OWASP-A01][FR-007]', async () => {
    const instructor = await createInstructor();
    const course = await createCourse({ price: 25000, instructor: instructor._id });
    const preview = await LectureMaterial.create({ course: course._id, lessonTitle: 'Week 1', title: 'Introduction', type: 'video', viewUrl: 'https://cdn.example/intro.mp4', isPreview: true });
    const lesson = await LectureMaterial.create({ course: course._id, lessonTitle: 'Week 1', title: 'Full lesson', type: 'pdf', viewUrl: 'https://cdn.example/lesson.pdf' });
    const enrolled = await createStudent();
    await enrol(enrolled, course);
    const outsider = await createStudent();
    const urls = async (headers) => Object.fromEntries((await api().get(`/api/lectures/course/${course._id}`).set(headers)).body.materials.map((m) => [m.title, m.viewUrl ?? null]));

    expect(await urls({})).toEqual({ Introduction: 'https://cdn.example/intro.mp4', 'Full lesson': null });
    expect(await urls(authHeader(outsider))).toEqual({ Introduction: 'https://cdn.example/intro.mp4', 'Full lesson': null });
    for (const user of [enrolled, instructor, await createAdmin()]) {
      expect(await urls(authHeader(user))).toEqual({ Introduction: 'https://cdn.example/intro.mp4', 'Full lesson': 'https://cdn.example/lesson.pdf' });
    }
    expect((await api().get(`/api/lectures/${preview._id}`)).status).toBe(200);
    expect((await api().get(`/api/lectures/${lesson._id}`)).status).toBe(403);
    expect((await api().get(`/api/lectures/${lesson._id}`).set(authHeader(outsider))).status).toBe(403);
    expect((await api().get(`/api/lectures/${lesson._id}`).set(authHeader(enrolled))).status).toBe(200);
  });

  test('TC-SEC-A01-04 assignment files are only shown to enrolled students and administrators [OWASP-A01][FR-020]', async () => {
    const course = await createCourse({ price: 25000 });
    const assignment = await Assignment.create({
      course: course._id, title: 'Essay', description: 'Write 300 words about Chuseok', attachmentUrl: 'https://cdn.example/essay-brief.pdf', weekNumber: 2,
    });
    const enrolled = await createStudent();
    await enrol(enrolled, course);
    const outsider = await createStudent();
    const list = (headers) => api().get(`/api/assignments/course/${course._id}`).set(headers);

    const publicList = await list({});
    const studentList = await list(authHeader(enrolled));

    expect(publicList.body).toMatchObject({ hasFullAccess: false, assignments: [{ title: 'Essay', weekNumber: 2, isLocked: true }] });
    expect(publicList.body.assignments[0]).not.toHaveProperty('attachmentUrl');
    expect((await list(authHeader(outsider))).body.hasFullAccess).toBe(false);
    expect(studentList.body).toMatchObject({ hasFullAccess: true, assignments: [{ attachmentUrl: 'https://cdn.example/essay-brief.pdf' }] });
    expect((await api().get(`/api/assignments/${assignment._id}`)).status).toBe(403);
    expect((await api().get(`/api/assignments/${assignment._id}`).set(authHeader(outsider))).status).toBe(403);
    expect((await api().get(`/api/assignments/${assignment._id}`).set(authHeader(enrolled))).status).toBe(200);
    expect((await api().get(`/api/assignments/${assignment._id}`).set(authHeader(await createAdmin()))).status).toBe(200);
  });

  test('TC-SEC-A01-02 a profile update cannot change the caller\'s role [OWASP-A01]', async () => {
    const student = await createStudent();

    await api().put('/api/users/profile').set(authHeader(student)).send({ role: 'admin' });

    expect((await User.findById(student._id)).role).toBe('student');
  });
});

describe('A05 Security misconfiguration', () => {
  test('TC-SEC-A05-01 error responses do not include stack traces [OWASP-A05]', async () => {
    jest.spyOn(User, 'findOne').mockImplementation(() => { throw new Error('internal detail'); });

    const res = await api().post('/api/auth/login').send({ email: 'a@example.com', password: 'x' });

    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toMatch(/internal detail|\bat .*\.js:\d+/);
  });

  // The API sends no Content-Security-Policy, HSTS, X-Frame-Options or nosniff headers.
  test.failing('TC-SEC-A05-02 [KNOWN DEFECT DEF-16] the API sends standard security headers [OWASP-A05]', async () => {
    const res = await api().get('/api/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
  });
});

describe('A07 Identification and authentication failures', () => {
  test('TC-SEC-A07-01 rejects an unsigned ("alg: none") token [OWASP-A07]', async () => {
    const admin = await createAdmin();
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ id: admin._id.toString() })).toString('base64url');

    const res = await api().get('/api/users').set('Authorization', `Bearer ${header}.${payload}.`);

    expect(res.status).toBe(401);
  });

  test('TC-SEC-A07-02 rejects a token whose payload was altered after signing [OWASP-A07]', async () => {
    const student = await createStudent();
    const admin = await createAdmin();
    const [head, , signature] = jwt.sign({ id: student._id.toString() }, process.env.JWT_SECRET).split('.');
    const forgedPayload = Buffer.from(JSON.stringify({ id: admin._id.toString() })).toString('base64url');

    const res = await api().get('/api/users').set('Authorization', `Bearer ${head}.${forgedPayload}.${signature}`);

    expect(res.status).toBe(401);
  });

  test('TC-SEC-A07-03 login tokens expire [OWASP-A07]', async () => {
    const user = await createStudent({ email: 'exp@example.com' });

    const res = await api().post('/api/auth/login').send({ email: 'exp@example.com', password: DEFAULT_PASSWORD });
    const { exp, iat } = jwt.decode(res.body.token);

    expect(exp - iat).toBe(60 * 60);
    expect(user).toBeDefined();
  });

  // Unlimited password guesses are accepted; there is no rate limit or lockout.
  test.failing('TC-SEC-A07-04 [KNOWN DEFECT DEF-07] repeated failed logins are throttled [OWASP-A07]', async () => {
    await createStudent({ email: 'target@example.com' });
    const statuses = [];

    for (let i = 0; i < 12; i += 1) {
      statuses.push((await api().post('/api/auth/login').send({ email: 'target@example.com', password: `guess-${i}` })).status);
    }

    expect(statuses).toContain(429);
  });
});
