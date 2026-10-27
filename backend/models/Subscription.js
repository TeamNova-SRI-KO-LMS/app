const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Subscription must belong to a user']
  },
  plan: {
    type: String,
    enum: ['starter', 'pro', 'premium'],
    required: [true, 'Please select a plan']
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: [true, 'Please select a billing cycle']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'expired', 'trial'],
    default: 'trial'
  },
  startDate: Date,
  endDate: Date,
  nextBillingDate: Date,
  trialEndDate: Date,
  cancelledAt: Date,
  amount: {
    type: Number,
    required: [true, 'Subscription amount is required']
  },
  currency: {
    type: String,
    default: 'LKR'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'bank_transfer', 'digital_wallet', 'invoice']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  features: {
    maxCourses: Number,
    maxStudents: Number,
    customBranding: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    whiteLabel: { type: Boolean, default: false }
  },
  usage: {
    coursesCreated: { type: Number, default: 0 },
    studentsEnrolled: { type: Number, default: 0 },
    apiCalls: { type: Number, default: 0 }
  },
  cancellationReason: String,
  notes: String
}, {
  timestamps: true
});

// Plan limits and prices in LKR, as shown on the pricing page. -1 means unlimited, which
// is how GET /api/subscriptions/usage reports it.
const PLANS = {
  starter: {
    features: { maxCourses: 5, maxStudents: 50, customBranding: false, apiAccess: false, whiteLabel: false },
    pricing: { monthly: 0, yearly: 0 }
  },
  pro: {
    features: { maxCourses: -1, maxStudents: 500, customBranding: true, apiAccess: true, whiteLabel: false },
    pricing: { monthly: 15000, yearly: 150000 }
  },
  premium: {
    features: { maxCourses: -1, maxStudents: -1, customBranding: true, apiAccess: true, whiteLabel: true },
    pricing: { monthly: 35000, yearly: 350000 }
  }
};

const planFor = (plan) => {
  if (!PLANS[plan]) {
    throw new Error(`Unknown subscription plan: ${plan}`);
  }
  return PLANS[plan];
};

subscriptionSchema.statics.getPlanFeatures = function (plan) {
  return { ...planFor(plan).features };
};

subscriptionSchema.statics.getPlanPricing = function (plan, billingCycle) {
  const { pricing } = planFor(plan);
  if (pricing[billingCycle] === undefined) {
    throw new Error(`Unknown billing cycle: ${billingCycle}`);
  }
  return pricing[billingCycle];
};

// Cancel the subscription; it stays usable until its end date but does not renew
subscriptionSchema.methods.cancel = function (reason) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.autoRenew = false;
  if (reason) {
    this.cancellationReason = reason;
  }
  return this.save();
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
