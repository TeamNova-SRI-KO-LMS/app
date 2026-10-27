const Course = require('../../models/Course');
const Progress = require('../../models/Progress');
const User = require('../../models/User');
const {
  api, createStudent, createAdmin, createInstructor, createCourse, enrol, createPayment, authHeader,
} = require('../helpers/factories');

describe('Public course catalogue', () => {
  test('TC-CRS-01 lists courses with pagination metadata [FR-003]', async () => {
    for (let i = 0; i < 12; i += 1) {
      await createCourse({ title: `Course ${String(i).padStart(2, '0')}` });
    }

    const page1 = await api().get('/api/courses?limit=5');
    const page3 = await api().get('/api/courses?limit=5&page=3');

    expect(page1.status).toBe(200);
    expect(page1.body).toMatchObject({ success: true, count: 5, total: 12, page: 1, pages: 3 });
    expect(page3.body.count).toBe(2);
  });

  test('TC-CRS-02 filters by publication state, category and level [FR-003]', async () => {
    await createCourse({ title: 'Published Beginner' });
    await createCourse({ title: 'Draft', isPublished: false });
    await createCourse({ title: 'Business Advanced', category: 'Business', level: 'advanced' });

    const published = await api().get('/api/courses?published=true');
    const business = await api().get('/api/courses?category=Business&level=advanced');

    expect(published.body.courses.map((c) => c.title).sort()).toEqual(['Business Advanced', 'Published Beginner']);
    expect(business.body.courses.map((c) => c.title)).toEqual(['Business Advanced']);
  });

  test('TC-CRS-03 searches titles case-insensitively and treats symbols literally [FR-003]', async () => {
    await createCourse({ title: 'Korean (TOPIK I) Preparation' });
    await createCourse({ title: 'Conversation Club' });

    const res = await api().get('/api/courses?search=(topik');

    expect(res.status).toBe(200);
    expect(res.body.courses.map((c) => c.title)).toEqual(['Korean (TOPIK I) Preparation']);
  });

  test('TC-CRS-04 returns one course with its instructor and reviews [FR-003]', async () => {
    const instructor = await createInstructor({ name: 'Ms. Lee' });
    const course = await createCourse({ instructor: instructor._id });

    const res = await api().get(`/api/courses/${course._id}`);
    const missing = await api().get('/api/courses/64b7f0a0a0a0a0a0a0a0a0a0');

    expect(res.status).toBe(200);
    expect(res.body.course.instructor.name).toBe('Ms. Lee');
    expect(missing.status).toBe(404);
  });

  test('TC-CRS-05 answers 500 when the catalogue query fails [NFR-002]', async () => {
    jest.spyOn(Course, 'find').mockImplementation(() => { throw new Error('boom'); });

    expect((await api().get('/api/courses')).status).toBe(500);
  });
});

describe('Enrolment', () => {
  test('TC-CRS-06 enrols a student in a free course and creates progress [FR-004]', async () => {
    const student = await createStudent();
    const course = await createCourse({ price: 0 });

    const res = await api().post(`/api/courses/${course._id}/enroll`).set(authHeader(student));

    expect(res.status).toBe(200);
    expect(res.body.course).toMatchObject({ title: course.title, progress: 0 });
    expect(await Progress.countDocuments({ student: student._id, course: course._id })).toBe(1);
    expect((await User.findById(student._id)).enrolledCourses.map(String)).toEqual([course._id.toString()]);
    expect((await Course.findById(course._id)).enrolledStudents.map(String)).toEqual([student._id.toString()]);
  });

  test('TC-CRS-07 requires payment before enrolling in a paid course [FR-004][FR-011]', async () => {
    const student = await createStudent();
    const course = await createCourse({ price: 15000 });

    const res = await api().post(`/api/courses/${course._id}/enroll`).set(authHeader(student));

    expect(res.status).toBe(402);
    expect(res.body).toMatchObject({ success: false, requiresPayment: true });
  });

  test('TC-CRS-08 enrols in a paid course once a completed payment exists [FR-004][FR-011]', async () => {
    const student = await createStudent();
    const course = await createCourse({ price: 15000 });
    await createPayment({ user: student._id, course: course._id, status: 'completed' });

    const res = await api().post(`/api/courses/${course._id}/enroll`).set(authHeader(student));

    expect(res.status).toBe(200);
  });

  test('TC-CRS-09 rejects enrolment in an unpublished course, a second enrolment and an unknown course [FR-004]', async () => {
    const student = await createStudent();
    const draft = await createCourse({ isPublished: false });
    const course = await createCourse();
    await enrol(student, course);

    const unpublished = await api().post(`/api/courses/${draft._id}/enroll`).set(authHeader(student));
    const twice = await api().post(`/api/courses/${course._id}/enroll`).set(authHeader(student));
    const unknown = await api().post('/api/courses/64b7f0a0a0a0a0a0a0a0a0a0/enroll').set(authHeader(student));

    expect(unpublished.status).toBe(400);
    expect(twice.status).toBe(400);
    expect(twice.body.message).toBe('You are already enrolled in this course');
    expect(unknown.status).toBe(404);
  });

  test('TC-CRS-10 only students can enrol [FR-004]', async () => {
    const course = await createCourse();

    const asAdmin = await api().post(`/api/courses/${course._id}/enroll`).set(authHeader(await createAdmin()));
    const anonymous = await api().post(`/api/courses/${course._id}/enroll`);

    expect(asAdmin.status).toBe(403);
    expect(anonymous.status).toBe(401);
  });

  test('TC-CRS-11 lists the student\'s own courses [FR-005]', async () => {
    const student = await createStudent();
    const course = await createCourse({ title: 'Mine' });
    await createCourse({ title: 'Not mine' });
    await enrol(student, course);

    const res = await api().get('/api/courses/my-courses').set(authHeader(student));
    const none = await api().get('/api/courses/my-courses').set(authHeader(await createStudent()));

    expect(res.body.courses.map((c) => c.title)).toEqual(['Mine']);
    expect(none.body.courses).toEqual([]);
  });

  test('TC-CRS-12 unenrols a student and removes their progress [FR-004]', async () => {
    const student = await createStudent();
    const course = await createCourse();
    await enrol(student, course);

    const res = await api().delete(`/api/courses/${course._id}/enroll`).set(authHeader(student));
    const again = await api().delete(`/api/courses/${course._id}/enroll`).set(authHeader(student));

    expect(res.status).toBe(200);
    expect(again.status).toBe(400);
    expect(await Progress.countDocuments()).toBe(0);
    expect((await User.findById(student._id)).enrolledCourses).toHaveLength(0);
  });

  test('TC-CRS-13 marks an enrolled course complete once [FR-005]', async () => {
    const student = await createStudent();
    const course = await createCourse();
    await enrol(student, course);

    const first = await api().post(`/api/courses/${course._id}/complete`).set(authHeader(student));
    const second = await api().post(`/api/courses/${course._id}/complete`).set(authHeader(student));
    const notEnrolled = await api().post(`/api/courses/${course._id}/complete`).set(authHeader(await createStudent()));

    expect(first.status).toBe(200);
    expect(first.body.progress).toMatchObject({ isCompleted: true, overallProgress: 100 });
    expect(second.status).toBe(400);
    expect(notEnrolled.status).toBe(400);
  });
});

describe('Course reviews', () => {
  test('TC-CRS-14 adds one review per user and updates the average rating [FR-003]', async () => {
    const course = await createCourse();
    const first = await createStudent();
    const second = await createStudent();

    await api().post(`/api/courses/${course._id}/reviews`).set(authHeader(first)).send({ rating: 5, comment: 'Excellent' });
    const res = await api().post(`/api/courses/${course._id}/reviews`).set(authHeader(second)).send({ rating: 2 });
    const duplicate = await api().post(`/api/courses/${course._id}/reviews`).set(authHeader(first)).send({ rating: 1 });

    expect(res.status).toBe(200);
    expect(res.body.course.averageRating).toBe(3.5);
    expect(duplicate.status).toBe(400);
  });

  test('TC-CRS-15 validates the rating and requires sign-in [FR-003]', async () => {
    const course = await createCourse();

    expect((await api().post(`/api/courses/${course._id}/reviews`).set(authHeader(await createStudent())).send({ rating: 9 })).status).toBe(400);
    expect((await api().post(`/api/courses/${course._id}/reviews`).send({ rating: 5 })).status).toBe(401);
  });
});

describe('Administrative course management', () => {
  test('TC-CRS-16 lists all courses with publication and enrolment totals [FR-020][FR-009]', async () => {
    const admin = await createAdmin();
    const student = await createStudent();
    const course = await createCourse({ title: 'Published' });
    await createCourse({ title: 'Draft', isPublished: false, level: 'advanced' });
    await enrol(student, course);

    const res = await api().get('/api/courses/admin/all?status=Status&category=All Categories').set(authHeader(admin));
    const drafts = await api().get('/api/courses/admin/all?status=DRAFT&level=Advanced&search=dra').set(authHeader(admin));

    expect(res.body).toMatchObject({ total: 2, totalPublished: 1, totalDraft: 1, totalStudents: 1 });
    expect(drafts.body.courses.map((c) => c.title)).toEqual(['Draft']);
  });

  test('TC-CRS-17 creates a course with LKR pricing and the admin as instructor [FR-006]', async () => {
    const admin = await createAdmin();

    const res = await api().post('/api/courses/admin').set(authHeader(admin)).send({
      title: '  EPS-TOPIK Fast Track  ', description: 'Twelve weeks of EPS-TOPIK practice.', level: 'Intermediate', price: '25000',
    });

    expect(res.status).toBe(201);
    expect(res.body.course).toMatchObject({ title: 'EPS-TOPIK Fast Track', level: 'intermediate', price: 25000, duration: 4, isPublished: false });
    expect(res.body.course.instructor.name).toBe(admin.name);
  });

  test('TC-CRS-18 validates title, description and price on creation [FR-006]', async () => {
    const admin = await createAdmin();
    const post = (body) => api().post('/api/courses/admin').set(authHeader(admin)).send(body);

    expect((await post({ title: 'AB', description: 'Long enough description', price: 1 })).status).toBe(400);
    expect((await post({ title: 'Valid title', description: 'short', price: 1 })).status).toBe(400);
    expect((await post({ title: 'Valid title', description: 'Long enough description', price: 'free' })).status).toBe(400);
  });

  test('TC-CRS-19 updates only whitelisted fields [FR-006]', async () => {
    const admin = await createAdmin();
    const course = await createCourse({ price: 1000 });

    const res = await api().put(`/api/courses/admin/${course._id}`).set(authHeader(admin)).send({ price: '2500', level: 'ADVANCED', averageRating: 5 });

    expect(res.status).toBe(200);
    expect(res.body.course).toMatchObject({ price: 2500, level: 'advanced', averageRating: 0 });
  });

  test('TC-CRS-20 toggles publication and deletes a course [FR-006]', async () => {
    const admin = await createAdmin();
    const course = await createCourse({ isPublished: false });

    const published = await api().patch(`/api/courses/admin/${course._id}/toggle-publish`).set(authHeader(admin));
    const deleted = await api().delete(`/api/courses/admin/${course._id}`).set(authHeader(admin));
    const missing = await api().delete(`/api/courses/admin/${course._id}`).set(authHeader(admin));
    const missingToggle = await api().patch(`/api/courses/admin/${course._id}/toggle-publish`).set(authHeader(admin));
    const missingUpdate = await api().put(`/api/courses/admin/${course._id}`).set(authHeader(admin)).send({ price: 1 });

    expect(published.body).toMatchObject({ isPublished: true, message: 'Course published successfully' });
    expect(deleted.status).toBe(200);
    expect(missing.status).toBe(404);
    expect(missingToggle.status).toBe(404);
    expect(missingUpdate.status).toBe(404);
  });

  test('TC-CRS-21 students cannot use the administrative course endpoints [FR-009]', async () => {
    const student = await createStudent();

    expect((await api().get('/api/courses/admin/all').set(authHeader(student))).status).toBe(403);
    expect((await api().post('/api/courses/admin').set(authHeader(student)).send({})).status).toBe(403);
  });

  // Deleting a course does not remove the enrolments that reference it.
  test.failing('TC-CRS-22 [KNOWN DEFECT DEF-18] deleting a course removes its enrolment records [NFR-002]', async () => {
    const admin = await createAdmin();
    const student = await createStudent();
    const course = await createCourse();
    await enrol(student, course);

    await api().delete(`/api/courses/admin/${course._id}`).set(authHeader(admin));

    expect(await Progress.countDocuments({ course: course._id })).toBe(0);
    expect((await User.findById(student._id)).enrolledCourses).toHaveLength(0);
  });
});

describe('Instructor course management', () => {
  const valid = { title: 'Hangul Bootcamp', description: 'Read Korean in two weeks.', price: 5000, duration: 2 };

  test('TC-CRS-23 an instructor creates, updates and deletes their own course [FR-006]', async () => {
    const instructor = await createInstructor();

    const created = await api().post('/api/courses').set(authHeader(instructor)).send(valid);
    const id = created.body.course._id;
    const updated = await api().put(`/api/courses/${id}`).set(authHeader(instructor)).send({ price: 6000 });
    const deleted = await api().delete(`/api/courses/${id}`).set(authHeader(instructor));

    expect(created.status).toBe(201);
    expect(updated.body.course.price).toBe(6000);
    expect(deleted.status).toBe(200);
  });

  test('TC-CRS-24 an instructor cannot change another instructor\'s course [FR-006]', async () => {
    const owner = await createInstructor();
    const other = await createInstructor();
    const course = await createCourse({ instructor: owner._id });

    const update = await api().put(`/api/courses/${course._id}`).set(authHeader(other)).send({ price: 1 });
    const remove = await api().delete(`/api/courses/${course._id}`).set(authHeader(other));

    expect(update.status).toBe(403);
    expect(remove.status).toBe(403);
  });

  test('TC-CRS-25 validates instructor course input and refuses students [FR-006]', async () => {
    expect((await api().post('/api/courses').set(authHeader(await createInstructor())).send({ title: 'x' })).status).toBe(400);
    expect((await api().post('/api/courses').set(authHeader(await createStudent())).send(valid)).status).toBe(403);
  });
});
