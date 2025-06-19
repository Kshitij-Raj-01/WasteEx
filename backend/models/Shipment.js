const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  shipmentNumber: {
    type: String,
    unique: true,
    required: true
  },
  contract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  logistics: {
    provider: {
      type: String,
      required: true,
      enum: ['delhivery', 'porter', 'bluedart', 'dtdc', 'fedex', 'custom']
    },
    trackingNumber: String,
    partnerOrderId: String,
    contactPerson: {
      name: String,
      phone: String,
      email: String
    }
  },
  pickup: {
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    scheduledDate: Date,
    actualDate: Date,
    contactPerson: {
      name: String,
      phone: String
    },
    instructions: String,
    photos: [String],
    signature: String
  },
  delivery: {
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    scheduledDate: Date,
    estimatedDate: Date,
    actualDate: Date,
    contactPerson: {
      name: String,
      phone: String
    },
    instructions: String,
    photos: [String],
    signature: String,
    otp: String
  },
  cargo: {
    description: String,
    weight: {
      value: Number,
      unit: String
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: String
    },
    packaging: String,
    specialHandling: [String],
    hazardous: Boolean,
    value: Number
  },
  status: {
    type: String,
    enum: [
      'created',
      'pickup-scheduled',
      'picked-up',
      'in-transit',
      'out-for-delivery',
      'delivered',
      'cancelled',
      'returned',
      'lost',
      'damaged'
    ],
    default: 'created'
  },
  tracking: [{
    status: String,
    location: {
      city: String,
      state: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    description: String,
    source: {
      type: String,
      enum: ['system', 'partner', 'manual'],
      default: 'system'
    }
  }],
  cost: {
    base: Number,
    fuel: Number,
    handling: Number,
    insurance: Number,
    taxes: Number,
    total: Number,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  insurance: {
    covered: Boolean,
    provider: String,
    policyNumber: String,
    amount: Number
  },
  documents: [{
    type: {
      type: String,
      enum: ['invoice', 'packing-list', 'msds', 'certificate', 'permit', 'other']
    },
    name: String,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  issues: [{
    type: {
      type: String,
      enum: ['delay', 'damage', 'lost', 'quality', 'documentation', 'other']
    },
    description: String,
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reportedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved', 'escalated'],
      default: 'open'
    },
    resolution: String,
    resolvedAt: Date
  }],
  rating: {
    seller: {
      rating: Number,
      feedback: String,
      ratedAt: Date
    },
    buyer: {
      rating: Number,
      feedback: String,
      ratedAt: Date
    },
    logistics: {
      rating: Number,
      feedback: String,
      ratedAt: Date
    }
  }
}, {
  timestamps: true
});

// Generate shipment number before saving
shipmentSchema.pre('save', async function(next) {
  if (this.isNew && !this.shipmentNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    this.shipmentNumber = `SH-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Indexes for better query performance
shipmentSchema.index({ shipmentNumber: 1 });
shipmentSchema.index({ seller: 1, status: 1 });
shipmentSchema.index({ buyer: 1, status: 1 });
shipmentSchema.index({ 'logistics.trackingNumber': 1 });
shipmentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Shipment', shipmentSchema);