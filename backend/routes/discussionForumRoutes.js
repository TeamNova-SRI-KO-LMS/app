const express = require('express');
const router = express.Router();
const DiscussionForum = require('../models/DiscussionForum');
const DiscussionPost = require('../models/DiscussionPost');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get forums for users
// @route   GET /api/forums
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { category, level } = req.query;

    const forums = await DiscussionForum.getForumsByCategory(category, level);

    res.json({
      success: true,
      forums
    });
  } catch (error) {
    console.error('Error fetching forums:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get all forums (admin only)
// @route   GET /api/forums/all
// @access  Private/Admin
router.get('/all', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filters = {
      category: req.query.category,
      level: req.query.level,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      isPinned: req.query.isPinned !== undefined ? req.query.isPinned === 'true' : undefined,
      isLocked: req.query.isLocked !== undefined ? req.query.isLocked === 'true' : undefined,
      search: req.query.search
    };

    const result = await DiscussionForum.getAllForums(page, limit, filters);

    res.json({
      success: true,
      forums: result.forums,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching all forums:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get forum statistics (admin only)
// @route   GET /api/forums/stats
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const stats = await DiscussionForum.getForumStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching forum stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get forum by ID
// @route   GET /api/forums/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const forum = await DiscussionForum.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('moderators', 'name email')
      .populate('lastPost.author', 'name email');

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found'
      });
    }

    // Increment view count
    await forum.incrementViewCount();

    res.json({
      success: true,
      forum
    });
  } catch (error) {
    console.error('Error fetching forum:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new forum (admin only)
// @route   POST /api/forums
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      level,
      isActive,
      isPinned,
      isLocked,
      moderators,
      tags,
      rules
    } = req.body;

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    // Create forum
    const forum = new DiscussionForum({
      title,
      description,
      category: category || 'general',
      level: level || 'all',
      isActive: isActive !== undefined ? isActive : true,
      isPinned: isPinned || false,
      isLocked: isLocked || false,
      createdBy: req.user._id,
      moderators: moderators || [],
      tags: tags || [],
      rules: rules || []
    });

    await forum.save();

    // Populate the forum with creator info
    await forum.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Forum created successfully',
      forum
    });
  } catch (error) {
    console.error('Error creating forum:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update forum (admin only)
// @route   PUT /api/forums/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const forum = await DiscussionForum.findById(req.params.id);

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found'
      });
    }

    const {
      title,
      description,
      category,
      level,
      isActive,
      isPinned,
      isLocked,
      moderators,
      tags,
      rules
    } = req.body;

    // Update fields
    if (title) forum.title = title;
    if (description) forum.description = description;
    if (category) forum.category = category;
    if (level) forum.level = level;
    if (isActive !== undefined) forum.isActive = isActive;
    if (isPinned !== undefined) forum.isPinned = isPinned;
    if (isLocked !== undefined) forum.isLocked = isLocked;
    if (moderators) forum.moderators = moderators;
    if (tags) forum.tags = tags;
    if (rules) forum.rules = rules;

    await forum.save();

    // Populate the forum with creator info
    await forum.populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Forum updated successfully',
      forum
    });
  } catch (error) {
    console.error('Error updating forum:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete forum (admin only)
// @route   DELETE /api/forums/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const forum = await DiscussionForum.findById(req.params.id);

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found'
      });
    }

    // Delete all posts in this forum
    await DiscussionPost.deleteMany({ forum: req.params.id });

    // Delete the forum
    await DiscussionForum.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Forum and all its posts deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting forum:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Toggle forum pin status (admin only)
// @route   PUT /api/forums/:id/pin
// @access  Private/Admin
router.put('/:id/pin', protect, authorize('admin'), async (req, res) => {
  try {
    const forum = await DiscussionForum.findById(req.params.id);

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found'
      });
    }

    forum.isPinned = !forum.isPinned;
    await forum.save();

    res.json({
      success: true,
      message: `Forum ${forum.isPinned ? 'pinned' : 'unpinned'} successfully`,
      forum
    });
  } catch (error) {
    console.error('Error toggling forum pin:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Toggle forum active status (admin only)
// @route   PUT /api/forums/:id/toggle
// @access  Private/Admin
router.put('/:id/toggle', protect, authorize('admin'), async (req, res) => {
  try {
    const forum = await DiscussionForum.findById(req.params.id);

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found'
      });
    }

    forum.isActive = !forum.isActive;
    await forum.save();

    res.json({
      success: true,
      message: `Forum ${forum.isActive ? 'activated' : 'deactivated'} successfully`,
      forum
    });
  } catch (error) {
    console.error('Error toggling forum status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Subscribe to forum
// @route   POST /api/forums/:id/subscribe
// @access  Private
router.post('/:id/subscribe', protect, async (req, res) => {
  try {
    const forum = await DiscussionForum.findById(req.params.id);

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found'
      });
    }

    await forum.subscribeUser(req.user._id);

    res.json({
      success: true,
      message: 'Subscribed to forum successfully',
      forum
    });
  } catch (error) {
    console.error('Error subscribing to forum:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Unsubscribe from forum
// @route   POST /api/forums/:id/unsubscribe
// @access  Private
router.post('/:id/unsubscribe', protect, async (req, res) => {
  try {
    const forum = await DiscussionForum.findById(req.params.id);

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found'
      });
    }

    await forum.unsubscribeUser(req.user._id);

    res.json({
      success: true,
      message: 'Unsubscribed from forum successfully',
      forum
    });
  } catch (error) {
    console.error('Error unsubscribing from forum:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get posts in forum
// @route   GET /api/forums/:id/posts
// @access  Private
router.get('/:id/posts', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filters = {
      isPinned: req.query.isPinned !== undefined ? req.query.isPinned === 'true' : undefined,
      search: req.query.search
    };

    const result = await DiscussionPost.getPostsByForum(req.params.id, page, limit, filters);

    res.json({
      success: true,
      posts: result.posts,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching forum posts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create post in forum
// @route   POST /api/forums/:id/posts
// @access  Private
router.post('/:id/posts', protect, async (req, res) => {
  try {
    const forum = await DiscussionForum.findById(req.params.id);

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found'
      });
    }

    if (!forum.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Forum is not active'
      });
    }

    if (forum.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Forum is locked'
      });
    }

    const { title, content, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    const post = new DiscussionPost({
      forum: req.params.id,
      author: req.user._id,
      title,
      content,
      tags: tags || []
    });

    await post.save();

    // Update forum post count and last post
    await forum.incrementPostCount(post._id, req.user._id);

    // Populate the post with author info
    await post.populate('author', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

