// Google Drive is replaced so uploads never leave the test process or touch the disk.
jest.mock('../../services/googleDriveService', () => ({
  uploadToDrive: jest.fn(),
  deleteFromDrive: jest.fn(),
}));

const drive = require('../../services/googleDriveService');
const LectureMaterial = require('../../models/LectureMaterial');
const Assignment = require('../../models/Assignment');
const AssignmentSubmission = require('../../models/AssignmentSubmission');
const {
  api, createStudent, createAdmin, createCourse, enrol, authHeader,
} = require('../helpers/factories');

const driveResult = (overrides = {}) => ({
  fileId: 'drive-file-1', viewUrl: 'https://drive.google.com/file/d/drive-file-1/view', embedUrl: 'https://drive.google.com/file/d/drive-file-1/preview',
  downloadUrl: 'https://drive.google.com/uc?export=download&id=drive-file-1', fileName: 'lesson.pdf', size: 1024, ...overrides,
});

beforeEach(() => {
  drive.uploadToDrive.mockReset();
  drive.deleteFromDrive.mockReset();
  drive.uploadToDrive.mockResolvedValue(driveResult());
});

describe('Lecture materials', () => {
  test('TC-LEC-01 uploads a lecture file to Drive and records it against the course [FR-007]', async () => {
    const admin = await createAdmin();
    const course = await createCourse();

    const res = await api().post('/api/lectures/upload').set(authHeader(admin))
      .field('courseId', course._id.toString()).field('title', ' Week 1 notes ').field('weekNumber', '1').field('lessonIndex', '2').field('isPreview', 'true')
      .attach('file', Buffer.from('%PDF-1.4'), { filename: 'week1.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(201);
    expect(drive.uploadToDrive).toHaveBeenCalledWith(expect.any(Buffer), 'week1.pdf', 'application/pdf', 'pdf');
    expect(res.body.material).toMatchObject({ title: 'Week 1 notes', type: 'pdf', lessonIndex: 2, isPreview: true, driveFileId: 'drive-file-1' });
  });

  test('TC-LEC-02 classifies video and image uploads [FR-007]', async () => {
    const admin = await createAdmin();
    const course = await createCourse();
    const upload = (name, type) => api().post('/api/lectures/upload').set(authHeader(admin))
      .field('courseId', course._id.toString()).field('title', name).attach('file', Buffer.from('x'), { filename: name, contentType: type });

    expect((await upload('intro.mp4', 'video/mp4')).body.material.type).toBe('video');
    expect((await upload('chart.png', 'image/png')).body.material.type).toBe('image');
    expect((await upload('slides.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation')).body.material.type).toBe('pdf');
  });

  test('TC-LEC-03 validates the upload request [FR-007]', async () => {
    const admin = await createAdmin();
    const course = await createCourse();

    const noFile = await api().post('/api/lectures/upload').set(authHeader(admin)).field('courseId', course._id.toString()).field('title', 't');
    const noCourse = await api().post('/api/lectures/upload').set(authHeader(admin)).field('title', 't').attach('file', Buffer.from('x'), { filename: 'a.pdf', contentType: 'application/pdf' });
    const noTitle = await api().post('/api/lectures/upload').set(authHeader(admin)).field('courseId', course._id.toString()).attach('file', Buffer.from('x'), { filename: 'a.pdf', contentType: 'application/pdf' });
    const badType = await api().post('/api/lectures/upload').set(authHeader(admin)).field('courseId', course._id.toString()).field('title', 't').attach('file', Buffer.from('x'), { filename: 'a.exe', contentType: 'application/x-msdownload' });

    expect(noFile.status).toBe(400);
    expect(noCourse.status).toBe(400);
    expect(noTitle.status).toBe(400);
    expect(badType.status).toBe(500);
  });

  test('TC-LEC-04 uploads a course thumbnail and reports Drive failures [FR-007]', async () => {
    const admin = await createAdmin();
    drive.uploadToDrive.mockResolvedValueOnce(driveResult({ embedUrl: 'https://lh3.googleusercontent.com/d/thumb' }));

    const ok = await api().post('/api/lectures/upload-thumbnail').set(authHeader(admin)).attach('thumbnail', Buffer.from('img'), { filename: 'cover.png', contentType: 'image/png' });
    drive.uploadToDrive.mockRejectedValueOnce(new Error('Drive quota exceeded'));
    const failed = await api().post('/api/lectures/upload-thumbnail').set(authHeader(admin)).attach('thumbnail', Buffer.from('img'), { filename: 'cover.png', contentType: 'image/png' });
    const missing = await api().post('/api/lectures/upload-thumbnail').set(authHeader(admin));

    expect(ok.body.url).toBe('https://lh3.googleusercontent.com/d/thumb');
    expect(failed.status).toBe(500);
    expect(failed.body.message).toBe('Drive quota exceeded');
    expect(missing.status).toBe(400);
  });

  test('TC-LEC-05 adds external links and converts YouTube URLs to embeds [FR-007]', async () => {
    const admin = await createAdmin();
    const course = await createCourse();
    const link = (externalUrl) => api().post('/api/lectures/link').set(authHeader(admin)).send({ courseId: course._id, title: 'Video', externalUrl });

    expect((await link('https://www.youtube.com/watch?v=abc123')).body.material.embedUrl).toBe('https://www.youtube.com/embed/abc123');
    expect((await link('https://youtu.be/xyz789?t=30')).body.material.embedUrl).toBe('https://www.youtube.com/embed/xyz789');
    expect((await link('https://vimeo.com/42')).body.material.embedUrl).toBe('https://vimeo.com/42');
    expect((await api().post('/api/lectures/link').set(authHeader(admin)).send({ courseId: course._id })).status).toBe(400);
  });

  test('TC-LEC-06 lists a course\'s materials in week order and returns one material [FR-007]', async () => {
    const course = await createCourse();
    const student = await createStudent();
    await enrol(student, course);
    await LectureMaterial.create({ course: course._id, weekNumber: 2, lessonTitle: 'L', title: 'Week 2', type: 'pdf' });
    const first = await LectureMaterial.create({ course: course._id, weekNumber: 1, lessonTitle: 'L', title: 'Week 1', type: 'video' });

    const list = await api().get(`/api/lectures/course/${course._id}`).set(authHeader(student));
    const one = await api().get(`/api/lectures/${first._id}`).set(authHeader(student));

    expect(list.body.materials.map((m) => m.title)).toEqual(['Week 1', 'Week 2']);
    expect(one.body.material.title).toBe('Week 1');
    expect((await api().get('/api/lectures/course/64b7f0a0a0a0a0a0a0a0a0a0')).status).toBe(404);
    expect((await api().get('/api/lectures/64b7f0a0a0a0a0a0a0a0a0a0')).status).toBe(404);
  });

  test('TC-LEC-07 deletes a material from Drive and the database, even if Drive fails [FR-007]', async () => {
    const admin = await createAdmin();
    const course = await createCourse();
    const material = await LectureMaterial.create({ course: course._id, lessonTitle: 'L', title: 'Old', type: 'pdf', driveFileId: 'drive-9' });
    drive.deleteFromDrive.mockRejectedValue(new Error('not found on Drive'));

    const res = await api().delete(`/api/lectures/${material._id}`).set(authHeader(admin));
    const again = await api().delete(`/api/lectures/${material._id}`).set(authHeader(admin));

    expect(res.status).toBe(200);
    expect(drive.deleteFromDrive).toHaveBeenCalledWith('drive-9');
    expect(again.status).toBe(404);
  });
});

describe('Assignments', () => {
  const createAssignment = async (overrides = {}) => Assignment.create({
    course: (await createCourse())._id, title: 'Write 10 sentences', description: 'Use the -아요 ending', ...overrides,
  });

  test('TC-ASG-01 creates an assignment for a course [FR-020]', async () => {
    const admin = await createAdmin();
    const course = await createCourse();

    const res = await api().post('/api/assignments').set(authHeader(admin)).send({ courseId: course._id, title: ' Essay ', description: ' 200 words ', dueDate: '2026-11-01', maxScore: '50' });
    const invalid = await api().post('/api/assignments').set(authHeader(admin)).send({ title: 'No course' });

    expect(res.status).toBe(201);
    expect(res.body.assignment).toMatchObject({ title: 'Essay', description: '200 words', maxScore: 50, weekNumber: 1 });
    expect(invalid.status).toBe(400);
  });

  test('TC-ASG-02 lists a course\'s assignments and returns one assignment [FR-020]', async () => {
    const assignment = await createAssignment();
    const student = await createStudent();
    await enrol(student, { _id: assignment.course });

    const list = await api().get(`/api/assignments/course/${assignment.course}`).set(authHeader(student));
    const one = await api().get(`/api/assignments/${assignment._id}`).set(authHeader(student));

    expect(list.body.count).toBe(1);
    expect(one.body.assignment.title).toBe('Write 10 sentences');
    expect((await api().get('/api/assignments/64b7f0a0a0a0a0a0a0a0a0a0')).status).toBe(404);
  });

  test('TC-ASG-03 a student submits files, resubmits, and late work is flagged [FR-020]', async () => {
    const student = await createStudent();
    const assignment = await createAssignment({ dueDate: new Date(Date.now() - 1000) });
    const submit = () => api().post(`/api/assignments/${assignment._id}/submit`).set(authHeader(student))
      .field('submissionNote', 'Done').attach('files', Buffer.from('answer'), { filename: 'answer.pdf', contentType: 'application/pdf' });

    const first = await submit();
    const second = await submit();
    const mine = await api().get(`/api/assignments/${assignment._id}/my-submission`).set(authHeader(student));

    expect(first.status).toBe(200);
    expect(first.body.submission).toMatchObject({ status: 'late', submissionNote: 'Done' });
    expect(second.body.submission.files).toHaveLength(2);
    expect(mine.body.submission.files).toHaveLength(2);
    expect(await AssignmentSubmission.countDocuments()).toBe(1);
  });

  test('TC-ASG-04 rejects a submission without files or for an unknown assignment [FR-020]', async () => {
    const student = await createStudent();
    const assignment = await createAssignment();

    const noFiles = await api().post(`/api/assignments/${assignment._id}/submit`).set(authHeader(student)).field('submissionNote', 'forgot the file');
    const unknown = await api().post('/api/assignments/64b7f0a0a0a0a0a0a0a0a0a0/submit').set(authHeader(student)).field('submissionNote', 'x');

    expect(noFiles.status).toBe(400);
    expect(noFiles.body.message).toBe('Please upload at least one file.');
    expect(unknown.status).toBe(404);
  });

  test('TC-ASG-05 administrators review and grade submissions [FR-020]', async () => {
    const admin = await createAdmin();
    const student = await createStudent();
    const assignment = await createAssignment();
    const submission = await AssignmentSubmission.create({
      assignment: assignment._id, course: assignment.course, student: student._id, files: [{ fileName: 'a.pdf', fileUrl: 'https://x/a.pdf' }],
    });

    const list = await api().get(`/api/assignments/${assignment._id}/submissions`).set(authHeader(admin));
    const graded = await api().patch(`/api/assignments/submissions/${submission._id}/grade`).set(authHeader(admin)).send({ grade: '45', feedback: ' Good work ' });
    const missing = await api().patch('/api/assignments/submissions/64b7f0a0a0a0a0a0a0a0a0a0/grade').set(authHeader(admin)).send({ grade: 1 });

    expect(list.body.submissions[0].student.name).toBe(student.name);
    expect(graded.body.submission).toMatchObject({ grade: 45, feedback: 'Good work', status: 'graded' });
    expect(missing.status).toBe(404);
  });

  test('TC-ASG-06 deleting an assignment removes its submissions [FR-020]', async () => {
    const admin = await createAdmin();
    const assignment = await createAssignment();
    await AssignmentSubmission.create({ assignment: assignment._id, course: assignment.course, student: (await createStudent())._id });

    const res = await api().delete(`/api/assignments/${assignment._id}`).set(authHeader(admin));
    const again = await api().delete(`/api/assignments/${assignment._id}`).set(authHeader(admin));

    expect(res.status).toBe(200);
    expect(again.status).toBe(404);
    expect(await AssignmentSubmission.countDocuments()).toBe(0);
  });

  test('TC-ASG-07 reports Drive failures during submission as 500 [NFR-002]', async () => {
    const student = await createStudent();
    const assignment = await createAssignment();
    drive.uploadToDrive.mockRejectedValue(new Error('Drive unavailable'));

    const res = await api().post(`/api/assignments/${assignment._id}/submit`).set(authHeader(student))
      .attach('files', Buffer.from('x'), { filename: 'a.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Drive unavailable');
  });
});
