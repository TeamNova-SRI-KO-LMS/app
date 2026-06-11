const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Payment must belong to a user']
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: [true, 'Payment must be associated with a subscription']
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required']
  },
  currency: {
    type: String,
    default: 'LKR'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'bank_transfer', 'digital_wallet', 'cash', 'cheque']
  },
  paymentGateway: {
    type: String,
    enum: ['stripe', 'paypal', 'razorpay', 'payhere', 'manual']
  },
  gatewayTransactionId: String,
  stripeSessionId: String,
  stripePaymentIntentId: String,
  gatewayResponse: mongoose.Schema.Types.Mixed,
  billingPeriod: {
    startDate: Date,
    endDate: Date
  },
  plan: {
    type: String,
    enum: ['starter', 'pro', 'premium']
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly']
  },
  paymentDate: Date,
  dueDate: Date,
  paidDate: Date,
  refundDate: Date,
  failureReason: String,
  refundReason: String,
  invoiceNumber: String,
  receiptNumber: String,
  notes: String,
  refundAmount: Number,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});


module.exports = mongoose.model('Payment', paymentSchema);
