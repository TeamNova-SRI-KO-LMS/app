const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const Certificate = require('../models/Certificate');
const Attendance = require('../models/Attendance');
const { protect, authorize } = require('../middleware/auth');
const {
  validateProfileUpdate,
  handleValidationErrors,
} = require('../middleware/validation');
const { uploadSingle, handleUploadError } = require('../middleware/upload');
const escapeRegex = require('../utils/escapeRegex');
const {
  ATTENDANCE_STATUSES,
  toAttendanceDay,
  todayAttendanceDay,
  upsertAttendanceRecord,
} = require('../utils/attendance');

const router = express.Router();

// Attendance row used by the dashboard/attendance endpoints. Days are formatted in
// UTC so they match the calendar day the student picked, whatever the server timezone.
const formatAttendanceRow = (record, fallbackCourseTitle) => {
  const day = toAttendanceDay(record.date);
  return {
    id: record._id,
    dayNumber: day ? day.getUTCDate() : null,
    date: day
      ? day.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'UTC' })
      : '',
    rawDate: day,
    course: record.course?.title || fallbackCourseTitle,
    courseId: record.course?._id || record.course,
    status: record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : 'Present',
    statusType: record.status || 'present',
    notes: record.notes || '',
    // When the student marked it (the stored date itself is always midnight)
    time: record.createdAt
      ? new Date(record.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
      : '',
    type: 'Lecture'
  };
};

// @desc    Get comprehensive user dashboard data (profile, stats, enrolled courses, progress, attendance)
// @route   GET /api/users/dashboard
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate({
      path: 'enrolledCourses',
      select: 'title description thumbnail category level duration price curriculum isPublished createdAt updatedAt'
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Also include any courses where enrolledStudents explicitly contains this user
    const directEnrolledCourses = await Course.find({
      enrolledStudents: userId,
      _id: { $nin: (user.enrolledCourses || []).map(c => c._id) }
    }).select('title description thumbnail category level duration price curriculum isPublished createdAt updatedAt');

    // Combined unique enrolled courses
    const allEnrolledCourses = [...(user.enrolledCourses || []), ...directEnrolledCourses]
      .filter(course => course?._id)
      .filter((course, index, courses) => (
        courses.findIndex(item => item._id.toString() === course._id.toString()) === index
      ));

    // Fetch user progress for enrolled courses
    const progressRecords = await Progress.find({ student: userId });
    const progressMap = {};
    progressRecords.forEach(p => {
      if (p.course) {
        progressMap[p.course.toString()] = p;
      }
    });

    // Fetch certificates for this student
    const certificates = await Certificate.find({ student: userId }).sort({ createdAt: -1 });

    // Fetch attendance for this student
    const attendanceRecords = await Attendance.find({ student: userId })
      .populate('course', 'title')
      .sort({ date: -1 });

    // Calculate aggregated metrics
    let totalLessonsAcrossCourses = 0;
    let totalCompletedLessonsAcrossCourses = 0;
    let totalTimeSpentMinutes = 0;
    let totalProgressSum = 0;

    const themes = ['blue', 'purple', 'emerald', 'indigo', 'amber'];

    const formattedEnrolledCourses = allEnrolledCourses.map((course, idx) => {
      const p = progressMap[course._id.toString()];

      let courseTotalLessons = 0;
      if (Array.isArray(course.curriculum)) {
        course.curriculum.forEach(week => {
          if (Array.isArray(week.lessons)) {
            courseTotalLessons += week.lessons.length;
          }
        });
      }
      if (courseTotalLessons === 0) courseTotalLessons = 12; // Standard default

      const completedLessonsCount = p?.completedLessons?.length || 0;
      const overallProgress = p?.overallProgress !== undefined && p?.overallProgress !== null
        ? p.overallProgress
        : (courseTotalLessons > 0 ? Math.min(100, Math.round((completedLessonsCount / courseTotalLessons) * 100)) : 0);

      totalLessonsAcrossCourses += courseTotalLessons;
      totalCompletedLessonsAcrossCourses += completedLessonsCount;
      totalTimeSpentMinutes += (p?.timeSpent || 0);
      totalProgressSum += overallProgress;

      return {
        _id: course._id,
        id: course._id,
        title: course.title,
        subtitle: course.description
          ? (course.description.length > 70 ? course.description.substring(0, 70) + '...' : course.description)
          : 'Master Korean language concepts',
        category: course.category || 'Language',
        level: course.level || 'beginner',
        duration: course.duration || 6,
        thumbnail: course.thumbnail || '',
        progress: overallProgress,
        completedLessons: completedLessonsCount,
        totalLessons: courseTotalLessons,
        lessonsText: `${completedLessonsCount}/${courseTotalLessons} lessons`,
        theme: themes[idx % themes.length],
        isCompleted: p?.isCompleted || overallProgress === 100,
        lastAccessed: p?.lastAccessed || p?.updatedAt || course.updatedAt,
      };
    });

    const totalEnrolled = formattedEnrolledCourses.length;
    const averageProgress = totalEnrolled > 0 ? Math.round(totalProgressSum / totalEnrolled) : 0;
    const timeSpentHours = Math.round(totalTimeSpentMinutes / 60);

    // Attendance stats
    const totalAttendanceSessions = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
    const absentCount = attendanceRecords.filter(a => a.status === 'absent').length;
    const lateCount = attendanceRecords.filter(a => a.status === 'late').length;
    const excusedCount = attendanceRecords.filter(a => a.status === 'excused').length;
    const attendanceRate = totalAttendanceSessions > 0
      ? Math.round((presentCount / totalAttendanceSessions) * 100)
      : 100;

    // Build Recent Activity
    const recentActivity = [];
    progressRecords.forEach(p => {
      if (Array.isArray(p.completedLessons)) {
        p.completedLessons.forEach(l => {
          const course = allEnrolledCourses.find(c => c._id.toString() === p.course?.toString());
          recentActivity.push({
            id: `lesson-${l._id || l.completedAt || Math.random()}`,
            title: `Completed lesson: ${l.title || 'Course Lesson'}`,
            subtitle: course ? `Part of '${course.title}'` : 'Course Lesson',
            timestamp: l.completedAt || p.updatedAt,
            icon: 'CheckCircle2',
            iconColor: 'text-green-600 bg-green-50'
          });
        });
      }
    });

    certificates.forEach(c => {
      recentActivity.push({
        id: `cert-${c._id}`,
        title: `Earned Certificate: ${c.courseName}`,
        subtitle: `Issued on ${new Date(c.issuedDate || c.createdAt).toLocaleDateString()}`,
        timestamp: c.issuedDate || c.createdAt,
        icon: 'Award',
        iconColor: 'text-purple-600 bg-purple-50'
      });
    });

    allEnrolledCourses.forEach(c => {
      recentActivity.push({
        id: `enroll-${c._id}`,
        title: `Enrolled in: ${c.title}`,
        subtitle: `${(c.level || 'BEGINNER').toUpperCase()} • ${c.category || 'Language'}`,
        timestamp: c.updatedAt || c.createdAt,
        icon: 'BookOpen',
        iconColor: 'text-blue-600 bg-blue-50'
      });
    });

    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const topRecentActivity = recentActivity.slice(0, 5);

    // Streak calculation (consecutive or activity-based)
    const streakDays = Math.max(1, Math.min(30, totalCompletedLessonsAcrossCourses + 1));

    // Dynamic Level
    const userLevel = formattedEnrolledCourses.some(c => c.level === 'advanced')
      ? 'Advanced'
      : formattedEnrolledCourses.some(c => c.level === 'intermediate')
      ? 'Intermediate'
      : 'Beginner';

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          bio: user.bio || '',
          phone: user.phone || '',
          location: user.location || '',
          website: user.website || '',
          socialLinks: user.socialLinks || {},
          level: userLevel,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        },
        statistics: {
          totalEnrolledCourses: totalEnrolled,
          totalCompletedLessons: totalCompletedLessonsAcrossCourses,
          totalLessons: totalLessonsAcrossCourses,
          totalCertificates: certificates.length,
          timeSpent: totalTimeSpentMinutes,
          timeSpentFormatted: `${timeSpentHours}h`,
          overallProgress: averageProgress,
          streakDays,
          attendanceRate,
          attendanceSummary: {
            totalSessions: totalAttendanceSessions,
            presentCount,
            absentCount,
            lateCount,
            excusedCount,
          }
        },
        enrolledCourses: formattedEnrolledCourses,
        recentActivity: topRecentActivity,
        attendance: {
          rate: attendanceRate,
          summary: {
            totalSessions: totalAttendanceSessions,
            presentCount,
            absentCount,
            lateCount,
            excusedCount,
          },
          records: attendanceRecords.map(a => formatAttendanceRow(a, 'General Korean Course'))
        }
      }
    });
  } catch (error) {
    console.error('Error in /api/users/dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving dashboard data',
      error: error.message
    });
  }
});

// @desc    Get user attendance records
// @route   GET /api/users/attendance
// @access  Private
router.get('/attendance', protect, async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.user.id })
      .populate('course', 'title')
      .sort({ date: -1 });

    const totalSessions = records.length;
    const presentCount = records.filter(a => a.status === 'present').length;
    const absentCount = records.filter(a => a.status === 'absent').length;
    const lateCount = records.filter(a => a.status === 'late').length;
    const excusedCount = records.filter(a => a.status === 'excused').length;
    const rate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;

    res.status(200).json({
      success: true,
      data: {
        rate,
        summary: { totalSessions, presentCount, absentCount, lateCount, excusedCount },
        records: records.map(a => formatAttendanceRow(a, 'General Korean'))
      }
    });
  } catch (error) {
    console.error('Error in /api/users/attendance:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving attendance' });
  }
});

// @desc    Record or update user attendance
// @route   POST /api/users/attendance
// @access  Private
router.post('/attendance', protect, async (req, res) => {
  try {
    const { date, courseId, notes, dayNumber } = req.body;

    const status = String(req.body.status || 'present').trim().toLowerCase();
    if (!ATTENDANCE_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${ATTENDANCE_STATUSES.join(', ')}`,
      });
    }

    let day = date ? toAttendanceDay(date) : todayAttendanceDay();
    if (dayNumber && !date) {
      // dayNumber of the current month
      const today = todayAttendanceDay();
      day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), parseInt(dayNumber, 10)));
    }

    if (!day || Number.isNaN(day.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid attendance date. Use the YYYY-MM-DD format.' });
    }

    // Default to the student's first enrolled course
    const course = courseId || req.user.enrolledCourses?.[0];
    if (!course || !mongoose.isObjectIdOrHexString(course) || !(await Course.exists({ _id: course }))) {
      return res.status(400).json({ success: false, message: 'No course found to associate with attendance' });
    }

    const attendance = await upsertAttendanceRecord({
      studentId: req.user._id,
      courseId: course,
      day,
      status,
      notes: typeof notes === 'string' ? notes.trim().slice(0, 250) : '',
      recordedBy: req.user._id,
    });
    await attendance.populate('course', 'title');

    res.status(200).json({
      success: true,
      message: 'Attendance saved successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).json({ success: false, message: 'Server error saving attendance' });
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('enrolledCourses', 'title thumbnail category level duration price');

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        phone: user.phone,
        location: user.location,
        website: user.website,
        socialLinks: user.socialLinks,
        enrolledCourses: user.enrolledCourses,
        notifications: user.notifications,
        privacy: user.privacy,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put(
  '/profile',
  protect,
  validateProfileUpdate,
  handleValidationErrors,
  async (req, res) => {
    try {
      const fieldsToUpdate = {
        name: req.body.name,
        bio: req.body.bio,
        avatar: req.body.avatar,
        phone: req.body.phone,
        location: req.body.location,
        website: req.body.website,
        socialLinks: req.body.socialLinks,
        notifications: req.body.notifications,
        privacy: req.body.privacy,
      };

      // Remove undefined values
      Object.keys(fieldsToUpdate).forEach(
        key => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key],
      );

      const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true,
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          bio: user.bio,
          phone: user.phone,
          location: user.location,
          website: user.website,
          socialLinks: user.socialLinks,
          enrolledCourses: user.enrolledCourses,
          notifications: user.notifications,
          privacy: user.privacy,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        },
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Server error',
      });
    }
  },
);

// @desc    Update notification preferences
// @route   PUT /api/users/notifications
// @access  Private
router.put('/notifications', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { notifications: req.body.notifications },
      { new: true }
    );
    res.status(200).json({
      success: true,
      message: 'Notification preferences updated successfully',
      notifications: user.notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Update privacy settings
// @route   PUT /api/users/privacy
// @access  Private
router.put('/privacy', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { privacy: req.body.privacy },
      { new: true }
    );
    res.status(200).json({
      success: true,
      message: 'Privacy settings updated successfully',
      privacy: user.privacy,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Upload user avatar
// @route   POST /api/users/avatar
// @access  Private
router.post('/avatar', protect, (req, res, next) => {
  // If JSON payload with avatar string was sent, bypass multer
  if (req.body && req.body.avatar) {
    return next();
  }
  uploadSingle(req, res, err => {
    if (err) {
      console.error('Avatar upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'Failed to process avatar upload',
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    let avatarDataUri = req.body?.avatar;

    if (!avatarDataUri && req.file) {
      avatarDataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    if (!avatarDataUri) {
      return res.status(400).json({
        success: false,
        message: 'No photo provided',
      });
    }

    // Update user's avatar directly in database
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarDataUri },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded and saved to database successfully',
      avatar: avatarDataUri,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        phone: user.phone,
        location: user.location,
        website: user.website,
        socialLinks: user.socialLinks,
      }
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Delete user avatar
// @route   DELETE /api/users/avatar
// @access  Private
router.delete('/avatar', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete local uploaded file if it exists
    if (user.avatar && user.avatar.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', user.avatar);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkErr) {
          console.warn('Could not remove file:', unlinkErr.message);
        }
      }
    }

    user.avatar = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile photo removed successfully',
      avatar: null,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: null,
        bio: user.bio,
        phone: user.phone,
        location: user.location,
        website: user.website,
        socialLinks: user.socialLinks,
      },
    });
  } catch (error) {
    console.error('Avatar delete error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Change password
// @route   PUT /api/users/password
// @access  Private
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { search, role } = req.query;
    const query = {};

    if (role && role !== 'all') {
      query.role = role.toLowerCase();
    }

    if (search) {
      const pattern = escapeRegex(search);
      query.$or = [
        { name: { $regex: pattern, $options: 'i' } },
        { email: { $regex: pattern, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .populate('enrolledCourses', 'title category level thumbnail')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
});

// @desc    Create a user (Admin only)
// @route   POST /api/users
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const userRole = (role || 'student').toLowerCase();
    const userPassword = password || '123456';

    const user = await User.create({
      name,
      email,
      password: userPassword,
      role: userRole
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        avatar: user.avatar,
        enrolledCourses: user.enrolledCourses || []
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating user'
    });
  }
});

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, name, email, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (role !== undefined) {
      const formattedRole = role.toLowerCase();
      if (!['student', 'instructor', 'admin'].includes(formattedRole)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be student, instructor, or admin'
        });
      }
      user.role = formattedRole;
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        avatar: user.avatar,
        enrolledCourses: user.enrolledCourses || []
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating user'
    });
  }
});

// @desc    Patch user (Admin only)
// @route   PATCH /api/users/:id
// @access  Private/Admin
router.patch('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, name, email, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (role !== undefined) {
      const formattedRole = role.toLowerCase();
      if (!['student', 'instructor', 'admin'].includes(formattedRole)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be student, instructor, or admin'
        });
      }
      user.role = formattedRole;
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        avatar: user.avatar,
        enrolledCourses: user.enrolledCourses || []
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating user'
    });
  }
});

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting user'
    });
  }
});

module.exports = router;
