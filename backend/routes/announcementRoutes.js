const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get active announcements for users
// @route   GET /api/announcements
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    console.log('📢 Fetching announcements for user:', req.user.email, 'role:', req.user.role);
    const audience = req.user.role === 'admin' ? 'admins' :
                   req.user.role === 'instructor' ? 'instructors' : 'students';

    console.log('📢 Audience:', audience);
    const announcements = await Announcement.getActiveAnnouncements(audience, req.user._id);
    console.log('📢 Announcements found:', announcements.length);
    console.log('📢 Announcements:', announcements.map(a => ({ title: a.title, targetAudience: a.targetAudience, isActive: a.isActive })));

    res.json({
      success: true,
      announcements
    });
  } catch (error) {
    console.error('❌ Error fetching announcements:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get all announcements (admin only)
// @route   GET /api/announcements/all
// @access  Private/Admin
router.get('/all', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filters = {
      type: req.query.type,
      priority: req.query.priority,
      targetAudience: req.query.targetAudience,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      isPinned: req.query.isPinned !== undefined ? req.query.isPinned === 'true' : undefined,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };

    const result = await Announcement.getAllAnnouncements(page, limit, filters);

    res.json({
      success: true,
      announcements: result.announcements,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching all announcements:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get announcement statistics (admin only)
// @route   GET /api/announcements/stats
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const stats = await Announcement.getAnnouncementStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching announcement stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get announcement by ID
// @route   GET /api/announcements/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check if user has access to this announcement
    const audience = req.user.role === 'admin' ? 'admins' :
                    req.user.role === 'instructor' ? 'instructors' : 'students';

    if (announcement.targetAudience !== 'all' && announcement.targetAudience !== audience) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      announcement
    });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new announcement (admin only)
// @route   POST /api/announcements
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      title,
      content,
      type,
      priority,
      targetAudience,
      isActive,
      isPinned,
      startDate,
      endDate,
      tags
    } = req.body;

    // Validate required fields
    if (!title || !content || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and end date are required'
      });
    }

    // Validate end date
    const endDateObj = new Date(endDate);
    const startDateObj = startDate ? new Date(startDate) : new Date();

    if (endDateObj <= startDateObj) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Create announcement
    const announcement = new Announcement({
      title,
      content,
      type: type || 'general',
      priority: priority || 'medium',
      targetAudience: targetAudience || 'all',
      isActive: isActive !== undefined ? isActive : true,
      isPinned: isPinned || false,
      startDate: startDateObj,
      endDate: endDateObj,
      createdBy: req.user._id,
      tags: tags || []
    });

    await announcement.save();

    // Populate the announcement with creator info
    await announcement.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      announcement
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update announcement (admin only)
// @route   PUT /api/announcements/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    const {
      title,
      content,
      type,
      priority,
      targetAudience,
      isActive,
      isPinned,
      startDate,
      endDate,
      tags
    } = req.body;

    // Update fields
    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (type) announcement.type = type;
    if (priority) announcement.priority = priority;
    if (targetAudience) announcement.targetAudience = targetAudience;
    if (isActive !== undefined) announcement.isActive = isActive;
    if (isPinned !== undefined) announcement.isPinned = isPinned;
    if (startDate) announcement.startDate = new Date(startDate);
    if (endDate) announcement.endDate = new Date(endDate);
    if (tags) announcement.tags = tags;

    // Validate end date
    if (announcement.endDate <= announcement.startDate) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    await announcement.save();

    // Populate the announcement with creator info
    await announcement.populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      announcement
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete announcement (admin only)
// @route   DELETE /api/announcements/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    await Announcement.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Toggle announcement pin status (admin only)
// @route   PUT /api/announcements/:id/pin
// @access  Private/Admin
router.put('/:id/pin', protect, authorize('admin'), async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    announcement.isPinned = !announcement.isPinned;
    await announcement.save();

    res.json({
      success: true,
      message: `Announcement ${announcement.isPinned ? 'pinned' : 'unpinned'} successfully`,
      announcement
    });
  } catch (error) {
    console.error('Error toggling announcement pin:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Toggle announcement active status (admin only)
// @route   PUT /api/announcements/:id/toggle
// @access  Private/Admin
router.put('/:id/toggle', protect, authorize('admin'), async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    announcement.isActive = !announcement.isActive;
    await announcement.save();

    res.json({
      success: true,
      message: `Announcement ${announcement.isActive ? 'activated' : 'deactivated'} successfully`,
      announcement
    });
  } catch (error) {
    console.error('Error toggling announcement status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Mark announcement as read
// @route   POST /api/announcements/:id/read
// @access  Private
router.post('/:id/read', protect, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    await announcement.markAsRead(req.user._id);

    res.json({
      success: true,
      message: 'Announcement marked as read'
    });
  } catch (error) {
    console.error('Error marking announcement as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

