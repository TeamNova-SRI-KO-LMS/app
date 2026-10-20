const express = require('express');
const router = express.Router();
const JoinUsSubmission = require('../models/JoinUsSubmission');
const { protect, authorize } = require('../middleware/auth');
const escapeRegex = require('../utils/escapeRegex');

// ─── Public: Submit a new Join-Us application ────────────────────────────────
// POST /api/join-us/submit
router.post('/submit', async (req, res) => {
  try {
    const {
      name, email, phone, age, currentLevel,
      preferredTime, interests, hearAboutUs, message,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    // Optional selects left blank arrive as "", which the schema's enums reject
    const submission = new JoinUsSubmission({
      name,
      email,
      phone,
      age: age ? Number(age) : undefined,
      currentLevel: currentLevel || undefined,
      preferredTime: preferredTime || undefined,
      interests: Array.isArray(interests) ? interests.filter(Boolean) : [],
      hearAboutUs: hearAboutUs || undefined,
      message,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    await submission.save();

    return res.status(201).json({
      success: true,
      message: 'Thank you for your interest! We will contact you soon.',
      data: { id: submission._id },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors)[0];
      return res.status(400).json({ success: false, message: firstError?.message || 'Please check the form and try again.' });
    }
    console.error('Join-Us submit error:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

// ─── Admin: Get all applications (with optional filters) ──────────────────────
// GET /api/join-us?status=pending&search=aruni&page=1&limit=20
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    const query = {};

    if (status && status !== 'ALL') {
      query.status = String(status).toLowerCase();
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await JoinUsSubmission.countDocuments(query);
    const submissions = await JoinUsSubmission.find(query)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    return res.json({
      success: true,
      data: submissions,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error('Join-Us list error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── Admin: Get recent applications (for dashboard widget) ─────────────────────
// GET /api/join-us/recent?limit=5
router.get('/recent', protect, authorize('admin'), async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 5, 20);
    const submissions = await JoinUsSubmission.find()
      .sort({ submittedAt: -1 })
      .limit(limit)
      .lean();

    // Stats
    const total = await JoinUsSubmission.countDocuments();
    const pending = await JoinUsSubmission.countDocuments({ status: 'pending' });

    return res.json({ success: true, data: submissions, total, pending });
  } catch (error) {
    console.error('Join-Us recent error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── Admin: Update application status ─────────────────────────────────────────
// PATCH /api/join-us/:id/status
router.patch('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['pending', 'contacted', 'enrolled', 'rejected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const submission = await JoinUsSubmission.findByIdAndUpdate(
      id,
      { status, contactedAt: status === 'contacted' ? new Date() : undefined },
      { new: true }
    );

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    return res.json({ success: true, data: submission });
  } catch (error) {
    console.error('Join-Us status update error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── Admin: Delete a submission ────────────────────────────────────────────────
// DELETE /api/join-us/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const submission = await JoinUsSubmission.findByIdAndDelete(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }
    return res.json({ success: true, message: 'Submission deleted.' });
  } catch (error) {
    console.error('Join-Us delete error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
