const Subscription = require('../../models/Subscription');
const Payment = require('../../models/Payment');
const { api, createStudent, createPayment, authHeader } = require('../helpers/factories');

const activeSubscription = (user, overrides = {}) => Subscription.create({
  user: user._id, plan: 'starter', billingCycle: 'monthly', amount: 0, status: 'active',
  features: { maxCourses: 3, maxStudents: -1 }, usage: { coursesCreated: 1, studentsEnrolled: 2, apiCalls: 5 }, ...overrides,
});

describe('Subscription information', () => {
  test('TC-SUB-01 reports that a user has no subscription [FR-025]', async () => {
    const res = await api().get('/api/subscriptions/current').set(authHeader(await createStudent()));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, subscription: null, message: 'No active subscription found' });
  });

  test('TC-SUB-02 returns the active subscription and its usage [FR-025]', async () => {
    const student = await createStudent();
    await activeSubscription(student);

    const current = await api().get('/api/subscriptions/current').set(authHeader(student));
    const usage = await api().get('/api/subscriptions/usage').set(authHeader(student));

    expect(current.body.subscription).toMatchObject({ plan: 'starter', status: 'active' });
    expect(usage.body.usage).toEqual({
      courses: { used: 1, limit: 3, unlimited: false },
      students: { used: 2, limit: -1, unlimited: true },
      apiCalls: { used: 5, limit: 1000, unlimited: false },
    });
  });

  test('TC-SUB-03 answers 404 for usage when there is no subscription [FR-025]', async () => {
    expect((await api().get('/api/subscriptions/usage').set(authHeader(await createStudent()))).status).toBe(404);
  });

  test('TC-SUB-04 pages through the user\'s payments and shows one invoice [FR-025]', async () => {
    const student = await createStudent();
    const payment = await createPayment({ user: student._id });
    await createPayment({ user: student._id });

    const list = await api().get('/api/subscriptions/payments?limit=1').set(authHeader(student));
    const invoice = await api().get(`/api/subscriptions/invoice/${payment._id}`).set(authHeader(student));
    const foreign = await api().get(`/api/subscriptions/invoice/${payment._id}`).set(authHeader(await createStudent()));

    expect(list.body.pagination).toEqual({ current: 1, pages: 2, total: 2 });
    expect(invoice.status).toBe(200);
    expect(foreign.status).toBe(404);
  });

  test('TC-SUB-05 validates plan changes before touching the database [FR-025]', async () => {
    const student = await createStudent();

    expect((await api().post('/api/subscriptions/create').set(authHeader(student)).send({ plan: 'gold', billingCycle: 'weekly' })).status).toBe(400);
    expect((await api().put('/api/subscriptions/upgrade').set(authHeader(student)).send({ plan: 'starter', billingCycle: 'monthly' })).status).toBe(400);
    expect((await api().put('/api/subscriptions/upgrade').set(authHeader(student)).send({ plan: 'pro', billingCycle: 'monthly' })).status).toBe(404);
    expect((await api().put('/api/subscriptions/cancel').set(authHeader(student)).send({})).status).toBe(404);
  });

  test('TC-SUB-06 refuses a second subscription and a non-upgrade [FR-025]', async () => {
    const student = await createStudent();
    await activeSubscription(student, { plan: 'premium' });

    const second = await api().post('/api/subscriptions/create').set(authHeader(student)).send({ plan: 'pro', billingCycle: 'monthly' });
    const downgrade = await api().put('/api/subscriptions/upgrade').set(authHeader(student)).send({ plan: 'pro', billingCycle: 'monthly' });

    expect(second.status).toBe(400);
    expect(downgrade.status).toBe(400);
  });
});

// DEF-02 (fixed): the plan features, prices and cancellation that the routes call now
// exist on the model, with the plans of the pricing page.
describe('Subscription plans, start, cancellation and upgrade', () => {
  test('TC-SUB-07 lists the available plans with their LKR prices and limits [FR-025]', async () => {
    const res = await api().get('/api/subscriptions/plans');
    const plans = Object.fromEntries(res.body.data.map((plan) => [plan.name, plan]));

    expect(res.status).toBe(200);
    expect(plans.starter).toMatchObject({ pricing: { monthly: 0, yearly: 0 }, features: { maxCourses: 5, maxStudents: 50 } });
    expect(plans.pro).toMatchObject({ pricing: { monthly: 15000, yearly: 150000 }, features: { maxCourses: -1, maxStudents: 500, apiAccess: true } });
    expect(plans.premium).toMatchObject({ pricing: { monthly: 35000, yearly: 350000 }, features: { maxStudents: -1, whiteLabel: true } });
  });

  test('TC-SUB-08 starts a free starter subscription [FR-025]', async () => {
    const res = await api().post('/api/subscriptions/create').set(authHeader(await createStudent())).send({ plan: 'starter', billingCycle: 'monthly' });

    expect(res.status).toBe(201);
    expect(res.body.subscription).toMatchObject({ plan: 'starter', status: 'active', amount: 0, features: { maxCourses: 5 } });
    expect(await Payment.countDocuments()).toBe(0);
  });

  test('TC-SUB-09 cancels an active subscription [FR-025]', async () => {
    const student = await createStudent();
    await activeSubscription(student);

    const res = await api().put('/api/subscriptions/cancel').set(authHeader(student)).send({ reason: 'Moving abroad' });

    expect(res.status).toBe(200);
    expect(await Subscription.findOne({ user: student._id })).toMatchObject({ status: 'cancelled', autoRenew: false, cancellationReason: 'Moving abroad' });
  });

  test('TC-SUB-10 upgrades an active subscription [FR-025]', async () => {
    const student = await createStudent();
    await activeSubscription(student);

    const res = await api().put('/api/subscriptions/upgrade').set(authHeader(student)).send({ plan: 'pro', billingCycle: 'yearly' });

    expect(res.status).toBe(200);
    expect(res.body.subscription).toMatchObject({ plan: 'pro', billingCycle: 'yearly', amount: 150000, features: { maxStudents: 500 } });
  });

  test('TC-SUB-11 a paid plan starts a 14-day trial with a pending payment at the plan price [FR-025]', async () => {
    const student = await createStudent();

    const res = await api().post('/api/subscriptions/create').set(authHeader(student)).send({ plan: 'premium', billingCycle: 'monthly' });
    const trialDays = (new Date(res.body.subscription.trialEndDate) - Date.now()) / (24 * 60 * 60 * 1000);

    expect(res.status).toBe(201);
    expect(res.body.subscription).toMatchObject({ status: 'trial', amount: 35000 });
    expect(Math.round(trialDays)).toBe(14);
    expect(await Payment.findOne({ user: student._id })).toMatchObject({ amount: 35000, status: 'pending', plan: 'premium' });
  });
});
