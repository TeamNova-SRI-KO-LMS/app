const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get active announcements for users/students (public or authenticated)
// @route   GET /api/announcements
// @access  Public / User
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { isActive: true };

    // Filter by type if provided
    if (req.query.type && req.query.type !== 'all' && req.query.type !== 'ALL') {
      query.type = req.query.type.toLowerCase();
    }

    // Filter by audience if provided
    if (req.query.audience && req.query.audience !== 'all' && req.query.audience !== 'ALL') {
      query.$or = [
        { targetAudience: 'all' },
        { targetAudience: new RegExp(req.query.audience, 'i') }
      ];
    }

    // Search query in title or content
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { title: searchRegex },
        { content: searchRegex }
      ];
    }

    // Optional date filter: exclude announcements whose endDate is in the past
    if (req.query.currentOnly === 'true') {
      const now = new Date();
      query.$and = [
        { $or: [{ startDate: { $exists: false } }, { startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: now } }] }
      ];
    }

    const total = await Announcement.countDocuments(query);
    const announcements = await Announcement.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email role avatar');

    res.json({
      success: true,
      count: announcements.length,
      announcements,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit) || 1,
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching announcements'
    });
  }
});

// @desc    Get announcement statistics (admin only)
// @route   GET /api/announcements/stats
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const total = await Announcement.countDocuments();
    const active = await Announcement.countDocuments({ isActive: true });
    const inactive = await Announcement.countDocuments({ isActive: false });
    const pinned = await Announcement.countDocuments({ isPinned: true });

    res.json({
      success: true,
      stats: {
        total,
        active,
        inactive,
        pinned
      }
    });
  } catch (error) {
    console.error('Error fetching announcement stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching announcement statistics'
    });
  }
});

// Handler for admin fetching all announcements with advanced filters and pagination
const handleGetAllAdminAnnouncements = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    // Filters
    if (req.query.type && req.query.type !== 'all' && req.query.type !== 'ALL') {
      query.type = req.query.type.toLowerCase();
    }

    if (req.query.priority && req.query.priority !== 'all' && req.query.priority !== 'ALL') {
      query.priority = req.query.priority.toLowerCase();
    }

    if (req.query.targetAudience && req.query.targetAudience !== 'all' && req.query.targetAudience !== 'ALL') {
      query.targetAudience = new RegExp(req.query.targetAudience, 'i');
    }

    if (req.query.isActive !== undefined && req.query.isActive !== '') {
      query.isActive = req.query.isActive === 'true' || req.query.isActive === true;
    }

    if (req.query.isPinned !== undefined && req.query.isPinned !== '') {
      query.isPinned = req.query.isPinned === 'true' || req.query.isPinned === true;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { title: searchRegex },
        { content: searchRegex }
      ];
    }

    if (req.query.dateFrom || req.query.dateTo) {
      query.createdAt = {};
      if (req.query.dateFrom) {
        query.createdAt.$gte = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        const toDate = new Date(req.query.dateTo);
        toDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDate;
      }
    }

    const total = await Announcement.countDocuments(query);
    const announcements = await Announcement.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email role avatar');

    res.json({
      success: true,
      announcements,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit) || 1,
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching admin announcements:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching announcements'
    });
  }
};

// @desc    Get all announcements (admin only)
// @route   GET /api/announcements/all or GET /api/announcements/admin/all
// @access  Private/Admin
router.get('/all', protect, authorize('admin'), handleGetAllAdminAnnouncements);
router.get('/admin/all', protect, authorize('admin'), handleGetAllAdminAnnouncements);

// @desc    Get announcement by ID
// @route   GET /api/announcements/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('createdBy', 'name email role avatar');

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.json({
      success: true,
      announcement
    });
  } catch (error) {
    console.error('Error fetching announcement by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching announcement'
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
      tags,
      attachments
    } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an announcement title'
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide announcement content'
      });
    }

    // Format fields
    const parsedStartDate = startDate ? new Date(startDate) : new Date();
    const parsedEndDate = endDate ? new Date(endDate) : undefined;

    // Format tags if array or comma-separated string
    let parsedTags = [];
    if (Array.isArray(tags)) {
      parsedTags = tags.map(t => String(t).trim()).filter(Boolean);
    } else if (typeof tags === 'string' && tags.trim()) {
      parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    const newAnnouncement = new Announcement({
      title: title.trim(),
      content: content.trim(),
      type: (type || 'general').toLowerCase().trim(),
      priority: (priority || 'medium').toLowerCase().trim(),
      targetAudience: (targetAudience || 'all').trim(),
      isActive: isActive !== undefined ? isActive : true,
      isPinned: isPinned !== undefined ? isPinned : false,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      tags: parsedTags,
      attachments: Array.isArray(attachments) ? attachments : [],
      createdBy: req.user._id
    });

    const savedAnnouncement = await newAnnouncement.save();
    await savedAnnouncement.populate('createdBy', 'name email role avatar');

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      announcement: savedAnnouncement
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating announcement'
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
      tags,
      attachments
    } = req.body;

    if (title !== undefined) announcement.title = title.trim();
    if (content !== undefined) announcement.content = content.trim();
    if (type !== undefined) announcement.type = type.toLowerCase().trim();
    if (priority !== undefined) announcement.priority = priority.toLowerCase().trim();
    if (targetAudience !== undefined) announcement.targetAudience = targetAudience.trim();
    if (isActive !== undefined) announcement.isActive = isActive;
    if (isPinned !== undefined) announcement.isPinned = isPinned;
    if (startDate !== undefined) announcement.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) announcement.endDate = endDate ? new Date(endDate) : null;

    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        announcement.tags = tags.map(t => String(t).trim()).filter(Boolean);
      } else if (typeof tags === 'string') {
        announcement.tags = tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    if (attachments !== undefined && Array.isArray(attachments)) {
      announcement.attachments = attachments;
    }

    const updatedAnnouncement = await announcement.save();
    await updatedAnnouncement.populate('createdBy', 'name email role avatar');

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      announcement: updatedAnnouncement
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating announcement'
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
      message: 'Server error deleting announcement'
    });
  }
});

// @desc    Toggle announcement pin status (admin only)
// @route   PUT /api/announcements/:id/pin or PATCH /api/announcements/:id/pin
// @access  Private/Admin
const handleTogglePin = async (req, res) => {
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
    await announcement.populate('createdBy', 'name email role avatar');

    res.json({
      success: true,
      message: `Announcement ${announcement.isPinned ? 'pinned' : 'unpinned'} successfully`,
      isPinned: announcement.isPinned,
      announcement
    });
  } catch (error) {
    console.error('Error toggling pin status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error toggling pin status'
    });
  }
};
router.put('/:id/pin', protect, authorize('admin'), handleTogglePin);
router.patch('/:id/pin', protect, authorize('admin'), handleTogglePin);

// @desc    Toggle announcement active status (admin only)
// @route   PUT /api/announcements/:id/active or PATCH /api/announcements/:id/active
// @access  Private/Admin
const handleToggleActive = async (req, res) => {
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
    await announcement.populate('createdBy', 'name email role avatar');

    res.json({
      success: true,
      message: `Announcement status changed to ${announcement.isActive ? 'Active' : 'Inactive'}`,
      isActive: announcement.isActive,
      announcement
    });
  } catch (error) {
    console.error('Error toggling active status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error toggling active status'
    });
  }
};
router.put('/:id/active', protect, authorize('admin'), handleToggleActive);
router.patch('/:id/active', protect, authorize('admin'), handleToggleActive);

// @desc    Mark announcement as read by user
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

    const alreadyRead = announcement.readBy.some(
      (entry) => entry.user && entry.user.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      announcement.readBy.push({
        user: req.user._id,
        readAt: new Date()
      });
      await announcement.save();
    }

    res.json({
      success: true,
      message: 'Announcement marked as read'
    });
  } catch (error) {
    console.error('Error marking announcement as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error marking announcement as read'
    });
  }
});

module.exports = router;
