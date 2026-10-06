import { apiClient } from './apiService';

/**
 * Course Service
 * All CRUD and user operations for courses
 */

const courseService = {
  /** Fetch all courses (admin) with optional filtering */
  async getAdminCourses(params = {}) {
    const query = new URLSearchParams();
    if (params.page)     query.append('page', params.page);
    if (params.limit)    query.append('limit', params.limit);
    if (params.category && params.category !== 'All Categories') query.append('category', params.category);
    if (params.level    && params.level    !== 'All Levels')     query.append('level', params.level);
    if (params.status   && params.status   !== 'Status')         query.append('status', params.status);
    if (params.search)   query.append('search', params.search);
    const response = await apiClient.get('/courses/admin/all?' + query.toString());
    return response.data;
  },

  /** Fetch all public courses */
  async getAllCourses(params = {}) {
    const query = new URLSearchParams();
    if (params.page)     query.append('page', params.page);
    if (params.limit)    query.append('limit', params.limit);
    if (params.category) query.append('category', params.category);
    if (params.level)    query.append('level', params.level);
    if (params.search)   query.append('search', params.search);
    const response = await apiClient.get('/courses?' + query.toString());
    return response.data;
  },

  /** Get a single course by ID */
  async getCourse(id) {
    const response = await apiClient.get('/courses/' + id);
    return response.data;
  },

  /** Enroll in a free course */
  async enrollInCourse(id) {
    const response = await apiClient.post('/courses/' + id + '/enroll');
    return response.data;
  },

  /** Add a review to a course */
  async addReview(id, reviewData) {
    const response = await apiClient.post('/courses/' + id + '/reviews', reviewData);
    return response.data;
  },

  /** Mark a course as completed */
  async completeCourse(id) {
    const response = await apiClient.post('/courses/' + id + '/complete');
    return response.data;
  },

  /** Create a new course (admin) */
  async createCourse(courseData) {
    const response = await apiClient.post('/courses/admin', courseData);
    return response.data;
  },

  /** Update an existing course (admin) */
  async updateCourse(id, courseData) {
    const response = await apiClient.put('/courses/admin/' + id, courseData);
    return response.data;
  },

  /** Delete a course (admin) */
  async deleteCourse(id) {
    const response = await apiClient.delete('/courses/admin/' + id);
    return response.data;
  },

  /** Toggle publish status (admin) */
  async togglePublish(id) {
    const response = await apiClient.patch('/courses/admin/' + id + '/toggle-publish');
    return response.data;
  },
};

export { courseService };
export default courseService;
