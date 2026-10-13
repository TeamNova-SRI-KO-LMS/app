const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const { protect } = require('../middleware/auth');

// @route   GET /api/attendance/my-attendance
// @desc    Get current user's attendance details, records, and monthly metrics
// @access  Private
router.get('/my-attendance', protect, async (req, res) => {
  try {
    const studentId = req.user._id;

    // Fetch all attendance records for this student
    const records = await Attendance.find({ student: studentId })
      .populate('course', 'title category level')
      .sort({ date: -1 });

    const totalSessions = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const excused = records.filter(r => r.status === 'excused').length;

    const attendanceRate = totalSessions > 0
      ? Math.round((present / totalSessions) * 100)
      : 100;

    res.json({
      success: true,
      stats: {
        attendanceRate,
        totalSessions,
        present,
        absent,
        late,
        excused,
      },
      records,
    });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching attendance data',
      error: error.message,
    });
  }
});

// @route   GET /api/attendance/monthly
// @desc    Get attendance records for a specific month/year for the calendar view
// @access  Private
router.get('/monthly', protect, async (req, res) => {
  try {
    const studentId = req.user._id;
    const { year, month, courseId } = req.query;

    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1; // 1-12

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59, 999); // last day of month

    const query = {
      student: studentId,
      date: { $gte: startDate, $lte: endDate },
    };

    if (courseId && courseId !== 'all') {
      query.course = courseId;
    }

    const records = await Attendance.find(query)
      .populate('course', 'title category level')
      .sort({ date: 1 });

    res.json({ success: true, records, year: y, month: m });
  } catch (error) {
    console.error('Error fetching monthly attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching monthly attendance',
      error: error.message,
    });
  }
});

// @route   GET /api/attendance/enrolled-courses
// @desc    Get courses the student has attendance records in or is enrolled in
// @access  Private
router.get('/enrolled-courses', protect, async (req, res) => {
  try {
    const studentId = req.user._id;

    // Courses that appear in attendance records
    const courseIds = await Attendance.distinct('course', { student: studentId });

    // Also look up courses the user is directly enrolled in
    const User = require('../models/User');
    const userDoc = await User.findById(studentId).select('enrolledCourses');
    const enrolledIds = userDoc?.enrolledCourses || [];

    const allIds = [...new Set([...courseIds.map(String), ...enrolledIds.map(String)])];

    const courses = await Course.find({ _id: { $in: allIds } }).select('title category level');

    res.json({ success: true, courses });
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching enrolled courses',
      error: error.message,
    });
  }
});

// @route   POST /api/attendance
// @desc    Record or update attendance for a date/course (upsert by student+course+date)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { courseId, date, status, notes } = req.body;
    const studentId = req.user._id;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    // Resolve courseId — may be a Mongo ObjectId or a course title string
    let targetCourseId = courseId;

    if (!targetCourseId) {
      const defaultCourse = await Course.findOne();
      if (defaultCourse) targetCourseId = defaultCourse._id;
    } else if (!/^[0-9a-fA-F]{24}$/.test(String(targetCourseId))) {
      const foundCourse = await Course.findOne({ title: new RegExp(courseId, 'i') });
      if (foundCourse) {
        targetCourseId = foundCourse._id;
      } else {
        const anyCourse = await Course.findOne();
        if (anyCourse) targetCourseId = anyCourse._id;
      }
    }

    if (!targetCourseId) {
      return res.status(400).json({ success: false, message: 'No valid course found to associate this attendance record' });
    }

    const filter = { student: studentId, course: targetCourseId, date: attendanceDate };
    const update = {
      student: studentId,
      course: targetCourseId,
      date: attendanceDate,
      status: status.toLowerCase(),
      notes: notes || '',
      recordedBy: req.user._id,
    };

    const record = await Attendance.findOneAndUpdate(
      filter,
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('course', 'title category level');

    res.status(200).json({
      success: true,
      message: 'Attendance recorded successfully',
      record,
    });
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error recording attendance',
      error: error.message,
    });
  }
});

// @route   PUT /api/attendance/:id
// @desc    Update attendance record by ID
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { status, notes, date } = req.body;
    const record = await Attendance.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    if (status) record.status = status.toLowerCase();
    if (notes !== undefined) record.notes = notes;
    if (date) record.date = new Date(date);

    await record.save();
    const updatedRecord = await Attendance.findById(record._id).populate('course', 'title category level');

    res.json({
      success: true,
      message: 'Attendance record updated successfully',
      record: updatedRecord,
    });
  } catch (error) {
    console.error('Error updating attendance record:', error);
    res.status(500).json({ success: false, message: 'Server error updating attendance record' });
  }
});

// @route   DELETE /api/attendance/:id
// @desc    Delete attendance record by ID
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    await Attendance.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Attendance record deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    res.status(500).json({ success: false, message: 'Server error deleting attendance record' });
  }
});

module.exports = router;
