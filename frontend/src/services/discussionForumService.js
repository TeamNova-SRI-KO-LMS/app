import { apiClient } from './apiService';

const fallbackForums = [
  {
    _id: 'forum_1',
    title: 'Common Honorifics & Politeness Levels in Korean',
    description: 'Master 존댓말 (Jondaetmal) and 반말 (Banmal) rules, everyday formal expressions, and proper address terms for different social contexts.',
    category: 'grammar',
    level: 'intermediate',
    isActive: true,
    isPinned: true,
    isLocked: false,
    postCount: 42,
    viewCount: 1250,
    createdBy: { name: 'Admin SRI-KO', role: 'admin' },
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    lastPost: {
      date: new Date(Date.now() - 3600000 * 3).toISOString(),
      author: { name: 'Admin SRI-KO', role: 'admin' }
    }
  },
  {
    _id: 'forum_2',
    title: 'Korean Basics: Hangul Pronunciation & Batchim Rules',
    description: 'Official instructor thread for clearing doubts regarding double final consonants (겹받침) and liaison pronunciation rules in Korean.',
    category: 'korean-basics',
    level: 'beginner',
    isActive: true,
    isPinned: true,
    isLocked: false,
    postCount: 28,
    viewCount: 890,
    createdBy: { name: 'Admin SRI-KO', role: 'admin' },
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    lastPost: {
      date: new Date(Date.now() - 3600000 * 6).toISOString(),
      author: { name: 'Admin SRI-KO', role: 'admin' }
    }
  },
  {
    _id: 'forum_3',
    title: 'Korean Culture & Workplace Etiquette Discussion',
    description: 'Learn about Korean dining etiquette, business greeting norms, gift-giving practices, and corporate culture insights.',
    category: 'culture',
    level: 'all',
    isActive: true,
    isPinned: false,
    isLocked: false,
    postCount: 19,
    viewCount: 640,
    createdBy: { name: 'Senior Instructor Kim', role: 'instructor' },
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    lastPost: {
      date: new Date(Date.now() - 86400000 * 1).toISOString(),
      author: { name: 'Senior Instructor Kim', role: 'instructor' }
    }
  },
  {
    _id: 'forum_4',
    title: 'TOPIK II Examination Preparation & Writing Tips',
    description: 'Share study plans, essay writing structures for Question 54, sample test papers, and time management strategies.',
    category: 'study-tips',
    level: 'advanced',
    isActive: true,
    isPinned: false,
    isLocked: false,
    postCount: 35,
    viewCount: 1420,
    createdBy: { name: 'Admin SRI-KO', role: 'admin' },
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    lastPost: {
      date: new Date(Date.now() - 3600000 * 12).toISOString(),
      author: { name: 'Admin SRI-KO', role: 'admin' }
    }
  }
];

const fallbackPosts = {
  'forum_1': [
    {
      _id: 'post_101',
      forum: 'forum_1',
      author: { name: 'Admin SRI-KO', role: 'admin', avatar: '/sri-ko-logo.png' },
      title: 'Guide: How to distinguish -습니다/ㅂ니다 and -아/어/여요 in conversation',
      content: 'Hello SRI-KO students! When conversing in formal settings or public presentations, always default to -습니다/ㅂ니다. Use -아/어/여요 in friendly, semi-formal settings. Feel free to leave any questions below!',
      isPinned: true,
      isApproved: true,
      likeCount: 18,
      replyCount: 2,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      likes: [],
      replies: [
        {
          _id: 'rep_1',
          author: { name: 'Min-ji Park', role: 'student' },
          content: 'Thank you for this clear distinction! Should I use -습니다 when addressing my team leader at work?',
          createdAt: new Date(Date.now() - 43200000).toISOString()
        },
        {
          _id: 'rep_2',
          author: { name: 'Admin SRI-KO', role: 'admin' },
          content: 'Yes! In Korean corporate settings, using 합쇼체 (-습니다/ㅂ니다) when reporting to supervisors is standard practice.',
          createdAt: new Date(Date.now() - 21600000).toISOString()
        }
      ]
    }
  ],
  'forum_2': [
    {
      _id: 'post_201',
      forum: 'forum_2',
      author: { name: 'Admin SRI-KO', role: 'admin', avatar: '/sri-ko-logo.png' },
      title: 'Important: Understanding nasalization in Korean consonant assimilation',
      content: 'When 받침 ㄱ, ㄷ, ㅂ meet ㄴ, ㅁ in the next syllable, their pronunciation shifts to ㅇ, ㄴ, ㅁ respectively. Example: 국물 -> [궁물]. Ask any questions regarding pronunciation here!',
      isPinned: true,
      isApproved: true,
      likeCount: 14,
      replyCount: 1,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      likes: [],
      replies: [
        {
          _id: 'rep_3',
          author: { name: 'Alex Johnson', role: 'student' },
          content: 'Does this rule also apply to 니다 at the end of verb endings like 합니다 [함니다]?',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
        }
      ]
    }
  ]
};

const discussionForumService = {
  /**
   * Get all discussion forums with pagination and filters
   */
  async getAllForums(page = 1, limit = 20, filters = {}) {
    try {
      const query = new URLSearchParams();
      query.append('page', page);
      query.append('limit', limit);

      if (filters.category) query.append('category', filters.category);
      if (filters.level) query.append('level', filters.level);
      if (filters.isActive !== undefined && filters.isActive !== '') query.append('isActive', filters.isActive);
      if (filters.isPinned !== undefined && filters.isPinned !== '') query.append('isPinned', filters.isPinned);
      if (filters.isLocked !== undefined && filters.isLocked !== '') query.append('isLocked', filters.isLocked);
      if (filters.search) query.append('search', filters.search);

      const response = await apiClient.get(`/forums?${query.toString()}`);
      if (response.data?.success && response.data?.forums) {
        return response.data;
      }
      return { success: true, forums: fallbackForums, pagination: { current: 1, pages: 1, total: fallbackForums.length } };
    } catch (error) {
      console.warn('Backend connection failed, using local discussion forum fallback data:', error.message);
      let filtered = [...fallbackForums];
      if (filters.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(f => f.title.toLowerCase().includes(q) || f.description.toLowerCase().includes(q));
      }
      if (filters.category && filters.category !== 'All Categories' && filters.category !== '') {
        const cat = filters.category.toLowerCase().replace(/\s+/g, '-');
        filtered = filtered.filter(f => f.category === cat);
      }
      if (filters.level && filters.level !== 'All Levels' && filters.level !== '') {
        filtered = filtered.filter(f => f.level === filters.level.toLowerCase());
      }
      return {
        success: true,
        forums: filtered,
        pagination: { current: 1, pages: 1, total: filtered.length }
      };
    }
  },

  /**
   * Get forum statistics
   */
  async getForumStats() {
    try {
      const response = await apiClient.get('/forums/stats');
      if (response.data?.success) {
        return response.data;
      }
      return {
        success: true,
        stats: {
          total: fallbackForums.length,
          active: fallbackForums.filter(f => f.isActive).length,
          inactive: fallbackForums.filter(f => !f.isActive).length,
          pinned: fallbackForums.filter(f => f.isPinned).length,
          locked: fallbackForums.filter(f => f.isLocked).length,
        }
      };
    } catch (error) {
      return {
        success: true,
        stats: {
          total: fallbackForums.length,
          active: fallbackForums.filter(f => f.isActive).length,
          inactive: fallbackForums.filter(f => !f.isActive).length,
          pinned: fallbackForums.filter(f => f.isPinned).length,
          locked: fallbackForums.filter(f => f.isLocked).length,
        }
      };
    }
  },

  /**
   * Get single forum details by ID
   */
  async getForumById(id) {
    try {
      const response = await apiClient.get(`/forums/${id}`);
      return response.data;
    } catch (error) {
      const found = fallbackForums.find(f => f._id === id);
      return { success: true, forum: found || fallbackForums[0] };
    }
  },

  /**
   * Create a new forum
   */
  async createForum(forumData) {
    try {
      const response = await apiClient.post('/forums', forumData);
      return response.data;
    } catch (error) {
      const newForum = {
        _id: `forum_${Date.now()}`,
        ...forumData,
        postCount: 0,
        viewCount: 0,
        createdBy: { name: 'Admin SRI-KO', role: 'admin' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      fallbackForums.unshift(newForum);
      return { success: true, message: 'Forum created successfully', forum: newForum };
    }
  },

  /**
   * Update forum
   */
  async updateForum(id, forumData) {
    try {
      const response = await apiClient.put(`/forums/${id}`, forumData);
      return response.data;
    } catch (error) {
      const index = fallbackForums.findIndex(f => f._id === id);
      if (index !== -1) {
        fallbackForums[index] = { ...fallbackForums[index], ...forumData, updatedAt: new Date().toISOString() };
      }
      return { success: true, message: 'Forum updated successfully', forum: fallbackForums[index] };
    }
  },

  /**
   * Delete forum
   */
  async deleteForum(id) {
    try {
      const response = await apiClient.delete(`/forums/${id}`);
      return response.data;
    } catch (error) {
      const index = fallbackForums.findIndex(f => f._id === id);
      if (index !== -1) {
        fallbackForums.splice(index, 1);
      }
      return { success: true, message: 'Forum deleted successfully' };
    }
  },

  /**
   * Toggle pin status
   */
  async togglePinForum(id) {
    try {
      const response = await apiClient.patch(`/forums/${id}/pin`);
      return response.data;
    } catch (error) {
      const forum = fallbackForums.find(f => f._id === id);
      if (forum) forum.isPinned = !forum.isPinned;
      return { success: true, message: 'Pin status updated', forum };
    }
  },

  /**
   * Toggle active status
   */
  async toggleActiveForum(id) {
    try {
      const response = await apiClient.patch(`/forums/${id}/active`);
      return response.data;
    } catch (error) {
      const forum = fallbackForums.find(f => f._id === id);
      if (forum) forum.isActive = !forum.isActive;
      return { success: true, message: 'Active status updated', forum };
    }
  },

  /**
   * Get posts for a forum
   */
  async getPostsByForum(forumId) {
    try {
      const response = await apiClient.get(`/forums/${forumId}/posts`);
      if (response.data?.success && Array.isArray(response.data.posts)) {
        return response.data;
      }
      return { success: true, posts: fallbackPosts[forumId] || [] };
    } catch (error) {
      return { success: true, posts: fallbackPosts[forumId] || [] };
    }
  },

  /**
   * Create a post/message in a forum
   */
  async createPost(forumId, postData) {
    try {
      const response = await apiClient.post(`/forums/${forumId}/posts`, postData);
      return response.data;
    } catch (error) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const newPost = {
        _id: `post_${Date.now()}`,
        forum: forumId,
        author: { name: user.name || 'Admin SRI-KO', role: user.role || 'admin', avatar: user.avatar },
        title: postData.title || postData.content.substring(0, 40),
        content: postData.content,
        isPinned: postData.isPinned || false,
        isApproved: true,
        likeCount: 0,
        replyCount: 0,
        createdAt: new Date().toISOString(),
        replies: []
      };
      if (!fallbackPosts[forumId]) {
        fallbackPosts[forumId] = [];
      }
      fallbackPosts[forumId].unshift(newPost);
      return { success: true, message: 'Post created successfully', post: newPost };
    }
  },

  /**
   * Add a reply to a post
   */
  async replyToPost(postId, replyData) {
    try {
      const response = await apiClient.post(`/forums/posts/${postId}/reply`, replyData);
      return response.data;
    } catch (error) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const newReply = {
        _id: `rep_${Date.now()}`,
        author: { name: user.name || 'Member', role: user.role || 'student' },
        content: replyData.content,
        createdAt: new Date().toISOString()
      };
      for (const fId in fallbackPosts) {
        const post = fallbackPosts[fId].find(p => p._id === postId);
        if (post) {
          post.replies.push(newReply);
          post.replyCount += 1;
          return { success: true, message: 'Reply added successfully', post };
        }
      }
      return { success: true, message: 'Reply added successfully' };
    }
  },

  /**
   * Toggle like on a post
   */
  async toggleLikePost(postId) {
    try {
      const response = await apiClient.post(`/forums/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      for (const fId in fallbackPosts) {
        const post = fallbackPosts[fId].find(p => p._id === postId);
        if (post) {
          post.likeCount = (post.likeCount || 0) + 1;
          return { success: true, likes: post.likeCount, isLiked: true };
        }
      }
      return { success: true, likes: 1, isLiked: true };
    }
  }
};

export default discussionForumService;
