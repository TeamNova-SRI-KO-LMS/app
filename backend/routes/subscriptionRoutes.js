const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');

const router = express.Router();

// @route   GET /api/subscriptions/plans
// @desc    Get available subscription plans
// @access  Public
router.get('/plans', async (req, res) => {
  try {
    const plans = [
      {
        name: 'starter',
        displayName: 'Starter',
        description: 'Perfect for individual learners and small institutions',
        features: Subscription.getPlanFeatures('starter'),
        pricing: {
          monthly: Subscription.getPlanPricing('starter', 'monthly'),
          yearly: Subscription.getPlanPricing('starter', 'yearly'),
        },
      },
      {
        name: 'pro',
        displayName: 'Pro',
        description: 'Ideal for growing institutions and training centers',
        features: Subscription.getPlanFeatures('pro'),
        pricing: {
          monthly: Subscription.getPlanPricing('pro', 'monthly'),
          yearly: Subscription.getPlanPricing('pro', 'yearly'),
        },
      },
      {
        name: 'premium',
        displayName: 'Premium',
        description: 'Complete solution for large institutions and enterprises',
        features: Subscription.getPlanFeatures('premium'),
        pricing: {
          monthly: Subscription.getPlanPricing('premium', 'monthly'),
          yearly: Subscription.getPlanPricing('premium', 'yearly'),
        },
      },
    ];

    res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/subscriptions/current
// @desc    Get current user's subscription
// @access  Private
router.get('/current', protect, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      user: req.user.id,
      status: { $in: ['active', 'trial'] },
    }).populate('user', 'name email');

    if (!subscription) {
      return res.json({
        success: true,
        subscription: null,
        message: 'No active subscription found',
      });
    }

    res.json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   POST /api/subscriptions/create
// @desc    Create a new subscription
// @access  Private
router.post(
  '/create',
  [
    protect,
    body('plan')
      .isIn(['starter', 'pro', 'premium'])
      .withMessage('Invalid plan selected'),
    body('billingCycle')
      .isIn(['monthly', 'yearly'])
      .withMessage('Invalid billing cycle'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array(),
        });
      }

      const { plan, billingCycle } = req.body;

      // Check if user already has an active subscription
      const existingSubscription = await Subscription.findOne({
        user: req.user.id,
        status: { $in: ['active', 'trial'] },
      });

      if (existingSubscription) {
        return res.status(400).json({
          success: false,
          message: 'User already has an active subscription',
        });
      }

      // Get plan features and pricing
      const features = Subscription.getPlanFeatures(plan);
      const amount = Subscription.getPlanPricing(plan, billingCycle);

      // Calculate dates
      const startDate = new Date();
      let endDate;
      let trialEndDate;

      if (plan === 'starter') {
        // Starter plan is free, no trial needed
        endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
      } else {
        // Pro and Premium plans have 14-day trial
        trialEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        endDate = trialEndDate;
      }

      // Create subscription
      const subscription = new Subscription({
        user: req.user.id,
        plan,
        billingCycle,
        status: plan === 'starter' ? 'active' : 'trial',
        startDate,
        endDate,
        trialEndDate,
        amount,
        features,
        autoRenew: plan !== 'starter',
      });

      await subscription.save();

      // If it's a paid plan, create a pending payment record
      if (amount > 0) {
        const payment = new Payment({
          user: req.user.id,
          subscription: subscription._id,
          amount,
          paymentMethod: 'credit_card', // Default, will be updated during payment
          billingPeriod: {
            startDate: trialEndDate,
            endDate: billingCycle === 'monthly'
              ? new Date(trialEndDate.getTime() + 30 * 24 * 60 * 60 * 1000)
              : new Date(trialEndDate.getTime() + 365 * 24 * 60 * 60 * 1000),
          },
          plan,
          billingCycle,
          dueDate: trialEndDate,
        });

        await payment.save();
      }

      await subscription.populate('user', 'name email');

      res.status(201).json({
        success: true,
        subscription,
        message: plan === 'starter'
          ? 'Starter plan activated successfully'
          : 'Trial started successfully',
      });
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  }
);

// @route   PUT /api/subscriptions/upgrade
// @desc    Upgrade subscription plan
// @access  Private
router.put(
  '/upgrade',
  [
    protect,
    body('plan')
      .isIn(['pro', 'premium'])
      .withMessage('Invalid plan selected'),
    body('billingCycle')
      .isIn(['monthly', 'yearly'])
      .withMessage('Invalid billing cycle'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array(),
        });
      }

      const { plan, billingCycle } = req.body;

      // Find current subscription
      const currentSubscription = await Subscription.findOne({
        user: req.user.id,
        status: { $in: ['active', 'trial'] },
      });

      if (!currentSubscription) {
        return res.status(404).json({
          success: false,
          message: 'No active subscription found',
        });
      }

      // Check if it's actually an upgrade
      const planHierarchy = { starter: 1, pro: 2, premium: 3 };
      if (planHierarchy[plan] <= planHierarchy[currentSubscription.plan]) {
        return res.status(400).json({
          success: false,
          message: 'This is not an upgrade from your current plan',
        });
      }

      // Get new plan features and pricing
      const newFeatures = Subscription.getPlanFeatures(plan);
      const newAmount = Subscription.getPlanPricing(plan, billingCycle);

      // Update subscription
      currentSubscription.plan = plan;
      currentSubscription.billingCycle = billingCycle;
      currentSubscription.features = newFeatures;
      currentSubscription.amount = newAmount;
      currentSubscription.status = 'active';
      currentSubscription.autoRenew = true;

      // Calculate new end date
      const now = new Date();
      if (billingCycle === 'monthly') {
        currentSubscription.endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      } else {
        currentSubscription.endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      }
      currentSubscription.nextBillingDate = currentSubscription.endDate;

      await currentSubscription.save();

      // Create payment record for the upgrade
      const payment = new Payment({
        user: req.user.id,
        subscription: currentSubscription._id,
        amount: newAmount,
        paymentMethod: 'credit_card',
        billingPeriod: {
          startDate: now,
          endDate: currentSubscription.endDate,
        },
        plan,
        billingCycle,
        dueDate: now,
        status: 'pending',
      });

      await payment.save();

      await currentSubscription.populate('user', 'name email');

      res.json({
        success: true,
        subscription: currentSubscription,
        payment,
        message: 'Subscription upgraded successfully',
      });
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  }
);

// @route   PUT /api/subscriptions/cancel
// @desc    Cancel subscription
// @access  Private
router.put(
  '/cancel',
  [
    protect,
    body('reason').optional().isString().withMessage('Reason must be a string'),
  ],
  async (req, res) => {
    try {
      const { reason } = req.body;

      const subscription = await Subscription.findOne({
        user: req.user.id,
        status: { $in: ['active', 'trial'] },
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'No active subscription found',
        });
      }

      await subscription.cancel(reason);

      res.json({
        success: true,
        message: 'Subscription cancelled successfully',
      });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  }
);

// @route   GET /api/subscriptions/usage
// @desc    Get subscription usage statistics
// @access  Private
router.get('/usage', protect, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      user: req.user.id,
      status: { $in: ['active', 'trial'] },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found',
      });
    }

    const usage = {
      courses: {
        used: subscription.usage.coursesCreated,
        limit: subscription.features.maxCourses,
        unlimited: subscription.features.maxCourses === -1,
      },
      students: {
        used: subscription.usage.studentsEnrolled,
        limit: subscription.features.maxStudents,
        unlimited: subscription.features.maxStudents === -1,
      },
      apiCalls: {
        used: subscription.usage.apiCalls,
        limit: subscription.plan === 'premium' ? -1 : 1000, // Premium has unlimited API calls
        unlimited: subscription.plan === 'premium',
      },
    };

    res.json({
      success: true,
      usage,
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        endDate: subscription.endDate,
      },
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/subscriptions/payments
// @desc    Get user's payment history
// @access  Private
router.get('/payments', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const payments = await Payment.find({ user: req.user.id })
      .populate('subscription', 'plan billingCycle')
      .sort({ paymentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      payments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/subscriptions/invoice/:id
// @desc    Get payment invoice
// @access  Private
router.get('/invoice/:id', protect, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate('user', 'name email').populate('subscription', 'plan billingCycle');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    res.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
