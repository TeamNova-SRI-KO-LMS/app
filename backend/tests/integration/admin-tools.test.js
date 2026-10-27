const Settings = require('../../models/Settings');
const User = require('../../models/User');
const JoinUsSubmission = require('../../models/JoinUsSubmission');
const {
  api, createStudent, createAdmin, createCourse, enrol, createPayment, createJoinUsSubmission, authHeader,
} = require('../helpers/factories');

describe('System settings', () => {
  test('TC-SET-01 creates default settings on first read [FR-024]', async () => {
    const admin = await createAdmin();

    const res = await api().get('/api/admin/settings').set(authHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body.settings.paymentSettings.currency).toBe('LKR');
    expect(res.body.settings.systemSettings.timezone).toBe('Asia/Colombo');
    expect(await Settings.countDocuments()).toBe(1);
  });

  test('TC-SET-02 updates all settings and records who changed them [FR-024]', async () => {
    const admin = await createAdmin();

    const created = await api().put('/api/admin/settings').set(authHeader(admin)).send({ siteName: 'SRI-KO LMS' });
    const updated = await api().put('/api/admin/settings').set(authHeader(admin)).send({ contactEmail: 'office@sriko.lk' });

    expect(created.body.settings.siteName).toBe('SRI-KO LMS');
    expect(updated.body.settings).toMatchObject({ siteName: 'SRI-KO LMS', contactEmail: 'office@sriko.lk', lastUpdatedBy: admin._id.toString() });
  });

  test('TC-SET-03 reads and updates one settings section [FR-024]', async () => {
    const admin = await createAdmin();

    const section = await api().get('/api/admin/settings/userSettings').set(authHeader(admin));
    const updated = await api().put('/api/admin/settings/userSettings').set(authHeader(admin)).send({ allowRegistration: false });
    const unknown = await api().get('/api/admin/settings/doesNotExist').set(authHeader(admin));

    expect(section.body).toMatchObject({ section: 'userSettings', data: { allowRegistration: true, maxLoginAttempts: 5 } });
    expect(updated.body.settings.userSettings.allowRegistration).toBe(false);
    expect(unknown.status).toBe(404);
  });

  test('TC-SET-04 exports, imports and resets the settings [FR-024]', async () => {
    const admin = await createAdmin();
    await Settings.create({ siteName: 'Before' });

    const exported = await api().get('/api/admin/settings/export/json').set(authHeader(admin));
    const imported = await api().post('/api/admin/settings/import').set(authHeader(admin)).send({ settings: { siteName: 'Imported' } });
    const missing = await api().post('/api/admin/settings/import').set(authHeader(admin)).send({});
    const reset = await api().post('/api/admin/settings/reset').set(authHeader(admin));

    expect(exported.body.settings.siteName).toBe('Before');
    expect(exported.body.exportedAt).toBeDefined();
    expect(imported.body.settings.siteName).toBe('Imported');
    expect(missing.status).toBe(400);
    expect(reset.body.settings.siteName).toBeUndefined();
    expect(await Settings.countDocuments()).toBe(1);
  });

  test('TC-SET-05 settings are for administrators only [FR-024][OWASP-A01]', async () => {
    expect((await api().get('/api/admin/settings').set(authHeader(await createStudent()))).status).toBe(403);
    expect((await api().get('/api/admin/settings')).status).toBe(401);
  });

  test('TC-SET-06 answers 500 when settings cannot be loaded [NFR-002]', async () => {
    const admin = await createAdmin();
    const header = authHeader(admin);
    jest.spyOn(Settings, 'findOne').mockRejectedValue(new Error('boom'));

    expect((await api().get('/api/admin/settings').set(header)).status).toBe(500);
    expect((await api().get('/api/admin/settings/userSettings').set(header)).status).toBe(500);
    expect((await api().put('/api/admin/settings/userSettings').set(header).send({})).status).toBe(500);
    expect((await api().put('/api/admin/settings').set(header).send({})).status).toBe(500);
    expect((await api().get('/api/admin/settings/export/json').set(header)).status).toBe(500);
  });
});

describe('Analytics and reports', () => {
  const seed = async () => {
    const admin = await createAdmin();
    const student = await createStudent({ lastLogin: new Date() });
    const course = await createCourse({ title: 'TOPIK I', price: 15000 });
    const progress = await enrol(student, course);
    progress.isCompleted = true;
    progress.completionDate = new Date();
    await progress.save();
    await createPayment({ user: student._id, course: course._id, amount: 15000 });
    return admin;
  };

  test('TC-ANL-01 reports users, courses, revenue, completions and monthly series [FR-010][FR-008]', async () => {
    const admin = await seed();

    const res = await api().get('/api/admin/analytics?period=30').set(authHeader(admin));
    const month = new Date().getUTCMonth();

    expect(res.status).toBe(200);
    expect(res.body.analytics.overview).toMatchObject({ totalUsers: 2, totalCourses: 1, totalRevenue: 15000, activeUsers: 1, completedCourses: 1 });
    expect(res.body.analytics.revenueData[month].revenue).toBe(15000);
    expect(res.body.analytics.userGrowth[month].users).toBe(2);
    expect(res.body.analytics.topCourses[0].title).toBe('TOPIK I');
  });

  test('TC-ANL-02 supports a calendar year and validates it [FR-010]', async () => {
    const admin = await seed();
    const year = new Date().getUTCFullYear();

    const res = await api().get(`/api/admin/analytics?year=${year}`).set(authHeader(admin));
    const all = await api().get('/api/admin/analytics?year=all&period=year').set(authHeader(admin));
    const invalid = await api().get('/api/admin/analytics?year=1999').set(authHeader(admin));

    expect(res.body.analytics.overview.totalRevenue).toBe(15000);
    expect(all.status).toBe(200);
    expect(invalid.status).toBe(400);
  });

  test('TC-ANL-03 exports the report as CSV or PDF [FR-010]', async () => {
    const admin = await seed();

    const csv = await api().get('/api/admin/analytics/export?format=csv').set(authHeader(admin));
    const pdf = await api().get('/api/admin/analytics/export?format=pdf').set(authHeader(admin)).buffer(true).parse((res, cb) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => cb(null, Buffer.concat(chunks)));
    });

    expect(csv.headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(csv.text).toContain('"Total Revenue (LKR)","15000"');
    expect(pdf.headers['content-type']).toBe('application/pdf');
    expect(pdf.body.subarray(0, 8).toString()).toBe('%PDF-1.4');
  });

  test('TC-ANL-04 rejects unknown export formats and invalid years [FR-010]', async () => {
    const admin = await createAdmin();

    expect((await api().get('/api/admin/analytics/export?format=xlsx').set(authHeader(admin))).status).toBe(400);
    expect((await api().get('/api/admin/analytics/export?year=3000').set(authHeader(admin))).status).toBe(400);
  });

  test('TC-ANL-05 answers 500 when the report cannot be built [NFR-002]', async () => {
    const admin = await createAdmin();
    const header = authHeader(admin);
    jest.spyOn(User, 'countDocuments').mockRejectedValue(new Error('boom'));

    expect((await api().get('/api/admin/analytics').set(header)).status).toBe(500);
    expect((await api().get('/api/admin/analytics/export').set(header)).status).toBe(500);
  });
});

describe('Join Us applications', () => {
  const application = {
    name: 'Ruwan Gamage', email: 'ruwan@example.com', phone: '0771234567', age: '24', currentLevel: 'Beginner',
    preferredTime: 'Weekend Classes', interests: ['Korean Language Basics', ''], hearAboutUs: 'social-media', message: 'I want to work in Korea.',
  };

  test('TC-JOIN-01 accepts a public application and records the request metadata [FR-022]', async () => {
    const res = await api().post('/api/join-us/submit').set('User-Agent', 'jest-agent').send(application);
    const stored = await JoinUsSubmission.findById(res.body.data.id);

    expect(res.status).toBe(201);
    expect(stored).toMatchObject({ age: 24, status: 'pending', interests: ['Korean Language Basics'], userAgent: 'jest-agent' });
  });

  test('TC-JOIN-02 accepts blank optional selections [FR-022]', async () => {
    const res = await api().post('/api/join-us/submit').send({ name: 'A', email: 'a@example.com', currentLevel: '', preferredTime: '', hearAboutUs: '', interests: 'x' });

    expect(res.status).toBe(201);
  });

  test('TC-JOIN-03 requires a name and email and validates option values [FR-022]', async () => {
    const missing = await api().post('/api/join-us/submit').send({ name: 'Only name' });
    const tooYoung = await api().post('/api/join-us/submit').send({ ...application, age: 12 });
    const badLevel = await api().post('/api/join-us/submit').send({ ...application, currentLevel: 'Guru' });

    expect(missing.status).toBe(400);
    expect(tooYoung.body.message).toBe('Age must be at least 16');
    expect(badLevel.status).toBe(400);
  });

  test('TC-JOIN-04 lets administrators filter, search and page applications [FR-022]', async () => {
    const admin = await createAdmin();
    await createJoinUsSubmission({ name: 'Ruwan', status: 'pending' });
    await createJoinUsSubmission({ name: 'Sachini', status: 'contacted' });

    const pending = await api().get('/api/join-us?status=PENDING').set(authHeader(admin));
    const search = await api().get('/api/join-us?search=sach&status=ALL&page=1&limit=1').set(authHeader(admin));
    const recent = await api().get('/api/join-us/recent?limit=50').set(authHeader(admin));

    expect(pending.body.data.map((s) => s.name)).toEqual(['Ruwan']);
    expect(search.body).toMatchObject({ total: 1, pages: 1 });
    expect(recent.body).toMatchObject({ total: 2, pending: 1 });
  });

  test('TC-JOIN-05 moves an application through the pipeline and deletes it [FR-022]', async () => {
    const admin = await createAdmin();
    const submission = await createJoinUsSubmission();

    const contacted = await api().patch(`/api/join-us/${submission._id}/status`).set(authHeader(admin)).send({ status: 'contacted' });
    const invalid = await api().patch(`/api/join-us/${submission._id}/status`).set(authHeader(admin)).send({ status: 'ghosted' });
    const deleted = await api().delete(`/api/join-us/${submission._id}`).set(authHeader(admin));
    const missingUpdate = await api().patch(`/api/join-us/${submission._id}/status`).set(authHeader(admin)).send({ status: 'enrolled' });
    const missingDelete = await api().delete(`/api/join-us/${submission._id}`).set(authHeader(admin));

    expect(contacted.body.data.status).toBe('contacted');
    expect(contacted.body.data.contactedAt).toBeDefined();
    expect(invalid.status).toBe(400);
    expect(deleted.status).toBe(200);
    expect(missingUpdate.status).toBe(404);
    expect(missingDelete.status).toBe(404);
  });

  test('TC-JOIN-06 applications are visible to administrators only [FR-022][OWASP-A01]', async () => {
    const student = await createStudent();

    expect((await api().get('/api/join-us').set(authHeader(student))).status).toBe(403);
    expect((await api().get('/api/join-us')).status).toBe(401);
  });

  test('TC-JOIN-07 answers 500 when the application store fails [NFR-002]', async () => {
    const admin = await createAdmin();
    const header = authHeader(admin);
    jest.spyOn(JoinUsSubmission.prototype, 'save').mockRejectedValue(new Error('boom'));
    jest.spyOn(JoinUsSubmission, 'countDocuments').mockRejectedValue(new Error('boom'));

    expect((await api().post('/api/join-us/submit').send(application)).status).toBe(500);
    expect((await api().get('/api/join-us').set(header)).status).toBe(500);
  });
});
