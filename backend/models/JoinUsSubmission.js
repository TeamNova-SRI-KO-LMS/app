const mongoose = require('mongoose');

const joinUsSubmissionSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  age: {
    type: Number,
    min: [16, 'Age must be at least 16'],
    max: [80, 'Age cannot be more than 80']
  },
  currentLevel: {
    type: String,
    enum: ['Complete Beginner', 'Beginner', 'Intermediate', 'Advanced', 'Native Level']
  },
  preferredTime: {
    type: String,
    enum: ['Morning', 'Afternoon', 'Evening', 'Weekends']
  },
  interests: [{
    type: String,
    enum: ['Speaking', 'Writing', 'Reading', 'Listening', 'TOPIK Prep', 'Culture']
  }],
  hearAboutUs: {
    type: String,
    enum: ['Social Media', 'Friend/Family', 'Search Engine', 'Advertisement', 'Other']
  },
  message: String,
  notes: String,
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['pending', 'contacted', 'enrolled', 'rejected'],
    default: 'pending'
  },
  contactedAt: Date,
  contactedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('JoinUsSubmission', joinUsSubmissionSchema);
