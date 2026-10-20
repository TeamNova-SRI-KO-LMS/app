const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get active events for users/students (public or authenticated)
// @route   GET /api/events
// @access  Public / User
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { isActive: true };

    // Filter by category if provided
    if (req.query.category && req.query.category !== 'all' && req.query.category !== 'ALL') {
      query.category = req.query.category.toLowerCase();
    }

    // Filter by status if provided
    if (req.query.status && req.query.status !== 'all' && req.query.status !== 'ALL') {
      query.status = req.query.status.toLowerCase();
    }

    // Search query in title, description, or location
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex }
      ];
    }

    // Optional filter: upcoming only (eventDate >= now)
    if (req.query.upcomingOnly === 'true') {
      query.eventDate = { $gte: new Date() };
    }

    const total = await Event.countDocuments(query);
    const events = await Event.find(query)
      .sort({ isPinned: -1, eventDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('organizer', 'name email role avatar')
      .populate('attendees', 'name email avatar');

    res.json({
      success: true,
      count: events.length,
      events,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit) || 1,
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching events'
    });
  }
});

// @desc    Get event statistics (admin only)
// @route   GET /api/events/stats
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const total = await Event.countDocuments();
    const upcoming = await Event.countDocuments({ status: 'upcoming' });
    const ongoing = await Event.countDocuments({ status: 'ongoing' });
    const completed = await Event.countDocuments({ status: 'completed' });
    const cancelled = await Event.countDocuments({ status: 'cancelled' });
    const active = await Event.countDocuments({ isActive: true });
    const pinned = await Event.countDocuments({ isPinned: true });

    res.json({
      success: true,
      stats: {
        total,
        upcoming,
        ongoing,
        completed,
        cancelled,
        active,
        pinned
      }
    });
  } catch (error) {
    console.error('Error fetching event stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching event stats'
    });
  }
});

// Handler for getting all events with admin filters
const handleGetAllAdminEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by category
    if (req.query.category && req.query.category !== 'all' && req.query.category !== 'ALL') {
      query.category = req.query.category.toLowerCase();
    }

    // Filter by status
    if (req.query.status && req.query.status !== 'all' && req.query.status !== 'ALL') {
      query.status = req.query.status.toLowerCase();
    }

    // Filter by active status
    if (req.query.isActive !== undefined && req.query.isActive !== '' && req.query.isActive !== 'all') {
      query.isActive = req.query.isActive === 'true' || req.query.isActive === true;
    }

    // Filter by pinned status
    if (req.query.isPinned !== undefined && req.query.isPinned !== '' && req.query.isPinned !== 'all') {
      query.isPinned = req.query.isPinned === 'true' || req.query.isPinned === true;
    }

    // Search filter
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex }
      ];
    }

    // Date range filter
    if (req.query.dateFrom || req.query.dateTo) {
      query.eventDate = {};
      if (req.query.dateFrom) query.eventDate.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) query.eventDate.$lte = new Date(req.query.dateTo);
    }

    const total = await Event.countDocuments(query);
    const events = await Event.find(query)
      .sort({ isPinned: -1, eventDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('organizer', 'name email role avatar')
      .populate('attendees', 'name email avatar');

    res.json({
      success: true,
      count: events.length,
      events,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit) || 1,
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching admin events:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching admin events'
    });
  }
};

// @desc    Get all events (admin only)
// @route   GET /api/events/all or GET /api/events/admin/all
// @access  Private/Admin
router.get('/all', protect, authorize('admin'), handleGetAllAdminEvents);
router.get('/admin/all', protect, authorize('admin'), handleGetAllAdminEvents);

// @desc    Get event by ID
// @route   GET /api/events/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email role avatar')
      .populate('attendees', 'name email avatar');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      event
    });
  } catch (error) {
    console.error('Error fetching event by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching event'
    });
  }
});

// @desc    Create new event (admin only)
// @route   POST /api/events
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      title,
      description,
      eventDate,
      endDate,
      duration,
      location,
      meetingLink,
      category,
      status,
      capacity,
      photos,
      coverImage,
      isActive,
      isPinned,
      tags,
      relatedCourse
    } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an event title'
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an event description'
      });
    }

    if (!eventDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an event date and time'
      });
    }

    // Format tags if array or comma-separated string
    let parsedTags = [];
    if (Array.isArray(tags)) {
      parsedTags = tags.map(t => String(t).trim()).filter(Boolean);
    } else if (typeof tags === 'string' && tags.trim()) {
      parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    // Process photos array
    let parsedPhotos = [];
    if (Array.isArray(photos)) {
      parsedPhotos = photos.map(p => String(p).trim()).filter(Boolean);
    } else if (typeof photos === 'string' && photos.trim()) {
      parsedPhotos = [photos.trim()];
    }

    const firstPhoto = parsedPhotos.length > 0 ? parsedPhotos[0] : null;
    const finalCoverImage = coverImage || firstPhoto || null;

    const newEvent = new Event({
      title: title.trim(),
      description: description.trim(),
      eventDate: new Date(eventDate),
      endDate: endDate ? new Date(endDate) : undefined,
      duration: duration ? Number(duration) : 60,
      location: location ? location.trim() : 'Online',
      meetingLink: meetingLink ? meetingLink.trim() : '',
      category: (category || 'seminar').toLowerCase().trim(),
      status: (status || 'upcoming').toLowerCase().trim(),
      capacity: capacity ? Number(capacity) : 0,
      photos: parsedPhotos,
      coverImage: finalCoverImage,
      isActive: isActive !== undefined ? isActive : true,
      isPinned: isPinned !== undefined ? isPinned : false,
      tags: parsedTags,
      relatedCourse: relatedCourse || undefined,
      organizer: req.user._id
    });

    const savedEvent = await newEvent.save();
    await savedEvent.populate('organizer', 'name email role avatar');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event: savedEvent
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating event'
    });
  }
});

// @desc    Update event (admin only)
// @route   PUT /api/events/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const {
      title,
      description,
      eventDate,
      endDate,
      duration,
      location,
      meetingLink,
      category,
      status,
      capacity,
      photos,
      coverImage,
      isActive,
      isPinned,
      tags,
      relatedCourse
    } = req.body;

    if (title !== undefined) event.title = title.trim();
    if (description !== undefined) event.description = description.trim();
    if (eventDate !== undefined) event.eventDate = new Date(eventDate);
    if (endDate !== undefined) event.endDate = endDate ? new Date(endDate) : null;
    if (duration !== undefined) event.duration = Number(duration) || 60;
    if (location !== undefined) event.location = location.trim();
    if (meetingLink !== undefined) event.meetingLink = meetingLink.trim();
    if (category !== undefined) event.category = category.toLowerCase().trim();
    if (status !== undefined) event.status = status.toLowerCase().trim();
    if (capacity !== undefined) event.capacity = Number(capacity) || 0;
    if (isActive !== undefined) event.isActive = isActive;
    if (isPinned !== undefined) event.isPinned = isPinned;
    if (relatedCourse !== undefined) event.relatedCourse = relatedCourse || null;

    if (photos !== undefined) {
      if (Array.isArray(photos)) {
        event.photos = photos.map(p => String(p).trim()).filter(Boolean);
      } else if (typeof photos === 'string') {
        event.photos = photos.trim() ? [photos.trim()] : [];
      }
    }

    if (coverImage !== undefined) {
      event.coverImage = coverImage || (event.photos.length > 0 ? event.photos[0] : null);
    } else if (!event.coverImage && event.photos.length > 0) {
      event.coverImage = event.photos[0];
    }

    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        event.tags = tags.map(t => String(t).trim()).filter(Boolean);
      } else if (typeof tags === 'string') {
        event.tags = tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    const updatedEvent = await event.save();
    await updatedEvent.populate('organizer', 'name email role avatar');
    await updatedEvent.populate('attendees', 'name email avatar');

    res.json({
      success: true,
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating event'
    });
  }
});

// @desc    Delete event (admin only)
// @route   DELETE /api/events/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting event'
    });
  }
});

// @desc    Toggle event pin status (admin only)
// @route   PUT /api/events/:id/pin or PATCH /api/events/:id/pin
// @access  Private/Admin
const handleTogglePin = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    event.isPinned = !event.isPinned;
    await event.save();
    await event.populate('organizer', 'name email role avatar');

    res.json({
      success: true,
      message: `Event ${event.isPinned ? 'pinned' : 'unpinned'} successfully`,
      isPinned: event.isPinned,
      event
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

// @desc    Toggle event active status (admin only)
// @route   PUT /api/events/:id/active or PATCH /api/events/:id/active
// @access  Private/Admin
const handleToggleActive = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    event.isActive = !event.isActive;
    await event.save();
    await event.populate('organizer', 'name email role avatar');

    res.json({
      success: true,
      message: `Event marked as ${event.isActive ? 'active' : 'inactive'}`,
      isActive: event.isActive,
      event
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

// @desc    Register attendance / RSVP for an event
// @route   POST /api/events/:id/attend
// @access  Private (Authenticated User)
router.post('/:id/attend', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (!event.isActive || event.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This event is not open for registration'
      });
    }

    if (event.capacity > 0 && event.attendees.length >= event.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Event capacity is full'
      });
    }

    const alreadyAttending = event.attendees.some(
      a => a.toString() === req.user._id.toString()
    );

    if (alreadyAttending) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    event.attendees.push(req.user._id);
    await event.save();

    res.json({
      success: true,
      message: 'Successfully registered for event',
      attendeesCount: event.attendees.length
    });
  } catch (error) {
    console.error('Error registering event attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error registering attendance'
    });
  }
});

// @desc    Cancel event RSVP
// @route   DELETE /api/events/:id/attend
// @access  Private (Authenticated User)
router.delete('/:id/attend', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    event.attendees = event.attendees.filter(
      a => a.toString() !== req.user._id.toString()
    );
    await event.save();

    res.json({
      success: true,
      message: 'Registration cancelled',
      attendeesCount: event.attendees.length
    });
  } catch (error) {
    console.error('Error cancelling event attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling attendance'
    });
  }
});

module.exports = router;
