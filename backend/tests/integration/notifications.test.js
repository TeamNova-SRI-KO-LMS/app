const Notification = require('../../models/Notification');
const {
  api, createStudent, createAdmin, createInstructor, createCourse, createNotification, authHeader,
} = require('../helpers/factories');

describe('User notifications', () => {
  test('TC-NOT-01 lists the notifications addressed to the user [FR-017]', async () => {
    const student = await createStudent();
    await createNotification({ title: 'For all' });
    await createNotification({ title: 'For students', targetAudience: 'students' });
    await createNotification({ title: 'For admins', targetAudience: 'admins' });

    const res = await api().get('/api/notifications').set(authHeader(student));

    expect(res.status).toBe(200);
    expect(res.body.notifications.map((n) => n.title).sort()).toEqual(['For all', 'For students']);
  });

  test('TC-NOT-02 counts unread notifications and marks them all read [FR-017]', async () => {
    const student = await createStudent();
    await createNotification({ title: 'One' });
    await createNotification({ title: 'Two', targetUsers: [student._id], targetAudience: 'specific_users' });
    await createNotification({ title: 'Expired', expiresAt: new Date(Date.now() - 1000) });

    const before = await api().get('/api/notifications/unread-count').set(authHeader(student));
    const marked = await api().post('/api/notifications/mark-all-read').set(authHeader(student));
    const after = await api().get('/api/notifications/unread-count').set(authHeader(student));

    expect(before.body.count).toBe(2);
    expect(marked.body).toMatchObject({ count: 2, message: 'Marked 2 notifications as read' });
    expect(after.body.count).toBe(0);
  });

  test('TC-NOT-03 marks one notification read, records a click and reads its details [FR-017]', async () => {
    const student = await createStudent();
    const notification = await createNotification({ title: 'Live class' });

    const read = await api().post(`/api/notifications/${notification._id}/read`).set(authHeader(student));
    const click = await api().post(`/api/notifications/${notification._id}/click`).set(authHeader(await createStudent()));
    const detail = await api().get(`/api/notifications/${notification._id}`).set(authHeader(student));
    const stored = await Notification.findById(notification._id);

    expect(read.status).toBe(200);
    expect(click.status).toBe(200);
    expect(detail.body.notification.title).toBe('Live class');
    expect(stored.readBy).toHaveLength(2);
    expect(stored.deliveryStats.totalClicked).toBe(1);
  });

  test('TC-NOT-04 answers 404 for an unknown notification [FR-017]', async () => {
    const student = await createStudent();
    const missing = '64b7f0a0a0a0a0a0a0a0a0a0';

    expect((await api().get(`/api/notifications/${missing}`).set(authHeader(student))).status).toBe(404);
    expect((await api().post(`/api/notifications/${missing}/read`).set(authHeader(student))).status).toBe(404);
    expect((await api().post(`/api/notifications/${missing}/click`).set(authHeader(student))).status).toBe(404);
  });
});

describe('Administrative notification management', () => {
  test('TC-NOT-05 creates a notification and normalizes free-text type, priority and audience [FR-017]', async () => {
    const admin = await createAdmin();

    const res = await api().post('/api/notifications').set(authHeader(admin)).send({
      title: 'Exam week', message: 'TOPIK mock exams start Monday', type: 'Course Alert', priority: 'normal', targetAudience: 'Scholars',
      expiresAt: '2000-01-01', parentNotification: { isParentNotification: true, studentId: '64b7f0a0a0a0a0a0a0a0a0a0', parentId: 'short' },
    });

    expect(res.status).toBe(201);
    expect(res.body.notification).toMatchObject({ type: 'course_update', priority: 'medium', targetAudience: 'students' });
    expect(new Date(res.body.notification.expiresAt).getTime()).toBeGreaterThan(Date.now() + 29 * 24 * 60 * 60 * 1000);
    expect(res.body.notification.parentNotification).toEqual({ isParentNotification: true, studentId: '64b7f0a0a0a0a0a0a0a0a0a0' });
  });

  test('TC-NOT-06 maps other audience and type spellings [FR-017]', async () => {
    const admin = await createAdmin();
    const post = (body) => api().post('/api/notifications').set(authHeader(admin)).send({ title: 't', message: 'm', ...body });

    expect((await post({ targetAudience: 'Teachers', type: 'Event Reminder' })).body.notification).toMatchObject({ targetAudience: 'instructors', type: 'other' });
    expect((await post({ targetAudience: 'admins only', type: 'System Update', priority: 'shouting' })).body.notification).toMatchObject({ targetAudience: 'admins', type: 'system', priority: 'medium' });
    expect((await post({ targetAudience: 'everyone', type: 'weird' })).body.notification).toMatchObject({ targetAudience: 'all', type: 'system' });
    expect((await post({ targetAudience: 'Students Only' })).body.notification.targetAudience).toBe('students');
    expect((await post({ targetAudience: 'martians' })).body.notification.targetAudience).toBe('all');
  });

  test('TC-NOT-07 requires a title and message [FR-017]', async () => {
    const res = await api().post('/api/notifications').set(authHeader(await createAdmin())).send({ title: 'only title' });

    expect(res.status).toBe(400);
  });

  test('TC-NOT-08 lists all notifications with filters and reports statistics [FR-017]', async () => {
    const admin = await createAdmin();
    await createNotification({ title: 'Pinned payment', type: 'payment_due', isPinned: true });
    await createNotification({ title: 'Inactive', isActive: false });

    const all = await api().get('/api/notifications/all?type=payment_due&isPinned=true&isActive=true').set(authHeader(admin));
    const stats = await api().get('/api/notifications/stats').set(authHeader(admin));

    expect(all.body.notifications.map((n) => n.title)).toEqual(['Pinned payment']);
    expect(stats.body.stats).toMatchObject({ total: 2, active: 1, pinned: 1 });
  });

  test('TC-NOT-09 updates, pins, toggles and deletes a notification [FR-017]', async () => {
    const admin = await createAdmin();
    const notification = await createNotification({ title: 'Draft' });
    const id = notification._id;

    const updated = await api().put(`/api/notifications/${id}`).set(authHeader(admin)).send({
      title: 'Final', message: 'Updated text', type: 'message', priority: 'high', targetAudience: 'students', targetUsers: [], targetRoles: ['student'],
      targetCourses: [], isActive: true, isPinned: false, scheduledFor: '2026-10-21', expiresAt: '2026-12-31', actionUrl: '/courses',
      actionText: 'Open', tags: ['exam'], koreanTitle: '시험', koreanMessage: '안내', parentNotification: { isParentNotification: false },
    });
    const pinned = await api().put(`/api/notifications/${id}/pin`).set(authHeader(admin));
    const toggled = await api().put(`/api/notifications/${id}/toggle`).set(authHeader(admin));
    const deleted = await api().delete(`/api/notifications/${id}`).set(authHeader(admin));

    expect(updated.body.notification).toMatchObject({ title: 'Final', priority: 'high', koreanTitle: '시험' });
    expect(pinned.body.notification.isPinned).toBe(true);
    expect(toggled.body.notification.isActive).toBe(false);
    expect(deleted.status).toBe(200);
    expect(await Notification.countDocuments()).toBe(0);
  });

  test('TC-NOT-10 answers 404 when managing an unknown notification [FR-017]', async () => {
    const admin = await createAdmin();
    const missing = '64b7f0a0a0a0a0a0a0a0a0a0';

    expect((await api().put(`/api/notifications/${missing}`).set(authHeader(admin)).send({ title: 'x' })).status).toBe(404);
    expect((await api().put(`/api/notifications/${missing}/pin`).set(authHeader(admin))).status).toBe(404);
    expect((await api().put(`/api/notifications/${missing}/toggle`).set(authHeader(admin))).status).toBe(404);
    expect((await api().delete(`/api/notifications/${missing}`).set(authHeader(admin))).status).toBe(404);
  });

  test('TC-NOT-11 finds target users and courses for addressing a notification [FR-017]', async () => {
    const admin = await createAdmin();
    await createStudent({ name: 'Nimali Perera' });
    await createInstructor({ name: 'Ms. Lee' });
    const course = await createCourse({ title: 'TOPIK I' });

    const students = await api().get('/api/notifications/target-users?role=student&search=nimali').set(authHeader(admin));
    const oneCourse = await api().get(`/api/notifications/target-users?courseId=${course._id}`).set(authHeader(admin));

    expect(students.body.users.map((u) => u.name)).toEqual(['Nimali Perera']);
    expect(students.body.courses.map((c) => c.title)).toEqual(['TOPIK I']);
    expect(oneCourse.body.courses.title).toBe('TOPIK I');
  });

  test('TC-NOT-12 sends notifications to selected students and their parents [FR-017]', async () => {
    const admin = await createAdmin();
    const student = await createStudent();
    const notificationData = { title: 'Fee reminder', message: 'Please settle the October fee' };

    const toUsers = await api().post('/api/notifications/send-to-users').set(authHeader(admin)).send({ notificationData, userIds: [student._id] });
    const toParents = await api().post('/api/notifications/send-to-parents').set(authHeader(admin)).send({ notificationData, studentIds: [student._id] });
    const missingUsers = await api().post('/api/notifications/send-to-users').set(authHeader(admin)).send({ notificationData, userIds: [] });
    const missingStudents = await api().post('/api/notifications/send-to-parents').set(authHeader(admin)).send({ notificationData });

    expect(toUsers.status).toBe(201);
    expect(toUsers.body.message).toBe('Notification sent to 1 users');
    expect(toParents.body.notification.parentNotification.isParentNotification).toBe(true);
    expect(missingUsers.status).toBe(400);
    expect(missingStudents.status).toBe(400);
  });

  // Any signed-in user can read any notification by id, including ones addressed
  // to another student.
  test.failing('TC-NOT-13 [KNOWN DEFECT DEF-09] hides notifications addressed to other users [OWASP-A01]', async () => {
    const owner = await createStudent();
    const private_ = await createNotification({ title: 'Your fee is overdue', targetAudience: 'specific_users', targetUsers: [owner._id] });

    const res = await api().get(`/api/notifications/${private_._id}`).set(authHeader(await createStudent()));

    expect([403, 404]).toContain(res.status);
  });

  test('TC-NOT-14 answers 500 when the notification store fails [NFR-002]', async () => {
    const student = await createStudent();
    const header = authHeader(student);
    jest.spyOn(Notification, 'getActiveNotifications').mockRejectedValue(new Error('boom'));
    jest.spyOn(Notification, 'countDocuments').mockRejectedValue(new Error('boom'));

    expect((await api().get('/api/notifications').set(header)).status).toBe(500);
    expect((await api().get('/api/notifications/unread-count').set(header)).status).toBe(500);
  });
});
