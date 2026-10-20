const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const escapeRegex = require('../utils/escapeRegex');
const {
  ATTENDANCE_STATUSES,
  toAttendanceDay,
  todayAttendanceDay,
  formatAttendanceDay,
  attendanceDayRange,
  serializeAttendance,
  summarizeAttendance,
  upsertAttendanceRecord,
} = require('../utils/attendance');

const COURSE_FIELDS = 'title category level';
const DAY_MS = 24 * 60 * 60 * 1000;

const isValidId = (value) => mongoose.isObjectIdOrHexString(value);

const parseStatus = (value) => {
  const status = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return ATTENDANCE_STATUSES.includes(status) ? status : null;
};

const parseNotes = (value) => (typeof value === 'string' ? value.trim().slice(0, 250) : '');

const invalidStatusMessage = `Status must be one of: ${ATTENDANCE_STATUSES.join(', ')}`;

// ─────────────────────────────────────────────────────────────
// STUDENT ROUTES
// ─────────────────────────────────────────────────────────────

// @route   GET /api/attendance/my-attendance
// @desc    Get current user's attendance details, records, and monthly metrics
// @access  Private
router.get('/my-attendance', protect, async (req, res) => {
  try {
    // Fetch all attendance records for this student
    const records = await Attendance.find({ student: req.user._id })
      .populate('course', COURSE_FIELDS)
      .sort({ date: -1 });

    res.json({
      success: true,
      stats: summarizeAttendance(records),
      records: records.map(serializeAttendance),
    });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching attendance data',
    });
  }
});

// @route   GET /api/attendance/monthly
// @desc    Get attendance records for a specific month/year for the calendar view
// @access  Private
router.get('/monthly', protect, async (req, res) => {
  try {
    const now = new Date();
    const year = Number.parseInt(req.query.year, 10) || now.getFullYear();
    const month = Number.parseInt(req.query.month, 10) || now.getMonth() + 1; // 1-12
    const { courseId } = req.query;

    if (month < 1 || month > 12 || year < 2000 || year > 2100) {
      return res.status(400).json({ success: false, message: 'Invalid month or year' });
    }

    const query = {
      student: req.user._id,
      date: attendanceDayRange(new Date(Date.UTC(year, month - 1, 1)), new Date(Date.UTC(year, month, 0))),
    };

    if (courseId && courseId !== 'all') {
      if (!isValidId(courseId)) {
        return res.status(400).json({ success: false, message: 'Invalid course' });
      }
      query.course = courseId;
    }

    const records = await Attendance.find(query)
      .populate('course', COURSE_FIELDS)
      .sort({ date: 1 });

    res.json({ success: true, records: records.map(serializeAttendance), year, month });
  } catch (error) {
    console.error('Error fetching monthly attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching monthly attendance',
    });
  }
});

// @route   GET /api/attendance/enrolled-courses
// @desc    Get courses the student has attendance records in or is enrolled in
// @access  Private
router.get('/enrolled-courses', protect, async (req, res) => {
  try {
    const studentId = req.user._id;

    const [attendanceCourseIds, directCourseIds] = await Promise.all([
      Attendance.distinct('course', { student: studentId }),
      Course.distinct('_id', { enrolledStudents: studentId }),
    ]);

    const allIds = [...new Set([
      ...attendanceCourseIds,
      ...directCourseIds,
      ...(req.user.enrolledCourses || []),
    ].map(String))];

    const courses = await Course.find({ _id: { $in: allIds } })
      .select(COURSE_FIELDS)
      .sort({ title: 1 });

    res.json({ success: true, courses });
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching enrolled courses',
    });
  }
});

// @route   POST /api/attendance
// @desc    Record or update attendance for a date/course (upsert by student+course+day)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { courseId, date } = req.body;

    const status = parseStatus(req.body.status);
    if (!status) {
      return res.status(400).json({ success: false, message: invalidStatusMessage });
    }

    const day = date ? toAttendanceDay(date) : todayAttendanceDay();
    if (!day) {
      return res.status(400).json({ success: false, message: 'Invalid attendance date. Use the YYYY-MM-DD format.' });
    }

    if (!isValidId(courseId)) {
      return res.status(400).json({ success: false, message: 'Please select a valid course for this attendance record.' });
    }

    const course = await Course.findById(courseId).select('_id');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const record = await upsertAttendanceRecord({
      studentId: req.user._id,
      courseId: course._id,
      day,
      status,
      notes: parseNotes(req.body.notes),
      recordedBy: req.user._id,
    });
    await record.populate('course', COURSE_FIELDS);

    res.status(200).json({
      success: true,
      message: 'Attendance recorded successfully',
      record: serializeAttendance(record),
    });
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error recording attendance',
    });
  }
});

// ─────────────────────────────────────────────────────────────
// ADMIN ROUTES (read-only reporting)
// ─────────────────────────────────────────────────────────────

const MAX_TREND_DAYS = 62;
const DEFAULT_TREND_DAYS = 30;
const MAX_EXPORT_ROWS = 10000;

// { present: {$sum: ...}, absent: ..., late: ..., excused: ... } for $group stages
const STATUS_COUNTERS = Object.fromEntries(
  ATTENDANCE_STATUSES.map((status) => [status, { $sum: { $cond: [{ $eq: ['$status', status] }, 1, 0] } }]),
);

// Rounded like Math.round so admins see the same rate the student sees.
const RATE_EXPRESSION = {
  $floor: { $add: [{ $multiply: [{ $divide: ['$present', '$totalSessions'] }, 100] }, 0.5] },
};

// Calendar-day bucket (ms at UTC midnight). Rounds legacy local-midnight
// timestamps to their day, the same way toAttendanceDay() does.
const DAY_BUCKET = {
  $multiply: [{ $floor: { $add: [{ $divide: [{ $toLong: '$date' }, DAY_MS] }, 0.5] } }, DAY_MS],
};

const RECORD_SORTS = {
  date_desc: { date: -1, _id: -1 },
  date_asc: { date: 1, _id: 1 },
  updated_desc: { updatedAt: -1, _id: -1 },
};

const STUDENT_SORTS = {
  rate_asc: { attendanceRate: 1, totalSessions: -1, _id: 1 },
  rate_desc: { attendanceRate: -1, totalSessions: -1, _id: 1 },
  sessions_desc: { totalSessions: -1, _id: 1 },
  name_asc: { 'student.name': 1, _id: 1 },
  recent: { lastMarkedAt: -1, _id: 1 },
};

const badRequest = (message) => Object.assign(new Error(message), { statusCode: 400 });

const sendAdminError = (res, error, action) => {
  if (error.statusCode === 400) {
    return res.status(400).json({ success: false, message: error.message });
  }
  console.error(`Error ${action}:`, error);
  return res.status(500).json({ success: false, message: `Server error ${action}` });
};

const withRate = ({ _id, ...counts }) => ({
  ...counts,
  attendanceRate: counts.totalSessions > 0
    ? Math.round((counts.present / counts.totalSessions) * 100)
    : null,
});

const parsePagination = (query) => ({
  page: Math.min(Math.max(Number.parseInt(query.page, 10) || 1, 1), 10000),
  limit: Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100),
});

/**
 * Translate the shared admin query (?from&to&courseId&studentId&search&status)
 * into a MongoDB filter. Dates are calendar days in YYYY-MM-DD format.
 */
const buildAdminFilter = async (query, { withStatus = true } = {}) => {
  const filter = {};

  const from = query.from ? toAttendanceDay(query.from) : null;
  const to = query.to ? toAttendanceDay(query.to) : null;
  if ((query.from && !from) || (query.to && !to)) {
    throw badRequest('Dates must use the YYYY-MM-DD format.');
  }
  if (from && to && from > to) {
    throw badRequest('The start date must be on or before the end date.');
  }
  if (from || to) {
    filter.date = attendanceDayRange(from, to);
  }

  if (query.courseId && query.courseId !== 'all') {
    if (!isValidId(query.courseId)) {
      throw badRequest('Invalid course filter.');
    }
    filter.course = new mongoose.Types.ObjectId(String(query.courseId));
  }

  if (query.studentId) {
    if (!isValidId(query.studentId)) {
      throw badRequest('Invalid student filter.');
    }
    filter.student = new mongoose.Types.ObjectId(String(query.studentId));
  } else if (typeof query.search === 'string' && query.search.trim()) {
    const pattern = new RegExp(escapeRegex(query.search.trim()), 'i');
    const students = await User.find({ $or: [{ name: pattern }, { email: pattern }] })
      .select('_id')
      .lean();
    filter.student = { $in: students.map((student) => student._id) };
  }

  if (withStatus && query.status && query.status !== 'all') {
    const status = parseStatus(query.status);
    if (!status) {
      throw badRequest('Invalid status filter.');
    }
    filter.status = status;
  }

  return { filter, from, to };
};

const countStatuses = async (filter) => {
  const [row] = await Attendance.aggregate([
    { $match: filter },
    { $group: { _id: null, totalSessions: { $sum: 1 }, ...STATUS_COUNTERS } },
  ]);
  return withRate(row || { totalSessions: 0, present: 0, absent: 0, late: 0, excused: 0 });
};

// @route   GET /api/attendance/admin/overview
// @desc    Attendance totals, today's numbers, per-course breakdown and daily trend
// @access  Private/Admin
router.get('/admin/overview', protect, authorize('admin'), async (req, res) => {
  try {
    const { filter, from, to } = await buildAdminFilter(req.query, { withStatus: false });
    const { date: _dateRange, ...scope } = filter; // course/student filters without the date range
    const today = (req.query.today && toAttendanceDay(req.query.today)) || todayAttendanceDay();

    // Trend: the whole selected range when short, otherwise the last 30 days of it.
    const trendTo = to || today;
    const trendFrom = from && (trendTo - from) / DAY_MS < MAX_TREND_DAYS
      ? from
      : new Date(trendTo.getTime() - (DEFAULT_TREND_DAYS - 1) * DAY_MS);

    // Previous period of equal length, for the attendance-rate delta.
    const previousRange = from && to
      ? (() => {
        const spanDays = Math.round((to - from) / DAY_MS) + 1;
        return {
          from: new Date(from.getTime() - spanDays * DAY_MS),
          to: new Date(from.getTime() - DAY_MS),
        };
      })()
      : null;

    const [
      totals,
      studentIds,
      courseIds,
      courseRows,
      trendRows,
      todayTotals,
      previousTotals,
      lastRecord,
      courses,
    ] = await Promise.all([
      countStatuses(filter),
      Attendance.distinct('student', filter),
      Attendance.distinct('course', filter),
      Attendance.aggregate([
        { $match: filter },
        { $group: { _id: '$course', totalSessions: { $sum: 1 }, ...STATUS_COUNTERS } },
        {
          $lookup: {
            from: Course.collection.name,
            localField: '_id',
            foreignField: '_id',
            as: 'course',
            pipeline: [{ $project: { title: 1, level: 1 } }],
          },
        },
        { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
        { $sort: { totalSessions: -1, _id: 1 } },
        { $limit: 50 },
      ]),
      Attendance.aggregate([
        { $match: { ...scope, date: attendanceDayRange(trendFrom, trendTo) } },
        { $group: { _id: DAY_BUCKET, totalSessions: { $sum: 1 }, ...STATUS_COUNTERS } },
      ]),
      countStatuses({ ...scope, date: attendanceDayRange(today, today) }),
      previousRange
        ? countStatuses({ ...scope, date: attendanceDayRange(previousRange.from, previousRange.to) })
        : null,
      Attendance.findOne(filter).sort({ updatedAt: -1 }).select('updatedAt').lean(),
      Course.find().select('title').sort({ title: 1 }).lean(),
    ]);

    const trendByDay = new Map(trendRows.map((row) => [Math.round(row._id), row]));
    const trendDays = [];
    for (let time = trendFrom.getTime(); time <= trendTo.getTime(); time += DAY_MS) {
      const row = trendByDay.get(time) || {};
      trendDays.push({
        date: formatAttendanceDay(new Date(time)),
        totalSessions: row.totalSessions || 0,
        present: row.present || 0,
        late: row.late || 0,
        excused: row.excused || 0,
        absent: row.absent || 0,
      });
    }

    res.json({
      success: true,
      range: { from: formatAttendanceDay(from), to: formatAttendanceDay(to) },
      totals: {
        ...totals,
        studentsTracked: studentIds.length,
        coursesTracked: courseIds.length,
      },
      previous: previousRange
        ? {
          from: formatAttendanceDay(previousRange.from),
          to: formatAttendanceDay(previousRange.to),
          ...previousTotals,
        }
        : null,
      today: { date: formatAttendanceDay(today), ...todayTotals },
      courseBreakdown: courseRows.map(({ _id, course, ...counts }) => ({
        courseId: _id,
        title: course?.title || 'Deleted course',
        level: course?.level || null,
        ...withRate(counts),
      })),
      trend: {
        from: formatAttendanceDay(trendFrom),
        to: formatAttendanceDay(trendTo),
        days: trendDays,
      },
      lastActivityAt: lastRecord?.updatedAt || null,
      courses,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    sendAdminError(res, error, 'loading the attendance overview');
  }
});

// @route   GET /api/attendance/admin/records
// @desc    Paginated attendance records with student and course details
// @access  Private/Admin
router.get('/admin/records', protect, authorize('admin'), async (req, res) => {
  try {
    const { filter } = await buildAdminFilter(req.query);
    const { page, limit } = parsePagination(req.query);
    const sort = RECORD_SORTS[req.query.sort] || RECORD_SORTS.date_desc;

    const [total, records] = await Promise.all([
      Attendance.countDocuments(filter),
      Attendance.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('student', 'name email role isActive')
        .populate('course', COURSE_FIELDS)
        .lean(),
    ]);

    res.json({
      success: true,
      records: records.map(serializeAttendance),
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    sendAdminError(res, error, 'loading attendance records');
  }
});

// @route   GET /api/attendance/admin/students
// @desc    Per-student attendance summary (rate, status counts, last marked)
// @access  Private/Admin
router.get('/admin/students', protect, authorize('admin'), async (req, res) => {
  try {
    const { filter } = await buildAdminFilter(req.query, { withStatus: false });
    const { page, limit } = parsePagination(req.query);
    const sortKey = STUDENT_SORTS[req.query.sort] ? req.query.sort : 'rate_asc';

    let aggregation = Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$student',
          totalSessions: { $sum: 1 },
          ...STATUS_COUNTERS,
          courses: { $addToSet: '$course' },
          lastSessionDate: { $max: '$date' },
          lastMarkedAt: { $max: '$updatedAt' },
        },
      },
      { $addFields: { attendanceRate: RATE_EXPRESSION, coursesCount: { $size: '$courses' } } },
      {
        $lookup: {
          from: User.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'student',
          pipeline: [{ $project: { name: 1, email: 1, isActive: 1 } }],
        },
      },
      { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
      { $sort: STUDENT_SORTS[sortKey] },
      {
        $facet: {
          rows: [{ $skip: (page - 1) * limit }, { $limit: limit }, { $project: { courses: 0 } }],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    if (sortKey === 'name_asc') {
      aggregation = aggregation.collation({ locale: 'en', strength: 2 });
    }

    const [result] = await aggregation;
    const total = result?.total?.[0]?.count || 0;

    res.json({
      success: true,
      students: (result?.rows || []).map(({ _id, student, lastSessionDate, ...row }) => ({
        studentId: _id,
        name: student?.name || 'Deleted user',
        email: student?.email || '',
        isActive: student?.isActive ?? false,
        lastSessionDate: formatAttendanceDay(lastSessionDate),
        ...withRate(row),
      })),
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    sendAdminError(res, error, 'loading the student attendance summary');
  }
});

const CSV_COLUMNS = ['Date', 'Student', 'Email', 'Course', 'Status', 'Notes', 'Marked at (UTC)', 'Last updated (UTC)'];

// Quote every cell, and neutralize spreadsheet formulas in user-entered text.
const csvCell = (value) => {
  let text = value === undefined || value === null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
};

const capitalize = (value = '') => value.charAt(0).toUpperCase() + value.slice(1);

// @route   GET /api/attendance/admin/export
// @desc    Download the filtered attendance records as CSV (newest 10,000)
// @access  Private/Admin
router.get('/admin/export', protect, authorize('admin'), async (req, res) => {
  try {
    const { filter } = await buildAdminFilter(req.query);

    const records = await Attendance.find(filter)
      .sort(RECORD_SORTS.date_desc)
      .limit(MAX_EXPORT_ROWS)
      .populate('student', 'name email')
      .populate('course', 'title')
      .lean();

    const lines = [CSV_COLUMNS.map(csvCell).join(',')];
    records.forEach((record) => {
      lines.push([
        formatAttendanceDay(record.date),
        record.student?.name || 'Deleted user',
        record.student?.email || '',
        record.course?.title || 'Deleted course',
        capitalize(record.status),
        record.notes || '',
        record.createdAt ? new Date(record.createdAt).toISOString() : '',
        record.updatedAt ? new Date(record.updatedAt).toISOString() : '',
      ].map(csvCell).join(','));
    });

    const filename = `attendance-${formatAttendanceDay(todayAttendanceDay())}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    // The BOM lets Excel detect UTF-8 (Korean names and notes)
    res.send(`﻿${lines.join('\r\n')}\r\n`);
  } catch (error) {
    sendAdminError(res, error, 'exporting attendance records');
  }
});

// ─────────────────────────────────────────────────────────────
// STUDENT ROUTES (by record ID) — owners only
// ─────────────────────────────────────────────────────────────

// @route   PUT /api/attendance/:id
// @desc    Update one of the current student's attendance records
// @access  Private (record owner)
router.put('/:id', protect, async (req, res) => {
  try {
    const record = isValidId(req.params.id) ? await Attendance.findById(req.params.id) : null;

    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    if (!record.student.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only update your own attendance records' });
    }

    const { status, notes, date } = req.body;

    if (status !== undefined) {
      const parsedStatus = parseStatus(status);
      if (!parsedStatus) {
        return res.status(400).json({ success: false, message: invalidStatusMessage });
      }
      record.status = parsedStatus;
    }

    if (notes !== undefined) {
      record.notes = parseNotes(notes);
    }

    if (date !== undefined) {
      const day = toAttendanceDay(date);
      if (!day) {
        return res.status(400).json({ success: false, message: 'Invalid attendance date. Use the YYYY-MM-DD format.' });
      }
      record.date = day;
    }

    await record.save();
    await record.populate('course', COURSE_FIELDS);

    res.json({
      success: true,
      message: 'Attendance record updated successfully',
      record: serializeAttendance(record),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An attendance record already exists for this course on that day',
      });
    }
    console.error('Error updating attendance record:', error);
    res.status(500).json({ success: false, message: 'Server error updating attendance record' });
  }
});

// @route   DELETE /api/attendance/:id
// @desc    Delete one of the current student's attendance records
// @access  Private (record owner)
router.delete('/:id', protect, async (req, res) => {
  try {
    const record = isValidId(req.params.id) ? await Attendance.findById(req.params.id) : null;

    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    if (!record.student.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only delete your own attendance records' });
    }

    await record.deleteOne();

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
