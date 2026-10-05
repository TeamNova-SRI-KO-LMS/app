import { apiClient } from './apiService';

/**
 * Announcement Service
 * Handles CRUD operations, status toggling, and fetching announcements for admins and students.
 */
const announcementService = {
  /**
   * Fetch all announcements with optional pagination and filters (Admin)
   * @param {number} page
   * @param {number} limit
   * @param {Object} filters
   */
  async getAllAnnouncements(page = 1, limit = 20, filters = {}) {
    const query = new URLSearchParams();
    query.append('page', page);
    query.append('limit', limit);

    if (filters.type && filters.type !== 'all' && filters.type !== 'ALL') {
      query.append('type', filters.type);
    }
    if (filters.priority && filters.priority !== 'all' && filters.priority !== 'ALL') {
      query.append('priority', filters.priority);
    }
    if (filters.targetAudience && filters.targetAudience !== 'all' && filters.targetAudience !== 'ALL') {
      query.append('targetAudience', filters.targetAudience);
    }
    if (filters.isActive !== undefined && filters.isActive !== '') {
      query.append('isActive', filters.isActive);
    }
    if (filters.isPinned !== undefined && filters.isPinned !== '') {
      query.append('isPinned', filters.isPinned);
    }
    if (filters.search) {
      query.append('search', filters.search);
    }
    if (filters.dateFrom) {
      query.append('dateFrom', filters.dateFrom);
    }
    if (filters.dateTo) {
      query.append('dateTo', filters.dateTo);
    }

    const response = await apiClient.get(`/announcements/admin/all?${query.toString()}`);
    return response.data;
  },

  /**
   * Fetch announcement statistics (total, active, inactive, pinned)
   */
  async getAnnouncementStats() {
    const response = await apiClient.get('/announcements/stats');
    return response.data;
  },

  /**
   * Fetch active announcements for users/students
   * @param {Object} params - { page, limit, type, audience, search, currentOnly }
   */
  async getActiveAnnouncements(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.type && params.type !== 'all' && params.type !== 'ALL') {
      query.append('type', params.type);
    }
    if (params.audience && params.audience !== 'all' && params.audience !== 'ALL') {
      query.append('audience', params.audience);
    }
    if (params.search) query.append('search', params.search);
    if (params.currentOnly) query.append('currentOnly', params.currentOnly);

    const queryString = query.toString();
    const endpoint = queryString ? `/announcements?${queryString}` : '/announcements';
    const response = await apiClient.get(endpoint);
    return response.data;
  },

  /**
   * Fetch single announcement by ID
   * @param {string} id
   */
  async getAnnouncementById(id) {
    const response = await apiClient.get(`/announcements/${id}`);
    return response.data;
  },

  /**
   * Create a new announcement (Admin)
   * @param {Object} announcementData
   */
  async createAnnouncement(announcementData) {
    const response = await apiClient.post('/announcements', announcementData);
    return response.data;
  },

  /**
   * Update an existing announcement (Admin)
   * @param {string} id
   * @param {Object} announcementData
   */
  async updateAnnouncement(id, announcementData) {
    const response = await apiClient.put(`/announcements/${id}`, announcementData);
    return response.data;
  },

  /**
   * Delete an announcement by ID (Admin)
   * @param {string} id
   */
  async deleteAnnouncement(id) {
    const response = await apiClient.delete(`/announcements/${id}`);
    return response.data;
  },

  /**
   * Toggle pin status of an announcement (Admin)
   * @param {string} id
   */
  async togglePinAnnouncement(id) {
    const response = await apiClient.put(`/announcements/${id}/pin`);
    return response.data;
  },

  /**
   * Toggle active/inactive status of an announcement (Admin)
   * @param {string} id
   */
  async toggleActiveAnnouncement(id) {
    const response = await apiClient.put(`/announcements/${id}/active`);
    return response.data;
  },

  /**
   * Mark announcement as read by the current user
   * @param {string} id
   */
  async markAsRead(id) {
    const response = await apiClient.post(`/announcements/${id}/read`);
    return response.data;
  }
};

export default announcementService;
