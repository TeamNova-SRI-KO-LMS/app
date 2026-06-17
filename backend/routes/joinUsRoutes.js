const express = require('express');
const router = express.Router();
const JoinUsSubmission = require('../models/JoinUsSubmission');
const { protect } = require('../middleware/auth');
const { validateJoinUsSubmission } = require('../middleware/validation');

// @route   POST /api/join-us/submit
// @desc    Submit Join Us form
// @access  Public
router.post('/submit', validateJoinUsSubmission, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      age,
      currentLevel,
      preferredTime,
      interests,
      hearAboutUs,
      message
    } = req.body;

    // Check if email already exists
    const existingSubmission = await JoinUsSubmission.findOne({ email });
    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'A submission with this email already exists. Please use a different email or contact us directly.'
      });
    }

    // Create new submission
    const submission = new JoinUsSubmission({
      name,
      email,
      phone,
      age: age ? parseInt(age) : undefined,
      currentLevel,
      preferredTime,
      interests: interests || [],
      hearAboutUs,
      message,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    await submission.save();

    console.log('✅ Join Us form submitted:', {
      name: submission.name,
      email: submission.email,
      currentLevel: submission.currentLevel,
      interests: submission.interests.length
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your interest! We will contact you soon.',
      submissionId: submission._id
    });

  } catch (error) {
    console.error('❌ Join Us submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.'
    });
  }
});

// @route   GET /api/join-us/submissions
// @desc    Get all Join Us submissions (Admin only)
// @access  Private (Admin)
router.get('/submissions', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { status, page = 1, limit = 10, sortBy = 'submittedAt', sortOrder = 'desc' } = req.query;

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const submissions = await JoinUsSubmission.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('contactedBy', 'name email')
      .select('-ipAddress -userAgent'); // Exclude sensitive data

    const total = await JoinUsSubmission.countDocuments(query);

    res.json({
      success: true,
      data: submissions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('❌ Get submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve submissions'
    });
  }
});

// @route   GET /api/join-us/submissions/:id
// @desc    Get single Join Us submission (Admin only)
// @access  Private (Admin)
router.get('/submissions/:id', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const submission = await JoinUsSubmission.findById(req.params.id)
      .populate('contactedBy', 'name email');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    res.json({
      success: true,
      data: submission
    });

  } catch (error) {
    console.error('❌ Get submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve submission'
    });
  }
});

// @route   PUT /api/join-us/submissions/:id/status
// @desc    Update submission status (Admin only)
// @access  Private (Admin)
router.put('/submissions/:id/status', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { status, notes } = req.body;

    if (!status || !['pending', 'contacted', 'enrolled', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: pending, contacted, enrolled, rejected'
      });
    }

    const submission = await JoinUsSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    await submission.updateStatus(status, notes, req.user._id);

    res.json({
      success: true,
      message: 'Submission status updated successfully',
      data: submission
    });

  } catch (error) {
    console.error('❌ Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update submission status'
    });
  }
});

// @route   GET /api/join-us/stats
// @desc    Get Join Us submission statistics (Admin only)
// @access  Private (Admin)
router.get('/stats', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const stats = await JoinUsSubmission.getStats();
    const totalSubmissions = await JoinUsSubmission.countDocuments();
    const recentSubmissions = await JoinUsSubmission.getRecent(5);

    // Format stats
    const formattedStats = {
      total: totalSubmissions,
      byStatus: {},
      recent: recentSubmissions
    };

    stats.forEach(stat => {
      formattedStats.byStatus[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: formattedStats
    });

  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics'
    });
  }
});

// @route   DELETE /api/join-us/submissions/:id
// @desc    Delete Join Us submission (Admin only)
// @access  Private (Admin)
router.delete('/submissions/:id', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const submission = await JoinUsSubmission.findByIdAndDelete(req.params.id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    res.json({
      success: true,
      message: 'Submission deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete submission'
    });
  }
});

module.exports = router;
