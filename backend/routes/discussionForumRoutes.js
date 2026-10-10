const express = require('express');
const router = express.Router();
const DiscussionForum = require('../models/DiscussionForum');
const DiscussionPost = require('../models/DiscussionPost');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/forums/stats
// @desc    Get discussion forum statistics
// @access  Public / Protected
router.get('/stats', async (req, res) => {
  try {
    const total = await DiscussionForum.countDocuments();
    const active = await DiscussionForum.countDocuments({ isActive: true });
    const inactive = await DiscussionForum.countDocuments({ isActive: false });
    const pinned = await DiscussionForum.countDocuments({ isPinned: true });
    const locked = await DiscussionForum.countDocuments({ isLocked: true });

    res.json({
      success: true,
      stats: {
        total,
        active,
        inactive,
        pinned,
        locked,
      },
    });
  } catch (error) {
    console.error('Error fetching forum stats:', error);
    res.status(500).json({ success: false, message: 'Server error fetching forum stats' });
  }
});

// @route   GET /api/forums
// @desc    Get all discussion forums with pagination and filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.category && req.query.category !== 'All Categories') {
      query.category = req.query.category.toLowerCase().replace(/\s+/g, '-');
    }

    if (req.query.level && req.query.level !== 'All Levels') {
      query.level = req.query.level.toLowerCase();
    }

    if (req.query.isActive !== undefined && req.query.isActive !== '') {
      query.isActive = req.query.isActive === 'true';
    }

    if (req.query.isPinned !== undefined && req.query.isPinned !== '') {
      query.isPinned = req.query.isPinned === 'true';
    }

    if (req.query.isLocked !== undefined && req.query.isLocked !== '') {
      query.isLocked = req.query.isLocked === 'true';
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
      ];
    }

    const total = await DiscussionForum.countDocuments(query);
    const forums = await DiscussionForum.find(query)
      .populate('createdBy', 'name email role avatar')
      .populate('lastPost.author', 'name role avatar')
      .sort({ isPinned: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      forums,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit) || 1,
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching forums:', error);
    res.status(500).json({ success: false, message: 'Server error fetching forums' });
  }
});

// @route   GET /api/forums/:id
// @desc    Get single forum details by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const forum = await DiscussionForum.findById(req.params.id)
      .populate('createdBy', 'name email role avatar')
      .populate('moderators', 'name email role avatar');

    if (!forum) {
      return res.status(404).json({ success: false, message: 'Forum not found' });
    }

    // Increment view count
    forum.viewCount += 1;
    await forum.save();

    res.json({ success: true, forum });
  } catch (error) {
    console.error('Error fetching forum detail:', error);
    res.status(500).json({ success: false, message: 'Server error fetching forum detail' });
  }
});

// @route   POST /api/forums
// @desc    Create a new discussion forum
// @access  Private (Admin / Instructor / User)
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, category, level, isActive, isPinned, isLocked, tags, rules } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }

    const forum = new DiscussionForum({
      title,
      description,
      category: category ? category.toLowerCase().replace(/\s+/g, '-') : 'general',
      level: level ? level.toLowerCase() : 'all',
      isActive: isActive !== undefined ? isActive : true,
      isPinned: isPinned || false,
      isLocked: isLocked || false,
      createdBy: req.user._id,
      tags: tags || [],
      rules: rules || [],
    });

    await forum.save();
    const populatedForum = await DiscussionForum.findById(forum._id).populate('createdBy', 'name email role avatar');

    res.status(201).json({
      success: true,
      message: 'Discussion forum created successfully',
      forum: populatedForum,
    });
  } catch (error) {
    console.error('Error creating forum:', error);
    res.status(500).json({ success: false, message: 'Server error creating discussion forum' });
  }
});

// @route   PUT /api/forums/:id
// @desc    Update a discussion forum
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let forum = await DiscussionForum.findById(req.params.id);

    if (!forum) {
      return res.status(404).json({ success: false, message: 'Forum not found' });
    }

    const { title, description, category, level, isActive, isPinned, isLocked, tags, rules } = req.body;

    if (title) forum.title = title;
    if (description) forum.description = description;
    if (category) forum.category = category.toLowerCase().replace(/\s+/g, '-');
    if (level) forum.level = level.toLowerCase();
    if (isActive !== undefined) forum.isActive = isActive;
    if (isPinned !== undefined) forum.isPinned = isPinned;
    if (isLocked !== undefined) forum.isLocked = isLocked;
    if (tags) forum.tags = tags;
    if (rules) forum.rules = rules;

    await forum.save();
    const updatedForum = await DiscussionForum.findById(forum._id).populate('createdBy', 'name email role avatar');

    res.json({
      success: true,
      message: 'Forum updated successfully',
      forum: updatedForum,
    });
  } catch (error) {
    console.error('Error updating forum:', error);
    res.status(500).json({ success: false, message: 'Server error updating forum' });
  }
});

// @route   DELETE /api/forums/:id
// @desc    Delete a discussion forum and its posts
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const forum = await DiscussionForum.findById(req.params.id);

    if (!forum) {
      return res.status(404).json({ success: false, message: 'Forum not found' });
    }

    // Delete all posts for this forum
    await DiscussionPost.deleteMany({ forum: forum._id });
    await DiscussionForum.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Discussion forum and associated posts deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting forum:', error);
    res.status(500).json({ success: false, message: 'Server error deleting forum' });
  }
});

// @route   PATCH /api/forums/:id/pin
// @desc    Toggle pin status for a forum
// @access  Private
router.patch('/:id/pin', protect, async (req, res) => {
  try {
    const forum = await DiscussionForum.findById(req.params.id);

    if (!forum) {
      return res.status(404).json({ success: false, message: 'Forum not found' });
    }

    forum.isPinned = !forum.isPinned;
    await forum.save();

    res.json({
      success: true,
      message: `Forum ${forum.isPinned ? 'pinned' : 'unpinned'} successfully`,
      forum,
    });
  } catch (error) {
    console.error('Error toggling pin:', error);
    res.status(500).json({ success: false, message: 'Server error toggling pin' });
  }
});

// @route   PATCH /api/forums/:id/active
// @desc    Toggle active status for a forum
// @access  Private
router.patch('/:id/active', protect, async (req, res) => {
  try {
    const forum = await DiscussionForum.findById(req.params.id);

    if (!forum) {
      return res.status(404).json({ success: false, message: 'Forum not found' });
    }

    forum.isActive = !forum.isActive;
    await forum.save();

    res.json({
      success: true,
      message: `Forum ${forum.isActive ? 'activated' : 'deactivated'} successfully`,
      forum,
    });
  } catch (error) {
    console.error('Error toggling active status:', error);
    res.status(500).json({ success: false, message: 'Server error toggling active status' });
  }
});

// --- POSTS ROUTES ---

// @route   GET /api/forums/:id/posts
// @desc    Get all posts for a forum
// @access  Public
router.get('/:id/posts', async (req, res) => {
  try {
    const posts = await DiscussionPost.find({ forum: req.params.id })
      .populate('author', 'name email role avatar')
      .populate('replies.author', 'name email role avatar')
      .sort({ isPinned: -1, createdAt: -1 });

    res.json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error('Error fetching forum posts:', error);
    res.status(500).json({ success: false, message: 'Server error fetching forum posts' });
  }
});

// @route   POST /api/forums/:id/posts
// @desc    Create a new post/message in a discussion forum
// @access  Private
router.post('/:id/posts', protect, async (req, res) => {
  try {
    const forum = await DiscussionForum.findById(req.params.id);

    if (!forum) {
      return res.status(404).json({ success: false, message: 'Forum not found' });
    }

    if (forum.isLocked && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'This forum is locked' });
    }

    const { title, content, tags, isPinned } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: 'Post content is required' });
    }

    const postTitle = title || (content.length > 50 ? `${content.substring(0, 47)}...` : content);

    const post = new DiscussionPost({
      forum: forum._id,
      author: req.user._id,
      title: postTitle,
      content,
      tags: tags || [],
      isPinned: isPinned && req.user.role === 'admin' ? true : false,
      isApproved: true,
      approvedBy: req.user._id,
      approvedAt: new Date(),
    });

    await post.save();

    // Update forum post count & last post info
    forum.postCount += 1;
    forum.lastPost = {
      post: post._id,
      author: req.user._id,
      date: new Date(),
    };
    await forum.save();

    const populatedPost = await DiscussionPost.findById(post._id)
      .populate('author', 'name email role avatar');

    res.status(201).json({
      success: true,
      message: 'Post published successfully',
      post: populatedPost,
    });
  } catch (error) {
    console.error('Error creating discussion post:', error);
    res.status(500).json({ success: false, message: 'Server error creating discussion post' });
  }
});

// @route   POST /api/forums/posts/:postId/reply
// @desc    Reply to a discussion post
// @access  Private
router.post('/posts/:postId/reply', protect, async (req, res) => {
  try {
    const post = await DiscussionPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: 'Reply content is required' });
    }

    const reply = {
      author: req.user._id,
      content,
      isApproved: true,
      approvedBy: req.user._id,
      approvedAt: new Date(),
      createdAt: new Date(),
    };

    post.replies.push(reply);
    post.replyCount += 1;
    await post.save();

    // Also update forum last post
    await DiscussionForum.findByIdAndUpdate(post.forum, {
      'lastPost.author': req.user._id,
      'lastPost.date': new Date(),
    });

    const updatedPost = await DiscussionPost.findById(post._id)
      .populate('author', 'name email role avatar')
      .populate('replies.author', 'name email role avatar');

    res.json({
      success: true,
      message: 'Reply added successfully',
      post: updatedPost,
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ success: false, message: 'Server error adding reply' });
  }
});

// @route   POST /api/forums/posts/:postId/like
// @desc    Toggle like on a post
// @access  Private
router.post('/posts/:postId/like', protect, async (req, res) => {
  try {
    const post = await DiscussionPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const userId = req.user._id;
    const existingIndex = post.likes.findIndex(
      l => l.user.toString() === userId.toString()
    );

    if (existingIndex !== -1) {
      // Remove like
      post.likes.splice(existingIndex, 1);
      post.likeCount = Math.max(0, post.likeCount - 1);
    } else {
      // Add like
      post.likes.push({ user: userId, likedAt: new Date() });
      post.likeCount += 1;
    }

    await post.save();

    res.json({
      success: true,
      likes: post.likeCount,
      isLiked: existingIndex === -1,
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ success: false, message: 'Server error toggling like' });
  }
});

module.exports = router;
