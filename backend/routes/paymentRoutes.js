const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');

const router = express.Router();

// @route   POST /api/payments/create
// @desc    Create a new payment
// @access  Private
router.post(
  '/create',
  [
    protect,
    body('subscriptionId')
      .isMongoId()
      .withMessage('Invalid subscription ID'),
    body('paymentMethod')
      .isIn(['credit_card', 'bank_transfer', 'digital_wallet', 'cash', 'cheque'])
      .withMessage('Invalid payment method'),
    body('amount')
      .isNumeric()
      .withMessage('Amount must be a number'),
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

      const { subscriptionId, paymentMethod, amount, gatewayResponse } = req.body;

      // Verify subscription belongs to user
      const subscription = await Subscription.findOne({
        _id: subscriptionId,
        user: req.user.id,
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Subscription not found',
        });
      }

      // Create payment record
      const payment = new Payment({
        user: req.user.id,
        subscription: subscriptionId,
        amount,
        paymentMethod,
        billingPeriod: {
          startDate: new Date(),
          endDate: subscription.endDate,
        },
        plan: subscription.plan,
        billingCycle: subscription.billingCycle,
        dueDate: new Date(),
        gatewayResponse,
      });

      await payment.save();

      res.status(201).json({
        success: true,
        payment,
        message: 'Payment created successfully',
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  }
);

// @route   PUT /api/payments/:id/complete
// @desc    Mark payment as completed
// @access  Private
router.put(
  '/:id/complete',
  [
    protect,
    body('gatewayTransactionId')
      .optional()
      .isString()
      .withMessage('Gateway transaction ID must be a string'),
    body('gatewayResponse')
      .optional()
      .isObject()
      .withMessage('Gateway response must be an object'),
  ],
  async (req, res) => {
    try {
      const { gatewayTransactionId, gatewayResponse } = req.body;

      const payment = await Payment.findOne({
        _id: req.params.id,
        user: req.user.id,
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
      }

      if (payment.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Payment already completed',
        });
      }

      // Mark payment as completed
      await payment.markCompleted(gatewayTransactionId, gatewayResponse);

      // Update subscription status and dates
      const subscription = await Subscription.findById(payment.subscription);
      if (subscription) {
        subscription.status = 'active';
        subscription.paymentStatus = 'paid';

        // Extend subscription end date
        const now = new Date();
        if (subscription.billingCycle === 'monthly') {
          subscription.endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        } else {
          subscription.endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        }
        subscription.nextBillingDate = subscription.endDate;

        await subscription.save();
      }

      res.json({
        success: true,
        payment,
        message: 'Payment completed successfully',
      });
    } catch (error) {
      console.error('Error completing payment:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  }
);

// @route   PUT /api/payments/:id/fail
// @desc    Mark payment as failed
// @access  Private
router.put(
  '/:id/fail',
  [
    protect,
    body('reason')
      .isString()
      .withMessage('Failure reason must be a string'),
  ],
  async (req, res) => {
    try {
      const { reason } = req.body;

      const payment = await Payment.findOne({
        _id: req.params.id,
        user: req.user.id,
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
      }

      await payment.markFailed(reason);

      res.json({
        success: true,
        payment,
        message: 'Payment marked as failed',
      });
    } catch (error) {
      console.error('Error failing payment:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  }
);

// @route   POST /api/payments/:id/refund
// @desc    Process refund for payment
// @access  Private
router.post(
  '/:id/refund',
  [
    protect,
    body('amount')
      .optional()
      .isNumeric()
      .withMessage('Refund amount must be a number'),
    body('reason')
      .isString()
      .withMessage('Refund reason must be a string'),
  ],
  async (req, res) => {
    try {
      const { amount, reason } = req.body;

      const payment = await Payment.findOne({
        _id: req.params.id,
        user: req.user.id,
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
      }

      if (payment.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Can only refund completed payments',
        });
      }

      await payment.processRefund(amount, reason);

      res.json({
        success: true,
        payment,
        message: 'Refund processed successfully',
      });
    } catch (error) {
      console.error('Error processing refund:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  }
);

// @route   GET /api/payments/stats
// @desc    Get payment statistics for admin
// @access  Private (Admin only)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {

    const { startDate, endDate } = req.query;

    const stats = await Payment.getPaymentStats(startDate, endDate);
    const revenueByPlan = await Payment.getRevenueByPlan(startDate, endDate);
    const monthlyRevenue = await Payment.getMonthlyRevenue(new Date().getFullYear());

    res.json({
      success: true,
      stats,
      revenueByPlan,
      monthlyRevenue,
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/payments/recent
// @desc    Get recent payments for admin
// @access  Private (Admin only)
router.get('/recent', protect, authorize('admin'), async (req, res) => {
  try {

    const { limit = 10 } = req.query;

    const payments = await Payment.find()
      .populate('user', 'name email')
      .populate('subscription', 'plan billingCycle')
      .sort({ paymentDate: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error('Error fetching recent payments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/payments/all
// @desc    Get all payments for admin
// @access  Private (Admin only)
router.get('/all', protect, authorize('admin'), async (req, res) => {
  try {

    const { page = 1, limit = 20, status, plan, startDate, endDate } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (plan) filter.plan = plan;
    if (startDate && endDate) {
      filter.paymentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const payments = await Payment.find(filter)
      .populate('user', 'name email')
      .populate('subscription', 'plan billingCycle')
      .sort({ paymentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(filter);

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
    console.error('Error fetching all payments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/payments/:id
// @desc    Get payment details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      user: req.user.id,
    })
      .populate('user', 'name email')
      .populate('subscription', 'plan billingCycle');

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
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
