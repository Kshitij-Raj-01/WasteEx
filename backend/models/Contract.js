const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  contractNumber: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  parties: {
    seller: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      company: String,
      signedAt: Date,
      signature: String,
      ipAddress: String
    },
    buyer: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      company: String,
      signedAt: Date,
      signature: String,
      ipAddress: String
    }
  },
  relatedNegotiation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Negotiation',
    required: true
  },
  relatedListing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WasteListing'
  },
  terms: {
    materialType: {
      type: String,
      required: true
    },
    quantity: {
      value: {
        type: Number,
        required: true
      },
      unit: {
        type: String,
        required: true
      }
    },
    price: {
      value: {
        type: Number,
        required: true
      },
      currency: {
        type: String,
        default: 'INR'
      }
    },
    totalValue: {
      type: Number,
      required: true
    },
    deliveryDate: {
      type: Date,
      required: true
    },
    deliveryLocation: {
      address: String,
      city: String,
      state: String,
      pincode: String
    },
    paymentTerms: {
      type: String,
      required: true,
      enum: ['advance', 'cod', 'net-15', 'net-30', 'net-45']
    },
    qualitySpecs: String,
    packagingRequirements: String,
    inspectionRights: String,
    penalties: {
      lateDelivery: String,
      qualityIssues: String,
      cancellation: String
    }
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'signed', 'executed', 'completed', 'cancelled', 'disputed'],
    default: 'draft'
  },
  blockchain: {
    deployed: {
      type: Boolean,
      default: false
    },
    transactionHash: String,
    contractAddress: String,
    blockNumber: Number,
    gasUsed: Number,
    deployedAt: Date
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  paymentStatus: {
    type: String,
    enum: ['not_initiated', 'pending', 'held_in_escrow', 'released_to_seller', 'refunded', 'failed'],
    default: 'not_initiated'
  },
  documents: [{
    name: String,
    url: String,
    type: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  milestones: [{
    title: String,
    description: String,
    dueDate: Date,
    status: {
      type: String,
      enum: ['pending', 'completed', 'overdue'],
      default: 'pending'
    },
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  logistics: {
    provider: String,
    trackingNumber: String,
    estimatedDelivery: Date,
    actualDelivery: Date,
    cost: Number
  },
  platformFee: {
    percentage: Number,
    amount: Number,
    paid: {
      type: Boolean,
      default: false
    },
    paidAt: Date
  },
  disputes: [{
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    description: String,
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved', 'escalated'],
      default: 'open'
    },
    resolution: String,
    resolvedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  auditTrail: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

// Generate contract number before saving
contractSchema.pre('save', async function(next) {
  if (this.isNew && !this.contractNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    this.contractNumber = `WE-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Indexes for better query performance
contractSchema.index({ contractNumber: 1 });
contractSchema.index({ 'parties.seller.user': 1, status: 1 });
contractSchema.index({ 'parties.buyer.user': 1, status: 1 });
contractSchema.index({ status: 1, createdAt: -1 });
contractSchema.index({ 'blockchain.transactionHash': 1 });

// Virtual for checking if contract is fully signed
contractSchema.virtual('isFullySigned').get(function() {
  return this.parties.seller.signedAt && this.parties.buyer.signedAt;
});

module.exports = mongoose.model('Contract', contractSchema);