import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import notificationService from '../services/notificationService';
import {
  BellIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  BookmarkIcon,
  BookmarkSlashIcon,
  ClockIcon,
  UsersIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const AdminNotificationManagementPage = () => {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    pinned: 0,
    typeStats: [],
    priorityStats: [],
    audienceStats: [],
    monthlyStats: [],
    deliveryStats: { totalSent: 0, totalRead: 0, totalClicked: 0 }
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const [filters, setFilters] = useState({
    type: '',
    priority: '',
    targetAudience: '',
    isActive: '',
    isPinned: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [showTargetUsers, setShowTargetUsers] = useState(false);
  const [targetUsers, setTargetUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    koreanTitle: '',
    koreanMessage: '',
    type: 'general',
    priority: 'medium',
    targetAudience: 'all',
    targetUsers: [],
    targetRoles: [],
    targetCourses: [],
    isActive: true,
    isPinned: false,
    scheduledFor: new Date().toISOString().slice(0, 16),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    actionUrl: '',
    actionText: '',
    tags: [],
    parentNotification: {
      isParentNotification: false,
      studentId: '',
      parentId: ''
    },
    deliveryMethods: {
      inApp: true,
      email: false,
      sms: false
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [pagination.current, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch notification statistics
      const statsResponse = await notificationService.getNotificationStats();
      if (statsResponse.success) {
        setStats(statsResponse.stats);
      }
    } catch (error) {
      toast.error('Failed to load notification data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getAllNotifications(pagination.current, 20, filters);
      if (response.success) {
        setNotifications(response.notifications);
        setPagination(response.pagination);
      } else {
        toast.error('Failed to load notifications');
      }
    } catch (error) {
      toast.error('Failed to load notifications');
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTargetUsers = async (role = '', courseId = '', search = '') => {
    try {
      const response = await notificationService.getTargetUsers(role, courseId, search);
      if (response.success) {
        setTargetUsers(response.users);
        setCourses(response.courses);
      }
    } catch (error) {
      console.error('Error fetching target users:', error);
    }
  };

  const handleCreateNotification = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.message || !formData.expiresAt) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await notificationService.createNotification(formData);

      if (response.success) {
        toast.success('Notification created successfully');
        setShowCreateForm(false);
        resetForm();
        fetchNotifications();
        fetchData(); // Refresh stats
      } else {
        toast.error(response.message || 'Failed to create notification');
      }
    } catch (error) {
      toast.error('Failed to create notification');
      console.error('Error creating notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotification = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.message || !formData.expiresAt) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await notificationService.updateNotification(editingNotification._id, formData);

      if (response.success) {
        toast.success('Notification updated successfully');
        setEditingNotification(null);
        resetForm();
        fetchNotifications();
        fetchData(); // Refresh stats
      } else {
        toast.error(response.message || 'Failed to update notification');
      }
    } catch (error) {
      toast.error('Failed to update notification');
      console.error('Error updating notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await notificationService.deleteNotification(notificationId);

      if (response.success) {
        toast.success('Notification deleted successfully');
        fetchNotifications();
        fetchData(); // Refresh stats
      } else {
        toast.error(response.message || 'Failed to delete notification');
      }
    } catch (error) {
      toast.error('Failed to delete notification');
      console.error('Error deleting notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = async (notificationId) => {
    try {
      const response = await notificationService.togglePinNotification(notificationId);
      if (response.success) {
        toast.success(response.message);
        fetchNotifications();
      } else {
        toast.error(response.message || 'Failed to toggle pin status');
      }
    } catch (error) {
      toast.error('Failed to toggle pin status');
      console.error('Error toggling pin:', error);
    }
  };

  const handleToggleActive = async (notificationId) => {
    try {
      const response = await notificationService.toggleActiveNotification(notificationId);
      if (response.success) {
        toast.success(response.message);
        fetchNotifications();
      } else {
        toast.error(response.message || 'Failed to toggle active status');
      }
    } catch (error) {
      toast.error('Failed to toggle active status');
      console.error('Error toggling active:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      koreanTitle: '',
      koreanMessage: '',
      type: 'general',
      priority: 'medium',
      targetAudience: 'all',
      targetUsers: [],
      targetRoles: [],
      targetCourses: [],
      isActive: true,
      isPinned: false,
      scheduledFor: new Date().toISOString().slice(0, 16),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      actionUrl: '',
      actionText: '',
      tags: [],
      parentNotification: {
        isParentNotification: false,
        studentId: '',
        parentId: ''
      },
      deliveryMethods: {
        inApp: true,
        email: false,
        sms: false
      }
    });
  };

  const handleEdit = (notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title || '',
      message: notification.message || '',
      koreanTitle: notification.koreanTitle || '',
      koreanMessage: notification.koreanMessage || '',
      type: notification.type || 'general',
      priority: notification.priority || 'medium',
      targetAudience: notification.targetAudience || 'all',
      targetUsers: notification.targetUsers?.map(u => u._id) || [],
      targetRoles: notification.targetRoles || [],
      targetCourses: notification.targetCourses?.map(c => c._id) || [],
      isActive: notification.isActive !== undefined ? notification.isActive : true,
      isPinned: notification.isPinned || false,
      scheduledFor: notification.scheduledFor ? new Date(notification.scheduledFor).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      expiresAt: notification.expiresAt ? new Date(notification.expiresAt).toISOString().slice(0, 16) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      actionUrl: notification.actionUrl || '',
      actionText: notification.actionText || '',
      tags: notification.tags || [],
      parentNotification: notification.parentNotification || {
        isParentNotification: false,
        studentId: '',
        parentId: ''
      },
      deliveryMethods: notification.deliveryMethods || {
        inApp: true,
        email: false,
        sms: false
      }
    });
    setShowCreateForm(true);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'course_update':
        return <AcademicCapIcon className="h-4 w-4" />;
      case 'assignment_reminder':
        return <ClockIcon className="h-4 w-4" />;
      case 'exam_schedule':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'payment_due':
        return <XCircleIcon className="h-4 w-4" />;
      case 'enrollment_confirmation':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'certificate_ready':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'system_maintenance':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'special_event':
        return <BellIcon className="h-4 w-4" />;
      case 'korean_culture_tip':
        return <InformationCircleIcon className="h-4 w-4" />;
      case 'language_learning_tip':
        return <AcademicCapIcon className="h-4 w-4" />;
      case 'parent_update':
        return <UserGroupIcon className="h-4 w-4" />;
      case 'teacher_announcement':
        return <UsersIcon className="h-4 w-4" />;
      default:
        return <BellIcon className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'course_update':
        return 'bg-blue-100 text-blue-800';
      case 'assignment_reminder':
        return 'bg-purple-100 text-purple-800';
      case 'exam_schedule':
        return 'bg-red-100 text-red-800';
      case 'payment_due':
        return 'bg-yellow-100 text-yellow-800';
      case 'enrollment_confirmation':
        return 'bg-green-100 text-green-800';
      case 'certificate_ready':
        return 'bg-green-100 text-green-800';
      case 'system_maintenance':
        return 'bg-red-100 text-red-800';
      case 'special_event':
        return 'bg-pink-100 text-pink-800';
      case 'korean_culture_tip':
        return 'bg-indigo-100 text-indigo-800';
      case 'language_learning_tip':
        return 'bg-cyan-100 text-cyan-800';
      case 'parent_update':
        return 'bg-amber-100 text-amber-800';
      case 'teacher_announcement':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notification Management</h1>
            <p className="text-gray-600 mt-2">
              Manage notifications for students, parents, and teachers at SRI-KO Korean Language Institute
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingNotification(null);
              setShowCreateForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Create Notification
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BellIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Notifications</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expired</p>
              <p className="text-2xl font-bold text-gray-900">{stats.expired}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <BookmarkIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pinned</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pinned}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="general">General</option>
              <option value="course_update">Course Update</option>
              <option value="assignment_reminder">Assignment Reminder</option>
              <option value="exam_schedule">Exam Schedule</option>
              <option value="payment_due">Payment Due</option>
              <option value="enrollment_confirmation">Enrollment Confirmation</option>
              <option value="certificate_ready">Certificate Ready</option>
              <option value="system_maintenance">System Maintenance</option>
              <option value="special_event">Special Event</option>
              <option value="korean_culture_tip">Korean Culture Tip</option>
              <option value="language_learning_tip">Language Learning Tip</option>
              <option value="parent_update">Parent Update</option>
              <option value="teacher_announcement">Teacher Announcement</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
            <select
              value={filters.targetAudience}
              onChange={(e) => setFilters({ ...filters, targetAudience: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Audiences</option>
              <option value="all">All</option>
              <option value="students">Students</option>
              <option value="instructors">Instructors</option>
              <option value="admins">Admins</option>
              <option value="parents">Parents</option>
              <option value="specific_users">Specific Users</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.isActive}
              onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search notifications..."
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ type: '', priority: '', targetAudience: '', isActive: '', isPinned: '', search: '', dateFrom: '', dateTo: '' })}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">Create Notification</h3>
          <form onSubmit={handleCreateNotification} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title<span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expires At<span className="text-red-500">*</span></label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message<span className="text-red-500">*</span></label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write the notification message..."
                rows="4"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">General</option>
                  <option value="course_update">Course Update</option>
                  <option value="assignment_reminder">Assignment Reminder</option>
                  <option value="exam_schedule">Exam Schedule</option>
                  <option value="payment_due">Payment Due</option>
                  <option value="enrollment_confirmation">Enrollment Confirmation</option>
                  <option value="certificate_ready">Certificate Ready</option>
                  <option value="system_maintenance">System Maintenance</option>
                  <option value="special_event">Special Event</option>
                  <option value="korean_culture_tip">Korean Culture Tip</option>
                  <option value="language_learning_tip">Language Learning Tip</option>
                  <option value="parent_update">Parent Update</option>
                  <option value="teacher_announcement">Teacher Announcement</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Audience</label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="students">Students</option>
                  <option value="instructors">Instructors</option>
                  <option value="admins">Admins</option>
                  <option value="parents">Parents</option>
                  <option value="specific_users">Specific Users</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Notification'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notifications Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">All Notifications</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notification</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Audience</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No notifications found
                  </td>
                </tr>
              ) : (
                notifications.map((notification) => (
                  <tr key={notification._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="ml-3">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            {notification.isPinned && (
                              <BookmarkIcon className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
                          {notification.koreanTitle && (
                            <p className="text-sm text-gray-400 mt-1">🇰🇷 {notification.koreanTitle}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                        {notification.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                        {notification.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 capitalize">{notification.targetAudience}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          notification.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {notification.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {isExpired(notification.expiresAt) && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Expired
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatDate(notification.expiresAt)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {isExpired(notification.expiresAt) ? 'Expired' : 'Active'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(notification)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleTogglePin(notification._id)}
                          className={`${notification.isPinned ? 'text-yellow-600 hover:text-yellow-800' : 'text-gray-400 hover:text-gray-600'}`}
                          title={notification.isPinned ? 'Unpin' : 'Pin'}
                        >
                          {notification.isPinned ? <BookmarkIcon className="h-4 w-4" /> : <BookmarkSlashIcon className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleToggleActive(notification._id)}
                          className={`${notification.isActive ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-gray-600'}`}
                          title={notification.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {notification.isActive ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteNotification(notification._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.current - 1) * 20) + 1} to {Math.min(pagination.current * 20, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, current: pagination.current - 1 })}
                  disabled={pagination.current === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Page {pagination.current} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, current: pagination.current + 1 })}
                  disabled={pagination.current === pagination.pages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotificationManagementPage;
        