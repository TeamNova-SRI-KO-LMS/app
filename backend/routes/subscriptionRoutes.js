const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const Subscription = require('../models/Subscription');

const router = express.Router();

// @desc    Get all subscription plans
// @route   GET /api/subscriptions/plans
// @access  Public
router.get('/plans', async (req, res) => {
  res.json({
    success: true,
    plans: [
      { name: 'starter', price: 0 },
      { name: 'pro', price: 10 },
      { name: 'premium', price: 20 },
    ],
  });
});

// @desc    Get current subscription
// @route   GET /api/subscriptions/current
// @access  Private
router.get('/current', protect, async (req, res) => {
  const subscription = await Subscription.findOne({
    user: req.user.id,
    status: { $in: ['active', 'trial'] },
  });

  res.json({ success: true, subscription });
});

// @desc    Create subscription (no payment yet)
// @route   POST /api/subscriptions/create
// @access  Private
router.post(
  '/create',
  protect,
  [
    body('plan').isIn(['starter', 'pro', 'premium']),
    body('billingCycle').isIn(['monthly', 'yearly']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { plan, billingCycle } = req.body;

    const existing = await Subscription.findOne({
      user: req.user.id,
      status: { $in: ['active', 'trial'] },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Already has active subscription',
      });
    }

    const subscription = await Subscription.create({
      user: req.user.id,
      plan,
      billingCycle,
      status: plan === 'starter' ? 'active' : 'trial',
      startDate: new Date(),
      endDate:
        plan === 'starter'
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });

    res.status(201).json({
      success: true,
      subscription,
    });
  }
);

// @desc    Upgrade subscription
// @route   PUT /api/subscriptions/upgrade
// @access  Private
router.put('/upgrade', protect, async (req, res) => {
  const { plan, billingCycle } = req.body;

  const subscription = await Subscription.findOne({
    user: req.user.id,
    status: { $in: ['active', 'trial'] },
  });

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: 'No subscription found',
    });
  }

  subscription.plan = plan;
  subscription.billingCycle = billingCycle;
  subscription.status = 'active';

  await subscription.save();

  res.json({
    success: true,
    subscription,
  });
});

// @desc    Cancel subscription
// @route   PUT /api/subscriptions/cancel
// @access  Private
router.put('/cancel', protect, async (req, res) => {
  const subscription = await Subscription.findOne({
    user: req.user.id,
    status: { $in: ['active', 'trial'] },
  });

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: 'No subscription found',
    });
  }

  subscription.status = 'cancelled';

  await subscription.save();

  res.json({
    success: true,
    message: 'Subscription cancelled',
  });
});

module.exports = router;