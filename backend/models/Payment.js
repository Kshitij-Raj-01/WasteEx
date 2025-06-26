const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String
  },
  contract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    total: {
      type: Number,
      required: true,
      min: 0
    },
    sellerAmount: {
      type: Number,
      required: true,
      min: 0
    },
    platformFee: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'paid_to_platform', 'held_in_escrow', 'released_to_seller', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay','upi', 'netbanking', 'card', 'wallet'],
    default: 'razorpay'
  },
  gatewayDetails: {
    provider: {
      type: String,
      enum: ['razorpay', 'stripe', 'payu'],
      required: true
    },
    transactionId: String,
    gatewayOrderId: String,
    gatewayPaymentId: String,
    signature: String
  },
  escrow: {
    heldAt: Date,
    releaseConditions: {
      deliveryConfirmed: {
        type: Boolean,
        default: false
      },
      qualityApproved: {
        type: Boolean,
        default: false
      },
      disputeResolved: {
        type: Boolean,
        default: true
      }
    },
    releasedAt: Date,
    autoReleaseDate: Date // Auto-release after 7 days of delivery
  },
  timeline: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    description: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  refund: {
    requested: {
      type: Boolean,
      default: false
    },
    requestedAt: Date,
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    approved: Boolean,
    approvedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    refundAmount: Number,
    refundTransactionId: String
  },
  dispute: {
    raised: {
      type: Boolean,
      default: false
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved'],
      default: 'open'
    },
    resolution: String,
    resolvedAt: Date
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceInfo: String
  }
}, {
  timestamps: true
});

// Generate payment ID before saving
paymentSchema.pre('save', async function(next) {
  if (this.isNew && !this.paymentId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    this.paymentId = `PAY-${year}-${String(count + 1).padStart(8, '0')}`;
  }
  next();
});

// Indexes for better query performance
paymentSchema.index({ paymentId: 1 });
paymentSchema.index({ contract: 1 });
paymentSchema.index({ buyer: 1, status: 1 });
paymentSchema.index({ seller: 1, status: 1 });
paymentSchema.index({ 'gatewayDetails.transactionId': 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

// Virtual for checking if payment can be released
paymentSchema.virtual('canRelease').get(function() {
  return this.status === 'held_in_escrow' &&
         this.escrow.releaseConditions.deliveryConfirmed &&
         this.escrow.releaseConditions.qualityApproved &&
         this.escrow.releaseConditions.disputeResolved;
});

// Method to add timeline entry
paymentSchema.methods.addTimelineEntry = function(status, description, performedBy) {
  this.timeline.push({
    status,
    description,
    performedBy
  });
  return this.save();
};

module.exports = mongoose.model('Payment', paymentSchema);