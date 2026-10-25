const express = require('express');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const User = require('../models/User');
const { protect, authorize, checkCourseAccess, optionalAuth, hasCourseAccess } = require('../middleware/auth');
const Payment = require('../models/Payment');
const {
  validateCourseCreation,
  validateReview,
  handleValidationErrors,
} = require('../middleware/validation');
const escapeRegex = require('../utils/escapeRegex');

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────────────────────

// @desc    Get all courses (public)
// @route   GET /api/courses
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.level)    filter.level    = req.query.level;
    if (req.query.published) filter.isPublished = req.query.published === 'true';
    if (req.query.featured) filter.isFeatured = req.query.featured === 'true';
    if (req.query.search)  filter.title = { $regex: escapeRegex(req.query.search), $options: 'i' };

    const courses = await Course.find(filter)
      .populate('instructor', 'name avatar')
      .populate('enrolledStudents', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ isFeatured: -1, createdAt: -1 });

    const total = await Course.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: courses.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      courses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get enrolled courses for user
// @route   GET /api/courses/my-courses
// @access  Private
router.get('/my-courses', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('enrolledCourses');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.enrolledCourses || user.enrolledCourses.length === 0) {
      return res.status(200).json({ success: true, courses: [] });
    }

    const courses = await Course.find({
      _id: { $in: user.enrolledCourses }
    }).populate('instructor', 'name avatar');

    res.status(200).json({ success: true, courses });
  } catch (error) {
    console.error('Error in my-courses endpoint:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// ADMIN ROUTES  (must be before /:id wildcard)
// ─────────────────────────────────────────────────────────────

// @desc    Admin: Get all courses with full data (published + drafts)
// @route   GET /api/courses/admin/all
// @access  Private/Admin
router.get('/admin/all', protect, authorize('admin'), async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.category && req.query.category !== 'All Categories') filter.category   = req.query.category;
    if (req.query.level    && req.query.level    !== 'All Levels')     filter.level      = req.query.level.toLowerCase();
    if (req.query.status   && req.query.status   !== 'Status')         filter.isPublished = req.query.status === 'PUBLISHED';
    if (req.query.search)  filter.title = { $regex: escapeRegex(req.query.search), $options: 'i' };

    let sortObj = { createdAt: -1 };
    if (req.query.sort === 'oldest') sortObj = { createdAt: 1 };
    if (req.query.sort === 'price-asc') sortObj = { price: 1 };
    if (req.query.sort === 'price-desc') sortObj = { price: -1 };

    // Synchronize enrolled students into Course documents from Users, Payments, and Progress
    // so Course.enrolledStudents in MongoDB is guaranteed to reflect real student purchases
    try {
      const [usersWithAnyCourses, paymentsWithCourses, progressWithCourses] = await Promise.all([
        User.find({ 'enrolledCourses.0': { $exists: true } }).select('_id enrolledCourses').lean(),
        Payment.find({ course: { $exists: true, $ne: null }, status: { $in: ['completed', 'processing', 'paid'] } }).select('user course').lean(),
        Progress.find({ course: { $exists: true, $ne: null } }).select('student course').lean(),
      ]);

      const courseStudentMap = new Map();
      const addStudentToCourse = (cId, uId) => {
        if (!cId || !uId) return;
        const key = (cId._id || cId).toString();
        if (!courseStudentMap.has(key)) courseStudentMap.set(key, new Set());
        courseStudentMap.get(key).add(uId.toString());
      };

      usersWithAnyCourses.forEach((u) => {
        (u.enrolledCourses || []).forEach((cId) => addStudentToCourse(cId, u._id));
      });
      paymentsWithCourses.forEach((p) => addStudentToCourse(p.course, p.user));
      progressWithCourses.forEach((pr) => addStudentToCourse(pr.course, pr.student));

      const bulkOps = [];
      for (const [courseIdStr, studentSet] of courseStudentMap.entries()) {
        if (studentSet.size > 0) {
          bulkOps.push({
            updateOne: {
              filter: { _id: courseIdStr },
              update: { $addToSet: { enrolledStudents: { $each: Array.from(studentSet) } } },
            },
          });
        }
      }

      if (bulkOps.length > 0) {
        await Course.bulkWrite(bulkOps, { ordered: false });
      }
    } catch (syncErr) {
      console.warn('Course enrollment sync warning:', syncErr.message);
    }

    let coursesQuery = Course.find(filter)
      .populate('instructor', 'name avatar');

    if (req.query.sort === 'most-enrolled') {
      // Sort by number of enrolled students descending
      coursesQuery = Course.aggregate([
        { $match: filter },
        { $addFields: { enrolledCount: { $size: { $ifNull: ['$enrolledStudents', []] } } } },
        { $sort: { enrolledCount: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]);
    } else {
      coursesQuery = coursesQuery.skip(skip).limit(limit).sort(sortObj);
    }

    const rawCourses = await coursesQuery;
    const courses = Array.isArray(rawCourses) ? rawCourses : [];

    // Cross-reference all sources where students buy or enroll in courses:
    // 1. Users with course in enrolledCourses (regardless of role)
    // 2. Payments completed for the course
    // 3. Progress records for the course
    const courseIds = courses.map((c) => c._id);
    const [usersWithCourses, completedPayments, progressRecords] = await Promise.all([
      User.find({ enrolledCourses: { $in: courseIds } }).select('_id enrolledCourses'),
      Payment.find({ course: { $in: courseIds }, status: { $in: ['completed', 'processing', 'paid'] } }).select('user course'),
      Progress.find({ course: { $in: courseIds } }).select('student course'),
    ]);

    const courseEnrollmentMap = new Map();
    const getSet = (id) => {
      const k = id.toString();
      if (!courseEnrollmentMap.has(k)) courseEnrollmentMap.set(k, new Set());
      return courseEnrollmentMap.get(k);
    };

    usersWithCourses.forEach((u) => {
      (u.enrolledCourses || []).forEach((cId) => {
        getSet(cId).add(u._id.toString());
      });
    });

    completedPayments.forEach((p) => {
      if (p.course && p.user) {
        getSet(p.course).add(p.user.toString());
      }
    });

    progressRecords.forEach((pr) => {
      if (pr.course && pr.student) {
        getSet(pr.course).add(pr.student.toString());
      }
    });

    const coursesWithEnrolled = courses.map((course) => {
      const courseObj = typeof course.toObject === 'function' ? course.toObject() : { ...course };
      const existingIds = new Set(
        (courseObj.enrolledStudents || []).map((id) => (id?._id || id).toString())
      );
      const userIds = courseEnrollmentMap.get(course._id.toString()) || new Set();
      userIds.forEach((id) => existingIds.add(id));
      const enrolledArray = Array.from(existingIds);
      courseObj.enrolledStudents = enrolledArray;
      courseObj.enrolledCount = enrolledArray.length;
      courseObj.buyersCount = enrolledArray.length;
      courseObj.studentsCount = enrolledArray.length;
      return courseObj;
    });

    const total          = await Course.countDocuments(filter);
    const totalPublished = await Course.countDocuments({ isPublished: true });
    const totalDraft     = await Course.countDocuments({ isPublished: false });
    
    // Total course enrollments across all courses
    const totalEnrollmentsAgg = await Course.aggregate([
      { $project: { count: { $size: { $ifNull: ['$enrolledStudents', []] } } } },
      { $group: { _id: null, total: { $sum: '$count' } } },
    ]);

    // Unique students who have registered and enrolled/bought courses
    const uniqueEnrolledStudents = await User.countDocuments({
      role: 'student',
      'enrolledCourses.0': { $exists: true },
    });

    // Total registered students in the system
    const totalRegisteredStudents = await User.countDocuments({ role: 'student' });

    res.status(200).json({
      success: true,
      count: coursesWithEnrolled.length,
      total,
      totalPublished,
      totalDraft,
      totalStudents: totalEnrollmentsAgg[0]?.total || 0,
      uniqueEnrolledStudents,
      totalRegisteredStudents,
      page,
      pages: Math.ceil(total / limit),
      courses: coursesWithEnrolled,
    });
  } catch (error) {
    console.error('Admin get courses error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Admin: Create course
// @route   POST /api/courses/admin
// @access  Private/Admin
router.post('/admin', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      level,
      duration,
      price,
      isPublished,
      isFeatured,
      features,
      tags,
      thumbnail,
      instructor,
      instructorName,
      instructorImage,
      instructorBio,
      instructorRole,
    } = req.body;

    if (!title || title.trim().length < 3)
      return res.status(400).json({ success: false, message: 'Course title must be at least 3 characters' });
    if (!description || description.trim().length < 10)
      return res.status(400).json({ success: false, message: 'Description must be at least 10 characters' });
    if (price === undefined || price === null || isNaN(Number(price)))
      return res.status(400).json({ success: false, message: 'A valid price is required' });

    const courseData = {
      title:           title.trim(),
      description:     description.trim(),
      category:        category    || 'Language',
      level:           (level      || 'beginner').toLowerCase(),
      duration:        duration    || 4,
      price:           Number(price),
      isPublished:     isPublished !== undefined ? isPublished : false,
      isFeatured:      isFeatured  !== undefined ? isFeatured : false,
      features:        features    || [],
      tags:            tags        || [],
      thumbnail:       thumbnail   || '',
      instructor:      instructor  || req.user._id,
      instructorName:  instructorName ? instructorName.trim() : '',
      instructorImage: instructorImage ? instructorImage.trim() : '',
      instructorBio:   instructorBio ? instructorBio.trim() : '',
      instructorRole:  instructorRole ? instructorRole.trim() : 'Lead Instructor',
    };

    const course = await Course.create(courseData);
    await course.populate('instructor', 'name avatar');
    res.status(201).json({ success: true, message: 'Course created successfully', course });
  } catch (error) {
    console.error('Admin create course error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// @desc    Admin: Update any course
// @route   PUT /api/courses/admin/:id
// @access  Private/Admin
router.put('/admin/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const allowed = [
      'title',
      'description',
      'category',
      'level',
      'duration',
      'price',
      'isPublished',
      'isFeatured',
      'features',
      'tags',
      'thumbnail',
      'prerequisites',
      'instructor',
      'instructorName',
      'instructorImage',
      'instructorBio',
      'instructorRole',
    ];
    const updateData = {};
    allowed.forEach(field => { if (req.body[field] !== undefined) updateData[field] = req.body[field]; });
    if (updateData.level)              updateData.level  = updateData.level.toLowerCase();
    if (updateData.price !== undefined) updateData.price = Number(updateData.price);

    const updatedCourse = await Course.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
      .populate('instructor', 'name avatar');
    res.status(200).json({ success: true, message: 'Course updated successfully', course: updatedCourse });
  } catch (error) {
    console.error('Admin update course error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// @desc    Admin: Delete any course
// @route   DELETE /api/courses/admin/:id
// @access  Private/Admin
router.delete('/admin/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    await Course.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Admin delete course error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Admin: Toggle course publish status
// @route   PATCH /api/courses/admin/:id/toggle-publish
// @access  Private/Admin
router.patch('/admin/:id/toggle-publish', protect, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const newPublishState = !course.isPublished;
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      { $set: { isPublished: newPublishState } },
      { new: true }
    ).populate('instructor', 'name avatar');

    res.status(200).json({
      success: true,
      message: `Course ${newPublishState ? 'published' : 'unpublished'} successfully`,
      isPublished: newPublishState,
      course: updatedCourse,
    });
  } catch (error) {
    console.error('Admin toggle publish error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// SINGLE-COURSE ROUTES (/:id wildcard — must stay AFTER admin routes)
// ─────────────────────────────────────────────────────────────

// @desc    Verify if user is authorized to access course info / classroom
// @route   GET /api/courses/:id/verify-access
// @access  Private
router.get('/:id/verify-access', protect, checkCourseAccess, async (req, res) => {
  res.status(200).json({
    success: true,
    hasAccess: true,
    courseId: req.params.id,
  });
});

// @desc    Get course by ID (public with role/enrollment awareness)
// @route   GET /api/courses/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name avatar bio')
      .populate('enrolledStudents', 'name avatar')
      .populate({ path: 'reviews.user', select: 'name avatar' });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const hasAccess = await hasCourseAccess(req.user, course);
    const courseObj = course.toObject();

    // If unenrolled, sanitize curriculum lessons: topics and titles remain visible,
    // but restricted lesson content/video streams are omitted
    if (!hasAccess && Array.isArray(courseObj.curriculum)) {
      courseObj.curriculum = courseObj.curriculum.map((week) => ({
        ...week,
        lessons: Array.isArray(week.lessons)
          ? week.lessons.map((lesson) => {
              if (lesson.isFreePreview) {
                return lesson;
              }
              return {
                _id: lesson._id,
                title: lesson.title,
                duration: lesson.duration,
                type: lesson.type,
                isFreePreview: false,
                isLocked: true,
                // Omit lesson.content for restricted lessons
              };
            })
          : [],
      }));
    }

    res.status(200).json({
      success: true,
      course: courseObj,
      isEnrolled: hasAccess,
    });
  } catch (error) {
    console.error('[courseRoutes] Get course error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Enroll in course
// @route   POST /api/courses/:id/enroll
// @access  Private/Student
router.post('/:id/enroll', protect, authorize('student'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    if (!course.isPublished) {
      return res.status(400).json({ success: false, message: 'Course is not published yet' });
    }

    const existingProgress = await Progress.findOne({ student: req.user.id, course: req.params.id });
    if (existingProgress) {
      return res.status(400).json({ success: false, message: 'You are already enrolled in this course' });
    }

    if (course.price > 0) {
      const Payment = require('../models/Payment');
      const completedPayment = await Payment.findOne({
        user: req.user.id,
        course: course._id,
        status: 'completed',
      });
      if (!completedPayment) {
        return res.status(402).json({
          success: false,
          requiresPayment: true,
          message: 'Payment is required to enroll in this course. Please complete checkout.',
        });
      }
    }

    course.enrolledStudents.push(req.user.id);
    await course.save();

    const progress = await Progress.create({
      student: req.user.id,
      course: req.params.id,
      currentWeek: 1,
      overallProgress: 0,
    });

    const updatedUser = await User.findByIdAndUpdate(req.user.id, {
      $push: { enrolledCourses: req.params.id },
    }, { new: true });

    console.log('✅ Enrollment successful - User ID:', req.user.id);
    console.log('✅ Enrollment successful - Course ID:', req.params.id);

    res.status(200).json({
      success: true,
      message: 'Enrolled in course successfully',
      course: { id: course._id, title: course.title, progress: progress.overallProgress },
    });
  } catch (error) {
    console.error('❌ Enrollment error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error', error: error.message });
  }
});

// @desc    Unenroll from course
// @route   DELETE /api/courses/:id/enroll
// @access  Private/Student
router.delete('/:id/enroll', protect, authorize('student'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const isEnrolled = course.enrolledStudents.includes(req.user.id);
    if (!isEnrolled) {
      return res.status(400).json({ success: false, message: 'You are not enrolled in this course' });
    }

    course.enrolledStudents = course.enrolledStudents.filter(
      studentId => studentId.toString() !== req.user.id.toString()
    );
    await course.save();

    await Progress.findOneAndDelete({ student: req.user.id, course: req.params.id });
    await User.findByIdAndUpdate(req.user.id, { $pull: { enrolledCourses: req.params.id } });

    res.status(200).json({
      success: true,
      message: 'Unenrolled from course successfully',
      course: { id: course._id, title: course.title },
    });
  } catch (error) {
    console.error('Error unenrolling from course:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Add course review
// @route   POST /api/courses/:id/reviews
// @access  Private
router.post(
  '/:id/reviews',
  protect,
  authorize('student', 'instructor', 'admin'),
  validateReview,
  handleValidationErrors,
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

      const existingReview = course.reviews.find(
        review => review.user.toString() === req.user.id.toString()
      );
      if (existingReview) {
        return res.status(400).json({ success: false, message: 'You have already reviewed this course' });
      }

      const review = { user: req.user.id, rating: req.body.rating, comment: req.body.comment };
      course.reviews.push(review);

      const totalRating = course.reviews.reduce((sum, r) => sum + r.rating, 0);
      course.averageRating = totalRating / course.reviews.length;
      await course.save();

      await course.populate({ path: 'reviews.user', select: 'name avatar' });

      res.status(200).json({ success: true, message: 'Review added successfully', course });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// @desc    Mark course as completed
// @route   POST /api/courses/:id/complete
// @access  Private/Student
router.post('/:id/complete', protect, authorize('student'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const isEnrolled = course.enrolledStudents.includes(req.user.id);
    if (!isEnrolled) {
      return res.status(400).json({ success: false, message: 'You are not enrolled in this course' });
    }

    const progress = await Progress.findOne({ student: req.user.id, course: req.params.id });
    if (!progress) return res.status(404).json({ success: false, message: 'Progress record not found' });
    if (progress.isCompleted) {
      return res.status(400).json({ success: false, message: 'Course is already marked as completed' });
    }

    progress.isCompleted = true;
    progress.completionDate = new Date();
    progress.overallProgress = 100;
    await progress.save();

    res.status(200).json({ success: true, message: 'Course marked as completed successfully', progress });
  } catch (error) {
    console.error('Error completing course:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// INSTRUCTOR/ADMIN COURSE MANAGEMENT
// ─────────────────────────────────────────────────────────────

// @desc    Create course (instructor/admin via validation middleware)
// @route   POST /api/courses
// @access  Private/Instructor/Admin
router.post(
  '/',
  protect,
  authorize('instructor', 'admin'),
  validateCourseCreation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const courseData = { ...req.body, instructor: req.user.id };
      const course = await Course.create(courseData);
      await course.populate('instructor', 'name avatar');
      res.status(201).json({ success: true, message: 'Course created successfully', course });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Instructor/Admin
router.put(
  '/:id',
  protect,
  authorize('instructor', 'admin'),
  checkCourseAccess,
  async (req, res) => {
    try {
      let course = await Course.findById(req.params.id);
      if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

      if (course.instructor && course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized to update this course' });
      }

      course = await Course.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      }).populate('instructor', 'name avatar');

      res.status(200).json({ success: true, message: 'Course updated successfully', course });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Instructor/Admin
router.delete(
  '/:id',
  protect,
  authorize('instructor', 'admin'),
  checkCourseAccess,
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

      if (course.instructor && course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this course' });
      }

      await Course.findByIdAndDelete(req.params.id);
      res.status(200).json({ success: true, message: 'Course deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

module.exports = router;
