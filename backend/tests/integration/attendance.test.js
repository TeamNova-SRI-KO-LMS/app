const Attendance = require('../../models/Attendance');
const {
  api, createStudent, createAdmin, createCourse, enrol, createAttendance, authHeader,
} = require('../helpers/factories');

const day = (iso) => new Date(`${iso}T00:00:00.000Z`);

beforeEach(async () => {
  await Attendance.init();
});

describe('Student attendance', () => {
  test('TC-ATT-01 records attendance for a chosen day and course [FR-015]', async () => {
    const student = await createStudent();
    const course = await createCourse({ title: 'Korean for Beginners' });
    await enrol(student, course);

    const res = await api().post('/api/attendance').set(authHeader(student)).send({ courseId: course._id, date: '2026-10-20', status: 'Present', notes: 'On time' });

    expect(res.status).toBe(200);
    expect(res.body.record).toMatchObject({ status: 'present', notes: 'On time', course: { title: 'Korean for Beginners' } });
    expect(res.body.record.date).toBe('2026-10-20T00:00:00.000Z');
  });

  test('TC-ATT-02 re-marking a day updates the existing record [FR-015]', async () => {
    const student = await createStudent();
    const course = await createCourse();
    await enrol(student, course);
    const mark = (status) => api().post('/api/attendance').set(authHeader(student)).send({ courseId: course._id, date: '2026-10-20', status });

    await mark('present');
    const res = await mark('late');

    expect(res.body.record.status).toBe('late');
    expect(await Attendance.countDocuments()).toBe(1);
  });

  test('TC-ATT-03 validates status, date and course [FR-015]', async () => {
    const student = await createStudent();
    const course = await createCourse();
    await enrol(student, course);
    const post = (body) => api().post('/api/attendance').set(authHeader(student)).send(body);

    expect((await post({ courseId: course._id, status: 'away' })).status).toBe(400);
    expect((await post({ courseId: course._id, status: 'present', date: '20/10/2026' })).status).toBe(400);
    expect((await post({ courseId: 'nope', status: 'present' })).status).toBe(400);
    expect((await post({ courseId: '64b7f0a0a0a0a0a0a0a0a0a0', status: 'present' })).status).toBe(404);
  });

  test('TC-ATT-04 defaults to today when no date is given [FR-015]', async () => {
    const student = await createStudent();
    const course = await createCourse();
    await enrol(student, course);

    const res = await api().post('/api/attendance').set(authHeader(student)).send({ courseId: course._id, status: 'present' });

    expect(res.body.record.date.slice(0, 10)).toBe(new Date().toISOString().slice(0, 10));
  });

  // The handler checks only that the course exists, so a student can add attendance to
  // any course and distort the administrators' reports.
  test.failing('TC-ATT-18 [KNOWN DEFECT DEF-21] refuses attendance for a course the student is not enrolled in [FR-015][OWASP-A01]', async () => {
    const student = await createStudent();
    const course = await createCourse();

    const res = await api().post('/api/attendance').set(authHeader(student)).send({ courseId: course._id, date: '2026-10-20', status: 'present' });

    expect(res.status).toBe(403);
    expect(await Attendance.countDocuments()).toBe(0);
  });

  test('TC-ATT-05 returns the student\'s history with statistics [FR-015]', async () => {
    const student = await createStudent();
    const course = await createCourse();
    await createAttendance({ student: student._id, course: course._id, status: 'present', date: day('2026-10-01') });
    await createAttendance({ student: student._id, course: course._id, status: 'absent', date: day('2026-10-02') });
    await createAttendance({ student: (await createStudent())._id, course: course._id, date: day('2026-10-01') });

    const res = await api().get('/api/attendance/my-attendance').set(authHeader(student));

    expect(res.body.stats).toMatchObject({ totalSessions: 2, present: 1, absent: 1, attendanceRate: 50 });
    expect(res.body.records.map((r) => r.status)).toEqual(['absent', 'present']);
  });

  test('TC-ATT-06 returns one month for the calendar, optionally for one course [FR-015]', async () => {
    const student = await createStudent();
    const courseA = await createCourse();
    const courseB = await createCourse();
    await createAttendance({ student: student._id, course: courseA._id, date: day('2026-10-01') });
    await createAttendance({ student: student._id, course: courseB._id, date: day('2026-10-31') });
    await createAttendance({ student: student._id, course: courseA._id, date: day('2026-11-01') });

    const october = await api().get('/api/attendance/monthly?year=2026&month=10').set(authHeader(student));
    const oneCourse = await api().get(`/api/attendance/monthly?year=2026&month=10&courseId=${courseA._id}`).set(authHeader(student));
    const badMonth = await api().get('/api/attendance/monthly?year=2026&month=13').set(authHeader(student));
    const badCourse = await api().get('/api/attendance/monthly?courseId=xyz').set(authHeader(student));

    expect(october.body.records).toHaveLength(2);
    expect(oneCourse.body.records).toHaveLength(1);
    expect(badMonth.status).toBe(400);
    expect(badCourse.status).toBe(400);
  });

  test('TC-ATT-07 lists courses the student is enrolled in or has attendance for [FR-015]', async () => {
    const student = await createStudent();
    const enrolled = await createCourse({ title: 'B enrolled' });
    const attended = await createCourse({ title: 'A attended' });
    await enrol(student, enrolled);
    await createAttendance({ student: student._id, course: attended._id });

    const res = await api().get('/api/attendance/enrolled-courses').set(authHeader(student));

    expect(res.body.courses.map((c) => c.title)).toEqual(['A attended', 'B enrolled']);
  });

  test('TC-ATT-08 lets a student edit and delete only their own records [FR-015][OWASP-A01]', async () => {
    const owner = await createStudent();
    const other = await createStudent();
    const course = await createCourse();
    const record = await createAttendance({ student: owner._id, course: course._id, date: day('2026-10-01') });

    const foreignEdit = await api().put(`/api/attendance/${record._id}`).set(authHeader(other)).send({ status: 'absent' });
    const foreignDelete = await api().delete(`/api/attendance/${record._id}`).set(authHeader(other));
    const edit = await api().put(`/api/attendance/${record._id}`).set(authHeader(owner)).send({ status: 'Excused', notes: 'Clinic', date: '2026-10-03' });
    const remove = await api().delete(`/api/attendance/${record._id}`).set(authHeader(owner));

    expect(foreignEdit.status).toBe(403);
    expect(foreignDelete.status).toBe(403);
    expect(edit.body.record).toMatchObject({ status: 'excused', notes: 'Clinic', date: '2026-10-03T00:00:00.000Z' });
    expect(remove.status).toBe(200);
  });

  test('TC-ATT-09 validates edits and reports missing records and clashing days [FR-015]', async () => {
    const owner = await createStudent();
    const course = await createCourse();
    const first = await createAttendance({ student: owner._id, course: course._id, date: day('2026-10-01') });
    await createAttendance({ student: owner._id, course: course._id, date: day('2026-10-02') });
    const put = (id, body) => api().put(`/api/attendance/${id}`).set(authHeader(owner)).send(body);

    expect((await put(first._id, { status: 'gone' })).status).toBe(400);
    expect((await put(first._id, { date: 'yesterday' })).status).toBe(400);
    expect((await put(first._id, { date: '2026-10-02' })).status).toBe(409);
    expect((await put('64b7f0a0a0a0a0a0a0a0a0a0', { status: 'late' })).status).toBe(404);
    expect((await put('not-an-id', { status: 'late' })).status).toBe(404);
    expect((await api().delete('/api/attendance/not-an-id').set(authHeader(owner))).status).toBe(404);
  });
});

describe('Administrative attendance monitoring', () => {
  const seed = async () => {
    const admin = await createAdmin();
    const nimali = await createStudent({ name: 'Nimali Perera', email: 'nimali@example.com' });
    const kamal = await createStudent({ name: 'Kamal Silva', email: 'kamal@example.com' });
    const beginners = await createCourse({ title: 'Korean for Beginners' });
    const business = await createCourse({ title: 'Business Korean' });
    const rows = [
      [nimali, beginners, 'present', '2026-10-01'],
      [nimali, beginners, 'present', '2026-10-02'],
      [nimali, business, 'late', '2026-10-02'],
      [kamal, beginners, 'absent', '2026-10-01'],
      [kamal, beginners, 'excused', '2026-10-02'],
      [kamal, business, 'present', '2026-09-20'],
    ];
    for (const [student, course, status, date] of rows) {
      await createAttendance({ student: student._id, course: course._id, status, date: day(date), notes: status === 'absent' ? '=HYPERLINK("x")' : '' });
    }
    return { admin, nimali, kamal, beginners, business };
  };

  test('TC-ATT-10 summarizes totals, today, per-course figures and a daily trend [FR-015][FR-008]', async () => {
    const { admin } = await seed();

    const res = await api().get('/api/attendance/admin/overview?from=2026-10-01&to=2026-10-02&today=2026-10-02').set(authHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body.totals).toMatchObject({ totalSessions: 5, present: 2, late: 1, absent: 1, excused: 1, attendanceRate: 40, studentsTracked: 2, coursesTracked: 2 });
    expect(res.body.today).toMatchObject({ date: '2026-10-02', totalSessions: 3 });
    expect(res.body.previous).toMatchObject({ from: '2026-09-29', to: '2026-09-30', totalSessions: 0 });
    expect(res.body.courseBreakdown[0]).toMatchObject({ title: 'Korean for Beginners', totalSessions: 4, attendanceRate: 50 });
    expect(res.body.trend.days).toEqual([
      { date: '2026-10-01', totalSessions: 2, present: 1, late: 0, excused: 0, absent: 1 },
      { date: '2026-10-02', totalSessions: 3, present: 1, late: 1, excused: 1, absent: 0 },
    ]);
  });

  test('TC-ATT-11 limits the trend to the last 30 days when no range is selected [FR-015]', async () => {
    const { admin } = await seed();

    const res = await api().get('/api/attendance/admin/overview?today=2026-10-02').set(authHeader(admin));

    expect(res.body.trend.days).toHaveLength(30);
    expect(res.body.trend).toMatchObject({ from: '2026-09-03', to: '2026-10-02' });
    expect(res.body.previous).toBeNull();
  });

  test('TC-ATT-12 pages through records with filters and sorting [FR-015]', async () => {
    const { admin, kamal } = await seed();

    const page = await api().get('/api/attendance/admin/records?limit=2&page=2&sort=date_asc').set(authHeader(admin));
    const absent = await api().get('/api/attendance/admin/records?status=absent').set(authHeader(admin));
    const bySearch = await api().get('/api/attendance/admin/records?search=kamal').set(authHeader(admin));
    const byStudent = await api().get(`/api/attendance/admin/records?studentId=${kamal._id}&sort=updated_desc`).set(authHeader(admin));

    expect(page.body.pagination).toEqual({ page: 2, limit: 2, total: 6, pages: 3 });
    expect(absent.body.records).toHaveLength(1);
    expect(absent.body.records[0].student.name).toBe('Kamal Silva');
    expect(bySearch.body.pagination.total).toBe(3);
    expect(byStudent.body.pagination.total).toBe(3);
  });

  test('TC-ATT-13 rejects invalid filter values with 400 [FR-015]', async () => {
    const { admin } = await seed();
    const get = (query) => api().get(`/api/attendance/admin/records?${query}`).set(authHeader(admin));

    expect((await get('from=yesterday')).status).toBe(400);
    expect((await get('from=2026-10-05&to=2026-10-01')).status).toBe(400);
    expect((await get('courseId=abc')).status).toBe(400);
    expect((await get('studentId=abc')).status).toBe(400);
    expect((await get('status=asleep')).status).toBe(400);
  });

  test('TC-ATT-14 ranks students by attendance rate and supports other sort orders [FR-015][FR-008]', async () => {
    const { admin, business } = await seed();

    const lowest = await api().get('/api/attendance/admin/students').set(authHeader(admin));
    const byName = await api().get('/api/attendance/admin/students?sort=name_asc').set(authHeader(admin));
    const oneCourse = await api().get(`/api/attendance/admin/students?courseId=${business._id}&sort=rate_desc`).set(authHeader(admin));

    expect(lowest.body.students[0]).toMatchObject({ name: 'Kamal Silva', totalSessions: 3, attendanceRate: 33 });
    expect(byName.body.students.map((s) => s.name)).toEqual(['Kamal Silva', 'Nimali Perera']);
    expect(oneCourse.body.students[0]).toMatchObject({ name: 'Kamal Silva', attendanceRate: 100 });
  });

  test('TC-ATT-15 exports CSV with a UTF-8 BOM and neutralized spreadsheet formulas [FR-015][OWASP-A03]', async () => {
    const { admin } = await seed();

    const res = await api().get('/api/attendance/admin/export?status=absent').set(authHeader(admin));

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(res.headers['content-disposition']).toMatch(/^attachment; filename="attendance-\d{4}-\d{2}-\d{2}\.csv"$/);
    expect(res.text.charCodeAt(0)).toBe(0xfeff);
    expect(res.text).toContain('"Date","Student","Email","Course","Status","Notes"');
    expect(res.text).toContain(`"'=HYPERLINK(""x"")"`);
  });

  test('TC-ATT-16 students cannot reach the administrative reports [FR-015][OWASP-A01]', async () => {
    const student = await createStudent();

    expect((await api().get('/api/attendance/admin/overview').set(authHeader(student))).status).toBe(403);
    expect((await api().get('/api/attendance/admin/export').set(authHeader(student))).status).toBe(403);
  });

  test('TC-ATT-17 answers 500 when an attendance report query fails [NFR-002]', async () => {
    const admin = await createAdmin();
    const header = authHeader(admin);
    jest.spyOn(Attendance, 'countDocuments').mockImplementation(() => { throw new Error('boom'); });

    expect((await api().get('/api/attendance/admin/records').set(header)).status).toBe(500);
  });
});
