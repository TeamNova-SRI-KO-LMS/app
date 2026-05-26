const mongoose = require('mongoose');

const discussionForumSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Forum title is required']
  },
  description: {
    type: String,
    required: [true, 'Forum description is required']
  },
  category: {
    type: String,
    enum: ['general', 'korean-basics', 'grammar', 'vocabulary', 'culture', 'other'],
    default: 'general'
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'all'],
    default: 'all'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  moderators: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  tags: [String],
  rules: [String],
  postCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  lastPost: {
    post: {
      type: mongoose.Schema.ObjectId,
      ref: 'DiscussionPost'
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    date: Date
  },
  subscribers: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('DiscussionForum', discussionForumSchema);
