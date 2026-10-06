const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const Course = require('../models/Course');
const User = require('../models/User');
const Progress = require('../models/Progress');
const Notification = require('../models/Notification');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = require('stripe')(stripeSecretKey);

const router = express.Router();

// =========================================================================
// COURSE STRIPE PAYMENT GATEWAY ROUTES
// =========================================================================

// @route   POST /api/payments/create-course-payment-intent
// @desc    Create Stripe PaymentIntent for purchasing a course
// @access  Private (Authenticated User)
router.post(
  '/create-course-payment-intent',
  [
    protect,
    body('courseId').isMongoId().withMessage('Valid course ID is required'),
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

      const { courseId } = req.body;
      const course = await Course.findById(courseId);

      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }

      if (!course.isPublished) {
        return res.status(400).json({
          success: false,
          message: 'This course is currently not published or available for purchase',
        });
      }

      // Check if student is already enrolled
      const isAlreadyEnrolled = course.enrolledStudents?.some(
        (studentId) => studentId.toString() === req.user.id.toString()
      );
      const existingProgress = await Progress.findOne({ student: req.user.id, course: course._id });

      if (isAlreadyEnrolled || existingProgress) {
        return res.status(400).json({
          success: false,
          message: 'You are already enrolled in this course',
        });
      }

      if (course.price <= 0) {
        return res.status(400).json({
          success: false,
          isFree: true,
          message: 'This course is free. You can enroll directly without payment.',
        });
      }

      // Convert price to smallest currency unit (cents equivalent for LKR)
      // Stripe requires amount in cents. Minimum charge is approx $0.50 USD (~160 LKR).
      const priceAmount = Math.max(course.price, 160);
      const amountInCents = Math.round(priceAmount * 100);

      // Create Stripe PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'lkr',
        description: `Enrollment: ${course.title}`,
        metadata: {
          courseId: course._id.toString(),
          userId: req.user.id.toString(),
          courseTitle: course.title,
          userEmail: req.user.email,
        },
        receipt_email: req.user.email,
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      });

      // Create or update pending Payment record
      const payment = await Payment.create({
        user: req.user.id,
        course: course._id,
        paymentType: 'course',
        amount: course.price,
        currency: 'LKR',
        status: 'pending',
        paymentGateway: 'stripe',
        gatewayTransactionId: paymentIntent.id,
        paymentMethod: 'credit_card',
        metadata: {
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          courseTitle: course.title,
        },
      });

      res.status(200).json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        paymentId: payment._id,
        course: {
          _id: course._id,
          title: course.title,
          description: course.description,
          price: course.price,
          duration: course.duration,
          level: course.level,
          category: course.category,
          thumbnail: course.thumbnail,
        },
      });
    } catch (error) {
      console.error('Error creating course payment intent:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to initialize payment with Stripe',
      });
    }
  }
);

// @route   POST /api/payments/confirm-course-payment
// @desc    Verify Stripe payment success and enroll the student
// @access  Private (Authenticated User)
router.post(
  '/confirm-course-payment',
  [
    protect,
    body('paymentIntentId').isString().notEmpty().withMessage('Payment intent ID is required'),
    body('courseId').isMongoId().withMessage('Valid course ID is required'),
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

      const { paymentIntentId, courseId } = req.body;

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }

      // Verify payment directly with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (!paymentIntent) {
        return res.status(404).json({
          success: false,
          message: 'Payment intent not found on Stripe',
        });
      }

      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({
          success: false,
          message: `Stripe payment is not completed. Current status: ${paymentIntent.status}`,
        });
      }

      // Verify course ID match in metadata (if present)
      if (paymentIntent.metadata?.courseId && paymentIntent.metadata.courseId !== courseId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed: course ID mismatch',
        });
      }

      // Record payment completion
      let payment = await Payment.findOne({ gatewayTransactionId: paymentIntent.id });
      const receiptNumber = `SRIKO-REC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      if (!payment) {
        payment = new Payment({
          user: req.user.id,
          course: course._id,
          paymentType: 'course',
          amount: paymentIntent.amount / 100,
          currency: (paymentIntent.currency || 'LKR').toUpperCase(),
          paymentGateway: 'stripe',
          gatewayTransactionId: paymentIntent.id,
          paymentMethod: 'credit_card',
        });
      }

      payment.status = 'completed';
      payment.paidDate = new Date();
      payment.paymentDate = payment.paidDate;
      payment.receiptNumber = receiptNumber;
      payment.gatewayResponse = {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        payment_method: paymentIntent.payment_method,
        receipt_email: paymentIntent.receipt_email,
      };
      await payment.save();

      // Enroll student in Course
      const isAlreadyInCourse = course.enrolledStudents.some(
        (id) => id.toString() === req.user.id.toString()
      );
      if (!isAlreadyInCourse) {
        course.enrolledStudents.push(req.user.id);
        await course.save();
      }

      // Add course to User model enrolledCourses
      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { enrolledCourses: course._id },
      });

      // Create Progress record if not already existing
      let progress = await Progress.findOne({ student: req.user.id, course: course._id });
      if (!progress) {
        progress = await Progress.create({
          student: req.user.id,
          course: course._id,
          currentWeek: 1,
          overallProgress: 0,
        });
      }

      // Create In-App Notification
      try {
        await Notification.create({
          title: 'Enrollment Confirmed!',
          message: `Your payment for "${course.title}" was successful. You now have full lifetime access.`,
          type: 'course_update',
          priority: 'high',
          targetAudience: 'specific_users',
          targetUsers: [req.user.id],
          targetCourses: [course._id],
          actionUrl: `/courses/${course._id}/learn`,
        });
      } catch (notifErr) {
        console.warn('Could not save notification:', notifErr.message);
      }

      console.log(`✅ Stripe payment succeeded: ${paymentIntent.id} for user ${req.user.id}, course ${course.title}`);

      res.status(200).json({
        success: true,
        message: 'Payment completed and student enrolled successfully!',
        payment: {
          id: payment._id,
          receiptNumber: payment.receiptNumber,
          amount: payment.amount,
          paidDate: payment.paidDate,
        },
        course: {
          _id: course._id,
          title: course.title,
        },
      });
    } catch (error) {
      console.error('Error confirming course payment:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to confirm course payment',
      });
    }
  }
);

// @route   GET /api/payments/my-payments
// @desc    Get logged in user's payment history
// @access  Private
router.get('/my-payments', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('course', 'title thumbnail duration price level category')
      .populate('subscription', 'plan billingCycle')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error('Error fetching student payments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// =========================================================================
// SUBSCRIPTION PAYMENT ROUTES
// =========================================================================

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
      .populate('course', 'title price thumbnail')
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
      .populate('course', 'title price thumbnail')
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
      .populate('course', 'title price thumbnail')
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
