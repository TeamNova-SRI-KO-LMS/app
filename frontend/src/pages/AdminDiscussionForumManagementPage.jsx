import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import discussionForumService from '../services/discussionForumService';
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  BookmarkIcon,
  BookmarkSlashIcon
} from '@heroicons/react/24/outline';

const AdminDiscussionForumManagementPage = () => {
  const [loading, setLoading] = useState(false);
  const [forums, setForums] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    pinned: 0,
    locked: 0
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const [filters, setFilters] = useState({
    category: '',
    level: '',
    isActive: '',
    isPinned: '',
    isLocked: '',
    search: ''
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingForum, setEditingForum] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    level: 'all',
    isActive: true,
    isPinned: false,
    isLocked: false,
    moderators: [],
    tags: [],
    rules: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchForums();
  }, [pagination.current, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch forum statistics
      const statsResponse = await discussionForumService.getForumStats();
      if (statsResponse.success) {
        setStats(statsResponse.stats);
      }
    } catch (error) {
      toast.error('Failed to load forum data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchForums = async () => {
    try {
      setLoading(true);
      const response = await discussionForumService.getAllForums(pagination.current, 20, filters);
      if (response.success) {
        setForums(response.forums);
        setPagination(response.pagination);
      } else {
        toast.error('Failed to load forums');
      }
    } catch (error) {
      toast.error('Failed to load forums');
      console.error('Error fetching forums:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForum = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await discussionForumService.createForum(formData);

      if (response.success) {
        toast.success('Forum created successfully');
        setShowCreateForm(false);
        resetForm();
        fetchForums();
        fetchData(); // Refresh stats
      } else {
        toast.error(response.message || 'Failed to create forum');
      }
    } catch (error) {
      toast.error('Failed to create forum');
      console.error('Error creating forum:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateForum = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await discussionForumService.updateForum(editingForum._id, formData);

      if (response.success) {
        toast.success('Forum updated successfully');
        setEditingForum(null);
        resetForm();
        fetchForums();
        fetchData(); // Refresh stats
      } else {
        toast.error(response.message || 'Failed to update forum');
      }
    } catch (error) {
      toast.error('Failed to update forum');
      console.error('Error updating forum:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteForum = async (forumId) => {
    if (!window.confirm('Are you sure you want to delete this forum? This will also delete all posts in the forum.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await discussionForumService.deleteForum(forumId);

      if (response.success) {
        toast.success('Forum deleted successfully');
        fetchForums();
        fetchData(); // Refresh stats
      } else {
        toast.error(response.message || 'Failed to delete forum');
      }
    } catch (error) {
      toast.error('Failed to delete forum');
      console.error('Error deleting forum:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = async (forumId) => {
    try {
      setLoading(true);
      const response = await discussionForumService.togglePinForum(forumId);

      if (response.success) {
        toast.success(response.message);
        fetchForums();
        fetchData(); // Refresh stats
      } else {
        toast.error(response.message || 'Failed to toggle pin status');
      }
    } catch (error) {
      toast.error('Failed to toggle pin status');
      console.error('Error toggling pin:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (forumId) => {
    try {
      setLoading(true);
      const response = await discussionForumService.toggleActiveForum(forumId);

      if (response.success) {
        toast.success(response.message);
        fetchForums();
        fetchData(); // Refresh stats
      } else {
        toast.error(response.message || 'Failed to toggle active status');
      }
    } catch (error) {
      toast.error('Failed to toggle active status');
      console.error('Error toggling active:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'general',
      level: 'all',
      isActive: true,
      isPinned: false,
      isLocked: false,
      moderators: [],
      tags: [],
      rules: []
    });
  };

  const handleEditForum = (forum) => {
    setEditingForum(forum);
    setFormData({
      title: forum.title,
      description: forum.description,
      category: forum.category,
      level: forum.level,
      isActive: forum.isActive,
      isPinned: forum.isPinned,
      isLocked: forum.isLocked,
      moderators: forum.moderators || [],
      tags: forum.tags || [],
      rules: forum.rules || []
    });
    setShowCreateForm(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current: page }));
  };

  const getCategoryBadge = (category) => {
    const categoryColors = {
      'general': 'bg-gray-100 text-gray-800',
      'korean-basics': 'bg-blue-100 text-blue-800',
      'grammar': 'bg-green-100 text-green-800',
      'vocabulary': 'bg-purple-100 text-purple-800',
      'pronunciation': 'bg-yellow-100 text-yellow-800',
      'conversation': 'bg-pink-100 text-pink-800',
      'culture': 'bg-indigo-100 text-indigo-800',
      'study-tips': 'bg-orange-100 text-orange-800',
      'homework-help': 'bg-red-100 text-red-800',
      'resources': 'bg-teal-100 text-teal-800',
      'events': 'bg-cyan-100 text-cyan-800',
      'introductions': 'bg-emerald-100 text-emerald-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[category] || 'bg-gray-100 text-gray-800'}`}>
        {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  const getLevelBadge = (level) => {
    const levelColors = {
      'beginner': 'bg-green-100 text-green-800',
      'intermediate': 'bg-yellow-100 text-yellow-800',
      'advanced': 'bg-red-100 text-red-800',
      'all': 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelColors[level] || 'bg-gray-100 text-gray-800'}`}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Discussion Forum Management</h1>
        <p className="text-gray-600">Create and manage discussion forums for Korean language learning</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Forums</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.inactive}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pinned</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pinned}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Locked</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.locked}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-4">
        <button
          onClick={() => {
            setShowCreateForm(true);
            setEditingForum(null);
            resetForm();
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Forum
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingForum ? 'Edit Forum' : 'Create New Forum'}
          </h3>
          <form onSubmit={editingForum ? handleUpdateForum : handleCreateForum}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter forum title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">General</option>
                  <option value="korean-basics">Korean Basics</option>
                  <option value="grammar">Grammar</option>
                  <option value="vocabulary">Vocabulary</option>
                  <option value="pronunciation">Pronunciation</option>
                  <option value="conversation">Conversation</option>
                  <option value="culture">Korean Culture</option>
                  <option value="study-tips">Study Tips</option>
                  <option value="homework-help">Homework Help</option>
                  <option value="resources">Resources</option>
                  <option value="events">Events</option>
                  <option value="introductions">Introductions</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPinned: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Pinned</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isLocked}
                    onChange={(e) => setFormData(prev => ({ ...prev, isLocked: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Locked</span>
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter forum description"
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingForum(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                {editingForum ? 'Update' : 'Create'} Forum
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Categories</option>
              <option value="general">General</option>
              <option value="korean-basics">Korean Basics</option>
              <option value="grammar">Grammar</option>
              <option value="vocabulary">Vocabulary</option>
              <option value="pronunciation">Pronunciation</option>
              <option value="conversation">Conversation</option>
              <option value="culture">Korean Culture</option>
              <option value="study-tips">Study Tips</option>
              <option value="homework-help">Homework Help</option>
              <option value="resources">Resources</option>
              <option value="events">Events</option>
              <option value="introductions">Introductions</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
            <select
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Levels</option>
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.isActive}
              onChange={(e) => handleFilterChange('isActive', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search forums..."
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ category: '', level: '', isActive: '', isPinned: '', isLocked: '', search: '' })}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Forums Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">All Forums</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {forums.map((forum) => (
                <tr key={forum._id}>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        {forum.title}
                        {forum.isPinned && (
                          <svg className="w-4 h-4 text-yellow-500 ml-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        )}
                        {forum.isLocked && (
                          <svg className="w-4 h-4 text-red-500 ml-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {forum.description.substring(0, 100)}...
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getCategoryBadge(forum.category)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getLevelBadge(forum.level)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {forum.postCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${forum.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {forum.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(forum.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditForum(forum)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                        disabled={loading}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleTogglePin(forum._id)}
                        className={`${forum.isPinned ? 'text-yellow-600 hover:text-yellow-800' : 'text-gray-400 hover:text-gray-600'}`}
                        title={forum.isPinned ? 'Unpin' : 'Pin'}
                        disabled={loading}
                      >
                        {forum.isPinned ? <BookmarkIcon className="h-4 w-4" /> : <BookmarkSlashIcon className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleToggleActive(forum._id)}
                        className={`${forum.isActive ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-gray-600'}`}
                        title={forum.isActive ? 'Deactivate' : 'Activate'}
                        disabled={loading}
                      >
                        {forum.isActive ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteForum(forum._id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                        disabled={loading}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {pagination.current} of {pagination.pages} ({pagination.total} total forums)
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.current - 1)}
                  disabled={pagination.current === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.current + 1)}
                  disabled={pagination.current === pagination.pages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              <span>Loading...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDiscussionForumManagementPage;

