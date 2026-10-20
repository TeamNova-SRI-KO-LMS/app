import { apiClient } from './apiService';

// No local fallback data: errors propagate to the caller, so the UI never shows
// forums or a "success" that the backend did not actually confirm.
const discussionForumService = {
  /**
   * Get all discussion forums with pagination and filters
   */
  async getAllForums(page = 1, limit = 20, filters = {}) {
    const query = new URLSearchParams();
    query.append('page', page);
    query.append('limit', limit);

    if (filters.category) query.append('category', filters.category);
    if (filters.level) query.append('level', filters.level);
    if (filters.includeAllLevels) query.append('includeAllLevels', 'true');
    if (filters.isActive !== undefined && filters.isActive !== '') query.append('isActive', filters.isActive);
    if (filters.isPinned !== undefined && filters.isPinned !== '') query.append('isPinned', filters.isPinned);
    if (filters.isLocked !== undefined && filters.isLocked !== '') query.append('isLocked', filters.isLocked);
    if (filters.search) query.append('search', filters.search);

    const response = await apiClient.get(`/forums?${query.toString()}`);
    return response.data;
  },

  /**
   * Get forum statistics
   */
  async getForumStats() {
    const response = await apiClient.get('/forums/stats');
    return response.data;
  },

  /**
   * Get single forum details by ID
   */
  async getForumById(id) {
    const response = await apiClient.get(`/forums/${id}`);
    return response.data;
  },

  /**
   * Create a new forum
   */
  async createForum(forumData) {
    const response = await apiClient.post('/forums', forumData);
    return response.data;
  },

  /**
   * Update forum
   */
  async updateForum(id, forumData) {
    const response = await apiClient.put(`/forums/${id}`, forumData);
    return response.data;
  },

  /**
   * Delete forum
   */
  async deleteForum(id) {
    const response = await apiClient.delete(`/forums/${id}`);
    return response.data;
  },

  /**
   * Toggle pin status
   */
  async togglePinForum(id) {
    const response = await apiClient.patch(`/forums/${id}/pin`);
    return response.data;
  },

  /**
   * Toggle active status
   */
  async toggleActiveForum(id) {
    const response = await apiClient.patch(`/forums/${id}/active`);
    return response.data;
  },

  /**
   * Toggle locked status
   */
  async toggleLockForum(id) {
    const response = await apiClient.patch(`/forums/${id}/lock`);
    return response.data;
  },

  /**
   * Get posts for a forum
   */
  async getPostsByForum(forumId) {
    const response = await apiClient.get(`/forums/${forumId}/posts`);
    return response.data;
  },

  /**
   * Create a post/message in a forum
   */
  async createPost(forumId, postData) {
    const response = await apiClient.post(`/forums/${forumId}/posts`, postData);
    return response.data;
  },

  /**
   * Add a reply to a post
   */
  async replyToPost(postId, replyData) {
    const response = await apiClient.post(`/forums/posts/${postId}/reply`, replyData);
    return response.data;
  },

  /**
   * Toggle like on a post
   */
  async toggleLikePost(postId) {
    const response = await apiClient.post(`/forums/posts/${postId}/like`);
    return response.data;
  }
};

export default discussionForumService;
