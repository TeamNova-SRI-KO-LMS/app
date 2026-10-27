const ChatbotEngine = require('../../../services/ChatbotEngine');
const Settings = require('../../../models/Settings');
const Certificate = require('../../../models/Certificate');
const Progress = require('../../../models/Progress');
const {
  createStudent, createInstructor, createAdmin, createCourse, enrol, createAttendance,
  createAnnouncement, createEvent, createForum,
} = require('../../helpers/factories');

const ask = (message, options) => ChatbotEngine.reply(message, options);

describe('Intent recognition', () => {
  test('TC-UNIT-BOT-01 answers a greeting with a Korean welcome [FR-021]', async () => {
    const reply = await ask('Hello!');

    expect(reply.intent).toBe('greeting');
    expect(reply.text).toMatch(/^Annyeonghaseyo! 👋 Welcome to SRI-KO/);
    expect(reply.suggestions).toEqual(ChatbotEngine.suggestionsFor(null));
  });

  test('TC-UNIT-BOT-02 personalizes the greeting prefix for a signed-in student [FR-021]', async () => {
    const student = await createStudent({ name: 'Nimali Perera' });

    const reply = await ask('hi, what courses do you offer?', { user: student });

    expect(reply.intent).toBe('courses');
    expect(reply.text.startsWith('Hi Nimali! ')).toBe(true);
  });

  test('TC-UNIT-BOT-03 recognizes Hangul keywords inside Korean words with particles [FR-021]', async () => {
    const reply = await ask('출석률이 궁금해요');

    expect(reply.intent).toBe('attendance');
  });

  test('TC-UNIT-BOT-04 falls back to a helpful message with contact details [FR-021]', async () => {
    const reply = await ask('qwerty zxcvb');

    expect(reply.intent).toBe('fallback');
    expect(reply.text).toContain("I'm not sure I understood that.");
    expect(reply.links).toEqual([{ label: 'Contact us', to: '/contact' }]);
  });

  test('TC-UNIT-BOT-05 handles thanks, goodbye and capability questions [FR-021]', async () => {
    expect((await ask('thanks a lot')).intent).toBe('thanks');
    expect((await ask('bye')).intent).toBe('goodbye');
    const help = await ask('what can you do?', { user: await createStudent() });

    expect(help.intent).toBe('capabilities');
    expect(help.text).toContain('Your enrolled courses, progress and attendance');
  });
});

describe('Answers built from live data', () => {
  test('TC-UNIT-BOT-06 lists published courses with level, duration and LKR fee [FR-003]', async () => {
    await createCourse({ title: 'Korean for Beginners', price: 15000, duration: 8 });
    await createCourse({ title: 'Business Korean', level: 'intermediate', category: 'Business', price: 25000, duration: 10 });
    await createCourse({ title: 'Hidden Draft', isPublished: false });

    const reply = await ask('What courses do you offer?');

    expect(reply.text).toContain('We currently offer 2 courses:');
    expect(reply.text).toContain('• Korean for Beginners — Beginner · 8 weeks · LKR 15,000');
    expect(reply.text).not.toContain('Hidden Draft');
  });

  test('TC-UNIT-BOT-07 filters courses by level and category [FR-003]', async () => {
    await createCourse({ title: 'Korean for Beginners' });
    await createCourse({ title: 'Business Korean', level: 'intermediate', category: 'Business' });

    const reply = await ask('show me business courses');

    expect(reply.text).toContain('Here is our Business course:');
    expect(reply.text).not.toContain('Korean for Beginners');
  });

  test('TC-UNIT-BOT-08 explains the catalog is being updated when no course is published [FR-003]', async () => {
    const reply = await ask('how much are the courses?');

    expect(reply.intent).toBe('pricing');
    expect(reply.text).toContain('no open courses to show right now');
  });

  test('TC-UNIT-BOT-09 quotes the fee range and free courses [FR-011]', async () => {
    await createCourse({ title: 'Hangul Starter', price: 0 });
    await createCourse({ title: 'TOPIK II Intensive', price: 30000 });
    await createCourse({ title: 'Conversation Club', price: 12000 });

    const reply = await ask('how much does it cost?');

    expect(reply.text).toContain('Course fees range from LKR 12,000 to LKR 30,000.');
    expect(reply.text).toContain('1 course is free.');
  });

  test('TC-UNIT-BOT-10 answers about one course and resolves a follow-up question from context [FR-021]', async () => {
    const course = await createCourse({ title: 'Business Korean Intensive', price: 30000, duration: 12 });

    const detail = await ask('tell me about the Business Korean Intensive course');
    const followUp = await ask('how much is it?', { context: { courseId: String(course._id) } });

    expect(detail.meta).toEqual({ courseId: String(course._id) });
    expect(detail.text).toContain('Fee: LKR 30,000');
    expect(followUp.intent).toBe('pricing');
    expect(followUp.text).toContain('Business Korean Intensive costs LKR 30,000');
  });

  test('TC-UNIT-BOT-11 summarizes the signed-in student\'s attendance [FR-015]', async () => {
    const student = await createStudent();
    const course = await createCourse({ title: 'Korean for Beginners' });
    await createAttendance({ student: student._id, course: course._id, status: 'present', date: new Date('2026-10-01') });
    await createAttendance({ student: student._id, course: course._id, status: 'late', date: new Date('2026-10-02') });

    const reply = await ask('my attendance', { user: student });

    expect(reply.intent).toBe('attendance');
    expect(reply.text).toContain('• Attendance rate: 50%');
    expect(reply.text).toContain('• Last recorded: Oct 2, 2026 (Late, Korean for Beginners)');
    expect(reply.text).toContain('Try to attend more sessions');
  });

  test('TC-UNIT-BOT-12 tells guests and students without records how attendance works [FR-015]', async () => {
    const guest = await ask('how do I mark attendance?');
    const fresh = await ask('my attendance', { user: await createStudent() });

    expect(guest.links[0]).toEqual({ label: 'Sign in', to: '/login' });
    expect(fresh.text).toContain("You haven't recorded any attendance yet.");
  });

  test('TC-UNIT-BOT-13 reports enrolled courses with progress [FR-005]', async () => {
    const student = await createStudent();
    const course = await createCourse({ title: 'Korean for Beginners' });
    const progress = await enrol(student, course);
    progress.overallProgress = 42;
    await progress.save();

    const reply = await ask('My courses and progress', { user: await student.constructor.findById(student._id) });

    expect(reply.text).toContain("You're enrolled in 1 course:");
    expect(reply.text).toContain('• Korean for Beginners — 42% complete');
  });

  // Phrase keywords are matched literally, and the plural "my courses" keyword is
  // removed as a duplicate of "my course" — so the plain question lists the catalog.
  test.failing('TC-UNIT-BOT-21 [KNOWN DEFECT DEF-12] "my courses" answers with the student\'s own courses [FR-005]', async () => {
    const student = await createStudent();
    await enrol(student, await createCourse({ title: 'Korean for Beginners' }));

    const reply = await ask('my courses', { user: await student.constructor.findById(student._id) });

    expect(reply.intent).toBe('myCourses');
  });

  test('TC-UNIT-BOT-14 reports certificates and completed courses [FR-005]', async () => {
    const student = await createStudent();
    const course = await createCourse();
    await Progress.create({ student: student._id, course: course._id, isCompleted: true });

    const pending = await ask('do I have a certificate?', { user: student });
    await Certificate.create({
      student: student._id, course: course._id, certificateNumber: 'SRIKO-0001', studentName: student.name,
      courseName: course.title, issuedBy: (await createAdmin())._id,
    });
    const issued = await ask('certificate', { user: student });

    expect(pending.text).toContain("You've completed 1 course");
    expect(issued.text).toContain('You have 1 certificate');
  });

  test('TC-UNIT-BOT-15 lists current announcements and upcoming events [FR-016][FR-018]', async () => {
    await createAnnouncement({ title: 'Exam timetable published', isPinned: true });
    await createAnnouncement({ title: 'Old notice', endDate: new Date('2020-01-01') });
    await createEvent({ title: 'Chuseok Celebration', location: 'Kadawata' });

    const news = await ask('latest announcements');
    const events = await ask('any upcoming events?');

    expect(news.text).toContain('• Exam timetable published (pinned)');
    expect(news.text).not.toContain('Old notice');
    expect(events.text).toContain('Chuseok Celebration');
    expect(events.text).toContain('(Kadawata)');
  });

  test('TC-UNIT-BOT-16 uses the contact details configured by the administrator [FR-024]', async () => {
    await Settings.create({ contactEmail: 'office@sriko.lk', contactPhone: '011 222 3333', contactAddress: 'Kadawata' });

    const reply = await ask('how can I contact you?');

    expect(reply.text).toContain('• Phone: 011 222 3333');
    expect(reply.text).toContain('• Email: office@sriko.lk');
    expect(reply.text).toContain('• Address: Kadawata');
  });

  test('TC-UNIT-BOT-17 explains Korean basics and suggests related topics [FR-021]', async () => {
    const hangul = await ask('explain hangul');
    const topik = await ask('what is the TOPIK exam?');
    const general = await ask('korean basics');

    expect(hangul.text).toContain('King Sejong');
    expect(hangul.suggestions).not.toContain('Explain Hangul');
    expect(topik.text).toContain('TOPIK I — levels 1–2');
    expect(general.suggestions).toContain('Explain Hangul');
  });

  test('TC-UNIT-BOT-18 tailors enrolment and payment guidance [FR-004][FR-011]', async () => {
    const instructor = await createInstructor();

    const guestEnrol = await ask('how do I enroll?');
    const instructorEnrol = await ask('how do I enroll?', { user: instructor });
    const refund = await ask('can I get a refund on my payment?');

    expect(guestEnrol.links[0]).toEqual({ label: 'Create an account', to: '/register' });
    expect(instructorEnrol.text).toContain('Instructor accounts teach courses');
    expect(refund.text).toContain('14-day money-back guarantee');
  });

  test('TC-UNIT-BOT-19 answers schedule, account and forum questions [FR-019][FR-023]', async () => {
    await createCourse({ duration: 6 });
    await createCourse({ duration: 12 });
    await createForum({ title: 'Grammar corner' });

    const schedule = await ask('what is the class schedule?');
    const account = await ask('I forgot my password');
    const forum = await ask('is there a discussion forum?');

    expect(schedule.text).toContain('Our courses run for 6 to 12 weeks');
    expect(account.text).toContain('6-digit code');
    expect(forum.text).toContain('• Grammar corner');
  });

  test('TC-UNIT-BOT-20 only returns in-app links [OWASP-A10]', async () => {
    const reply = await ask('contact');

    reply.links.forEach((link) => expect(link.to.startsWith('/')).toBe(true));
  });
});
