import { apiClient } from './apiService';

/**
 * Admin Course Service
 * All CRUD operations for course management (admin only)
 */

const courseService = {
  /**
   * Fetch all courses with optional filtering and pagination
   * @param {Object} params - { page, limit, category, level, status, search }
   */
  async getAdminCourses(params = {}) {
    const query = new URLSearchParams();
    if (params.page)     query.append('page', params.page);
    if (params.limit)    query.append('limit', params.limit);
    if (params.category && params.category !== 'All Categories') query.append('category', params.category);
    if (params.level    && params.level    !== 'All Levels')     query.append('level', params.level);
    if (params.status   && params.status   !== 'Status')         query.append('status', params.status);
    if (params.search)   query.append('search', params.search);

    const response = await apiClient.get(`/courses/admin/all?${query.toString()}`);
    return response.data;
  },

  /**
   * Create a new course
   * @param {Object} courseData - { title, description, category, level, duration, price, isPublished, tags, thumbnail }
   */
  async createCourse(courseData) {
    const response = await apiClient.post('/courses/admin', courseData);
    return response.data;
  },

  /**
   * Update an existing course by ID
   * @param {string} id - MongoDB course _id
   * @param {Object} courseData - fields to update
   */
  async updateCourse(id, courseData) {
    const response = await apiClient.put(`/courses/admin/${id}`, courseData);
    return response.data;
  },

  /**
   * Delete a course by ID
   * @param {string} id - MongoDB course _id
   */
  async deleteCourse(id) {
    const response = await apiClient.delete(`/courses/admin/${id}`);
    return response.data;
  },

  /**
   * Toggle a course's published/draft status
   * @param {string} id - MongoDB course _id
   */
  async togglePublish(id) {
    const response = await apiClient.patch(`/courses/admin/${id}/toggle-publish`);
    return response.data;
  },
};

export default courseService;
