const User = require('../../models/User');
const Certificate = require('../../models/Certificate');
const Attendance = require('../../models/Attendance');
const {
  api, createStudent, createAdmin, createCourse, enrol, createAttendance, authHeader, DEFAULT_PASSWORD,
} = require('../helpers/factories');

const PNG = Buffer.from('89504e470d0a1a0a', 'hex');

describe('Student dashboard', () => {
  test('TC-USER-01 combines enrolled courses, progress, certificates and attendance [FR-005]', async () => {
    const student = await createStudent();
    const admin = await createAdmin();
    const course = await createCourse({ title: 'Korean for Beginners' });
    const progress = await enrol(student, course);
    progress.completedLessons.push({ completedAt: new Date() });
    progress.overallProgress = 50;
    progress.timeSpent = 120;
    await progress.save();
    await Certificate.create({
      student: student._id, course: course._id, certificateNumber: 'C-1', studentName: student.name,
      courseName: course.title, issuedBy: admin._id, issuedDate: new Date(),
    });
    await createAttendance({ student: student._id, course: course._id, status: 'present', date: new Date('2026-10-01') });
    await createAttendance({ student: student._id, course: course._id, status: 'absent', date: new Date('2026-10-02') });

    const res = await api().get('/api/users/dashboard').set(authHeader(student));

    expect(res.status).toBe(200);
    expect(res.body.data.statistics).toMatchObject({
      totalEnrolledCourses: 1, totalCompletedLessons: 1, totalLessons: 2, totalCertificates: 1,
      timeSpentFormatted: '2h', overallProgress: 50, attendanceRate: 50,
    });
    expect(res.body.data.enrolledCourses[0]).toMatchObject({ title: 'Korean for Beginners', lessonsText: '1/2 lessons' });
    expect(res.body.data.recentActivity.map((a) => a.icon)).toEqual(expect.arrayContaining(['Award', 'BookOpen', 'CheckCircle2']));
    expect(res.body.data.attendance.records[0]).toMatchObject({ statusType: 'absent', date: 'Oct 02, 2026' });
  });

  test('TC-USER-02 reports a new student with no activity sensibly [FR-005]', async () => {
    const res = await api().get('/api/users/dashboard').set(authHeader(await createStudent()));

    expect(res.body.data.statistics).toMatchObject({ totalEnrolledCourses: 0, overallProgress: 0, attendanceRate: 100 });
    expect(res.body.data.user.level).toBe('Beginner');
  });

  test('TC-USER-03 includes courses linked only through the course enrolment list [FR-005]', async () => {
    const student = await createStudent();
    await createCourse({ title: 'Direct', enrolledStudents: [student._id], level: 'advanced' });

    const res = await api().get('/api/users/dashboard').set(authHeader(student));

    expect(res.body.data.enrolledCourses.map((c) => c.title)).toEqual(['Direct']);
    expect(res.body.data.user.level).toBe('Advanced');
  });

  test('TC-USER-04 answers 500 when the dashboard query fails [NFR-002]', async () => {
    const student = await createStudent();
    jest.spyOn(Certificate, 'find').mockImplementation(() => { throw new Error('boom'); });

    expect((await api().get('/api/users/dashboard').set(authHeader(student))).status).toBe(500);
  });
});

describe('Student attendance via /api/users/attendance', () => {
  test('TC-USER-05 lists the student\'s records with a summary [FR-015]', async () => {
    const student = await createStudent();
    const course = await createCourse();
    await createAttendance({ student: student._id, course: course._id, status: 'late' });

    const res = await api().get('/api/users/attendance').set(authHeader(student));

    expect(res.status).toBe(200);
    expect(res.body.data.summary).toEqual({ totalSessions: 1, presentCount: 0, absentCount: 0, lateCount: 1, excusedCount: 0 });
    expect(res.body.data.rate).toBe(0);
  });

  test('TC-USER-06 records attendance for a date and defaults to the first enrolled course [FR-015]', async () => {
    const student = await createStudent();
    const course = await createCourse({ title: 'Korean for Beginners' });
    await enrol(student, course);

    const res = await api().post('/api/users/attendance').set(authHeader(student)).send({ date: '2026-10-15', status: 'Excused', notes: '  Medical  ' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'excused', notes: 'Medical', course: { title: 'Korean for Beginners' } });
  });

  test('TC-USER-07 supports a day number in the current month [FR-015]', async () => {
    const student = await createStudent();
    const course = await createCourse();

    const res = await api().post('/api/users/attendance').set(authHeader(student)).send({ dayNumber: 1, courseId: course._id.toString() });
    const stored = await Attendance.findOne({ student: student._id });

    expect(res.status).toBe(200);
    expect(stored.date.getUTCDate()).toBe(1);
  });

  test('TC-USER-08 rejects an unknown status, an invalid date and a missing course [FR-015]', async () => {
    const student = await createStudent();
    const course = await createCourse();

    const badStatus = await api().post('/api/users/attendance').set(authHeader(student)).send({ status: 'sleeping', courseId: course._id });
    const badDate = await api().post('/api/users/attendance').set(authHeader(student)).send({ date: '2026-02-31', courseId: course._id });
    const noCourse = await api().post('/api/users/attendance').set(authHeader(student)).send({});
    const unknownCourse = await api().post('/api/users/attendance').set(authHeader(student)).send({ courseId: '64b7f0a0a0a0a0a0a0a0a0a0' });

    expect(badStatus.status).toBe(400);
    expect(badDate.status).toBe(400);
    expect(noCourse.status).toBe(400);
    expect(unknownCourse.status).toBe(400);
  });
});

describe('Profile management', () => {
  test('TC-USER-09 returns the profile with enrolled course details [FR-012]', async () => {
    const student = await createStudent({ bio: 'Aspiring EPS worker' });
    await enrol(student, await createCourse({ title: 'EPS-TOPIK' }));

    const res = await api().get('/api/users/profile').set(authHeader(student));

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ bio: 'Aspiring EPS worker', enrolledCourses: [{ title: 'EPS-TOPIK' }] });
  });

  test('TC-USER-10 updates allowed profile fields only [FR-012]', async () => {
    const student = await createStudent();

    const res = await api().put('/api/users/profile').set(authHeader(student)).send({
      name: 'Nimali P.', phone: '+94771234567', location: 'Gampaha', role: 'admin', email: 'hijack@example.com',
    });
    const stored = await User.findById(student._id);

    expect(res.status).toBe(200);
    expect(stored).toMatchObject({ name: 'Nimali P.', phone: '+94771234567', location: 'Gampaha', role: 'student' });
    expect(stored.email).not.toBe('hijack@example.com');
  });

  test('TC-USER-11 rejects invalid profile values [FR-012]', async () => {
    const res = await api().put('/api/users/profile').set(authHeader(await createStudent())).send({ phone: '123' });

    expect(res.status).toBe(400);
  });

  test('TC-USER-12 saves notification and privacy preferences [FR-012]', async () => {
    const student = await createStudent();

    const notifications = await api().put('/api/users/notifications').set(authHeader(student)).send({ notifications: { marketingEmails: true } });
    const privacy = await api().put('/api/users/privacy').set(authHeader(student)).send({ privacy: { profileVisibility: 'private' } });

    expect(notifications.body.notifications.marketingEmails).toBe(true);
    expect(privacy.body.privacy.profileVisibility).toBe('private');
  });

  test('TC-USER-13 uploads an avatar as JSON data or as a multipart image and removes it [FR-012]', async () => {
    const student = await createStudent();

    const json = await api().post('/api/users/avatar').set(authHeader(student)).send({ avatar: 'data:image/png;base64,AAAA' });
    const multipart = await api().post('/api/users/avatar').set(authHeader(student)).attach('avatar', PNG, { filename: 'me.png', contentType: 'image/png' });
    const removed = await api().delete('/api/users/avatar').set(authHeader(student));

    expect(json.body.avatar).toBe('data:image/png;base64,AAAA');
    expect(multipart.body.avatar).toBe(`data:image/png;base64,${PNG.toString('base64')}`);
    expect(removed.body.avatar).toBeNull();
    expect((await User.findById(student._id)).avatar).toBeNull();
  });

  test('TC-USER-14 rejects an avatar request without a photo or with a non-image file [FR-012]', async () => {
    const student = await createStudent();

    const empty = await api().post('/api/users/avatar').set(authHeader(student)).send({});
    const notImage = await api().post('/api/users/avatar').set(authHeader(student)).attach('avatar', Buffer.from('text'), { filename: 'a.txt', contentType: 'text/plain' });

    expect(empty.status).toBe(400);
    expect(notImage.status).toBe(400);
  });

  test('TC-USER-15 changes the password only with the correct current password [FR-012]', async () => {
    const student = await createStudent({ email: 'pw@example.com' });

    const wrong = await api().put('/api/users/password').set(authHeader(student)).send({ currentPassword: 'nope', newPassword: 'NewPassword1' });
    const short = await api().put('/api/users/password').set(authHeader(student)).send({ currentPassword: DEFAULT_PASSWORD, newPassword: '123' });
    const missing = await api().put('/api/users/password').set(authHeader(student)).send({});
    const ok = await api().put('/api/users/password').set(authHeader(student)).send({ currentPassword: DEFAULT_PASSWORD, newPassword: 'NewPassword1' });
    const relogin = await api().post('/api/auth/login').send({ email: 'pw@example.com', password: 'NewPassword1' });

    expect(wrong.status).toBe(400);
    expect(short.status).toBe(400);
    expect(missing.status).toBe(400);
    expect(ok.status).toBe(200);
    expect(relogin.status).toBe(200);
  });
});

describe('Administrative user management', () => {
  test('TC-USER-16 lists users and filters by role and search text [FR-009]', async () => {
    const admin = await createAdmin();
    await createStudent({ name: 'Nimali Perera', email: 'nimali@example.com' });
    await createStudent({ name: 'Kamal Silva', email: 'kamal@example.com' });

    const all = await api().get('/api/users').set(authHeader(admin));
    const students = await api().get('/api/users?role=Student').set(authHeader(admin));
    const search = await api().get('/api/users?search=nimali').set(authHeader(admin));
    const regexChars = await api().get('/api/users?search=(').set(authHeader(admin));

    expect(all.body.count).toBe(3);
    expect(students.body.count).toBe(2);
    expect(search.body.data.map((u) => u.name)).toEqual(['Nimali Perera']);
    expect(regexChars.status).toBe(200);
    expect(JSON.stringify(all.body)).not.toMatch(/\$2[aby]\$/);
  });

  test('TC-USER-17 creates a user with a chosen role [FR-009]', async () => {
    const admin = await createAdmin();

    const res = await api().post('/api/users').set(authHeader(admin)).send({ name: 'New Teacher', email: 'teacher@example.com', password: 'Teacher123', role: 'Instructor' });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ role: 'instructor', isActive: true });
  });

  test('TC-USER-18 rejects a user without name or email and a duplicate email [FR-009]', async () => {
    const admin = await createAdmin();
    await createStudent({ email: 'taken@example.com' });

    expect((await api().post('/api/users').set(authHeader(admin)).send({ name: 'No Email' })).status).toBe(400);
    expect((await api().post('/api/users').set(authHeader(admin)).send({ name: 'Dup', email: 'taken@example.com' })).status).toBe(400);
  });

  test('TC-USER-19 updates role, name, email and active state with PUT and PATCH [FR-009]', async () => {
    const admin = await createAdmin();
    const student = await createStudent();

    const put = await api().put(`/api/users/${student._id}`).set(authHeader(admin)).send({ role: 'Instructor', name: 'Renamed', email: 'renamed@example.com' });
    const patch = await api().patch(`/api/users/${student._id}`).set(authHeader(admin)).send({ isActive: false });
    const invalidRole = await api().patch(`/api/users/${student._id}`).set(authHeader(admin)).send({ role: 'superuser' });
    const invalidRolePut = await api().put(`/api/users/${student._id}`).set(authHeader(admin)).send({ role: 'superuser' });
    const missing = await api().put('/api/users/64b7f0a0a0a0a0a0a0a0a0a0').set(authHeader(admin)).send({ name: 'x' });
    const missingPatch = await api().patch('/api/users/64b7f0a0a0a0a0a0a0a0a0a0').set(authHeader(admin)).send({ name: 'x' });

    expect(put.body.data).toMatchObject({ role: 'instructor', name: 'Renamed', email: 'renamed@example.com' });
    expect(patch.body.data.isActive).toBe(false);
    expect(invalidRole.status).toBe(400);
    expect(invalidRolePut.status).toBe(400);
    expect(missing.status).toBe(404);
    expect(missingPatch.status).toBe(404);
  });

  test('TC-USER-20 deletes a user [FR-009]', async () => {
    const admin = await createAdmin();
    const student = await createStudent();

    const res = await api().delete(`/api/users/${student._id}`).set(authHeader(admin));
    const again = await api().delete(`/api/users/${student._id}`).set(authHeader(admin));

    expect(res.status).toBe(200);
    expect(again.status).toBe(404);
    expect(await User.findById(student._id)).toBeNull();
  });

  test('TC-USER-21 deactivating a user immediately blocks their existing session [FR-009]', async () => {
    const admin = await createAdmin();
    const student = await createStudent();
    const session = authHeader(student);

    await api().patch(`/api/users/${student._id}`).set(authHeader(admin)).send({ isActive: false });
    const res = await api().get('/api/users/profile').set(session);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Account is deactivated');
  });

  // An administrator who leaves the password blank creates an account protected by
  // the well-known password "123456".
  test.failing('TC-USER-22 [KNOWN DEFECT DEF-11] refuses to create an account without a password [OWASP-A07]', async () => {
    const admin = await createAdmin();

    const res = await api().post('/api/users').set(authHeader(admin)).send({ name: 'No Password', email: 'nopass@example.com' });

    expect(res.status).toBe(400);
  });

  // A malformed id reaches Mongoose and surfaces as a CastError (HTTP 500).
  test.failing('TC-USER-23 [KNOWN DEFECT DEF-10] answers 400 or 404 for a malformed user id [NFR-002]', async () => {
    const admin = await createAdmin();

    const res = await api().put('/api/users/not-an-id').set(authHeader(admin)).send({ name: 'x' });

    expect([400, 404]).toContain(res.status);
  });

  test('TC-USER-24 answers 500 when a user-management query fails [NFR-002]', async () => {
    const admin = await createAdmin();
    const header = authHeader(admin);
    jest.spyOn(User, 'find').mockImplementation(() => { throw new Error('boom'); });

    expect((await api().get('/api/users').set(header)).status).toBe(500);
  });
});
