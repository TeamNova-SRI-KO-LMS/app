#!/usr/bin/env node
/**
 * Seeds a LOCAL database with demonstration data for end-to-end tests, screenshots
 * and load tests:  MONGODB_URI=mongodb://127.0.0.1:27017/sriko_demo node tests/fixtures/seedDemoData.js
 *
 * It wipes the target database first, so it refuses any URI that is not a local
 * or CI container database. All people, courses and records are fictional.
 */
const mongoose = require('mongoose');

const User = require('../../models/User');
const Course = require('../../models/Course');
const Progress = require('../../models/Progress');
const Payment = require('../../models/Payment');
const Attendance = require('../../models/Attendance');
const Announcement = require('../../models/Announcement');
const Event = require('../../models/Event');
const Notification = require('../../models/Notification');
const DiscussionForum = require('../../models/DiscussionForum');
const DiscussionPost = require('../../models/DiscussionPost');
const JoinUsSubmission = require('../../models/JoinUsSubmission');
const LectureMaterial = require('../../models/LectureMaterial');
const Assignment = require('../../models/Assignment');
const AssignmentSubmission = require('../../models/AssignmentSubmission');
const Certificate = require('../../models/Certificate');
const Settings = require('../../models/Settings');

const DEMO_PASSWORD = 'Demo@1234';
const DAY = 24 * 60 * 60 * 1000;
const LOCAL_HOSTS = /^mongodb:\/\/(127\.0\.0\.1|localhost|mongo|mongodb)(:\d+)?\//;

// Deterministic pseudo-random numbers, so every run produces the same data set.
let seed = 20261021;
const random = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const utcDay = (offsetDays) => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) + offsetDays * DAY);
};

const backdate = (Model, id, createdAt) => Model.collection.updateOne({ _id: id }, { $set: { createdAt, updatedAt: createdAt } });

const lessons = (titles) => titles.map((title, index) => ({ title, type: index % 3 === 2 ? 'quiz' : 'video', duration: 20 + (index % 4) * 5 }));

async function seedDemoData() {
  const uri = process.env.MONGODB_URI || '';
  if (!LOCAL_HOSTS.test(uri)) {
    throw new Error(`Refusing to seed "${uri.replace(/\/\/[^@]*@/, '//***@')}": only local or CI databases may be wiped.`);
  }

  await mongoose.connect(uri);
  await mongoose.connection.dropDatabase();
  await Promise.all([User, Attendance, AssignmentSubmission, Certificate].map((Model) => Model.init()));

  const admin = await User.create({ name: 'SRI-KO Administrator', email: 'admin@sriko.demo', password: DEMO_PASSWORD, role: 'admin' });
  const instructor = await User.create({ name: 'Nandana Kekulawala', email: 'instructor@sriko.demo', password: DEMO_PASSWORD, role: 'instructor', bio: 'Founder and lead Korean instructor.' });

  const studentNames = ['Nimali Perera', 'Kasun Silva', 'Tharushi Fernando', 'Dilan Jayasinghe', 'Sachini Wickramasinghe', 'Ravindu Bandara', 'Hiruni Gunasekara', 'Pasindu Ekanayake'];
  const students = [];
  for (const [index, name] of studentNames.entries()) {
    const email = index === 0 ? 'student@sriko.demo' : `${name.split(' ')[0].toLowerCase()}@sriko.demo`;
    const student = await User.create({
      name, email, password: DEMO_PASSWORD, role: 'student', phone: `07712345${String(index).padStart(2, '0')}`,
      location: ['Gampaha', 'Kadawata', 'Colombo', 'Kandy'][index % 4], lastLogin: new Date(Date.now() - index * 3 * 60 * 60 * 1000),
    });
    await backdate(User, student._id, new Date(Date.now() - (200 - index * 22) * DAY));
    students.push(student);
  }

  const courseData = [
    { title: 'Korean for Beginners (TOPIK I)', level: 'beginner', category: 'Language', price: 15000, duration: 12, thumbnail: '/event1.png',
      description: 'Learn Hangul, everyday expressions and the grammar needed for TOPIK I, with weekly speaking practice.',
      weeks: [['Hangul vowels', 'Hangul consonants', 'Hangul quiz'], ['Greetings and introductions', 'Numbers and counting', 'Week 2 quiz']] },
    { title: 'EPS-TOPIK Exam Preparation', level: 'intermediate', category: 'Language', price: 25000, duration: 10, thumbnail: '/event2.png',
      description: 'Focused preparation for the EPS-TOPIK test for workers seeking employment in South Korea.',
      weeks: [['Workplace vocabulary', 'Listening strategies', 'Mock test 1'], ['Safety signs and instructions', 'Reading practice', 'Mock test 2']] },
    { title: 'Business Korean', level: 'advanced', category: 'Business', price: 45000, duration: 8, thumbnail: '/reghero1.png',
      description: 'Formal speech levels, business email writing and meeting etiquette for professionals.',
      weeks: [['Honorifics at work', 'Business email', 'Role-play assessment']] },
    { title: 'Korean Conversation Club', level: 'intermediate', category: 'Conversation', price: 12000, duration: 6, thumbnail: '/unreghero.jpg',
      description: 'Weekly guided conversation sessions to build fluency and confidence in everyday Korean.',
      weeks: [['Talking about your day', 'Shopping and food', 'Conversation check']] },
    { title: 'Korean Culture and Etiquette', level: 'beginner', category: 'Culture', price: 0, duration: 4, thumbnail: '/aboutwall2.png',
      description: 'A free introduction to Korean customs, food culture, holidays and social etiquette.',
      weeks: [['Holidays and traditions', 'Food culture', 'Culture quiz']] },
    { title: 'TOPIK II Intensive', level: 'advanced', category: 'Grammar', price: 35000, duration: 12, thumbnail: '/girl_AI.png', isPublished: false,
      description: 'Advanced grammar, essay writing and reading strategies for TOPIK II levels 3 to 6.',
      weeks: [['Connective endings', 'Essay structure', 'Writing task']] },
  ];

  const courses = [];
  for (const [index, data] of courseData.entries()) {
    const { weeks, ...fields } = data;
    const course = await Course.create({
      isPublished: true, ...fields, instructor: instructor._id,
      curriculum: weeks.map((titles, week) => ({ week: week + 1, title: `Week ${week + 1}`, lessons: lessons(titles) })),
      tags: [fields.category.toLowerCase(), fields.level],
    });
    await backdate(Course, course._id, new Date(Date.now() - (180 - index * 25) * DAY));
    courses.push(course);
  }

  // Enrolments, progress, payments and attendance
  const enrolments = [
    [0, [0, 4]], [1, [0, 1]], [2, [1, 3]], [3, [0, 2]], [4, [3, 4]], [5, [1]], [6, [0, 3]], [7, [2, 4]],
  ];
  const statuses = ['present', 'present', 'present', 'present', 'present', 'present', 'present', 'late', 'excused', 'absent'];
  const attendanceRows = [];
  for (const [studentIndex, courseIndexes] of enrolments) {
    const student = students[studentIndex];
    for (const courseIndex of courseIndexes) {
      const course = courses[courseIndex];
      const progressValue = Math.round(15 + random() * 80);
      const lessonIds = course.curriculum.flatMap((week) => week.lessons.map((lesson) => lesson._id));
      const completedCount = Math.round((progressValue / 100) * lessonIds.length);
      const progress = await Progress.create({
        student: student._id, course: course._id, overallProgress: studentIndex === 0 && courseIndex === 4 ? 100 : progressValue,
        isCompleted: studentIndex === 0 && courseIndex === 4, completionDate: studentIndex === 0 && courseIndex === 4 ? new Date(Date.now() - 5 * DAY) : undefined,
        currentWeek: 1 + Math.floor(random() * 2), timeSpent: Math.round(120 + random() * 900),
        completedLessons: lessonIds.slice(0, completedCount).map((lesson, i) => ({ lesson, completedAt: new Date(Date.now() - (completedCount - i) * 2 * DAY) })),
      });
      const enrolledAt = new Date(Date.now() - (120 - studentIndex * 9 - courseIndex * 3) * DAY);
      await backdate(Progress, progress._id, enrolledAt);
      await Course.updateOne({ _id: course._id }, { $addToSet: { enrolledStudents: student._id } });
      await User.updateOne({ _id: student._id }, { $addToSet: { enrolledCourses: course._id } });

      if (course.price > 0) {
        await Payment.create({
          user: student._id, course: course._id, paymentType: 'course', amount: course.price, currency: 'LKR', status: 'completed',
          paymentGateway: studentIndex % 3 === 0 ? 'manual' : 'stripe', paymentMethod: studentIndex % 3 === 0 ? 'bank_transfer' : 'credit_card',
          paidDate: enrolledAt, paymentDate: enrolledAt, receiptNumber: `SRIKO-REC-${1000 + attendanceRows.length}-${studentIndex}${courseIndex}`,
          gatewayTransactionId: `demo_txn_${studentIndex}_${courseIndex}`,
        });
      }

      for (let offset = -29; offset <= 0; offset += 1) {
        const day = utcDay(offset);
        if (day.getUTCDay() === 0 || day.getUTCDay() === 6 || random() < 0.15) continue;
        const status = statuses[Math.floor(random() * statuses.length)];
        attendanceRows.push({
          student: student._id, course: course._id, date: day, status, recordedBy: student._id,
          notes: status === 'excused' ? 'Medical appointment' : status === 'late' ? 'Bus delay' : '',
        });
      }
    }
  }
  await Attendance.insertMany(attendanceRows);

  await Payment.create([
    { user: students[5]._id, course: courses[3]._id, amount: 12000, status: 'pending', paymentMethod: 'bank_transfer', paymentGateway: 'manual', notes: 'Bank slip uploaded, awaiting verification' },
    { user: students[6]._id, course: courses[2]._id, amount: 45000, status: 'failed', failureReason: 'Card declined', gatewayTransactionId: 'demo_failed_1' },
  ]);

  await Certificate.create({
    student: students[0]._id, course: courses[4]._id, certificateNumber: 'SRIKO-CERT-2026-0001', studentName: students[0].name,
    courseName: courses[4].title, completionDate: new Date(Date.now() - 5 * DAY), issuedDate: new Date(Date.now() - 4 * DAY), issuedBy: admin._id, status: 'issued',
  });

  await Course.updateOne({ _id: courses[0]._id }, {
    $push: { reviews: { $each: [
      { user: students[0]._id, rating: 5, comment: 'Clear explanations and friendly classes.' },
      { user: students[1]._id, rating: 4, comment: 'Hangul lessons were very well structured.' },
    ] } },
    $set: { averageRating: 4.5 },
  });

  await Announcement.create([
    { title: 'TOPIK mock examination on Saturday', content: 'All TOPIK I students will sit a full mock examination this Saturday at 9.00 a.m. Please arrive 15 minutes early.', type: 'academic', priority: 'high', isPinned: true, createdBy: admin._id, targetAudience: 'students' },
    { title: 'New Business Korean intake', content: 'Registrations are open for the next Business Korean intake starting next month.', type: 'course', priority: 'medium', createdBy: admin._id },
    { title: 'Office closed for Poya day', content: 'The institute office will be closed on the Poya holiday. Online classes continue as scheduled.', type: 'general', priority: 'low', createdBy: admin._id },
    { title: 'Scheduled maintenance', content: 'The learning platform will be unavailable for 30 minutes on Sunday night for maintenance.', type: 'maintenance', priority: 'medium', createdBy: admin._id },
  ]);

  await Event.create([
    { title: 'Chuseok Cultural Celebration', description: 'Celebrate the Korean harvest festival with traditional games, hanbok try-on and food.', eventDate: new Date(Date.now() + 6 * DAY), location: 'Kadawata', category: 'cultural', organizer: admin._id, isPinned: true, capacity: 60, coverImage: '/event1.png', attendees: [students[0]._id, students[2]._id] },
    { title: 'EPS-TOPIK Strategy Webinar', description: 'Live online session on time management and common mistakes in the EPS-TOPIK test.', eventDate: new Date(Date.now() + 12 * DAY), location: 'Online', meetingLink: 'https://meet.example.com/sriko-eps', category: 'webinar', organizer: admin._id, coverImage: '/event2.png' },
    { title: 'Hangul Day Workshop', description: 'A hands-on calligraphy and Hangul history workshop for all levels.', eventDate: new Date(Date.now() + 20 * DAY), location: 'Kadawata', category: 'workshop', organizer: admin._id, capacity: 30 },
    { title: 'Graduation Ceremony 2026', description: 'Certificate ceremony for students who completed their courses this year.', eventDate: new Date(Date.now() - 20 * DAY), location: 'Gampaha', category: 'ceremony', status: 'completed', organizer: admin._id },
  ]);

  await Notification.create([
    { title: 'Welcome to SRI-KO LMS', message: 'Your account is ready. Explore the course catalogue to get started.', type: 'system', targetAudience: 'all', createdBy: admin._id },
    { title: 'Week 2 lessons published', message: 'New lessons are available in Korean for Beginners (TOPIK I).', type: 'course_update', targetAudience: 'students', createdBy: admin._id, isPinned: true },
    { title: 'Payment reminder', message: 'Your Conversation Club payment is awaiting verification.', type: 'payment_due', priority: 'high', targetAudience: 'specific_users', targetUsers: [students[5]._id], createdBy: admin._id },
  ]);

  const forums = await DiscussionForum.create([
    { title: 'Hangul and Pronunciation Help', description: 'Ask questions about reading Hangul, batchim and pronunciation rules.', category: 'korean-basics', level: 'beginner', isPinned: true, createdBy: instructor._id },
    { title: 'EPS-TOPIK Study Group', description: 'Share study plans, mock test scores and tips for the EPS-TOPIK exam.', category: 'study-tips', level: 'intermediate', createdBy: admin._id },
    { title: 'Korean Culture Corner', description: 'Talk about Korean food, dramas, music and traditions.', category: 'culture', level: 'all', createdBy: admin._id },
  ]);
  const post = await DiscussionPost.create({ forum: forums[0]._id, author: students[0]._id, title: 'When is ㅇ silent?', content: 'Is ㅇ always silent at the start of a syllable?', replies: [{ author: instructor._id, content: 'Yes. At the start of a syllable ㅇ is silent; as a final consonant it sounds like "ng".' }], replyCount: 1, likeCount: 2, likes: [{ user: students[1]._id }, { user: students[2]._id }] });
  await DiscussionForum.updateOne({ _id: forums[0]._id }, { $set: { postCount: 1, lastPost: { post: post._id, author: instructor._id, date: new Date() } } });

  await JoinUsSubmission.create([
    { name: 'Malith Herath', email: 'malith.herath@example.com', phone: '0711234567', age: 23, currentLevel: 'Complete Beginner', preferredTime: 'Weekend Classes', interests: ['Korean Language Basics'], hearAboutUs: 'social-media', message: 'I want to prepare for EPS-TOPIK.' },
    { name: 'Dulani Rathnayake', email: 'dulani.r@example.com', phone: '0759876543', age: 27, currentLevel: 'Beginner', preferredTime: 'Evening (6:00 PM - 9:00 PM)', interests: ['Business Korean', 'Korean Culture'], hearAboutUs: 'referral', status: 'in_progress', contactedAt: new Date() },
    { name: 'Chamod Perera', email: 'chamod.p@example.com', phone: '0761122334', age: 19, currentLevel: 'Intermediate', preferredTime: 'Flexible Schedule', interests: ['K-Pop & K-Drama'], hearAboutUs: 'website', status: 'resolved' },
  ]);

  await LectureMaterial.create([
    { course: courses[0]._id, weekNumber: 1, lessonIndex: 0, lessonTitle: 'Hangul vowels', title: 'Introduction to Hangul vowels', type: 'link', externalUrl: 'https://www.youtube.com/embed/demo-vowels', embedUrl: 'https://www.youtube.com/embed/demo-vowels', isPreview: true, uploadedBy: admin._id },
    { course: courses[0]._id, weekNumber: 1, lessonIndex: 1, lessonTitle: 'Hangul consonants', title: 'Consonant chart (PDF)', type: 'link', externalUrl: 'https://example.com/consonants.pdf', uploadedBy: admin._id },
  ]);

  const assignment = await Assignment.create({ course: courses[0]._id, weekNumber: 1, lessonTitle: 'Hangul consonants', title: 'Write your name in Hangul', description: 'Write your full name in Hangul and record yourself reading it.', dueDate: new Date(Date.now() + 7 * DAY), maxScore: 20, createdBy: admin._id });
  await AssignmentSubmission.create({ assignment: assignment._id, course: courses[0]._id, student: students[0]._id, files: [{ fileName: 'my-name.pdf', fileUrl: 'https://example.com/my-name.pdf' }], status: 'graded', grade: 18, feedback: 'Excellent handwriting.', gradedBy: admin._id, gradedAt: new Date() });

  await Settings.create({
    siteName: 'SRI-KO LMS', contactEmail: 'info@sriko-korean.com', contactPhone: '+94 11 234 5678', contactAddress: 'Kadawata, Gampaha, Sri Lanka',
    systemSettings: { timezone: 'Asia/Colombo' }, lastUpdatedBy: admin._id,
  });

  const summary = {
    users: await User.countDocuments(), courses: await Course.countDocuments(), attendance: await Attendance.countDocuments(),
    payments: await Payment.countDocuments(), events: await Event.countDocuments(),
  };
  await mongoose.disconnect();
  return summary;
}

if (require.main === module) {
  seedDemoData()
    .then((summary) => {
      console.log('Demo data seeded:', summary);
      console.log(`Sign in with admin@sriko.demo or student@sriko.demo and the password ${DEMO_PASSWORD}`);
    })
    .catch(async (error) => {
      console.error(error.message);
      await mongoose.disconnect();
      process.exit(1);
    });
}

module.exports = { seedDemoData, DEMO_PASSWORD };
