const mongoose = require('mongoose');

const materialRequestSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  materialType: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Plastic Materials',
      'Metal Materials',
      'Paper Materials',
      'Textile Materials',
      'Chemical Materials',
      'Electronic Materials',
      'Rubber Materials',
      'Glass Materials',
      'Wood Materials',
      'Organic Materials'
    ]
  },
  quantity: {
    value: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'tonnes', 'liters', 'pieces', 'm3']
    }
  },
  frequency: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'one-time']
  },
  budget: {
    min: Number,
    max: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  location: {
    preferredCities: [String],
    state: String,
    maxDistance: Number, // in kilometers
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  qualityGrade: {
    type: String,
    required: true,
    enum: ['Grade A', 'Grade B', 'Grade C', 'Industrial Grade', 'Food Grade', 'Medical Grade']
  },
  specifications: {
    purity: String,
    moisture: String,
    packaging: String,
    certifications: [String],
    additionalRequirements: String
  },
  description: String,
  urgency: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high']
  },
  deliveryRequirements: {
    timeline: String,
    packaging: String,
    handling: String
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'fulfilled', 'cancelled', 'expired']
  },
  matches: [{
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WasteListing'
    },
    matchScore: Number,
    reasons: [String],
    contacted: {
      type: Boolean,
      default: false
    },
    contactedAt: Date
  }],
  responses: [{
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WasteListing'
    },
    message: String,
    quotedPrice: Number,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  expiryDate: Date,
  aiMatchScore: Number,
  tags: [String]
}, {
  timestamps: true
});

// Indexes for better query performance
materialRequestSchema.index({ buyer: 1, status: 1 });
materialRequestSchema.index({ category: 1, status: 1 });
materialRequestSchema.index({ 'location.preferredCities': 1 });
materialRequestSchema.index({ urgency: 1, createdAt: -1 });

// Text index for search functionality
materialRequestSchema.index({
  title: 'text',
  materialType: 'text',
  description: 'text',
  tags: 'text'
});

// Virtual for total responses count
materialRequestSchema.virtual('responseCount').get(function() {
  return this.responses.length;
});

// Auto-expire requests after 30 days if no expiry date set
materialRequestSchema.pre('save', function(next) {
  if (!this.expiryDate && this.isNew) {
    this.expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }
  next();
});

module.exports = mongoose.model('MaterialRequest', materialRequestSchema);