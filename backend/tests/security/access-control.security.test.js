const { api, createStudent, createInstructor, authHeader } = require('../helpers/factories');
const { endpointInventory } = require('../helpers/endpointInventory');

// Every endpoint must appear in exactly one of these lists. The inventory test below
// fails when a route is added without deciding who may call it.
const ADMIN_ONLY = `
GET /api/users | POST /api/users | PUT /api/users/:id | PATCH /api/users/:id | DELETE /api/users/:id
GET /api/courses/admin/all | POST /api/courses/admin | PUT /api/courses/admin/:id | DELETE /api/courses/admin/:id | PATCH /api/courses/admin/:id/toggle-publish
GET /api/payments/stats | GET /api/payments/recent | GET /api/payments/all | PUT /api/payments/admin/:id/status | POST /api/payments/admin/manual | PUT /api/payments/:id/complete
GET /api/notifications/all | GET /api/notifications/stats | GET /api/notifications/target-users | POST /api/notifications | PUT /api/notifications/:id
DELETE /api/notifications/:id | PUT /api/notifications/:id/pin | PUT /api/notifications/:id/toggle | POST /api/notifications/send-to-users | POST /api/notifications/send-to-parents
GET /api/announcements/stats | GET /api/announcements/all | GET /api/announcements/admin/all | POST /api/announcements | PUT /api/announcements/:id | DELETE /api/announcements/:id
PUT /api/announcements/:id/pin | PATCH /api/announcements/:id/pin | PUT /api/announcements/:id/active | PATCH /api/announcements/:id/active
GET /api/admin/settings | PUT /api/admin/settings | POST /api/admin/settings/reset | GET /api/admin/settings/:section | PUT /api/admin/settings/:section
GET /api/admin/settings/export/json | POST /api/admin/settings/import
GET /api/attendance/admin/overview | GET /api/attendance/admin/records | GET /api/attendance/admin/students | GET /api/attendance/admin/export
GET /api/admin/analytics | GET /api/admin/analytics/export
GET /api/events/stats | GET /api/events/all | GET /api/events/admin/all | POST /api/events | PUT /api/events/:id | DELETE /api/events/:id
PUT /api/events/:id/pin | PATCH /api/events/:id/pin | PUT /api/events/:id/active | PATCH /api/events/:id/active
GET /api/join-us | GET /api/join-us/recent | PATCH /api/join-us/:id/status | DELETE /api/join-us/:id
POST /api/lectures/upload | POST /api/lectures/upload-thumbnail | POST /api/lectures/link | DELETE /api/lectures/:id
POST /api/assignments | GET /api/assignments/:id/submissions | PATCH /api/assignments/submissions/:submissionId/grade | DELETE /api/assignments/:id
`;

const SIGNED_IN = `
GET /api/auth/me
GET /api/users/dashboard | GET /api/users/attendance | POST /api/users/attendance | GET /api/users/profile | PUT /api/users/profile
PUT /api/users/notifications | PUT /api/users/privacy | POST /api/users/avatar | DELETE /api/users/avatar | PUT /api/users/password
GET /api/courses/my-courses | POST /api/courses/:id/enroll | DELETE /api/courses/:id/enroll | POST /api/courses/:id/reviews | POST /api/courses/:id/complete
POST /api/courses | PUT /api/courses/:id | DELETE /api/courses/:id
GET /api/subscriptions/current | POST /api/subscriptions/create | PUT /api/subscriptions/upgrade | PUT /api/subscriptions/cancel
GET /api/subscriptions/usage | GET /api/subscriptions/payments | GET /api/subscriptions/invoice/:id
POST /api/payments/create-course-payment-intent | POST /api/payments/confirm-course-payment | GET /api/payments/my-payments | POST /api/payments/create
PUT /api/payments/:id/fail | POST /api/payments/:id/refund | GET /api/payments/:id
GET /api/notifications | GET /api/notifications/unread-count | POST /api/notifications/mark-all-read | GET /api/notifications/:id
POST /api/notifications/:id/read | POST /api/notifications/:id/click
POST /api/announcements/:id/read
POST /api/forums | PUT /api/forums/:id | DELETE /api/forums/:id | PATCH /api/forums/:id/pin | PATCH /api/forums/:id/active | PATCH /api/forums/:id/lock
POST /api/forums/:id/posts | POST /api/forums/posts/:postId/reply | POST /api/forums/posts/:postId/like
GET /api/attendance/my-attendance | GET /api/attendance/monthly | GET /api/attendance/enrolled-courses | POST /api/attendance
PUT /api/attendance/:id | DELETE /api/attendance/:id
POST /api/events/:id/attend | DELETE /api/events/:id/attend
POST /api/assignments/:id/submit | GET /api/assignments/:id/my-submission
GET /api/chat/history | DELETE /api/chat/history
`;

const PUBLIC = `
POST /api/auth/register | POST /api/auth/login | POST /api/auth/forgot-password | POST /api/auth/verify-reset-otp | POST /api/auth/reset-password | POST /api/auth/google
GET /api/courses | GET /api/courses/:id | GET /api/subscriptions/plans
GET /api/announcements | GET /api/announcements/:id
GET /api/forums/stats | GET /api/forums | GET /api/forums/:id | GET /api/forums/:id/posts
GET /api/events | GET /api/events/:id | POST /api/join-us/submit
GET /api/lectures/course/:courseId | GET /api/lectures/:id | GET /api/assignments/course/:courseId | GET /api/assignments/:id
POST /api/chat
`;

const parse = (list) => list.split(/\n|\|/).map((entry) => entry.trim()).filter(Boolean).map((entry) => {
  const [method, path] = entry.split(/\s+/);
  return { method, path, key: `${method} ${path}` };
});

const SAMPLE_ID = '64b7f0a0a0a0a0a0a0a0a0a0';
const concrete = (path) => path.replace(/:[A-Za-z]+/g, SAMPLE_ID).replace(`/settings/${SAMPLE_ID}`, '/settings/userSettings');
const call = (endpoint) => api()[endpoint.method.toLowerCase()](concrete(endpoint.path));

const adminOnly = parse(ADMIN_ONLY);
const signedIn = parse(SIGNED_IN);
const publicEndpoints = parse(PUBLIC);

describe('Endpoint inventory', () => {
  test('TC-SEC-AC-01 every API endpoint is classified exactly once as admin-only, signed-in or public [OWASP-A01]', () => {
    const inventory = endpointInventory().map((endpoint) => `${endpoint.method} ${endpoint.path}`);
    const classified = [...adminOnly, ...signedIn, ...publicEndpoints].map((endpoint) => endpoint.key);

    expect(inventory.length).toBe(155);
    expect(new Set(classified).size).toBe(classified.length);
    expect([...classified].sort()).toEqual([...inventory].sort());
  });
});

describe('Administrative endpoints', () => {
  let student;
  let instructor;

  beforeEach(async () => {
    student = authHeader(await createStudent());
    instructor = authHeader(await createInstructor());
  });

  test.each(adminOnly.map((endpoint) => [endpoint.key, endpoint]))('TC-SEC-AC-02 %s refuses anonymous callers (401) and students and instructors (403) [OWASP-A01]', async (key, endpoint) => {
    const anonymous = await call(endpoint);
    const asStudent = await call(endpoint).set(student);
    const asInstructor = await call(endpoint).set(instructor);

    expect(anonymous.status).toBe(401);
    expect(asStudent.status).toBe(403);
    expect(asInstructor.status).toBe(403);
  });
});

describe('Signed-in endpoints', () => {
  test.each(signedIn.map((endpoint) => [endpoint.key, endpoint]))('TC-SEC-AC-03 %s refuses anonymous callers with 401 [OWASP-A01]', async (key, endpoint) => {
    const res = await call(endpoint);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, message: 'Not authorized to access this route' });
  });
});
