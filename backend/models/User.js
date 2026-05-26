const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    maxLength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
    default: 'student'
  },
  avatar: {
    type: String
  },
  bio: {
    type: String,
    maxLength: [500, 'Bio cannot be more than 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  enrolledCourses: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Course'
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerificationToken: String,
  emailVerified: {
    type: Boolean,
    default: false
  },
  notifications: {
    emailNotifications: { type: Boolean, default: true },
    courseUpdates: { type: Boolean, default: true },
    assignmentReminders: { type: Boolean, default: true },
    systemAnnouncements: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false }
  },
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'friends'],
      default: 'public'
    },
    showEmail: { type: Boolean, default: false },
    showCourses: { type: Boolean, default: true },
    allowMessages: { type: Boolean, default: true }
  },
  phone: String,
  location: String,
  website: String,
  socialLinks: {
    linkedin: String,
    twitter: String,
    github: String
  },
  lastLogin: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
