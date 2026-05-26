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

module.exports = mongoose.model('Subscription', subscriptionSchema);
