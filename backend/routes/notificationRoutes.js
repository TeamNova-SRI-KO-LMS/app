const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const Course = require('../models/Course');
const { protect, authorize } = require('../middleware/auth');
const NotificationEngine = require('../services/NotificationEngine');
const escapeRegex = require('../utils/escapeRegex');

// @desc    Get active notifications for current user
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.getActiveNotifications(req.user._id, req.user.role);

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get all notifications (admin only)
// @route   GET /api/notifications/all
// @access  Private/Admin
router.get('/all', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filters = {
      type: req.query.type,
      priority: req.query.priority,
      targetAudience: req.query.targetAudience,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      isPinned: req.query.isPinned !== undefined ? req.query.isPinned === 'true' : undefined,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      search: req.query.search
    };

    const result = await Notification.getAllNotifications(page, limit, filters);

    res.json({
      success: true,
      notifications: result.notifications,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get notification statistics (admin only)
// @route   GET /api/notifications/stats
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const stats = await Notification.getNotificationStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get unread notification count for current user
// @route   GET /api/notifications/unread-count
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
  try {
    const now = new Date();
    const audienceMatches = [
      { targetAudience: 'all' },
      { targetUsers: req.user._id }
    ];

    if (req.user.role) {
      audienceMatches.push({ targetAudience: `${req.user.role}s` });
      audienceMatches.push({ targetRoles: req.user.role });
    }

    const count = await Notification.countDocuments({
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: now } }
      ],
      'readBy.user': { $ne: req.user._id },
      $and: [
        { $or: audienceMatches }
      ]
    });

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Mark all unread notifications as read for current user
// @route   POST /api/notifications/mark-all-read
// @access  Private
router.post('/mark-all-read', protect, async (req, res) => {
  try {
    const now = new Date();
    const audienceMatches = [
      { targetAudience: 'all' },
      { targetUsers: req.user._id }
    ];

    if (req.user.role) {
      audienceMatches.push({ targetAudience: `${req.user.role}s` });
      audienceMatches.push({ targetRoles: req.user.role });
    }

    const unreadNotifications = await Notification.find({
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: now } }
      ],
      'readBy.user': { $ne: req.user._id },
      $and: [
        { $or: audienceMatches }
      ]
    });

    for (const notif of unreadNotifications) {
      await notif.markAsRead(req.user._id);
    }

    res.json({
      success: true,
      message: `Marked ${unreadNotifications.length} notifications as read`,
      count: unreadNotifications.length
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get users for notification targeting (admin only)
// @route   GET /api/notifications/target-users
// @access  Private/Admin
router.get('/target-users', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, courseId, search } = req.query;
    const query = {};

    if (role) {
      query.role = role;
    }

    if (search) {
      const pattern = escapeRegex(search);
      query.$or = [
        { name: { $regex: pattern, $options: 'i' } },
        { email: { $regex: pattern, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('name email role')
      .limit(50)
      .sort({ name: 1 });

    let courses = [];
    if (courseId) {
      courses = await Course.findById(courseId).select('title');
    } else {
      courses = await Course.find({ isPublished: true })
        .select('title')
        .limit(20)
        .sort({ title: 1 });
    }

    res.json({
      success: true,
      users,
      courses
    });
  } catch (error) {
    console.error('Error fetching target users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get notification by ID
// @route   GET /api/notifications/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('targetUsers', 'name email')
      .populate('targetCourses', 'title');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new notification and dispatch via WebSocket (admin only)
// @route   POST /api/notifications
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      priority,
      targetAudience,
      targetUsers,
      targetRoles,
      targetCourses,
      isActive,
      isPinned,
      scheduledFor,
      expiresAt,
      actionUrl,
      actionText,
      tags,
      koreanTitle,
      koreanMessage,
      parentNotification,
    } = req.body;

    // Validate required fields
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    // Process expiration date (default to 30 days in future if omitted or invalid)
    let expDate = expiresAt ? new Date(expiresAt) : null;
    if (!expDate || isNaN(expDate.getTime()) || expDate <= new Date()) {
      expDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    // Normalize type to match enum ['course_update', 'payment_due', 'system', 'message', 'other']
    let normalizedType = (type || 'system').toLowerCase().replace(/\s+/g, '_');
    if (['general', 'special_event', 'event', 'event_reminder'].includes(normalizedType)) normalizedType = 'other';
    if (['course_alert', 'course'].includes(normalizedType)) normalizedType = 'course_update';
    if (['system_update'].includes(normalizedType)) normalizedType = 'system';
    if (!['course_update', 'payment_due', 'system', 'message', 'other'].includes(normalizedType)) {
      normalizedType = 'system';
    }

    // Normalize priority to match enum ['low', 'medium', 'high', 'urgent']
    let normalizedPriority = (priority || 'medium').toLowerCase();
    if (normalizedPriority === 'normal') normalizedPriority = 'medium';
    if (!['low', 'medium', 'high', 'urgent'].includes(normalizedPriority)) {
      normalizedPriority = 'medium';
    }

    // Normalize audience to match enum ['all', 'students', 'instructors', 'admins', 'specific_users', 'specific_courses']
    let normalizedAudience = (targetAudience || 'all').toLowerCase().replace(/\s+/g, '_');
    if (['all_users', 'all_scholars', 'everyone'].includes(normalizedAudience)) normalizedAudience = 'all';
    if (['scholars', 'student'].includes(normalizedAudience)) normalizedAudience = 'students';
    if (['editors', 'instructor', 'instructors_only', 'teachers'].includes(normalizedAudience)) normalizedAudience = 'instructors';
    if (['admin', 'admins_only'].includes(normalizedAudience)) normalizedAudience = 'admins';
    if (['students_only'].includes(normalizedAudience)) normalizedAudience = 'students';
    if (!['all', 'students', 'instructors', 'admins', 'specific_users', 'specific_courses'].includes(normalizedAudience)) {
      normalizedAudience = 'all';
    }

    // Sanitize parentNotification to avoid ObjectId cast errors
    let sanitizedParentNotification = { isParentNotification: false };
    if (parentNotification && parentNotification.isParentNotification) {
      sanitizedParentNotification.isParentNotification = true;
      if (typeof parentNotification.studentId === 'string' && parentNotification.studentId.length === 24) {
        sanitizedParentNotification.studentId = parentNotification.studentId;
      }
      if (typeof parentNotification.parentId === 'string' && parentNotification.parentId.length === 24) {
        sanitizedParentNotification.parentId = parentNotification.parentId;
      }
    }

    // Use NotificationEngine to save in MongoDB and dispatch via Socket.IO
    const notification = await NotificationEngine.dispatch({
      title,
      message,
      type: normalizedType,
      priority: normalizedPriority,
      targetAudience: normalizedAudience,
      targetUsers: targetUsers || [],
      targetRoles: targetRoles || [],
      targetCourses: targetCourses || [],
      isActive: isActive !== undefined ? isActive : true,
      isPinned: isPinned || false,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : new Date(),
      expiresAt: expDate,
      actionUrl,
      actionText,
      tags: tags || [],
      koreanTitle,
      koreanMessage,
      parentNotification: sanitizedParentNotification,
    }, req.user._id);

    res.status(201).json({
      success: true,
      message: 'Notification created and dispatched in real-time',
      notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update notification (admin only)
// @route   PUT /api/notifications/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    const {
      title,
      message,
      type,
      priority,
      targetAudience,
      targetUsers,
      targetRoles,
      targetCourses,
      isActive,
      isPinned,
      scheduledFor,
      expiresAt,
      actionUrl,
      actionText,
      tags,
      koreanTitle,
      koreanMessage,
      parentNotification,
    } = req.body;

    // Update fields
    if (title) notification.title = title;
    if (message) notification.message = message;
    if (type) notification.type = type;
    if (priority) notification.priority = priority;
    if (targetAudience) notification.targetAudience = targetAudience;
    if (targetUsers) notification.targetUsers = targetUsers;
    if (targetRoles) notification.targetRoles = targetRoles;
    if (targetCourses) notification.targetCourses = targetCourses;
    if (isActive !== undefined) notification.isActive = isActive;
    if (isPinned !== undefined) notification.isPinned = isPinned;
    if (scheduledFor) notification.scheduledFor = new Date(scheduledFor);
    if (expiresAt) notification.expiresAt = new Date(expiresAt);
    if (actionUrl !== undefined) notification.actionUrl = actionUrl;
    if (actionText !== undefined) notification.actionText = actionText;
    if (tags) notification.tags = tags;
    if (koreanTitle !== undefined) notification.koreanTitle = koreanTitle;
    if (koreanMessage !== undefined) notification.koreanMessage = koreanMessage;
    if (parentNotification) notification.parentNotification = parentNotification;

    await notification.save();

    res.json({
      success: true,
      message: 'Notification updated successfully',
      notification
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete notification (admin only)
// @route   DELETE /api/notifications/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Toggle notification pin status (admin only)
// @route   PUT /api/notifications/:id/pin
// @access  Private/Admin
router.put('/:id/pin', protect, authorize('admin'), async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.isPinned = !notification.isPinned;
    await notification.save();

    res.json({
      success: true,
      message: `Notification ${notification.isPinned ? 'pinned' : 'unpinned'} successfully`,
      notification
    });
  } catch (error) {
    console.error('Error toggling notification pin:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Toggle notification active status (admin only)
// @route   PUT /api/notifications/:id/toggle
// @access  Private/Admin
router.put('/:id/toggle', protect, authorize('admin'), async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.isActive = !notification.isActive;
    await notification.save();

    res.json({
      success: true,
      message: `Notification ${notification.isActive ? 'activated' : 'deactivated'} successfully`,
      notification
    });
  } catch (error) {
    console.error('Error toggling notification active status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Mark notification as read
// @route   POST /api/notifications/:id/read
// @access  Private
router.post('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsRead(req.user._id);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Mark notification as clicked
// @route   POST /api/notifications/:id/click
// @access  Private
router.post('/:id/click', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsClicked(req.user._id);

    res.json({
      success: true,
      message: 'Notification click recorded'
    });
  } catch (error) {
    console.error('Error recording notification click:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Send notification to specific users (admin only)
// @route   POST /api/notifications/send-to-users
// @access  Private/Admin
router.post('/send-to-users', protect, authorize('admin'), async (req, res) => {
  try {
    const { notificationData, userIds } = req.body;

    if (!notificationData || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Notification data and user IDs are required'
      });
    }

    const notification = await Notification.sendToUsers(
      { ...notificationData, createdBy: req.user._id },
      userIds
    );

    res.status(201).json({
      success: true,
      message: `Notification sent to ${userIds.length} users`,
      notification
    });
  } catch (error) {
    console.error('Error sending notification to users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Send notification to parents (admin only)
// @route   POST /api/notifications/send-to-parents
// @access  Private/Admin
router.post('/send-to-parents', protect, authorize('admin'), async (req, res) => {
  try {
    const { notificationData, studentIds } = req.body;

    if (!notificationData || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Notification data and student IDs are required'
      });
    }

    const notification = await Notification.sendToParents(
      { ...notificationData, createdBy: req.user._id },
      studentIds
    );

    res.status(201).json({
      success: true,
      message: `Notification sent to ${studentIds.length} parents`,
      notification
    });
  } catch (error) {
    console.error('Error sending notification to parents:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
