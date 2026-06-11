const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const stripe = require('../config/stripe');

const router = express.Router();

// @desc    Create Stripe checkout session
// @route   POST /api/payments/create-checkout-session
// @access  Private
router.post(
  '/create-checkout-session',
  protect,
  [
    body('subscriptionId')
      .isMongoId()
      .withMessage('Invalid subscription ID'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { subscriptionId } = req.body;

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

      const amount =
        subscription.billingCycle === 'monthly' ? 1000 : 10000;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${subscription.plan} Subscription`,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId: req.user.id,
          subscriptionId: subscription._id.toString(),
        },
        success_url: `${process.env.FRONTEND_URL}/payment-success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
      });

      await Payment.create({
        user: req.user.id,
        subscription: subscription._id,
        amount,
        paymentMethod: 'stripe',
        status: 'pending',
        stripeSessionId: session.id,
        plan: subscription.plan,
        billingCycle: subscription.billingCycle,
        dueDate: new Date(),
      });

      res.json({
        success: true,
        checkoutUrl: session.url,
      });
    } catch (error) {
      console.error('Checkout error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// @desc    Stripe webhook handler
// @route   POST /api/payments/webhook
// @access  Public (Stripe only)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        const payment = await Payment.findOne({
          stripeSessionId: session.id,
        });

        if (payment) {
          payment.status = 'completed';
          payment.gatewayTransactionId = session.payment_intent;
          await payment.save();

          const subscription = await Subscription.findById(
            payment.subscription
          );

          if (subscription) {
            subscription.status = 'active';
            subscription.paymentStatus = 'paid';

            const now = new Date();

            subscription.endDate =
              subscription.billingCycle === 'monthly'
                ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
                : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

            subscription.nextBillingDate = subscription.endDate;

            await subscription.save();
          }
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({
        success: false,
        message: 'Webhook error',
      });
    }
  }
);

// @desc    Get logged-in user payments
// @route   GET /api/payments/my-payments
// @access  Private
router.get('/my-payments', protect, async (req, res) => {
  const payments = await Payment.find({ user: req.user.id })
    .populate('subscription', 'plan billingCycle')
    .sort({ createdAt: -1 });

  res.json({ success: true, payments });
});

// @desc    Get all payments (admin)
// @route   GET /api/payments/all
// @access  Private/Admin
router.get('/all', protect, authorize('admin'), async (req, res) => {
  const payments = await Payment.find()
    .populate('user', 'name email')
    .populate('subscription', 'plan billingCycle')
    .sort({ createdAt: -1 });

  res.json({ success: true, payments });
});

module.exports = router;