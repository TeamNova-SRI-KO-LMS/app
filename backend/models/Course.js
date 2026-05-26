const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a course title'],
    maxLength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxLength: [1000, 'Description cannot be more than 1000 characters']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Course must have an instructor']
  },
  category: {
    type: String,
    enum: ['programming', 'design', 'business', 'language', 'other']
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced']
  },
  duration: {
    type: Number,
    required: [true, 'Please specify the duration in weeks']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price must be a positive number or zero']
  },
  thumbnail: {
    type: String
  },
  curriculum: [{
    week: Number,
    title: String,
    description: String,
    lessons: [{
      title: String,
      content: String,
      duration: Number,
      type: {
        type: String,
        enum: ['video', 'text', 'quiz', 'assignment']
      },
      isFreePreview: {
        type: Boolean,
        default: false
      }
    }]
  }],
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: [0, 'Rating must be at least 0'],
    max: [5, 'Rating cannot be more than 5']
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  tags: [String],
  prerequisites: [String]
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
