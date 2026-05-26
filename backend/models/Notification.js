const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: String,
  message: String,
  type: {
    type: String,
    enum: ['course_update', 'payment_due', 'system', 'message', 'other']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'students', 'instructors', 'admins', 'specific_users', 'specific_courses']
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
  scheduledFor: Date,
  expiresAt: Date,
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

module.exports = mongoose.model('Notification', notificationSchema);
