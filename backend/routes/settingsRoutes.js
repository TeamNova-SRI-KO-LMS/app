const express = require('express');
const Settings = require('../models/Settings');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all settings
// @route   GET /api/admin/settings
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    let settings = await Settings.findOne();

    // If no settings exist, create default settings
    if (!settings) {
      settings = await Settings.create({});
    }

    res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Update settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
router.put('/', protect, authorize('admin'), async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      lastUpdatedBy: req.user.id,
    };

    let settings = await Settings.findOne();

    if (!settings) {
      // Create new settings if none exist
      settings = await Settings.create(updateData);
    } else {
      // Update existing settings
      settings = await Settings.findOneAndUpdate(
        {},
        updateData,
        { new: true, runValidators: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Reset settings to default
// @route   POST /api/admin/settings/reset
// @access  Private/Admin
router.post('/reset', protect, authorize('admin'), async (req, res) => {
  try {
    await Settings.deleteMany({});
    const defaultSettings = await Settings.create({
      lastUpdatedBy: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: 'Settings reset to default successfully',
      settings: defaultSettings,
    });
  } catch (error) {
    console.error('Reset settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get specific settings section
// @route   GET /api/admin/settings/:section
// @access  Private/Admin
router.get('/:section', protect, authorize('admin'), async (req, res) => {
  try {
    const { section } = req.params;
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    const sectionData = settings[section];

    if (!sectionData) {
      return res.status(404).json({
        success: false,
        message: 'Settings section not found',
      });
    }

    res.status(200).json({
      success: true,
      section,
      data: sectionData,
    });
  } catch (error) {
    console.error('Get settings section error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Update specific settings section
// @route   PUT /api/admin/settings/:section
// @access  Private/Admin
router.put('/:section', protect, authorize('admin'), async (req, res) => {
  try {
    const { section } = req.params;
    const updateData = req.body;

    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    // Update the specific section
    settings[section] = { ...settings[section], ...updateData };
    settings.lastUpdatedBy = req.user.id;

    await settings.save();

    res.status(200).json({
      success: true,
      message: `${section} settings updated successfully`,
      settings,
    });
  } catch (error) {
    console.error('Update settings section error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Export settings
// @route   GET /api/admin/settings/export
// @access  Private/Admin
router.get('/export/json', protect, authorize('admin'), async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    res.status(200).json({
      success: true,
      settings,
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Export settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Import settings
// @route   POST /api/admin/settings/import
// @access  Private/Admin
router.post('/import', protect, authorize('admin'), async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'Settings data is required',
      });
    }

    // Delete existing settings
    await Settings.deleteMany({});

    // Create new settings with imported data
    const newSettings = await Settings.create({
      ...settings,
      lastUpdatedBy: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: 'Settings imported successfully',
      settings: newSettings,
    });
  } catch (error) {
    console.error('Import settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;

