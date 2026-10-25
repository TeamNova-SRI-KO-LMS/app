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
  // Values match the form's timeOptions (full label strings)
  preferredTime: {
    type: String,
    enum: [
      'Morning (9:00 AM - 12:00 PM)',
      'Afternoon (1:00 PM - 4:00 PM)',
      'Evening (6:00 PM - 9:00 PM)',
      'Weekend Classes',
      'Flexible Schedule',
      // Short forms kept for backwards-compat
      'Morning', 'Afternoon', 'Evening', 'Weekends'
    ]
  },
  // Values match the form's interestOptions array
  interests: [{
    type: String,
    enum: [
      'Korean Language Basics',
      'Business Korean',
      'Korean Culture',
      'K-Pop & K-Drama',
      'Korean Cuisine',
      'Travel Korean',
      'Academic Korean',
      'Korean Literature',
      // Old values kept for backwards-compat
      'Speaking', 'Writing', 'Reading', 'Listening', 'TOPIK Prep', 'Culture'
    ]
  }],
  // Values match the form's hearAboutUs select options
  hearAboutUs: {
    type: String,
    enum: [
      'social-media', 'website', 'referral', 'advertisement', 'search-engine', 'other',
      // Capitalised forms for backwards-compat
      'Social Media', 'Friend/Family', 'Search Engine', 'Advertisement', 'Other'
    ]
  },
  subject: String,
  category: String,
  message: String,
  notes: String,
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['pending', 'contacted', 'enrolled', 'rejected', 'new', 'in_progress', 'resolved'],
    default: 'new'
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
