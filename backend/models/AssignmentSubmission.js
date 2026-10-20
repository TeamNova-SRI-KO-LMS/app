const mongoose = require('mongoose');

const assignmentSubmissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: [true, 'Submission must belong to an assignment'],
    index: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  files: [{
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    driveFileId: {
      type: String,
    },
    downloadUrl: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    mimeType: {
      type: String,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  submissionNote: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'late', 'resubmit'],
    default: 'submitted',
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  grade: {
    type: Number,
    min: 0,
  },
  feedback: {
    type: String,
    trim: true,
  },
  gradedAt: {
    type: Date,
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// A student has one active submission per assignment (can update if resubmitted)
assignmentSubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
