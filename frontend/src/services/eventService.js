import { apiClient } from './apiService';
import { uploadToSupabase } from './uploadService';

/**
 * Event Service
 * Handles CRUD operations, status toggling, and Supabase image uploads for events.
 * Modeled after announcementService.
 */
const eventService = {
  /**
   * Fetch all events with optional pagination and filters (Admin)
   * @param {number} page
   * @param {number} limit
   * @param {Object} filters
   */
  async getAllEvents(page = 1, limit = 20, filters = {}) {
    const query = new URLSearchParams();
    query.append('page', page);
    query.append('limit', limit);

    if (filters.category && filters.category !== 'all' && filters.category !== 'ALL') {
      query.append('category', filters.category);
    }
    if (filters.status && filters.status !== 'all' && filters.status !== 'ALL') {
      query.append('status', filters.status);
    }
    if (filters.isActive !== undefined && filters.isActive !== '' && filters.isActive !== 'all') {
      query.append('isActive', filters.isActive);
    }
    if (filters.isPinned !== undefined && filters.isPinned !== '' && filters.isPinned !== 'all') {
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

    const response = await apiClient.get(`/events/admin/all?${query.toString()}`);
    return response.data;
  },

  /**
   * Fetch event statistics (total, upcoming, ongoing, completed, cancelled, active, pinned)
   */
  async getEventStats() {
    const response = await apiClient.get('/events/stats');
    return response.data;
  },

  /**
   * Fetch active events for students/public view
   * @param {Object} params - { page, limit, category, status, search, upcomingOnly }
   */
  async getActiveEvents(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.category && params.category !== 'all' && params.category !== 'ALL') {
      query.append('category', params.category);
    }
    if (params.status && params.status !== 'all' && params.status !== 'ALL') {
      query.append('status', params.status);
    }
    if (params.search) query.append('search', params.search);
    if (params.upcomingOnly) query.append('upcomingOnly', params.upcomingOnly);

    const queryString = query.toString();
    const endpoint = queryString ? `/events?${queryString}` : '/events';
    const response = await apiClient.get(endpoint);
    return response.data;
  },

  /**
   * Fetch single event by ID
   * @param {string} id
   */
  async getEventById(id) {
    const response = await apiClient.get(`/events/${id}`);
    return response.data;
  },

  /**
   * Register attendance / RSVP for an event
   * @param {string} id
   */
  async registerAttendance(id) {
    const response = await apiClient.post(`/events/${id}/attend`);
    return response.data;
  },

  /**
   * Cancel event RSVP / attendance
   * @param {string} id
   */
  async cancelAttendance(id) {
    const response = await apiClient.delete(`/events/${id}/attend`);
    return response.data;
  },

  /**
   * Create a new event (Admin)
   * @param {Object} eventData
   */
  async createEvent(eventData) {
    const response = await apiClient.post('/events', eventData);
    return response.data;
  },

  /**
   * Update an existing event (Admin)
   * @param {string} id
   * @param {Object} eventData
   */
  async updateEvent(id, eventData) {
    const response = await apiClient.put(`/events/${id}`, eventData);
    return response.data;
  },

  /**
   * Delete an event by ID (Admin)
   * @param {string} id
   */
  async deleteEvent(id) {
    const response = await apiClient.delete(`/events/${id}`);
    return response.data;
  },

  /**
   * Toggle pin status of an event (Admin)
   * @param {string} id
   */
  async togglePinEvent(id) {
    const response = await apiClient.put(`/events/${id}/pin`);
    return response.data;
  },

  /**
   * Toggle active/inactive status of an event (Admin)
   * @param {string} id
   */
  async toggleActiveEvent(id) {
    const response = await apiClient.put(`/events/${id}/active`);
    return response.data;
  },

  /**
   * Upload a single event photo directly to Supabase Storage
   * @param {File} file - Image file object
   * @returns {Promise<{success: boolean, url: string, storage: string}>}
   */
  async uploadPhoto(file) {
    const publicUrl = await uploadToSupabase(file, undefined, 'events');
    return { success: true, url: publicUrl, storage: 'supabase' };
  },

  /**
   * Upload multiple photos to Supabase Storage concurrently
   * @param {FileList|File[]} files - List of image file objects
   * @param {Function} [onProgress] - Optional progress callback ({ completed, total, currentUrl })
   * @returns {Promise<string[]>} Array of uploaded public URLs
   */
  async uploadMultiplePhotos(files, onProgress) {
    const fileArray = Array.from(files);
    const uploadedUrls = [];
    let completed = 0;

    for (const file of fileArray) {
      try {
        const publicUrl = await uploadToSupabase(file, undefined, 'events');
        uploadedUrls.push(publicUrl);
        completed += 1;
        if (onProgress) {
          onProgress({ completed, total: fileArray.length, currentUrl: publicUrl });
        }
      } catch (err) {
        console.error(`Failed to upload ${file.name} to Supabase:`, err);
        throw err;
      }
    }

    return uploadedUrls;
  }
};

export default eventService;
