const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Certificate must belong to a student']
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: [true, 'Certificate must belong to a course']
  },
  certificateNumber: {
    type: String,
    required: true,
    unique: true
  },
  studentName: {
    type: String,
    required: [true, 'Student name on certificate is required']
  },
  courseName: {
    type: String,
    required: [true, 'Course name on certificate is required']
  },
  completionDate: Date,
  issuedDate: Date,
  issuedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Issuer is required']
  },
  status: {
    type: String,
    enum: ['pending', 'issued', 'sent', 'delivered'],
    default: 'pending'
  },
  certificateUrl: String,
  emailSent: {
    type: Boolean,
    default: false
  },
  viewedByStudent: {
    type: Boolean,
    default: false
  },
  emailSentDate: Date,
  firstViewedDate: Date,
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Certificate', certificateSchema);
