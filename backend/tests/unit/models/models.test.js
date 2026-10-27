const mongoose = require('mongoose');
const User = require('../../../models/User');
const Notification = require('../../../models/Notification');
const Payment = require('../../../models/Payment');
const NotificationEngine = require('../../../services/NotificationEngine');
const { createStudent, createAdmin, createPayment } = require('../../helpers/factories');

describe('User model', () => {
  test('TC-UNIT-MOD-01 stores the password as a bcrypt hash, never in plain text [NFR-004]', async () => {
    const user = await createStudent({ password: 'Password123' });
    const stored = await User.findById(user._id).select('+password');

    expect(stored.password).not.toBe('Password123');
    expect(stored.password).toMatch(/^\$2[aby]\$\d{2}\$/);
    expect(await stored.matchPassword('Password123')).toBe(true);
    expect(await stored.matchPassword('wrong-password')).toBe(false);
  });

  test('TC-UNIT-MOD-02 does not re-hash an unchanged password on later saves [FR-012]', async () => {
    const user = await createStudent();
    const before = (await User.findById(user._id).select('+password')).password;

    const reloaded = await User.findById(user._id).select('+password');
    reloaded.bio = 'Learning Korean for EPS-TOPIK';
    await reloaded.save();
    const after = (await User.findById(user._id).select('+password')).password;

    expect(after).toBe(before);
  });

  test('TC-UNIT-MOD-03 excludes the password from default queries [NFR-004]', async () => {
    const user = await createStudent();

    expect((await User.findById(user._id)).password).toBeUndefined();
  });

  test('TC-UNIT-MOD-04 allows a Google account without a password but not a local one [FR-013]', async () => {
    await expect(User.create({ name: 'Google User', email: 'g@example.com', googleId: 'google-123' })).resolves.toBeDefined();
    await expect(User.create({ name: 'Local User', email: 'local@example.com' })).rejects.toThrow(/password/i);
  });

  test('TC-UNIT-MOD-05 enforces unique emails and a valid email format [FR-001]', async () => {
    await User.init();
    await createStudent({ email: 'same@example.com' });

    await expect(createStudent({ email: 'same@example.com' })).rejects.toThrow(/duplicate key/);
    await expect(createStudent({ email: 'no-at-sign' })).rejects.toThrow(/valid email/);
  });

  test('TC-UNIT-MOD-06 defaults new accounts to the active student role [FR-001]', async () => {
    const user = await User.create({ name: 'Default', email: 'default@example.com', password: 'Password123' });

    expect(user.role).toBe('student');
    expect(user.isActive).toBe(true);
    expect(user.privacy.profileVisibility).toBe('public');
  });
});

describe('Notification model', () => {
  test('TC-UNIT-MOD-07 markAsRead records each reader once and counts reads [FR-017]', async () => {
    const student = await createStudent();
    const notification = await Notification.create({ title: 'Exam', message: 'TOPIK on Friday' });

    await notification.markAsRead(student._id);
    await notification.markAsRead(student._id);

    expect(notification.readBy).toHaveLength(1);
    expect(notification.deliveryStats.totalRead).toBe(1);
  });

  test('TC-UNIT-MOD-08 markAsClicked counts the click and marks the notification read [FR-017]', async () => {
    const student = await createStudent();
    const notification = await Notification.create({ title: 'Exam', message: 'TOPIK on Friday' });

    await notification.markAsClicked(student._id);

    expect(notification.deliveryStats.totalClicked).toBe(1);
    expect(notification.readBy).toHaveLength(1);
  });

  // markAsClicked only persists through markAsRead, which returns early when the
  // user has already read the notification, so the incremented counter is lost.
  test.failing('TC-UNIT-MOD-17 [KNOWN DEFECT DEF-13] counts a click on a notification the user already read [FR-017]', async () => {
    const student = await createStudent();
    const notification = await Notification.create({ title: 'Exam', message: 'TOPIK on Friday' });
    await notification.markAsRead(student._id);

    await notification.markAsClicked(student._id);
    const reloaded = await Notification.findById(notification._id);

    expect(reloaded.deliveryStats.totalClicked).toBe(1);
  });

  test('TC-UNIT-MOD-09 getActiveNotifications returns only active, unexpired notifications for the user audience [FR-017]', async () => {
    const student = await createStudent();
    const other = await createStudent();
    await Notification.create([
      { title: 'Everyone', message: 'm', targetAudience: 'all' },
      { title: 'Students', message: 'm', targetAudience: 'students' },
      { title: 'Admins', message: 'm', targetAudience: 'admins' },
      { title: 'Mine', message: 'm', targetAudience: 'specific_users', targetUsers: [student._id] },
      { title: 'Someone else', message: 'm', targetAudience: 'specific_users', targetUsers: [other._id] },
      { title: 'Expired', message: 'm', expiresAt: new Date(Date.now() - 1000) },
      { title: 'Inactive', message: 'm', isActive: false },
      { title: 'Pinned', message: 'm', isPinned: true },
    ]);

    const titles = (await Notification.getActiveNotifications(student._id, 'student')).map((n) => n.title);

    expect(titles[0]).toBe('Pinned');
    expect(titles.sort()).toEqual(['Everyone', 'Mine', 'Pinned', 'Students']);
  });

  test('TC-UNIT-MOD-10 getAllNotifications filters, searches and paginates for administrators [FR-017]', async () => {
    await Notification.create([
      { title: 'Payment reminder', message: 'Fees due', type: 'payment_due', priority: 'high' },
      { title: 'Course update', message: 'Week 3 published', type: 'course_update' },
      { title: 'Holiday', message: 'Office closed', type: 'system', isActive: false },
    ]);

    const byType = await Notification.getAllNotifications(1, 10, { type: 'payment_due' });
    const bySearch = await Notification.getAllNotifications(1, 10, { search: 'week 3' });
    const inactive = await Notification.getAllNotifications(1, 10, { isActive: false });
    const paged = await Notification.getAllNotifications(2, 2, {});
    const dated = await Notification.getAllNotifications(1, 10, { dateFrom: '2000-01-01', dateTo: '2100-01-01', priority: 'high' });

    expect(byType.notifications.map((n) => n.title)).toEqual(['Payment reminder']);
    expect(bySearch.notifications.map((n) => n.title)).toEqual(['Course update']);
    expect(inactive.pagination.total).toBe(1);
    expect(paged.pagination).toEqual({ page: 2, limit: 2, total: 3, pages: 2 });
    expect(dated.notifications).toHaveLength(1);
  });

  test('TC-UNIT-MOD-11 getNotificationStats counts totals and groups by type [FR-017]', async () => {
    await Notification.create([
      { title: 'a', message: 'm', type: 'system', isPinned: true },
      { title: 'b', message: 'm', type: 'system' },
      { title: 'c', message: 'm', type: 'message', isActive: false },
    ]);

    expect(await Notification.getNotificationStats()).toEqual({
      total: 3, active: 2, pinned: 1, byType: { system: 2, message: 1 },
    });
  });

  test('TC-UNIT-MOD-12 sendToUsers and sendToParents dispatch to specific users [FR-017]', async () => {
    const dispatch = jest.spyOn(NotificationEngine, 'dispatch').mockResolvedValue({ ok: true });
    const admin = await createAdmin();
    const ids = [new mongoose.Types.ObjectId()];

    await Notification.sendToUsers({ title: 't', message: 'm', createdBy: admin._id }, ids);
    await Notification.sendToParents({ title: 't', message: 'm' }, ids);

    expect(dispatch).toHaveBeenNthCalledWith(1, expect.objectContaining({ targetAudience: 'specific_users', targetUsers: ids }), admin._id);
    expect(dispatch).toHaveBeenNthCalledWith(2, expect.objectContaining({
      parentNotification: { isParentNotification: true, studentId: ids[0] },
    }), null);
  });
});

describe('Payment model', () => {
  test('TC-UNIT-MOD-13 markCompleted, markFailed and processRefund update status and dates [FR-011]', async () => {
    const user = await createStudent();
    const completed = await createPayment({ user: user._id, status: 'pending', paidDate: undefined });
    const failed = await createPayment({ user: user._id, status: 'pending' });
    const refunded = await createPayment({ user: user._id, amount: 9000 });

    await completed.markCompleted('pi_123', { status: 'succeeded' });
    await failed.markFailed('Card declined');
    await refunded.processRefund(undefined, 'Duplicate charge');

    expect(completed).toMatchObject({ status: 'completed', gatewayTransactionId: 'pi_123' });
    expect(completed.paidDate).toBeInstanceOf(Date);
    expect(failed).toMatchObject({ status: 'failed', failureReason: 'Card declined' });
    expect(refunded).toMatchObject({ status: 'refunded', refundAmount: 9000, refundReason: 'Duplicate charge' });
  });

  test('TC-UNIT-MOD-14 getPaymentStats sums completed payments, optionally within a date range [FR-010]', async () => {
    const user = await createStudent();
    await createPayment({ user: user._id, amount: 10000, paidDate: new Date('2026-03-10') });
    await createPayment({ user: user._id, amount: 20000, paidDate: new Date('2026-07-10') });
    await createPayment({ user: user._id, amount: 99999, status: 'failed' });

    const all = await Payment.getPaymentStats();
    const ranged = await Payment.getPaymentStats('2026-06-01', '2026-12-31');
    const empty = await Payment.getPaymentStats('1999-01-01', '1999-12-31');

    expect(all).toMatchObject({ totalRevenue: 30000, totalTransactions: 2, avgTransactionValue: 15000 });
    expect(ranged).toMatchObject({ totalRevenue: 20000, totalTransactions: 1 });
    expect(empty).toEqual({ totalRevenue: 0, totalTransactions: 0, avgTransactionValue: 0 });
  });

  test('TC-UNIT-MOD-15 getRevenueByPlan and getMonthlyRevenue group completed revenue [FR-010]', async () => {
    const user = await createStudent();
    await createPayment({ user: user._id, amount: 5000, plan: 'pro', paidDate: new Date('2026-02-15') });
    await createPayment({ user: user._id, amount: 7000, paidDate: new Date('2026-02-20') });
    await createPayment({ user: user._id, amount: 3000, paidDate: new Date('2026-05-01') });

    const byPlan = await Payment.getRevenueByPlan();
    const ranged = await Payment.getRevenueByPlan('2026-01-01', '2026-03-31');
    const monthly = await Payment.getMonthlyRevenue(2026);

    expect(byPlan).toEqual(expect.arrayContaining([
      { plan: 'pro', revenue: 5000, count: 1 },
      { plan: 'course', revenue: 10000, count: 2 },
    ]));
    expect(ranged.reduce((sum, row) => sum + row.revenue, 0)).toBe(12000);
    expect(monthly).toEqual([{ month: 2, revenue: 12000, count: 2 }, { month: 5, revenue: 3000, count: 1 }]);
  });

  test('TC-UNIT-MOD-16 getMonthlyRevenue defaults to the current year [FR-010]', async () => {
    const user = await createStudent();
    await createPayment({ user: user._id, amount: 1234, paidDate: new Date() });

    const monthly = await Payment.getMonthlyRevenue();

    expect(monthly[0]).toMatchObject({ month: new Date().getUTCMonth() + 1, revenue: 1234 });
  });
});
