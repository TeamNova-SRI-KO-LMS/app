const ChatbotEngine = require('../../../services/ChatbotEngine');
const Settings = require('../../../models/Settings');
const Certificate = require('../../../models/Certificate');
const Progress = require('../../../models/Progress');
const Assignment = require('../../../models/Assignment');
const AssignmentSubmission = require('../../../models/AssignmentSubmission');
const LectureMaterial = require('../../../models/LectureMaterial');
const {
  createStudent, createInstructor, createAdmin, createCourse, enrol, createAttendance,
  createAnnouncement, createEvent, createForum, createNotification,
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

  test('TC-UNIT-BOT-04 falls back to a helpful message with the Contact page details [FR-021]', async () => {
    const reply = await ask('qwerty zxcvb');

    expect(reply.intent).toBe('fallback');
    expect(reply.text).toContain("Sorry, I don't have an answer for that yet.");
    expect(reply.text).toContain('+94 77 307 9412 · info@sriko-korean.com');
    expect(reply.links).toEqual([{ label: 'Contact us', to: '/contact' }, { label: 'Help Center', to: '/help' }]);
    expect(reply.suggestions).toContain('What can you do?');
  });

  test('TC-UNIT-BOT-05 handles thanks, goodbye and capability questions [FR-021]', async () => {
    expect((await ask('thanks a lot')).intent).toBe('thanks');
    expect((await ask('bye')).intent).toBe('goodbye');
    const help = await ask('what can you do?', { user: await createStudent() });
    const guestHelp = await ask('what can you do?');

    expect(help.intent).toBe('capabilities');
    expect(help.text).toContain('Your learning — your courses and progress, assignments and grades');
    expect(help.suggestions).toContain('My assignments');
    expect(guestHelp.text).toContain('(sign in for your own details)');
  });

  test('TC-UNIT-BOT-22 understands capability questions in other word orders and chat shorthand [FR-021]', async () => {
    const questions = ['what you can do', 'What can u do?', 'what do you do', 'how can you help me', 'help', 'who are you', 'are you a bot?', 'what can I ask you', 'what services do you provide'];

    const intents = await Promise.all(questions.map(async (question) => (await ask(question)).intent));

    expect(intents).toEqual(questions.map(() => 'capabilities'));
  });

  test('TC-UNIT-BOT-23 answers the topic of a question phrased like a capability question [FR-021]', async () => {
    const fees = await ask('what can you tell me about fees?');
    const greetedHelp = await ask('hi, what can you do?');

    expect(fees.intent).toBe('pricing');
    expect(greetedHelp.intent).toBe('capabilities');
    expect(greetedHelp.text.startsWith('Hi! ')).toBe(true);
  });

  test('TC-UNIT-BOT-24 tolerates typos and plurals in key terms [FR-021]', async () => {
    expect((await ask('my atendance')).intent).toBe('attendance');
    expect((await ask('certifcate')).intent).toBe('certificate');
    expect((await ask('do you have evening classes?')).intent).toBe('schedule');
    expect((await ask('do you have physical classes?')).intent).toBe('about');
    expect((await ask('my classes', { user: await createStudent() })).intent).toBe('myCourses');
  });

  test('TC-UNIT-BOT-25 lets a core term outweigh generic words such as "when" or "due" [FR-021]', async () => {
    const payment = await ask('When is the payment due?');
    const failed = await ask('my payment failed');
    const assignment = await ask('when is my assignment due?');

    expect(payment.intent).toBe('payment');
    expect(failed.text).toContain("you're only charged when the payment succeeds");
    expect(assignment.intent).toBe('assignments');
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

  // DEF-12 (fixed): phrases also match their singular form, so "my courses" matches "my course".
  test('TC-UNIT-BOT-21 "my courses" answers with the student\'s own courses [FR-005]', async () => {
    const student = await createStudent();
    await enrol(student, await createCourse({ title: 'Korean for Beginners' }));

    const reply = await ask('my courses', { user: await student.constructor.findById(student._id) });

    expect(reply.intent).toBe('myCourses');
    expect(reply.text).toContain('• Korean for Beginners — 0% complete');
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

describe('Answers about the rest of the platform', () => {
  const DAY = 24 * 60 * 60 * 1000;

  const enrolledStudent = async (course) => {
    const student = await createStudent();
    await enrol(student, course);
    return student.constructor.findById(student._id);
  };

  test('TC-UNIT-BOT-26 lists a student\'s assignments by status, with grades [FR-020]', async () => {
    const course = await createCourse({ title: 'Korean for Beginners' });
    const student = await enrolledStudent(course);
    const assign = (title, days, maxScore = 20) => Assignment.create({
      course: course._id, title, description: 'Do it', dueDate: new Date(Date.now() + days * DAY), maxScore,
    });
    await assign('Write 10 sentences', 3, 50);
    await assign('Hangul worksheet', -2);
    const waiting = await assign('Self-introduction video', -5, 30);
    const graded = await assign('Numbers drill', -9, 10);
    await AssignmentSubmission.create([
      { assignment: waiting._id, course: course._id, student: student._id, status: 'late' },
      { assignment: graded._id, course: course._id, student: student._id, status: 'graded', grade: 9 },
    ]);

    const reply = await ask('my assignments', { user: student });

    expect(reply.intent).toBe('assignments');
    expect(reply.text).toContain('You have 4 assignments: 1 to do, 1 overdue, 1 waiting for a grade, 1 graded.');
    expect(reply.text).toMatch(/• Write 10 sentences — due \w{3} \d{1,2}, \d{4}/);
    expect(reply.text).toMatch(/• Hangul worksheet — overdue since \w{3} \d{1,2}, \d{4}/);
    expect(reply.text).toContain('• Self-introduction video — submitted late, waiting for a grade');
    expect(reply.text).toContain('• Numbers drill — graded: 9/10');
    expect(reply.links[0]).toEqual({ label: 'Open classroom', to: `/course-info/${course._id}` });
  });

  test('TC-UNIT-BOT-27 explains assignments to guests and to students without any [FR-020]', async () => {
    const guest = await ask('how do I submit my homework?');
    const notEnrolled = await ask('my assignments', { user: await createStudent() });
    const noneYet = await ask('my assignments', { user: await enrolledStudent(await createCourse()) });

    expect(guest.text).toContain('up to 5 files, 50 MB each');
    expect(guest.links[0]).toEqual({ label: 'Sign in', to: '/login' });
    expect(notEnrolled.text).toContain("You're not enrolled in a course yet");
    expect(noneYet.text).toContain("Your courses don't have any assignments yet.");
  });

  test('TC-UNIT-BOT-28 points to lesson videos and materials [FR-007]', async () => {
    const course = await createCourse({ title: 'Korean for Beginners' });
    await LectureMaterial.create([
      { course: course._id, lessonTitle: 'Week 1', title: 'Intro video', type: 'video' },
      { course: course._id, lessonTitle: 'Week 1', title: 'Hangul chart', type: 'pdf' },
    ]);

    const guest = await ask('how do I watch the lesson videos?');
    const student = await ask('lesson videos', { user: await enrolledStudent(course) });

    expect(guest.intent).toBe('materials');
    expect(guest.text).toContain('free previews are open to everyone');
    expect(student.text).toContain('• Korean for Beginners — 2 learning materials');
    expect(student.links[0]).toEqual({ label: 'Open classroom', to: `/course-info/${course._id}` });
  });

  test('TC-UNIT-BOT-29 counts unread notifications with the same audience rules as the bell [FR-017]', async () => {
    const student = await createStudent();
    const other = await createStudent();
    await createNotification({ title: 'New lesson published', targetAudience: 'all' });
    await createNotification({ title: 'Student meeting', targetAudience: 'students' });
    await createNotification({ title: 'Your grade is ready', targetAudience: 'specific_users', targetUsers: [student._id] });
    await createNotification({ title: 'Someone else', targetAudience: 'specific_users', targetUsers: [other._id] });
    await createNotification({ title: 'Already read', targetAudience: 'all', readBy: [{ user: student._id }] });

    const reply = await ask('my notifications', { user: student });
    const guest = await ask('notifications');

    expect(reply.text).toContain('You have 3 unread notifications:');
    expect(reply.text).not.toMatch(/Someone else|Already read/);
    expect(guest.links).toEqual([{ label: 'Sign in', to: '/login' }]);
  });

  test('TC-UNIT-BOT-30 answers about the institute, profile, policies and technical problems [FR-021]', async () => {
    await createCourse();

    const about = await ask('tell me about SRI-KO');
    const profile = await ask('how do I change my profile picture?', { user: await createStudent() });
    const policies = await ask('privacy policy');
    const support = await ask('the website is not working');

    expect(about.text).toContain('Mr. Nandana Kekulawala');
    expect(about.text).toContain('We currently offer 1 course on this platform.');
    expect(profile.links).toEqual([{ label: 'Profile', to: '/profile' }, { label: 'Settings', to: '/settings' }]);
    expect(policies.links).toEqual([{ label: 'Terms of Service', to: '/terms' }, { label: 'Privacy Policy', to: '/privacy' }]);
    expect(support.text).toContain('Refresh the page');
    expect(support.links).toContainEqual({ label: 'Help Center', to: '/help' });
  });

  test('TC-UNIT-BOT-31 gives the Contact page phone and hours when Settings has none [FR-022]', async () => {
    const reply = await ask('what is your phone number?');

    expect(reply.intent).toBe('contact');
    expect(reply.text).toContain('• Phone: +94 77 307 9412');
    expect(reply.text).toContain('Sat 9:00 AM – 1:00 PM');
  });

  test('TC-UNIT-BOT-32 teaches Korean particles and a self-introduction [FR-021]', async () => {
    const particles = await ask('explain korean particles');
    const introduction = await ask('how do I introduce myself in korean?');

    expect(particles.text).toContain('은 / 는 — topic');
    expect(introduction.text).toContain('스리랑카에서 왔어요');
    expect(introduction.suggestions).not.toContain('Introduce myself in Korean');
  });

  test('TC-UNIT-BOT-33 links the forum page and tells guests how to join an event [FR-018][FR-019]', async () => {
    await createForum({ title: 'Grammar corner' });
    await createEvent({ title: 'Chuseok Celebration' });

    const forum = await ask('discussion forum');
    const events = await ask('upcoming events');

    expect(forum.links).toEqual([{ label: 'Forum', to: '/forum' }, { label: 'Sign in', to: '/login' }]);
    expect(events.text).toContain('choose Register Interest (sign in first)');
  });
});
