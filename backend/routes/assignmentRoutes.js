const express = require('express');
const multer = require('multer');
const { protect, authorize, optionalAuth, hasCourseAccess } = require('../middleware/auth');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const { uploadToStorage, deleteFromStorage } = require('../services/supabaseStorageService');

const router = express.Router();

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
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const hasAccess = await hasCourseAccess(req.user, course);
    const assignments = await Assignment.find({ course: req.params.courseId })
      .sort({ weekNumber: 1, createdAt: 1 });

    if (hasAccess) {
      return res.status(200).json({
        success: true,
        count: assignments.length,
        hasFullAccess: true,
        assignments,
      });
    }

    // Unenrolled users: only title and week metadata for curriculum display
    const sanitized = assignments.map((a) => ({
      _id: a._id,
      course: a.course,
      weekNumber: a.weekNumber,
      lessonTitle: a.lessonTitle,
      title: a.title,
      description: a.description,
      dueDate: a.dueDate,
      maxScore: a.maxScore,
      isLocked: true,
    }));

    res.status(200).json({
      success: true,
      count: sanitized.length,
      hasFullAccess: false,
      assignments: sanitized,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch assignments.' });
  }
});

// ─────────────────────────────────────────────────────────────
// 3. GET: Single Assignment Details
// GET /api/assignments/:id
// ─────────────────────────────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('course', 'title instructor enrolledStudents');
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const hasAccess = await hasCourseAccess(req.user, assignment.course);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be enrolled in this course to view assignment details.',
      });
    }

    res.status(200).json({ success: true, assignment });
  } catch (error) {
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

    const course = await Course.findById(assignment.course);
    const hasAccess = await hasCourseAccess(req.user, course);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be enrolled in this course to submit assignments.',
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please upload at least one file.' });
    }

    // Upload each submitted file to Supabase Storage "assignment" folder
    const uploadedFiles = [];
    for (const file of req.files) {
      const storageResult = await uploadToStorage(
        file.buffer,
        file.originalname,
        file.mimetype,
        'assignment'
      );

      uploadedFiles.push({
        fileName: file.originalname,
        fileUrl: storageResult.viewUrl,
        driveFileId: storageResult.fileId,
        downloadUrl: storageResult.downloadUrl,
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
      message: 'Assignment submitted to Supabase Storage successfully!',
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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

    const submissions = await AssignmentSubmission.find({ assignment: req.params.id });
    for (const sub of submissions) {
      for (const f of (sub.files || [])) {
        if (f.driveFileId || f.fileUrl) {
          try {
            await deleteFromStorage(f.driveFileId || f.fileUrl);
          } catch (storageErr) {
            console.warn('[assignmentRoutes] Could not delete assignment file:', storageErr.message);
          }
        }
      }
    }

    await AssignmentSubmission.deleteMany({ assignment: req.params.id });
    await assignment.deleteOne();

    res.status(200).json({ success: true, message: 'Assignment deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete assignment.' });
  }
});

module.exports = router;
