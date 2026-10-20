const express = require('express');
const ChatSession = require('../models/ChatSession');
const ChatbotEngine = require('../services/ChatbotEngine');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

const MAX_MESSAGE_LENGTH = 500;
const HISTORY_LIMIT = 50; // messages returned to the chat widget
const STORED_MESSAGES = 100; // messages kept per conversation

// Light abuse protection: 20 messages per minute per user (or IP for guests).
// It is per server instance, which is enough for a free, database-backed bot.
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT = 20;
const recentMessages = new Map();

const isRateLimited = (key) => {
  const now = Date.now();
  const hits = (recentMessages.get(key) || []).filter((time) => now - time < RATE_WINDOW_MS);
  hits.push(now);
  recentMessages.set(key, hits);

  if (recentMessages.size > 5000) {
    for (const [entryKey, times] of recentMessages) {
      if (times.every((time) => now - time >= RATE_WINDOW_MS)) {
        recentMessages.delete(entryKey);
      }
    }
  }

  return hits.length > RATE_LIMIT;
};

const toClientMessage = (message) => ({
  id: message._id,
  sender: message.role === 'user' ? 'user' : 'ai',
  text: message.content,
  links: message.links || [],
  timestamp: message.timestamp,
});

// @route   POST /api/chat
// @desc    Ask the SRI-KO assistant a question (guests and signed-in users)
// @access  Public (personalized and saved when a valid token is sent)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

    if (!message) {
      return res.status(400).json({ success: false, message: 'Please type a message.' });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Messages can be up to ${MAX_MESSAGE_LENGTH} characters.`,
      });
    }

    const limiterKey = req.user ? `user:${req.user._id}` : `ip:${req.ip}`;
    if (isRateLimited(limiterKey)) {
      return res.status(429).json({
        success: false,
        message: "You're sending messages too quickly. Please wait a moment and try again.",
      });
    }

    const courseId = req.body?.context?.courseId;
    const reply = await ChatbotEngine.reply(message, {
      user: req.user || null,
      context: { courseId: typeof courseId === 'string' ? courseId : undefined },
    });

    if (req.user) {
      const askedAt = new Date();
      // A failed save should not cost the user their answer
      await ChatSession.findOneAndUpdate(
        { user: req.user._id, isActive: true },
        {
          $push: {
            messages: {
              $each: [
                { role: 'user', content: message, timestamp: askedAt },
                { role: 'assistant', content: reply.text, links: reply.links, timestamp: new Date(askedAt.getTime() + 1) },
              ],
              $slice: -STORED_MESSAGES,
            },
          },
        },
        { upsert: true, setDefaultsOnInsert: true },
      ).catch((err) => console.warn('Could not save chat history:', err.message));
    }

    res.json({ success: true, reply: { ...reply, timestamp: new Date().toISOString() } });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'The assistant is unavailable right now. Please try again shortly.',
    });
  }
});

// @route   GET /api/chat/history
// @desc    The signed-in user's current conversation and starter suggestions
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const session = await ChatSession.findOne({ user: req.user._id, isActive: true })
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      success: true,
      messages: (session?.messages || []).slice(-HISTORY_LIMIT).map(toClientMessage),
      suggestions: ChatbotEngine.suggestionsFor(req.user),
    });
  } catch (error) {
    console.error('Error loading chat history:', error);
    res.status(500).json({ success: false, message: 'Could not load the conversation' });
  }
});

// @route   DELETE /api/chat/history
// @desc    Start a new conversation (the old one is archived, not deleted)
// @access  Private
router.delete('/history', protect, async (req, res) => {
  try {
    await ChatSession.updateMany({ user: req.user._id, isActive: true }, { $set: { isActive: false } });
    res.json({ success: true, message: 'Conversation cleared' });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({ success: false, message: 'Could not clear the conversation' });
  }
});

module.exports = router;
