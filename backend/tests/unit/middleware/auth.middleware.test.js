const mongoose = require('mongoose');
const { protect, authorize, optionalAuth, checkCourseAccess } = require('../../../middleware/auth');
const Course = require('../../../models/Course');
const {
  createStudent, createAdmin, createInstructor, createCourse, enrol, tokenFor,
} = require('../../helpers/factories');

const mockResponse = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

const bearer = (token) => ({ headers: { authorization: `Bearer ${token}` } });

describe('protect', () => {
  test('TC-UNIT-AUTH-01 rejects a request without a token with 401 [FR-002]', async () => {
    const res = mockResponse();
    const next = jest.fn();

    await protect({ headers: {} }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Not authorized to access this route' });
    expect(next).not.toHaveBeenCalled();
  });

  test('TC-UNIT-AUTH-02 rejects a token signed with another secret [OWASP-A07]', async () => {
    const user = await createStudent();
    const res = mockResponse();

    await protect(bearer(tokenFor(user, { secret: 'not-the-server-secret' })), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Token is not valid' });
  });

  test('TC-UNIT-AUTH-03 rejects an expired token [OWASP-A07]', async () => {
    const user = await createStudent();
    const res = mockResponse();

    await protect(bearer(tokenFor(user, { expiresIn: '-10s' })), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('TC-UNIT-AUTH-04 rejects a valid token whose user no longer exists [FR-009]', async () => {
    const res = mockResponse();
    const ghost = { _id: new mongoose.Types.ObjectId() };

    await protect(bearer(tokenFor(ghost)), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Token is not valid' });
  });

  test('TC-UNIT-AUTH-05 rejects a deactivated account even with a valid token [FR-009]', async () => {
    const user = await createStudent({ isActive: false });
    const res = mockResponse();

    await protect(bearer(tokenFor(user)), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Account is deactivated' });
  });

  test('TC-UNIT-AUTH-06 answers 500 when the server has no JWT secret configured [OWASP-A05]', async () => {
    const user = await createStudent();
    const token = tokenFor(user);
    const secret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    const res = mockResponse();

    await protect(bearer(token), res, jest.fn());
    process.env.JWT_SECRET = secret;

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'JWT_SECRET is not configured' });
  });

  test('TC-UNIT-AUTH-07 attaches the current user and calls next for a valid token [FR-002]', async () => {
    const user = await createStudent();
    const req = bearer(tokenFor(user));
    const next = jest.fn();

    await protect(req, mockResponse(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user._id.equals(user._id)).toBe(true);
    expect(req.user.password).toBeUndefined();
  });
});

describe('authorize', () => {
  test('TC-UNIT-AUTH-08 lets a permitted role through [FR-009]', () => {
    const next = jest.fn();

    authorize('admin', 'instructor')({ user: { role: 'instructor' } }, mockResponse(), next);

    expect(next).toHaveBeenCalled();
  });

  test('TC-UNIT-AUTH-09 refuses other roles with 403 and names the role [FR-009]', () => {
    const res = mockResponse();

    authorize('admin')({ user: { role: 'student' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User role student is not authorized to access this route' });
  });
});

describe('optionalAuth', () => {
  test('TC-UNIT-AUTH-10 continues as a guest without a token [FR-021]', async () => {
    const req = { headers: {} };
    const next = jest.fn();

    await optionalAuth(req, mockResponse(), next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  test('TC-UNIT-AUTH-11 continues as a guest when the token is invalid instead of answering 401 [FR-021]', async () => {
    const req = bearer('garbage.token.value');
    const res = mockResponse();
    const next = jest.fn();

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  test('TC-UNIT-AUTH-12 attaches an active user and ignores a deactivated one [FR-021]', async () => {
    const active = await createStudent();
    const inactive = await createStudent({ isActive: false });
    const activeReq = bearer(tokenFor(active));
    const inactiveReq = bearer(tokenFor(inactive));

    await optionalAuth(activeReq, mockResponse(), jest.fn());
    await optionalAuth(inactiveReq, mockResponse(), jest.fn());

    expect(activeReq.user._id.equals(active._id)).toBe(true);
    expect(inactiveReq.user).toBeUndefined();
  });
});

describe('checkCourseAccess', () => {
  test('TC-UNIT-AUTH-13 answers 404 for an unknown course [FR-004]', async () => {
    const res = mockResponse();

    await checkCourseAccess({ params: { id: new mongoose.Types.ObjectId().toString() }, user: await createStudent() }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('TC-UNIT-AUTH-14 grants administrators access to any course [FR-009]', async () => {
    const course = await createCourse();
    const req = { params: { id: course._id.toString() }, user: await createAdmin() };
    const next = jest.fn();

    await checkCourseAccess(req, mockResponse(), next);

    expect(next).toHaveBeenCalled();
    expect(req.course._id.equals(course._id)).toBe(true);
  });

  test('TC-UNIT-AUTH-15 grants the course instructor access [FR-006]', async () => {
    const instructor = await createInstructor();
    const course = await createCourse({ instructor: instructor._id });
    const next = jest.fn();

    await checkCourseAccess({ params: { courseId: course._id.toString() }, user: instructor }, mockResponse(), next);

    expect(next).toHaveBeenCalled();
  });

  test('TC-UNIT-AUTH-16 grants an enrolled student access and exposes their progress [FR-005]', async () => {
    const student = await createStudent();
    const course = await createCourse({ instructor: (await createInstructor())._id });
    await enrol(student, course);
    const req = { params: { id: course._id.toString() }, user: student };
    const next = jest.fn();

    await checkCourseAccess(req, mockResponse(), next);

    expect(next).toHaveBeenCalled();
    expect(req.progress.student.equals(student._id)).toBe(true);
  });

  test('TC-UNIT-AUTH-17 refuses a student who is not enrolled with 403 [FR-004]', async () => {
    const course = await createCourse({ instructor: (await createInstructor())._id });
    const res = mockResponse();

    await checkCourseAccess({ params: { id: course._id.toString() }, user: await createStudent() }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'You are not enrolled in this course' });
  });

  test('TC-UNIT-AUTH-18 answers 500 when the lookup fails [NFR-002]', async () => {
    jest.spyOn(Course, 'findById').mockRejectedValue(new Error('connection reset'));
    const res = mockResponse();

    await checkCourseAccess({ params: { id: 'x' }, user: { role: 'student' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
