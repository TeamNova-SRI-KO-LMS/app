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
      required: true,
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
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);