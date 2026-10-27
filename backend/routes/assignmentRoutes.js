const express = require('express');
const multer = require('multer');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Course = require('../models/Course');
const { canAccessCourseContent } = require('../utils/courseAccess');
const { uploadToDrive } = require('../services/googleDriveService');

const router = express.Router();

// Fields of an assignment shown on the public course page; the instructions and the
// attached file are reserved for enrolled students.
const toAssignmentPreview = (assignment) => ({
  _id: assignment._id,
  course: assignment.course,
  weekNumber: assignment.weekNumber,
  lessonTitle: assignment.lessonTitle,
  title: assignment.title,
  dueDate: assignment.dueDate,
  maxScore: assignment.maxScore,
});

// Multer memory storage for student assignment uploads (up to 5 files, 50MB each)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// ─────────────────────────────────────────────────────────────
// 1. ADMIN: Create an Assignment
// POST /api/assignments
// ─────────────────────────────────────────────────────────────
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      courseId,
      weekNumber = 1,
      lessonTitle = 'Assignment',
      title,
      description,
      dueDate,
      maxScore = 100,
      allowedFileTypes = ['pdf', 'doc', 'docx', 'zip', 'jpg', 'png'],
    } = req.body;

    if (!courseId || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Course ID, title, and description are required.',
      });
    }

    const assignment = await Assignment.create({
      course: courseId,
      weekNumber: parseInt(weekNumber, 10) || 1,
      lessonTitle,
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      maxScore: Number(maxScore) || 100,
      allowedFileTypes,
      createdBy: req.user._id || req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully.',
      assignment,
    });
  } catch (error) {
    console.error('[assignmentRoutes] Create assignment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 2. GET: Assignments for a Course
// GET /api/assignments/course/:courseId
// ─────────────────────────────────────────────────────────────
router.get('/course/:courseId', optionalAuth, async (req, res) => {
  try {
    const [course, assignments] = await Promise.all([
      Course.findById(req.params.courseId),
      Assignment.find({ course: req.params.courseId }).sort({ weekNumber: 1, createdAt: 1 }),
    ]);

    // Visitors and students who have not enrolled see which assignments the course has,
    // but not their instructions or attached files.
    const fullAccess = await canAccessCourseContent(req.user, course);

    res.status(200).json({
      success: true,
      access: fullAccess ? 'full' : 'preview',
      count: assignments.length,
      assignments: fullAccess ? assignments : assignments.map(toAssignmentPreview),
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch assignments.' });
  }
});

// ─────────────────────────────────────────────────────────────
// 3. GET: Single Assignment Details
// GET /api/assignments/:id
// ─────────────────────────────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('course', 'title');
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const course = await Course.findById(assignment.course?._id);
    if (!(await canAccessCourseContent(req.user, course))) {
      return res.status(req.user ? 403 : 401).json({
        success: false,
        message: 'Enrol in this course to open this assignment.',
      });
    }

    res.status(200).json({ success: true, assignment });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// 4. STUDENT: Submit Assignment Files (Uploaded to Google Drive)
// POST /api/assignments/:id/submit
// ─────────────────────────────────────────────────────────────
router.post('/:id/submit', protect, upload.array('files', 5), async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const studentId = req.user._id || req.user.id;
    const { submissionNote } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please upload at least one file.' });
    }

    // Upload each submitted file to Google Drive "assignment" folder
    const uploadedFiles = [];
    for (const file of req.files) {
      const driveResult = await uploadToDrive(
        file.buffer,
        file.originalname,
        file.mimetype,
        'assignment'
      );

      uploadedFiles.push({
        fileName: file.originalname,
        fileUrl: driveResult.viewUrl,
        driveFileId: driveResult.fileId,
        downloadUrl: driveResult.downloadUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
      });
    }

    // Check if late
    const isLate = assignment.dueDate && new Date() > new Date(assignment.dueDate);

    // Upsert submission (one submission per student per assignment)
    let submission = await AssignmentSubmission.findOne({
      assignment: assignmentId,
      student: studentId,
    });

    if (submission) {
      // Append or replace files
      submission.files = [...submission.files, ...uploadedFiles];
      submission.submissionNote = submissionNote || submission.submissionNote;
      submission.status = isLate ? 'late' : 'submitted';
      submission.submittedAt = new Date();
      await submission.save();
    } else {
      submission = await AssignmentSubmission.create({
        assignment: assignmentId,
        course: assignment.course,
        student: studentId,
        files: uploadedFiles,
        submissionNote: submissionNote?.trim() || '',
        status: isLate ? 'late' : 'submitted',
        submittedAt: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Assignment submitted to Google Drive successfully!',
      submission,
    });
  } catch (error) {
    console.error('[assignmentRoutes] Submit error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit assignment.',
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 5. STUDENT: Get Own Submission for an Assignment
// GET /api/assignments/:id/my-submission
// ─────────────────────────────────────────────────────────────
router.get('/:id/my-submission', protect, async (req, res) => {
  try {
    const studentId = req.user._id || req.user.id;
    const submission = await AssignmentSubmission.findOne({
      assignment: req.params.id,
      student: studentId,
    }).populate('gradedBy', 'name');

    res.status(200).json({
      success: true,
      submission: submission || null,
    });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// 6. ADMIN: View All Submissions for an Assignment
// GET /api/assignments/:id/submissions
// ─────────────────────────────────────────────────────────────
router.get('/:id/submissions', protect, authorize('admin'), async (req, res) => {
  try {
    const submissions = await AssignmentSubmission.find({ assignment: req.params.id })
      .populate('student', 'name email avatar')
      .populate('gradedBy', 'name')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      count: submissions.length,
      submissions,
    });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// 7. ADMIN: Grade a Submission
// PATCH /api/assignments/submissions/:submissionId/grade
// ─────────────────────────────────────────────────────────────
router.patch('/submissions/:submissionId/grade', protect, authorize('admin'), async (req, res) => {
  try {
    const { grade, feedback } = req.body;

    const submission = await AssignmentSubmission.findById(req.params.submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    submission.grade = Number(grade);
    submission.feedback = feedback ? feedback.trim() : submission.feedback;
    submission.status = 'graded';
    submission.gradedAt = new Date();
    submission.gradedBy = req.user._id || req.user.id;

    await submission.save();

    res.status(200).json({
      success: true,
      message: 'Submission graded successfully.',
      submission,
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to grade submission.' });
  }
});

// ─────────────────────────────────────────────────────────────
// 8. ADMIN: Delete an Assignment
// DELETE /api/assignments/:id
// ─────────────────────────────────────────────────────────────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    await AssignmentSubmission.deleteMany({ assignment: req.params.id });
    await assignment.deleteOne();

    res.status(200).json({ success: true, message: 'Assignment deleted successfully.' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete assignment.' });
  }
});

module.exports = router;
