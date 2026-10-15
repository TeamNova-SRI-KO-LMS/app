const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['course_update', 'payment_due', 'system', 'message', 'other'],
    default: 'system'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'students', 'instructors', 'admins', 'specific_users', 'specific_courses'],
    default: 'all'
  },
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  targetCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  targetRoles: [{
    type: String,
    enum: ['student', 'instructor', 'admin']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  scheduledFor: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  attachments: [{
    url: String,
    name: String
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String],
  actionUrl: String,
  actionText: String,
  koreanTitle: String,
  koreanMessage: String,
  parentNotification: {
    isParentNotification: { type: Boolean, default: false },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  deliveryMethods: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false }
  },
  deliveryStats: {
    totalSent: { type: Number, default: 0 },
    totalRead: { type: Number, default: 0 },
    totalClicked: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Indexing for high-performance notification querying
notificationSchema.index({ isActive: 1, expiresAt: 1, targetAudience: 1, createdAt: -1 });
notificationSchema.index({ targetUsers: 1 });
notificationSchema.index({ 'readBy.user': 1 });

// Instance method: mark as read
notificationSchema.methods.markAsRead = async function(userId) {
  const userIdStr = userId.toString();
  const alreadyRead = this.readBy.some(r => r.user && r.user.toString() === userIdStr);
  if (!alreadyRead) {
    this.readBy.push({ user: userId, readAt: new Date() });
    this.deliveryStats.totalRead = (this.deliveryStats.totalRead || 0) + 1;
    await this.save();
  }
  return this;
};

// Instance method: mark as clicked
notificationSchema.methods.markAsClicked = async function(userId) {
  this.deliveryStats.totalClicked = (this.deliveryStats.totalClicked || 0) + 1;
  await this.markAsRead(userId);
  return this;
};

// Static method: get active notifications for a user
notificationSchema.statics.getActiveNotifications = async function(userId, userRole) {
  const now = new Date();
  const audienceMatches = [
    { targetAudience: 'all' },
    { targetUsers: userId }
  ];

  if (userRole) {
    audienceMatches.push({ targetAudience: `${userRole}s` });
    audienceMatches.push({ targetRoles: userRole });
  }

  const query = {
    isActive: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: now } }
    ],
    $and: [
      { $or: audienceMatches }
    ]
  };

  return this.find(query)
    .populate('createdBy', 'name email role')
    .sort({ isPinned: -1, createdAt: -1 });
};

// Static method: get all notifications with pagination and filters (admin)
notificationSchema.statics.getAllNotifications = async function(page = 1, limit = 20, filters = {}) {
  const query = {};
  if (filters.type) query.type = filters.type;
  if (filters.priority) query.priority = filters.priority;
  if (filters.targetAudience) query.targetAudience = filters.targetAudience;
  if (filters.isActive !== undefined) query.isActive = filters.isActive;
  if (filters.isPinned !== undefined) query.isPinned = filters.isPinned;
  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
  }
  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { message: { $regex: filters.search, $options: 'i' } },
      { koreanTitle: { $regex: filters.search, $options: 'i' } },
      { koreanMessage: { $regex: filters.search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  const [notifications, total] = await Promise.all([
    this.find(query)
      .populate('createdBy', 'name email role')
      .populate('targetUsers', 'name email')
      .populate('targetCourses', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    this.countDocuments(query)
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method: get notification statistics (admin)
notificationSchema.statics.getNotificationStats = async function() {
  const [total, active, pinned, typeStats] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ isActive: true }),
    this.countDocuments({ isPinned: true }),
    this.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ])
  ]);

  return {
    total,
    active,
    pinned,
    byType: typeStats.reduce((acc, curr) => {
      acc[curr._id || 'other'] = curr.count;
      return acc;
    }, {})
  };
};

// Static method: send to specific users
notificationSchema.statics.sendToUsers = async function(notificationData, userIds) {
  const NotificationEngine = require('../services/NotificationEngine');
  return NotificationEngine.dispatch({
    ...notificationData,
    targetAudience: 'specific_users',
    targetUsers: userIds
  }, notificationData.createdBy || null);
};

// Static method: send to parents
notificationSchema.statics.sendToParents = async function(notificationData, studentIds) {
  const NotificationEngine = require('../services/NotificationEngine');
  return NotificationEngine.dispatch({
    ...notificationData,
    targetAudience: 'specific_users',
    targetUsers: studentIds,
    parentNotification: {
      isParentNotification: true,
      studentId: studentIds[0] || null
    }
  }, notificationData.createdBy || null);
};

module.exports = mongoose.model('Notification', notificationSchema);
