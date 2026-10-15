import apiService from './apiService';

const notificationService = {
  /**
   * Get active notifications for current logged in user
   */
  async getActiveNotifications() {
    const response = await apiService.get('/notifications');
    return response.data;
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount() {
    const response = await apiService.get('/notifications/unread-count');
    return response.data;
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId) {
    const response = await apiService.post(`/notifications/${notificationId}/read`);
    return response.data;
  },

  /**
   * Record click on a notification
   */
  async markAsClicked(notificationId) {
    const response = await apiService.post(`/notifications/${notificationId}/click`);
    return response.data;
  },

  /**
   * Mark all notifications as read for current user
   */
  async markAllAsRead() {
    const response = await apiService.post('/notifications/mark-all-read');
    return response.data;
  },

  /**
   * Admin: Get all notifications with pagination and filters
   */
  async getAllNotifications(params = {}) {
    const response = await apiService.get('/notifications/all', { params });
    return response.data;
  },

  /**
   * Admin: Create notification
   */
  async createNotification(notificationData) {
    const response = await apiService.post('/notifications', notificationData);
    return response.data;
  },

  /**
   * Admin: Delete notification
   */
  async deleteNotification(id) {
    const response = await apiService.delete(`/notifications/${id}`);
    return response.data;
  },

  /**
   * Admin: Get notification statistics
   */
  async getNotificationStats() {
    const response = await apiService.get('/notifications/stats');
    return response.data;
  },
};

export default notificationService;
