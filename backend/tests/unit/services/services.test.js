const fs = require('fs');
const NotificationEngine = require('../../../services/NotificationEngine');
const socketManager = require('../../../socket/socketManager');
const Notification = require('../../../models/Notification');
const { createStudent, createInstructor, createAdmin } = require('../../helpers/factories');

describe('NotificationEngine', () => {
  test('TC-UNIT-SVC-01 persists an in-app notification and counts its audience [FR-017]', async () => {
    const admin = await createAdmin();
    await createStudent();
    await createStudent();
    const broadcast = jest.spyOn(socketManager, 'broadcast');

    const notification = await NotificationEngine.dispatch({ title: 'Welcome', message: 'Classes start Monday' }, admin._id);

    expect(await Notification.countDocuments()).toBe(1);
    expect(notification.deliveryMethods.toObject()).toEqual({ inApp: true, email: false, sms: false });
    expect(notification.deliveryStats.totalSent).toBe(3);
    expect(notification.createdBy.name).toBe(admin.name);
    expect(broadcast).toHaveBeenCalledWith('notification:new', expect.objectContaining({ title: 'Welcome', isRead: false }));
  });

  test('TC-UNIT-SVC-02 routes each audience to the matching Socket.IO room [FR-017]', async () => {
    const student = await createStudent();
    await createInstructor();
    const sendToRole = jest.spyOn(socketManager, 'sendToRole');
    const sendToUser = jest.spyOn(socketManager, 'sendToUser');
    const sendToCourse = jest.spyOn(socketManager, 'sendToCourse');
    const broadcast = jest.spyOn(socketManager, 'broadcast');
    const courseId = '64b7f0a0a0a0a0a0a0a0a0a0';

    const students = await NotificationEngine.dispatch({ title: 's', message: 'm', targetAudience: 'students' });
    const instructors = await NotificationEngine.dispatch({ title: 'i', message: 'm', targetAudience: 'instructors' });
    const admins = await NotificationEngine.dispatch({ title: 'a', message: 'm', targetAudience: 'admins' });
    const users = await NotificationEngine.dispatch({ title: 'u', message: 'm', targetAudience: 'specific_users', targetUsers: [student._id] });
    const courses = await NotificationEngine.dispatch({ title: 'c', message: 'm', targetAudience: 'specific_courses', targetCourses: [courseId] });

    expect(students.deliveryStats.totalSent).toBe(1);
    expect(instructors.deliveryStats.totalSent).toBe(1);
    expect(admins.deliveryStats.totalSent).toBe(0);
    expect(users.deliveryStats.totalSent).toBe(1);
    expect(courses.deliveryStats.totalSent).toBe(0);
    expect(sendToRole.mock.calls.map(([role]) => role)).toEqual(['student', 'instructor', 'admin']);
    expect(sendToUser).toHaveBeenCalledWith(student._id.toString(), 'notification:new', expect.any(Object));
    expect(sendToCourse).toHaveBeenCalledWith(courseId, 'notification:new', expect.any(Object));
    expect(broadcast).not.toHaveBeenCalled();
  });

  test('TC-UNIT-SVC-03 rethrows when the notification cannot be saved [NFR-002]', async () => {
    await expect(NotificationEngine.dispatch({ title: 'Missing message' })).rejects.toThrow(/message/);
  });

  test('TC-UNIT-SVC-04 resolveTargetUsers falls back to an empty list on errors [NFR-002]', async () => {
    jest.spyOn(require('../../../models/User'), 'find').mockImplementation(() => { throw new Error('offline'); });

    await expect(NotificationEngine.resolveTargetUsers({ targetAudience: 'all' })).resolves.toEqual([]);
  });

  test('TC-UNIT-SVC-05 event hooks build the expected notifications [FR-017]', async () => {
    const student = await createStudent();
    const admin = await createAdmin();

    const enrolled = await NotificationEngine.onCourseEnrolled(student._id, 'TOPIK I');
    const paid = await NotificationEngine.onPaymentReceived(student._id, 15000, 'TOPIK I');
    const due = await NotificationEngine.onPaymentDue(student._id, 15000, new Date(Date.now() + 86400000));
    const certificate = await NotificationEngine.onCertificateReady(student._id, 'TOPIK I');
    const reply = await NotificationEngine.onForumReply(student._id, 'Kamal', 'Grammar');
    const maintenance = await NotificationEngine.onSystemMaintenance('Upgrade tonight', new Date(Date.now() + 86400000), admin._id);

    expect(enrolled).toMatchObject({ title: 'Enrolled in TOPIK I', type: 'course_update', targetAudience: 'specific_users' });
    expect(paid.message).toContain('LKR 15000');
    expect(due.priority).toBe('high');
    expect(certificate.actionUrl).toBe('/dashboard');
    expect(reply.title).toBe('💬 New reply from Kamal');
    expect(maintenance).toMatchObject({ priority: 'urgent', isPinned: true, targetAudience: 'all' });
  });

  test('TC-UNIT-SVC-06 maps announcement audiences to notification audiences [FR-016]', async () => {
    const admin = await createAdmin();

    const students = await NotificationEngine.onAnnouncementCreated({ title: 'Exam', content: 'x'.repeat(300), targetAudience: 'Intermediate Scholars' }, admin._id);
    const staff = await NotificationEngine.onAnnouncementCreated({ title: 'Staff meeting', targetAudience: 'teachers' }, admin._id);
    const admins = await NotificationEngine.onAnnouncementCreated({ title: 'Audit', targetAudience: 'admin' }, admin._id);
    const everyone = await NotificationEngine.onAnnouncementCreated({ title: 'Holiday' }, admin._id);

    expect(students.targetAudience).toBe('students');
    expect(students.message).toHaveLength(203);
    expect(staff.targetAudience).toBe('instructors');
    expect(admins.targetAudience).toBe('admins');
    expect(everyone).toMatchObject({ targetAudience: 'all', message: 'Holiday', title: '📢 Holiday' });
  });
});

describe('Email service', () => {
  const smtp = { SMTP_HOST: 'smtp.example.com', SMTP_PORT: '587', SMTP_USER: 'mailer', SMTP_PASS: 'secret' };

  afterEach(() => {
    Object.keys(smtp).forEach((key) => delete process.env[key]);
    delete process.env.SMTP_FROM;
  });

  test('TC-UNIT-SVC-07 refuses to send when SMTP is not configured [FR-023]', async () => {
    const { sendPasswordResetOtp } = require('../../../services/emailService');

    await expect(sendPasswordResetOtp({ email: 'a@example.com', name: 'A' }, '123456'))
      .rejects.toThrow('Email service is not configured: missing SMTP_HOST');
  });

  test('TC-UNIT-SVC-08 sends the six-digit code in both the text and HTML parts [FR-023]', async () => {
    Object.assign(process.env, smtp, { SMTP_FROM: 'no-reply@sriko.lk' });
    const sendMail = jest.fn().mockResolvedValue({});
    let service;
    jest.isolateModules(() => {
      jest.doMock('nodemailer', () => ({ createTransport: jest.fn(() => ({ sendMail })) }));
      service = require('../../../services/emailService');
    });
    jest.dontMock('nodemailer');

    await service.sendPasswordResetOtp({ email: 'nimali@example.com', name: 'Nimali' }, '482913');

    const mail = sendMail.mock.calls[0][0];
    expect(mail).toMatchObject({ from: 'no-reply@sriko.lk', to: 'nimali@example.com', subject: 'SRI-KO — Your Password Reset Code' });
    expect(mail.text).toContain('482913');
    expect(mail.html).toContain('Hello, Nimali');
    '482913'.split('').forEach((digit) => expect(mail.html).toContain(`${digit}\n      </td>`));
  });
});

describe('Google Drive service', () => {
  const driveEnv = { GOOGLE_CLIENT_ID: 'client', GOOGLE_CLIENT_SECRET: 'secret', GOOGLE_REFRESH_TOKEN: 'refresh' };

  const loadService = (driveImpl) => {
    let service;
    jest.isolateModules(() => {
      if (driveImpl) {
        jest.doMock('googleapis', () => ({
          google: {
            auth: { OAuth2: jest.fn(() => ({ setCredentials: jest.fn() })), GoogleAuth: jest.fn() },
            drive: jest.fn(() => driveImpl),
          },
        }));
      }
      service = require('../../../services/googleDriveService');
    });
    jest.dontMock('googleapis');
    return service;
  };

  afterEach(() => {
    Object.keys(driveEnv).forEach((key) => delete process.env[key]);
    delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    delete process.env.GOOGLE_PRIVATE_KEY;
    delete process.env.BACKEND_URL;
  });

  test('TC-UNIT-SVC-09 stores files locally with a public URL when Drive is not configured [FR-007]', async () => {
    process.env.BACKEND_URL = 'https://api.example.com';
    const mkdir = jest.spyOn(fs.promises, 'mkdir').mockResolvedValue();
    const writeFile = jest.spyOn(fs.promises, 'writeFile').mockResolvedValue();
    const service = loadService();

    const result = await service.uploadToDrive(Buffer.from('pdf'), 'Week 1 notes.pdf', 'application/pdf', 'pdf');

    expect(mkdir).toHaveBeenCalled();
    expect(writeFile).toHaveBeenCalled();
    expect(result.isLocal).toBe(true);
    expect(result.viewUrl).toMatch(/^https:\/\/api\.example\.com\/uploads\/pdfs\/\d+_Week_1_notes\.pdf$/);
  });

  test('TC-UNIT-SVC-10 uploads to Drive, shares the file and returns Drive URLs [FR-007]', async () => {
    Object.assign(process.env, driveEnv);
    const drive = {
      files: { create: jest.fn().mockResolvedValue({ data: { id: 'file123', name: 'lesson.mp4', size: '2048' } }) },
      permissions: { create: jest.fn().mockResolvedValue({}) },
    };
    const service = loadService(drive);

    const result = await service.uploadToDrive(Buffer.from('video'), 'lesson.mp4', 'video/mp4', 'video');

    expect(drive.permissions.create).toHaveBeenCalledWith(expect.objectContaining({ fileId: 'file123', requestBody: { role: 'reader', type: 'anyone' } }));
    expect(result).toMatchObject({
      fileId: 'file123', isLocal: false, size: 2048,
      viewUrl: 'https://drive.google.com/file/d/file123/view?usp=sharing',
      embedUrl: 'https://drive.google.com/file/d/file123/preview',
    });
  });

  test('TC-UNIT-SVC-11 falls back to local storage when the Drive upload fails [NFR-002]', async () => {
    Object.assign(process.env, driveEnv);
    jest.spyOn(fs.promises, 'mkdir').mockResolvedValue();
    jest.spyOn(fs.promises, 'writeFile').mockResolvedValue();
    const service = loadService({ files: { create: jest.fn().mockRejectedValue(new Error('quota exceeded')) } });

    const result = await service.uploadToDrive(Buffer.from('img'), 'cover.png', 'image/png', 'thumbnail');

    expect(result.isLocal).toBe(true);
    expect(result.viewUrl).toContain('http://localhost:5000/uploads/thumbnails/');
  });

  test('TC-UNIT-SVC-12 builds image embed URLs, rejects empty uploads and skips local deletions [FR-007]', async () => {
    const service = loadService();

    expect(service.getEmbedUrl('abc', 'image/png')).toBe('https://lh3.googleusercontent.com/d/abc');
    expect(service.getEmbedUrl('abc', 'application/pdf')).toBe('https://drive.google.com/file/d/abc/preview');
    await expect(service.uploadToDrive(null, 'x', 'image/png')).rejects.toThrow('No file buffer provided for upload.');
    await expect(service.deleteFromDrive('local_123')).resolves.toBeUndefined();
    await expect(service.deleteFromDrive(undefined)).resolves.toBeUndefined();
    await expect(service.getFileInfo('local_123')).resolves.toBeNull();
    expect(service.getDriveClient()).toBeNull();
  });

  test('TC-UNIT-SVC-13 deletes and inspects Drive files when Drive is configured [FR-007]', async () => {
    Object.assign(process.env, driveEnv);
    const drive = {
      files: {
        delete: jest.fn().mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('not found')),
        get: jest.fn().mockResolvedValueOnce({ data: { id: 'f1', name: 'a.pdf' } }).mockRejectedValueOnce(new Error('gone')),
      },
    };
    const service = loadService(drive);

    await expect(service.deleteFromDrive('f1')).resolves.toBe(true);
    await expect(service.deleteFromDrive('f2')).resolves.toBeUndefined();
    await expect(service.getFileInfo('f1')).resolves.toEqual({ id: 'f1', name: 'a.pdf' });
    await expect(service.getFileInfo('f2')).resolves.toBeNull();
  });

  test('TC-UNIT-SVC-14 supports service-account credentials with escaped newlines [FR-007]', () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'uploader@project.iam.gserviceaccount.com';
    process.env.GOOGLE_PRIVATE_KEY = '"-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----"';
    let GoogleAuth;
    let service;
    jest.isolateModules(() => {
      GoogleAuth = jest.fn();
      jest.doMock('googleapis', () => ({ google: { auth: { GoogleAuth }, drive: jest.fn(() => ({})) } }));
      service = require('../../../services/googleDriveService');
    });
    jest.dontMock('googleapis');

    expect(service.getDriveClient()).toEqual({});
    expect(GoogleAuth.mock.calls[0][0].credentials.private_key).toBe('-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----');
  });
});
