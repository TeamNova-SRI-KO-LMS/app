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
