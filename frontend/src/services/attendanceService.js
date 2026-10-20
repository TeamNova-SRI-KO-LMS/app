import { apiClient } from './apiService';

/**
 * Fetch all attendance stats + records for the logged-in student.
 */
export const fetchMyAttendance = async () => {
  const response = await apiClient.get('/attendance/my-attendance');
  return response.data; // { success, stats, records }
};

/**
 * Fetch attendance records for a specific month/year (for the calendar view).
 * @param {number} year
 * @param {number} month  1–12
 * @param {string} [courseId]  Mongo ObjectId or 'all'
 */
export const fetchMonthlyAttendance = async (year, month, courseId = 'all') => {
  const params = { year, month };
  if (courseId && courseId !== 'all') params.courseId = courseId;
  const response = await apiClient.get('/attendance/monthly', { params });
  return response.data; // { success, records, year, month }
};

/**
 * Fetch courses the student has attendance records in (for filter dropdown).
 */
export const fetchEnrolledCourses = async () => {
  const response = await apiClient.get('/attendance/enrolled-courses');
  return response.data; // { success, courses }
};

/**
 * Create or update (upsert) an attendance record for a given date + course.
 * @param {object} payload
 * @param {string} payload.courseId  Mongo ObjectId of the course
 * @param {string} payload.date      ISO date string (YYYY-MM-DD)
 * @param {string} payload.status    'present' | 'absent' | 'late' | 'excused'
 * @param {string} [payload.notes]
 */
export const saveAttendance = async ({ courseId, date, status, notes = '' }) => {
  const response = await apiClient.post('/attendance', { courseId, date, status, notes });
  return response.data; // { success, message, record }
};

/**
 * Update an existing attendance record by its Mongo _id.
 * @param {string} id
 * @param {object} updates  { status?, notes?, date? }
 */
export const updateAttendance = async (id, updates) => {
  const response = await apiClient.put(`/attendance/${id}`, updates);
  return response.data; // { success, message, record }
};

/**
 * Delete an attendance record by its Mongo _id.
 * @param {string} id
 */
export const deleteAttendance = async (id) => {
  const response = await apiClient.delete(`/attendance/${id}`);
  return response.data; // { success, message }
};

// ─── Admin (read-only reporting) ──────────────────────────────────────────────
// Shared filters: { from, to } as 'YYYY-MM-DD', courseId, search (student name/email),
// studentId, status. Empty values are dropped so the API applies no filter.

const toParams = (filters = {}) => Object.fromEntries(
  Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== '' && value !== 'all'),
);

/**
 * Totals, today's numbers, per-course breakdown and the daily trend.
 * @param {object} filters  shared filters plus `today` (client's local date)
 */
export const fetchAdminAttendanceOverview = async (filters) => {
  const response = await apiClient.get('/attendance/admin/overview', { params: toParams(filters) });
  return response.data; // { success, totals, previous, today, courseBreakdown, trend, courses, lastActivityAt }
};

/**
 * Paginated attendance records with student and course details.
 * @param {object} filters  shared filters plus page, limit, sort ('date_desc' | 'date_asc' | 'updated_desc')
 */
export const fetchAdminAttendanceRecords = async (filters) => {
  const response = await apiClient.get('/attendance/admin/records', { params: toParams(filters) });
  return response.data; // { success, records, pagination }
};

/**
 * Per-student attendance summary.
 * @param {object} filters  shared filters plus page, limit, sort ('rate_asc' | 'rate_desc' | 'sessions_desc' | 'name_asc' | 'recent')
 */
export const fetchAdminAttendanceStudents = async (filters) => {
  const response = await apiClient.get('/attendance/admin/students', { params: toParams(filters) });
  return response.data; // { success, students, pagination }
};

/**
 * Download the filtered records as a CSV file (newest 10,000).
 * @param {object} filters  shared filters
 * @returns {Promise<Blob>}
 */
export const exportAdminAttendanceCsv = async (filters) => {
  const response = await apiClient.get('/attendance/admin/export', {
    params: toParams(filters),
    responseType: 'blob',
    timeout: 60000,
  });
  return response.data;
};
