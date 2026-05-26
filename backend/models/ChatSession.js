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
      default: true, // You can set this to false if the user clears their chat history
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatSession', chatSessionSchema);