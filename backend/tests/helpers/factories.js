const http = require('http');
const jwt = require('jsonwebtoken');
const request = require('supertest');

const app = require('../../app');
const User = require('../../models/User');
const Course = require('../../models/Course');
const Progress = require('../../models/Progress');
const Payment = require('../../models/Payment');
const Attendance = require('../../models/Attendance');
const Event = require('../../models/Event');
const Announcement = require('../../models/Announcement');
const Notification = require('../../models/Notification');
const DiscussionForum = require('../../models/DiscussionForum');
const JoinUsSubmission = require('../../models/JoinUsSubmission');

const DEFAULT_PASSWORD = 'Password123';

let sequence = 0;
const nextId = () => {
  sequence += 1;
  return sequence;
};

const tokenFor = (user, options = {}) => jwt.sign(
  { id: user._id.toString() },
  options.secret || process.env.JWT_SECRET,
  { expiresIn: options.expiresIn || '1h' },
);

const authHeader = (user) => ({ Authorization: `Bearer ${tokenFor(user)}` });

const createUser = async (overrides = {}) => {
  const n = nextId();
  return User.create({
    name: `Test User ${n}`,
    email: `user${n}@example.com`,
    password: DEFAULT_PASSWORD,
    role: 'student',
    ...overrides,
  });
};

const createStudent = (overrides = {}) => createUser({ role: 'student', ...overrides });
const createAdmin = (overrides = {}) => createUser({ name: `Admin ${nextId()}`, role: 'admin', ...overrides });
const createInstructor = (overrides = {}) => createUser({ role: 'instructor', ...overrides });

const createCourse = async (overrides = {}) => {
  const n = nextId();
  return Course.create({
    title: `Korean Course ${n}`,
    description: 'A structured Korean language course for testing purposes.',
    category: 'Language',
    level: 'beginner',
    duration: 8,
    price: 0,
    isPublished: true,
    curriculum: [
      {
        week: 1,
        title: 'Hangul basics',
        lessons: [
          { title: 'Vowels', type: 'video', duration: 20 },
          { title: 'Consonants', type: 'video', duration: 25 },
        ],
      },
    ],
    ...overrides,
  });
};

// Enrols a student the way the API does: Progress record plus both enrolment arrays.
const enrol = async (student, course) => {
  await Course.updateOne({ _id: course._id }, { $addToSet: { enrolledStudents: student._id } });
  await User.updateOne({ _id: student._id }, { $addToSet: { enrolledCourses: course._id } });
  return Progress.create({ student: student._id, course: course._id, currentWeek: 1, overallProgress: 0 });
};

const createPayment = (overrides = {}) => Payment.create({
  amount: 15000,
  currency: 'LKR',
  status: 'completed',
  paymentType: 'course',
  paidDate: new Date(),
  ...overrides,
});

const createAttendance = (overrides = {}) => Attendance.create({
  status: 'present',
  date: new Date(Date.UTC(2026, 9, 1)),
  ...overrides,
});

const createEvent = (overrides = {}) => Event.create({
  title: `Event ${nextId()}`,
  description: 'Korean culture workshop',
  eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  ...overrides,
});

const createAnnouncement = async (overrides = {}) => Announcement.create({
  title: `Announcement ${nextId()}`,
  content: 'Classes resume next Monday.',
  createdBy: overrides.createdBy || (await createUser({ role: 'admin' }))._id,
  ...overrides,
});

const createNotification = (overrides = {}) => Notification.create({
  title: `Notification ${nextId()}`,
  message: 'A new lesson has been published.',
  ...overrides,
});

const createForum = (overrides = {}) => DiscussionForum.create({
  title: `Forum ${nextId()}`,
  description: 'Questions about Korean grammar',
  ...overrides,
});

const createJoinUsSubmission = (overrides = {}) => JoinUsSubmission.create({
  name: `Applicant ${nextId()}`,
  email: `applicant${nextId()}@example.com`,
  phone: '0771234567',
  ...overrides,
});

// One listening server per test file. Letting supertest open and close a listener
// on a fresh ephemeral port for every request occasionally hands a request to an
// unrelated local process that picked up the recycled port.
const server = http.createServer(app);
server.listen(0, '127.0.0.1');
afterAll(() => new Promise((resolve) => server.close(resolve)));

const api = () => request(server.listening ? server : app);

module.exports = {
  DEFAULT_PASSWORD,
  api,
  app,
  authHeader,
  tokenFor,
  createUser,
  createStudent,
  createAdmin,
  createInstructor,
  createCourse,
  enrol,
  createPayment,
  createAttendance,
  createEvent,
  createAnnouncement,
  createNotification,
  createForum,
  createJoinUsSubmission,
};
