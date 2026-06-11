const stripe = require('../config/stripe');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');

exports.handleWebhook = async (req, res) => {
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const payment = await Payment.findOne({
      stripeSessionId: session.id,
    });

    if (payment) {
      payment.status = 'completed';
      payment.gatewayTransactionId = session.payment_intent;
      await payment.save();

      const subscription = await Subscription.findById(payment.subscription);

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
};