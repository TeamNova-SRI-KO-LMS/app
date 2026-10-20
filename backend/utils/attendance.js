const Attendance = require('../models/Attendance');

const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'excused'];

const DAY_MS = 24 * 60 * 60 * 1000;
const HALF_DAY_MS = DAY_MS / 2;
const DAY_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Attendance is recorded per calendar day and stored at UTC midnight
 * ("2026-10-20" -> 2026-10-20T00:00:00.000Z) regardless of the server timezone.
 *
 * Older records were saved at the server's *local* midnight (for example
 * 2026-10-19T18:30:00Z on a UTC+05:30 machine), so any value that is not a
 * "YYYY-MM-DD" string is rounded to the nearest UTC midnight, which recovers the
 * intended day for any server offset within ±12 hours. Returns null when invalid.
 */
const toAttendanceDay = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value === 'string') {
    const match = DAY_KEY_PATTERN.exec(value.trim());
    if (match) {
      const [, year, month, day] = match.map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      // Reject overflowing dates such as 2026-02-31
      return date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
    }
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return new Date(Math.round(timestamp / DAY_MS) * DAY_MS);
};

/** Today's calendar date in UTC, used when a request does not name a day. */
const todayAttendanceDay = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

/** "YYYY-MM-DD" key for a stored or requested attendance date. */
const formatAttendanceDay = (value) => {
  const day = toAttendanceDay(value);
  return day ? day.toISOString().slice(0, 10) : null;
};

/**
 * MongoDB condition matching records whose day is between fromDay and toDay
 * (inclusive, either may be omitted). The ±12h margin also matches legacy
 * records stored at a local midnight, consistent with toAttendanceDay().
 */
const attendanceDayRange = (fromDay, toDay) => {
  const range = {};
  if (fromDay) {
    range.$gte = new Date(fromDay.getTime() - HALF_DAY_MS);
  }
  if (toDay) {
    range.$lt = new Date(toDay.getTime() + HALF_DAY_MS);
  }
  return range;
};

/** Plain copy of a record (document or lean object) with its day normalized. */
const serializeAttendance = (record) => {
  const plain = typeof record.toObject === 'function' ? record.toObject() : { ...record };
  plain.date = toAttendanceDay(plain.date);
  return plain;
};

/** Status counts plus the attendance rate (present ÷ total) shown to students and admins. */
const summarizeAttendance = (records) => {
  const summary = { totalSessions: records.length, present: 0, absent: 0, late: 0, excused: 0 };
  records.forEach((record) => {
    if (summary[record.status] !== undefined) {
      summary[record.status] += 1;
    }
  });
  summary.attendanceRate = summary.totalSessions > 0
    ? Math.round((summary.present / summary.totalSessions) * 100)
    : 100;
  return summary;
};

/**
 * Create or update a student's attendance for one course on one day. Prefers the
 * record stored exactly at that UTC midnight, otherwise reuses a legacy
 * local-midnight record for the same day (normalizing its date), so re-marking a
 * day never creates a duplicate.
 */
const upsertAttendanceRecord = async ({ studentId, courseId, day, status, notes = '', recordedBy }, isRetry = false) => {
  const owner = { student: studentId, course: courseId };
  const existing = (await Attendance.findOne({ ...owner, date: day }))
    || (await Attendance.findOne({ ...owner, date: attendanceDayRange(day, day) }));

  try {
    if (existing) {
      existing.date = day;
      existing.status = status;
      existing.notes = notes;
      existing.recordedBy = recordedBy || studentId;
      return await existing.save();
    }

    return await Attendance.create({
      ...owner,
      date: day,
      status,
      notes,
      recordedBy: recordedBy || studentId,
    });
  } catch (err) {
    // A concurrent request created the same day first; update that record instead.
    if (err.code === 11000 && !isRetry) {
      return upsertAttendanceRecord({ studentId, courseId, day, status, notes, recordedBy }, true);
    }
    throw err;
  }
};

module.exports = {
  ATTENDANCE_STATUSES,
  toAttendanceDay,
  todayAttendanceDay,
  formatAttendanceDay,
  attendanceDayRange,
  serializeAttendance,
  summarizeAttendance,
  upsertAttendanceRecord,
};
