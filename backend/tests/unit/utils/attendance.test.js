const mongoose = require('mongoose');
const Attendance = require('../../../models/Attendance');
const {
  ATTENDANCE_STATUSES,
  toAttendanceDay,
  todayAttendanceDay,
  formatAttendanceDay,
  attendanceDayRange,
  serializeAttendance,
  summarizeAttendance,
  upsertAttendanceRecord,
} = require('../../../utils/attendance');

const DAY_MS = 24 * 60 * 60 * 1000;

describe('toAttendanceDay', () => {
  test('TC-UNIT-ATT-01 converts a YYYY-MM-DD string to UTC midnight [FR-015]', () => {
    expect(toAttendanceDay('2026-10-20').toISOString()).toBe('2026-10-20T00:00:00.000Z');
  });

  test('TC-UNIT-ATT-02 rejects calendar dates that do not exist [FR-015]', () => {
    expect(toAttendanceDay('2026-02-31')).toBeNull();
    expect(toAttendanceDay('2026-13-01')).toBeNull();
  });

  test('TC-UNIT-ATT-03 returns null for empty or unparseable values [FR-015]', () => {
    expect(toAttendanceDay(undefined)).toBeNull();
    expect(toAttendanceDay(null)).toBeNull();
    expect(toAttendanceDay('')).toBeNull();
    expect(toAttendanceDay('not a date')).toBeNull();
  });

  test('TC-UNIT-ATT-04 rounds a legacy local-midnight timestamp to its intended day [FR-015]', () => {
    // 2026-10-20 00:00 in Sri Lanka (UTC+05:30) was stored as 2026-10-19T18:30Z
    expect(toAttendanceDay('2026-10-19T18:30:00.000Z').toISOString()).toBe('2026-10-20T00:00:00.000Z');
    expect(toAttendanceDay(new Date('2026-10-20T03:00:00.000Z')).toISOString()).toBe('2026-10-20T00:00:00.000Z');
  });
});

describe('Attendance day helpers', () => {
  test('TC-UNIT-ATT-05 todayAttendanceDay is the current UTC calendar day [FR-015]', () => {
    const today = todayAttendanceDay();
    const now = new Date();

    expect(today.getUTCHours()).toBe(0);
    expect(today.getUTCDate()).toBe(now.getUTCDate());
  });

  test('TC-UNIT-ATT-06 formatAttendanceDay produces a YYYY-MM-DD key or null [FR-015]', () => {
    expect(formatAttendanceDay(new Date('2026-10-19T18:30:00.000Z'))).toBe('2026-10-20');
    expect(formatAttendanceDay('garbage')).toBeNull();
  });

  test('TC-UNIT-ATT-07 attendanceDayRange widens the range by half a day on each side [FR-015]', () => {
    const from = new Date('2026-10-01T00:00:00.000Z');
    const to = new Date('2026-10-31T00:00:00.000Z');

    expect(attendanceDayRange(from, to)).toEqual({
      $gte: new Date(from.getTime() - DAY_MS / 2),
      $lt: new Date(to.getTime() + DAY_MS / 2),
    });
    expect(attendanceDayRange(from, null)).toEqual({ $gte: new Date(from.getTime() - DAY_MS / 2) });
    expect(attendanceDayRange(null, to)).toEqual({ $lt: new Date(to.getTime() + DAY_MS / 2) });
  });

  test('TC-UNIT-ATT-08 summarizeAttendance counts statuses and rounds the rate [FR-015]', () => {
    const records = ['present', 'present', 'late', 'absent', 'excused', 'present'].map((status) => ({ status }));

    expect(summarizeAttendance(records)).toEqual({
      totalSessions: 6, present: 3, absent: 1, late: 1, excused: 1, attendanceRate: 50,
    });
  });

  test('TC-UNIT-ATT-09 summarizeAttendance reports 100% when nothing is recorded [FR-015]', () => {
    expect(summarizeAttendance([])).toMatchObject({ totalSessions: 0, attendanceRate: 100 });
  });

  test('TC-UNIT-ATT-10 serializeAttendance normalizes plain objects and documents [FR-015]', () => {
    const plain = serializeAttendance({ status: 'late', date: '2026-10-19T18:30:00.000Z' });
    const doc = serializeAttendance(new Attendance({
      student: new mongoose.Types.ObjectId(),
      course: new mongoose.Types.ObjectId(),
      status: 'present',
      date: new Date('2026-10-05T00:00:00.000Z'),
    }));

    expect(plain.date.toISOString()).toBe('2026-10-20T00:00:00.000Z');
    expect(doc.date.toISOString()).toBe('2026-10-05T00:00:00.000Z');
    expect(doc.status).toBe('present');
  });

  test('TC-UNIT-ATT-11 the supported statuses are present, absent, late and excused [FR-015]', () => {
    expect(ATTENDANCE_STATUSES).toEqual(['present', 'absent', 'late', 'excused']);
  });
});

describe('upsertAttendanceRecord', () => {
  const studentId = new mongoose.Types.ObjectId();
  const courseId = new mongoose.Types.ObjectId();
  const day = new Date('2026-10-20T00:00:00.000Z');

  beforeEach(async () => {
    await Attendance.init();
  });

  test('TC-UNIT-ATT-12 creates a record for a new day [FR-015]', async () => {
    const record = await upsertAttendanceRecord({ studentId, courseId, day, status: 'present' });

    expect(record.status).toBe('present');
    expect(record.recordedBy.equals(studentId)).toBe(true);
    expect(await Attendance.countDocuments()).toBe(1);
  });

  test('TC-UNIT-ATT-13 updates the existing record instead of creating a duplicate [FR-015]', async () => {
    await upsertAttendanceRecord({ studentId, courseId, day, status: 'present' });
    const updated = await upsertAttendanceRecord({ studentId, courseId, day, status: 'late', notes: 'Bus delay' });

    expect(updated.status).toBe('late');
    expect(updated.notes).toBe('Bus delay');
    expect(await Attendance.countDocuments()).toBe(1);
  });

  test('TC-UNIT-ATT-14 reuses and normalizes a legacy local-midnight record for the same day [FR-015]', async () => {
    await Attendance.create({ student: studentId, course: courseId, status: 'absent', date: new Date('2026-10-19T18:30:00.000Z') });

    const record = await upsertAttendanceRecord({ studentId, courseId, day, status: 'present' });

    expect(record.date.toISOString()).toBe('2026-10-20T00:00:00.000Z');
    expect(await Attendance.countDocuments()).toBe(1);
  });

  test('TC-UNIT-ATT-15 retries once as an update when a concurrent request created the day first [FR-015]', async () => {
    const created = await Attendance.create({ student: studentId, course: courseId, status: 'present', date: day });
    const findOne = jest.spyOn(Attendance, 'findOne')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const record = await upsertAttendanceRecord({ studentId, courseId, day, status: 'excused' });

    expect(findOne).toHaveBeenCalled();
    expect(record._id.equals(created._id)).toBe(true);
    expect(record.status).toBe('excused');
  });

  test('TC-UNIT-ATT-16 rethrows unexpected database errors [FR-015]', async () => {
    jest.spyOn(Attendance, 'findOne').mockResolvedValue(null);
    jest.spyOn(Attendance, 'create').mockRejectedValue(Object.assign(new Error('disk full'), { code: 1 }));

    await expect(upsertAttendanceRecord({ studentId, courseId, day, status: 'present' })).rejects.toThrow('disk full');
  });
});
