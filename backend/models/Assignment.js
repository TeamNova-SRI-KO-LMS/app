const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Assignment must belong to a course'],
    index: true,
  },
  weekNumber: {
    type: Number,
    default: 1,
  },
  lessonTitle: {
    type: String,
    default: 'General Course Assignment',
  },
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Assignment description/instructions required'],
  },
  dueDate: {
    type: Date,
  },
  maxScore: {
    type: Number,
    default: 100,
  },
  allowedFileTypes: {
    type: [String],
    default: ['pdf', 'doc', 'docx', 'zip', 'jpg', 'png'],
  },
  maxFileSizeMB: {
    type: Number,
    default: 50,
  },
  attachmentUrl: {
    type: String, // Optional worksheet or rubric attached by admin
  },
  attachmentName: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Assignment', assignmentSchema);
