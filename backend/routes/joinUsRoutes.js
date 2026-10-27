const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const JoinUsSubmission = require('../models/JoinUsSubmission');
const { protect, authorize } = require('../middleware/auth');
const escapeRegex = require('../utils/escapeRegex');

// ─── Public: Submit a new Join-Us application ────────────────────────────────
// POST /api/join-us/submit
router.post('/submit', async (req, res) => {
  try {
    const {
      name, email, phone, subject, category, age, currentLevel,
      preferredTime, interests, hearAboutUs, message,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    const submission = new JoinUsSubmission({
      name,
      email,
      phone,
      subject: subject || undefined,
      category: category || undefined,
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
      message: 'Thank you for reaching out! We will get back to you shortly.',
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
      const s = String(status).toLowerCase().replace(/\s+/g, '_');
      if (s === 'new' || s === 'pending') {
        query.status = { $in: ['new', 'pending'] };
      } else if (s === 'in_progress' || s === 'contacted') {
        query.status = { $in: ['in_progress', 'contacted'] };
      } else if (s === 'resolved' || s === 'enrolled' || s === 'rejected') {
        query.status = { $in: ['resolved', 'enrolled', 'rejected'] };
      } else {
        query.status = s;
      }
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

    const newCount = await JoinUsSubmission.countDocuments({ status: { $in: ['new', 'pending'] } });
    const inProgressCount = await JoinUsSubmission.countDocuments({ status: { $in: ['in_progress', 'contacted'] } });
    const resolvedCount = await JoinUsSubmission.countDocuments({ status: { $in: ['resolved', 'enrolled', 'rejected'] } });

    const counts = {
      total: await JoinUsSubmission.countDocuments(),
      new: newCount,
      in_progress: inProgressCount,
      resolved: resolvedCount,
    };

    const normalizedSubmissions = submissions.map((sub) => {
      let st = sub.status;
      if (st === 'pending') st = 'new';
      else if (st === 'contacted') st = 'in_progress';
      else if (st === 'enrolled' || st === 'rejected') st = 'resolved';
      return { ...sub, status: st || 'new' };
    });

    return res.json({
      success: true,
      data: normalizedSubmissions,
      total,
      counts,
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

    const normalizedSubmissions = submissions.map((sub) => {
      let st = sub.status;
      if (st === 'pending') st = 'new';
      else if (st === 'contacted') st = 'in_progress';
      else if (st === 'enrolled' || st === 'rejected') st = 'resolved';
      return { ...sub, status: st || 'new' };
    });

    // Stats
    const total = await JoinUsSubmission.countDocuments();
    const newCount = await JoinUsSubmission.countDocuments({ status: { $in: ['new', 'pending'] } });
    const inProgressCount = await JoinUsSubmission.countDocuments({ status: { $in: ['in_progress', 'contacted'] } });
    const resolvedCount = await JoinUsSubmission.countDocuments({ status: { $in: ['resolved', 'enrolled', 'rejected'] } });

    return res.json({
      success: true,
      data: normalizedSubmissions,
      total,
      new: newCount,
      in_progress: inProgressCount,
      resolved: resolvedCount,
    });
  } catch (error) {
    console.error('Join-Us recent error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── Admin: Get single application by ID ───────────────────────────────────────
// GET /api/join-us/:id
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }
    const submission = await JoinUsSubmission.findById(req.params.id).lean();
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }
    let st = submission.status;
    if (st === 'pending') st = 'new';
    else if (st === 'contacted') st = 'in_progress';
    else if (st === 'enrolled' || st === 'rejected') st = 'resolved';
    return res.json({ success: true, data: { ...submission, status: st || 'new' } });
  } catch (error) {
    console.error('Join-Us get error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── Admin: Update application status and notes ────────────────────────────────
// Supports PATCH/PUT /api/join-us/:id/status and /api/join-us/submissions/:id/status
const handleStatusUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    let targetStatus = status;
    if (status === 'pending') targetStatus = 'new';
    else if (status === 'contacted') targetStatus = 'in_progress';
    else if (status === 'enrolled' || status === 'rejected') targetStatus = 'resolved';

    const allowed = ['new', 'in_progress', 'resolved'];
    if (targetStatus && !allowed.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status value '${status}'. Allowed values: new, in_progress, resolved`,
      });
    }

    const updateData = {};
    if (targetStatus) {
      updateData.status = targetStatus;
      if (targetStatus === 'in_progress' || targetStatus === 'resolved') {
        updateData.contactedAt = new Date();
      }
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const submission = await JoinUsSubmission.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Application submission not found.' });
    }

    return res.json({ success: true, data: submission });
  } catch (error) {
    console.error('Join-Us status update error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating application.' });
  }
};

router.patch('/:id/status', protect, authorize('admin'), handleStatusUpdate);
router.put('/:id/status', protect, authorize('admin'), handleStatusUpdate);
router.patch('/submissions/:id/status', protect, authorize('admin'), handleStatusUpdate);
router.put('/submissions/:id/status', protect, authorize('admin'), handleStatusUpdate);

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
