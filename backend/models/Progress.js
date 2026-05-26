const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Progress must belong to a student']
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: [true, 'Progress must belong to a course']
  },
  completedLessons: [{
    lesson: {
      type: mongoose.Schema.ObjectId
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    score: Number
  }],
  currentWeek: {
    type: Number,
    default: 1
  },
  overallProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  timeSpent: {
    type: Number, // in minutes
    default: 0
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completionDate: {
    type: Date
  },
  certificate: {
    type: String // URL or reference to certificate
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Progress', progressSchema);
