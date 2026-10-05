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
    required: false
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: false
  },
  paymentType: {
    type: String,
    enum: ['course', 'subscription'],
    default: 'course'
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
    enum: ['credit_card', 'bank_transfer', 'digital_wallet', 'cash', 'cheque'],
    default: 'credit_card'
  },
  paymentGateway: {
    type: String,
    enum: ['stripe', 'paypal', 'razorpay', 'payhere', 'manual'],
    default: 'stripe'
  },
  gatewayTransactionId: String,
  gatewayResponse: mongoose.Schema.Types.Mixed,
  billingPeriod: {
    startDate: Date,
    endDate: Date
  },
  plan: {
    type: String
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly']
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
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

paymentSchema.methods.markCompleted = async function(gatewayTransactionId, gatewayResponse) {
  this.status = 'completed';
  this.paidDate = new Date();
  this.paymentDate = this.paidDate;
  if (gatewayTransactionId) this.gatewayTransactionId = gatewayTransactionId;
  if (gatewayResponse) this.gatewayResponse = gatewayResponse;
  return this.save();
};

paymentSchema.methods.markFailed = async function(failureReason) {
  this.status = 'failed';
  this.failureReason = failureReason;
  return this.save();
};

paymentSchema.methods.processRefund = async function(amount, reason) {
  this.status = 'refunded';
  this.refundDate = new Date();
  this.refundAmount = amount || this.amount;
  this.refundReason = reason;
  return this.save();
};

paymentSchema.statics.getPaymentStats = async function(startDate, endDate) {
  const match = { status: 'completed' };
  if (startDate && endDate) {
    match.paidDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
        avgTransactionValue: { $avg: '$amount' }
      }
    }
  ]);
  return result[0] || { totalRevenue: 0, totalTransactions: 0, avgTransactionValue: 0 };
};

paymentSchema.statics.getRevenueByPlan = async function(startDate, endDate) {
  const match = { status: 'completed' };
  if (startDate && endDate) {
    match.paidDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $ifNull: ['$plan', '$paymentType'] },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $project: { plan: '$_id', revenue: 1, count: 1, _id: 0 } }
  ]);
};

paymentSchema.statics.getMonthlyRevenue = async function(year) {
  const targetYear = year || new Date().getFullYear();
  const startOfYear = new Date(`${targetYear}-01-01T00:00:00.000Z`);
  const endOfYear = new Date(`${targetYear}-12-31T23:59:59.999Z`);

  return this.aggregate([
    {
      $match: {
        status: 'completed',
        paidDate: { $gte: startOfYear, $lte: endOfYear }
      }
    },
    {
      $group: {
        _id: { $month: '$paidDate' },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } },
    { $project: { month: '$_id', revenue: 1, count: 1, _id: 0 } }
  ]);
};

module.exports = mongoose.model('Payment', paymentSchema);
