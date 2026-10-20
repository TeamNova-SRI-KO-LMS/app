const mongoose = require('mongoose');

const lectureMaterialSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Lecture material must belong to a course'],
    index: true,
  },
  weekNumber: {
    type: Number,
    required: true,
    default: 1,
  },
  lessonIndex: {
    type: Number,
    default: 0,
  },
  lessonTitle: {
    type: String,
    required: [true, 'Lesson title is required'],
  },
  title: {
    type: String,
    required: [true, 'Material title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ['video', 'pdf', 'image', 'link'],
    required: true,
  },

  // Google Drive integration fields
  driveFileId: {
    type: String,
  },
  viewUrl: {
    type: String,
  },
  embedUrl: {
    type: String,
  },
  downloadUrl: {
    type: String,
  },
  fileName: {
    type: String,
  },
  fileSizeBytes: {
    type: Number,
  },
  mimeType: {
    type: String,
  },

  // External link (e.g. YouTube, Vimeo)
  externalUrl: {
    type: String,
  },

  isPreview: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Number,
    default: 0,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('LectureMaterial', lectureMaterialSchema);
