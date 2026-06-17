const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const Course = require('../models/Course');
const { protect, authorize } = require('../middleware/auth');

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

// @desc    Get notification by ID
// @route   GET /api/notifications/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('createdBy', 'name email')
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

// @desc    Create new notification (admin only)
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
      deliveryMethods
    } = req.body;

    // Validate required fields
    if (!title || !message || !expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Title, message, and expiration date are required'
      });
    }

    // Validate expiration date
    const expDate = new Date(expiresAt);
    if (expDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Expiration date must be in the future'
      });
    }

    // Sanitize parentNotification to avoid ObjectId cast errors from empty strings
    const sanitizedParentNotification = {};
    if (parentNotification && parentNotification.isParentNotification) {
      const maybeStudentId = parentNotification.studentId;
      const maybeParentId = parentNotification.parentId;
      sanitizedParentNotification.isParentNotification = true;
      if (typeof maybeStudentId === 'string' && maybeStudentId.length === 24) {
        sanitizedParentNotification.studentId = maybeStudentId;
      }
      if (typeof maybeParentId === 'string' && maybeParentId.length === 24) {
        sanitizedParentNotification.parentId = maybeParentId;
      }
    }

    // Create notification
    const notification = new Notification({
      title,
      message,
      type: type || 'general',
      priority: priority || 'medium',
      targetAudience: targetAudience || 'all',
      targetUsers: targetUsers || [],
      targetRoles: targetRoles || [],
      targetCourses: targetCourses || [],
      isActive: isActive !== undefined ? isActive : true,
      isPinned: isPinned || false,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : new Date(),
      expiresAt: expDate,
      createdBy: req.user._id,
      actionUrl,
      actionText,
      tags: tags || [],
      koreanTitle,
      koreanMessage,
      parentNotification: sanitizedParentNotification,
      deliveryMethods: deliveryMethods || {
        inApp: true,
        email: false,
        sms: false
      }
    });

    await notification.save();

    // Populate the notification with creator info
    await notification.populate('createdBy', 'name email');

    // If targetUsers is specified, send to specific users
    if (targetUsers && targetUsers.length > 0) {
      notification.deliveryStats.totalSent = targetUsers.length;
      await notification.save();
    }

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
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
      deliveryMethods
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
    if (actionUrl) notification.actionUrl = actionUrl;
    if (actionText) notification.actionText = actionText;
    if (tags) notification.tags = tags;
    if (koreanTitle) notification.koreanTitle = koreanTitle;
    if (koreanMessage) notification.koreanMessage = koreanMessage;
    if (parentNotification) notification.parentNotification = parentNotification;
    if (deliveryMethods) notification.deliveryMethods = deliveryMethods;

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

    const notifications = await Notification.sendToUsers(notificationData, userIds);

    res.status(201).json({
      success: true,
      message: `Notification sent to ${notifications.length} users`,
      notifications
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

    const notifications = await Notification.sendToParents(notificationData, studentIds);

    res.status(201).json({
      success: true,
      message: `Notification sent to ${notifications.length} parents`,
      notifications
    });
  } catch (error) {
    console.error('Error sending notification to parents:', error);
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
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
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

module.exports = router;
