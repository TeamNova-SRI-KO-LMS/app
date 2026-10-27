// The Stripe SDK is replaced so no test can create a real charge.
const mockStripe = {
  paymentIntents: { create: jest.fn(), retrieve: jest.fn() },
};
jest.mock('stripe', () => jest.fn(() => mockStripe));

const Payment = require('../../models/Payment');
const Progress = require('../../models/Progress');
const Notification = require('../../models/Notification');
const Subscription = require('../../models/Subscription');
const Course = require('../../models/Course');
const User = require('../../models/User');
const {
  api, createStudent, createAdmin, createCourse, enrol, createPayment, authHeader,
} = require('../helpers/factories');

const intent = (overrides = {}) => ({
  id: 'pi_test_123', client_secret: 'pi_test_123_secret', status: 'succeeded', amount: 1500000, currency: 'lkr',
  metadata: {}, payment_method: 'pm_card_visa', receipt_email: 'student@example.com', ...overrides,
});

beforeEach(() => {
  mockStripe.paymentIntents.create.mockReset();
  mockStripe.paymentIntents.retrieve.mockReset();
});

describe('Stripe course checkout', () => {
  test('TC-PAY-01 explains that card payments are not configured when the Stripe key is missing [FR-011]', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const student = await createStudent();
    const course = await createCourse({ price: 15000 });

    const res = await api().post('/api/payments/create-course-payment-intent').set(authHeader(student)).send({ courseId: course._id });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Card payments are not configured on the server (STRIPE_SECRET_KEY is missing).');
  });

  describe('with Stripe configured', () => {
    beforeAll(() => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
    });

    afterAll(() => {
      delete process.env.STRIPE_SECRET_KEY;
    });

    test('TC-PAY-02 creates a PaymentIntent in LKR cents and a pending payment record [FR-011]', async () => {
      const student = await createStudent({ email: 'student@example.com' });
      const course = await createCourse({ title: 'TOPIK I', price: 15000 });
      mockStripe.paymentIntents.create.mockResolvedValue(intent({ status: 'requires_payment_method' }));

      const res = await api().post('/api/payments/create-course-payment-intent').set(authHeader(student)).send({ courseId: course._id });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ clientSecret: 'pi_test_123_secret', paymentIntentId: 'pi_test_123', course: { title: 'TOPIK I', price: 15000 } });
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(expect.objectContaining({
        amount: 1500000, currency: 'lkr', metadata: expect.objectContaining({ courseId: course._id.toString(), userId: student._id.toString() }),
      }));
      expect(await Payment.findOne({ gatewayTransactionId: 'pi_test_123' })).toMatchObject({ status: 'pending', amount: 15000, currency: 'LKR' });
    });

    test('TC-PAY-03 charges at least the Stripe minimum for very cheap courses [FR-011]', async () => {
      const student = await createStudent();
      const course = await createCourse({ price: 100 });
      mockStripe.paymentIntents.create.mockResolvedValue(intent());

      await api().post('/api/payments/create-course-payment-intent').set(authHeader(student)).send({ courseId: course._id });

      expect(mockStripe.paymentIntents.create.mock.calls[0][0].amount).toBe(16000);
    });

    test('TC-PAY-04 refuses checkout for free, unpublished, unknown or already-enrolled courses [FR-011]', async () => {
      const student = await createStudent();
      const free = await createCourse({ price: 0 });
      const draft = await createCourse({ price: 9000, isPublished: false });
      const owned = await createCourse({ price: 9000 });
      await enrol(student, owned);
      const checkout = (courseId) => api().post('/api/payments/create-course-payment-intent').set(authHeader(student)).send({ courseId });

      const freeRes = await checkout(free._id);
      expect(freeRes.status).toBe(400);
      expect(freeRes.body.isFree).toBe(true);
      expect((await checkout(draft._id)).status).toBe(400);
      expect((await checkout(owned._id)).status).toBe(400);
      expect((await checkout('64b7f0a0a0a0a0a0a0a0a0a0')).status).toBe(404);
      expect((await checkout('not-an-id')).status).toBe(400);
      expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
    });

    test('TC-PAY-05 confirms a succeeded payment, enrols the student and notifies them [FR-011][FR-004]', async () => {
      const student = await createStudent();
      const course = await createCourse({ price: 15000 });
      await createPayment({ user: student._id, course: course._id, status: 'pending', gatewayTransactionId: 'pi_test_123', paidDate: undefined });
      mockStripe.paymentIntents.retrieve.mockResolvedValue(intent({ metadata: { courseId: course._id.toString(), userId: student._id.toString() } }));

      const res = await api().post('/api/payments/confirm-course-payment').set(authHeader(student)).send({ paymentIntentId: 'pi_test_123', courseId: course._id });

      expect(res.status).toBe(200);
      expect(res.body.payment.receiptNumber).toMatch(/^SRIKO-REC-\d+-\d{4}$/);
      expect(await Payment.findOne({ gatewayTransactionId: 'pi_test_123' })).toMatchObject({ status: 'completed' });
      expect(await Progress.countDocuments({ student: student._id, course: course._id })).toBe(1);
      expect((await User.findById(student._id)).enrolledCourses.map(String)).toContain(course._id.toString());
      expect(await Notification.countDocuments({ title: 'Enrollment Confirmed!', targetUsers: student._id })).toBe(1);
    });

    test('TC-PAY-06 creates the payment record during confirmation if it is missing [FR-011]', async () => {
      const student = await createStudent();
      const course = await createCourse({ price: 15000 });
      mockStripe.paymentIntents.retrieve.mockResolvedValue(intent({ id: 'pi_new' }));

      const res = await api().post('/api/payments/confirm-course-payment').set(authHeader(student)).send({ paymentIntentId: 'pi_new', courseId: course._id });

      expect(res.status).toBe(200);
      expect(await Payment.findOne({ gatewayTransactionId: 'pi_new' })).toMatchObject({ amount: 15000, currency: 'LKR', status: 'completed' });
    });

    test('TC-PAY-07 refuses to confirm unpaid, mismatched or foreign payments [FR-011][OWASP-A04]', async () => {
      const student = await createStudent();
      const course = await createCourse({ price: 15000 });
      const confirm = () => api().post('/api/payments/confirm-course-payment').set(authHeader(student)).send({ paymentIntentId: 'pi_test_123', courseId: course._id });

      mockStripe.paymentIntents.retrieve.mockResolvedValueOnce(intent({ status: 'requires_payment_method' }));
      const unpaid = await confirm();
      mockStripe.paymentIntents.retrieve.mockResolvedValueOnce(intent({ metadata: { courseId: '64b7f0a0a0a0a0a0a0a0a0a0' } }));
      const otherCourse = await confirm();
      mockStripe.paymentIntents.retrieve.mockResolvedValueOnce(intent({ metadata: { userId: '64b7f0a0a0a0a0a0a0a0a0a1' } }));
      const otherUser = await confirm();
      mockStripe.paymentIntents.retrieve.mockResolvedValueOnce(null);
      const missing = await confirm();

      expect(unpaid.status).toBe(400);
      expect(otherCourse.status).toBe(400);
      expect(otherUser.status).toBe(403);
      expect(missing.status).toBe(404);
      expect(await Progress.countDocuments()).toBe(0);
    });

    test('TC-PAY-08 validates the confirmation request [FR-011]', async () => {
      const student = await createStudent();

      expect((await api().post('/api/payments/confirm-course-payment').set(authHeader(student)).send({ courseId: 'x' })).status).toBe(400);
      expect((await api().post('/api/payments/confirm-course-payment').set(authHeader(student)).send({ paymentIntentId: 'pi', courseId: '64b7f0a0a0a0a0a0a0a0a0a0' })).status).toBe(404);
    });

    test('TC-PAY-09 reports Stripe errors as 500 with the gateway message [NFR-002]', async () => {
      const student = await createStudent();
      const course = await createCourse({ price: 15000 });
      mockStripe.paymentIntents.create.mockRejectedValue(new Error('Your card was declined.'));

      const res = await api().post('/api/payments/create-course-payment-intent').set(authHeader(student)).send({ courseId: course._id });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Your card was declined.');
    });
  });
});

describe('Payment history', () => {
  test('TC-PAY-10 lists only the signed-in user\'s payments [FR-011]', async () => {
    const student = await createStudent();
    const course = await createCourse({ title: 'TOPIK I' });
    await createPayment({ user: student._id, course: course._id });
    await createPayment({ user: (await createStudent())._id });

    const res = await api().get('/api/payments/my-payments').set(authHeader(student));

    expect(res.body.payments).toHaveLength(1);
    expect(res.body.payments[0].course.title).toBe('TOPIK I');
  });

  test('TC-PAY-11 shows a payment to its owner and to administrators only [FR-011][OWASP-A01]', async () => {
    const owner = await createStudent();
    const payment = await createPayment({ user: owner._id });

    const asOwner = await api().get(`/api/payments/${payment._id}`).set(authHeader(owner));
    const asOther = await api().get(`/api/payments/${payment._id}`).set(authHeader(await createStudent()));
    const asAdmin = await api().get(`/api/payments/${payment._id}`).set(authHeader(await createAdmin()));

    expect(asOwner.status).toBe(200);
    expect(asOther.status).toBe(404);
    expect(asAdmin.status).toBe(200);
  });
});

describe('Subscription payments', () => {
  const subscriptionFor = (user) => Subscription.create({
    user: user._id, plan: 'pro', billingCycle: 'monthly', amount: 2500, status: 'trial',
  });

  test('TC-PAY-12 records a payment against the user\'s own subscription [FR-025]', async () => {
    const student = await createStudent();
    const subscription = await subscriptionFor(student);

    const res = await api().post('/api/payments/create').set(authHeader(student)).send({ subscriptionId: subscription._id, paymentMethod: 'credit_card', amount: 2500 });
    const foreign = await api().post('/api/payments/create').set(authHeader(await createStudent())).send({ subscriptionId: subscription._id, paymentMethod: 'credit_card', amount: 2500 });
    const invalid = await api().post('/api/payments/create').set(authHeader(student)).send({ subscriptionId: 'x', paymentMethod: 'barter', amount: 'lots' });

    expect(res.status).toBe(201);
    expect(res.body.payment).toMatchObject({ plan: 'pro', billingCycle: 'monthly', amount: 2500, status: 'pending' });
    expect(foreign.status).toBe(404);
    expect(invalid.status).toBe(400);
  });

  test('TC-PAY-13 an administrator completing a subscription payment activates it; the student cannot [FR-025][OWASP-A04]', async () => {
    const student = await createStudent();
    const subscription = await subscriptionFor(student);
    const payment = await createPayment({ user: student._id, subscription: subscription._id, status: 'pending', paymentType: 'subscription' });

    const admin = await createAdmin();

    const byStudent = await api().put(`/api/payments/${payment._id}/complete`).set(authHeader(student)).send({ gatewayTransactionId: 'txn-1' });
    const res = await api().put(`/api/payments/${payment._id}/complete`).set(authHeader(admin)).send({ gatewayTransactionId: 'txn-1' });
    const again = await api().put(`/api/payments/${payment._id}/complete`).set(authHeader(admin)).send({});

    expect(byStudent.status).toBe(403);
    expect(res.status).toBe(200);
    expect(again.status).toBe(400);
    expect(await Subscription.findById(subscription._id)).toMatchObject({ status: 'active', paymentStatus: 'paid' });
  });

  test('TC-PAY-14 marks a payment failed and refunds a completed one [FR-011]', async () => {
    const student = await createStudent();
    const pending = await createPayment({ user: student._id, status: 'pending' });
    const completed = await createPayment({ user: student._id, amount: 5000 });

    const failed = await api().put(`/api/payments/${pending._id}/fail`).set(authHeader(student)).send({ reason: 'Card declined' });
    const refundPending = await api().post(`/api/payments/${pending._id}/refund`).set(authHeader(student)).send({ reason: 'x' });
    const refunded = await api().post(`/api/payments/${completed._id}/refund`).set(authHeader(student)).send({ reason: 'Course cancelled' });
    const notFound = await api().put('/api/payments/64b7f0a0a0a0a0a0a0a0a0a0/fail').set(authHeader(student)).send({ reason: 'x' });

    expect(failed.body.payment).toMatchObject({ status: 'failed', failureReason: 'Card declined' });
    expect(refundPending.status).toBe(400);
    expect(refunded.body.payment).toMatchObject({ status: 'refunded', refundAmount: 5000 });
    expect(notFound.status).toBe(404);
  });
});

describe('Administrative payment management', () => {
  const seed = async () => {
    const admin = await createAdmin();
    const nimali = await createStudent({ name: 'Nimali Perera', email: 'nimali@example.com' });
    const course = await createCourse({ title: 'TOPIK I', price: 15000 });
    await createPayment({ user: nimali._id, course: course._id, amount: 15000, receiptNumber: 'SRIKO-REC-1' });
    await createPayment({ user: nimali._id, amount: 2500, status: 'pending', plan: 'pro', paymentType: 'subscription' });
    await createPayment({ user: nimali._id, amount: 999, status: 'failed' });
    return { admin, nimali, course };
  };

  test('TC-PAY-15 reports revenue statistics and the status breakdown [FR-010]', async () => {
    const { admin } = await seed();

    const res = await api().get('/api/payments/stats').set(authHeader(admin));

    expect(res.body.stats).toMatchObject({ totalRevenue: 15000, totalTransactions: 3, completedTransactions: 1, pendingTransactions: 1, failedTransactions: 1, refundedTransactions: 0 });
    expect(res.body.monthlyRevenue[0].revenue).toBe(15000);
  });

  test('TC-PAY-16 lists recent payments and filters, searches and sorts all payments [FR-010]', async () => {
    const { admin } = await seed();

    const recent = await api().get('/api/payments/recent?limit=2').set(authHeader(admin));
    const pending = await api().get('/api/payments/all?status=pending&paymentType=subscription&plan=pro&paymentMethod=credit_card').set(authHeader(admin));
    const byStudent = await api().get('/api/payments/all?search=nimali').set(authHeader(admin));
    const byCourse = await api().get('/api/payments/all?search=TOPIK&sortBy=amount&sortOrder=asc').set(authHeader(admin));
    const byReceipt = await api().get('/api/payments/all?search=SRIKO-REC-1').set(authHeader(admin));
    const byDate = await api().get('/api/payments/all?startDate=2000-01-01&endDate=2100-01-01').set(authHeader(admin));

    expect(recent.body.payments).toHaveLength(2);
    expect(pending.body.payments).toHaveLength(1);
    expect(byStudent.body.pagination.total).toBe(3);
    expect(byCourse.body.payments).toHaveLength(1);
    expect(byReceipt.body.payments[0].receiptNumber).toBe('SRIKO-REC-1');
    expect(byDate.body.pagination.total).toBe(3);
  });

  test('TC-PAY-17 approving a course payment enrols the student and notifies them [FR-011]', async () => {
    const admin = await createAdmin();
    const student = await createStudent();
    const course = await createCourse({ price: 15000 });
    const payment = await createPayment({ user: student._id, course: course._id, status: 'pending', paymentMethod: 'bank_transfer' });

    const res = await api().put(`/api/payments/admin/${payment._id}/status`).set(authHeader(admin)).send({ status: 'completed', notes: 'Bank slip verified' });

    expect(res.status).toBe(200);
    expect(res.body.payment.receiptNumber).toMatch(/^SRIKO-MAN-/);
    expect(await Progress.countDocuments({ student: student._id, course: course._id })).toBe(1);
    expect((await Course.findById(course._id)).enrolledStudents.map(String)).toContain(student._id.toString());
    expect(await Notification.countDocuments({ title: 'Payment Confirmed by Admin' })).toBe(1);
  });

  test('TC-PAY-18 refunds and fails payments with reasons, and reports missing payments [FR-011]', async () => {
    const admin = await createAdmin();
    const student = await createStudent();
    const toRefund = await createPayment({ user: student._id, amount: 4000 });
    const toFail = await createPayment({ user: student._id, status: 'pending' });

    const refunded = await api().put(`/api/payments/admin/${toRefund._id}/status`).set(authHeader(admin)).send({ status: 'refunded' });
    const failed = await api().put(`/api/payments/admin/${toFail._id}/status`).set(authHeader(admin)).send({ status: 'failed', failureReason: 'Slip unreadable' });
    const missing = await api().put('/api/payments/admin/64b7f0a0a0a0a0a0a0a0a0a0/status').set(authHeader(admin)).send({ status: 'failed' });

    expect(refunded.body.payment).toMatchObject({ status: 'refunded', refundAmount: 4000, refundReason: 'Refunded by administrator' });
    expect(failed.body.payment).toMatchObject({ status: 'failed', failureReason: 'Slip unreadable' });
    expect(missing.status).toBe(404);
  });

  test('TC-PAY-19 records an offline payment and enrols the student [FR-011]', async () => {
    const admin = await createAdmin();
    const student = await createStudent();
    const course = await createCourse({ price: 15000 });

    const res = await api().post('/api/payments/admin/manual').set(authHeader(admin)).send({ userId: student._id, courseId: course._id, amount: '15000', receiptNumber: 'BANK-778' });
    const pendingOnly = await api().post('/api/payments/admin/manual').set(authHeader(admin)).send({ userId: student._id, courseId: course._id, amount: 1, markCompleted: false });

    expect(res.status).toBe(201);
    expect(res.body.payment).toMatchObject({ status: 'completed', paymentGateway: 'manual', receiptNumber: 'BANK-778', amount: 15000 });
    expect(pendingOnly.body.payment.status).toBe('pending');
    expect(await Progress.countDocuments({ student: student._id, course: course._id })).toBe(1);
  });

  test('TC-PAY-20 validates offline payments [FR-011]', async () => {
    const admin = await createAdmin();
    const student = await createStudent();
    const course = await createCourse();
    const post = (body) => api().post('/api/payments/admin/manual').set(authHeader(admin)).send(body);

    expect((await post({ userId: student._id })).status).toBe(400);
    expect((await post({ userId: '64b7f0a0a0a0a0a0a0a0a0a0', courseId: course._id, amount: 1 })).status).toBe(404);
    expect((await post({ userId: student._id, courseId: '64b7f0a0a0a0a0a0a0a0a0a0', amount: 1 })).status).toBe(404);
  });

  // The new status is written without validation, so an unknown value fails inside
  // Mongoose and surfaces as HTTP 500 instead of a 400 validation error.
  test.failing('TC-PAY-21 [KNOWN DEFECT DEF-19] rejects an unknown payment status with 400 [FR-011]', async () => {
    const admin = await createAdmin();
    const payment = await createPayment({ user: (await createStudent())._id });

    const res = await api().put(`/api/payments/admin/${payment._id}/status`).set(authHeader(admin)).send({ status: 'paid-ish' });

    expect(res.status).toBe(400);
  });

  test('TC-PAY-22 answers 500 when payment statistics cannot be computed [NFR-002]', async () => {
    const admin = await createAdmin();
    const header = authHeader(admin);
    jest.spyOn(Payment, 'getPaymentStats').mockRejectedValue(new Error('boom'));

    expect((await api().get('/api/payments/stats').set(header)).status).toBe(500);
  });
});
