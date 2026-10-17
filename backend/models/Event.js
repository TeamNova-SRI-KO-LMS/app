const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      maxLength: 100,
    },
    description: {
      type: String,
      required: true,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // in minutes
      default: 60,
    },
    location: {
      type: String, // Can be "Online" or a physical address
      default: 'Online',
    },
    meetingLink: {
      type: String, // Zoom/Meet link if online
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    relatedCourse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course', // Optional: if the event is tied to a specific Korean language batch
    },
    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    photos: [
      {
        type: String,
        trim: true,
      }
    ],
    coverImage: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['seminar', 'ceremony', 'workshop', 'cultural', 'exam', 'webinar', 'general'],
      default: 'seminar',
      lowercase: true,
      trim: true,
    },
    capacity: {
      type: Number,
      default: 0, // 0 = unlimited
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        trim: true,
      }
    ],
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);