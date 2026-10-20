const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  // In-app navigation shortcuts offered with an assistant reply
  links: [{
    _id: false,
    label: String,
    to: String,
  }],
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

const chatSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    messages: [chatMessageSchema],
    isActive: {
      type: Boolean,
      default: true, 
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatSession', chatSessionSchema);