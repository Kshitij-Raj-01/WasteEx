const mongoose = require('mongoose');

const wasteListingSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  wasteType: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Plastic Waste',
      'Metal Scrap',
      'Paper Waste',
      'Textile Waste',
      'Chemical Waste',
      'Electronic Waste',
      'Rubber Waste',
      'Glass Waste',
      'Wood Waste',
      'Organic Waste'
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
  price: {
    value: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    negotiable: {
      type: Boolean,
      default: true
    }
  },
  location: {
    address: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  urgency: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high']
  },
  description: String,
  images: [{
    url: String,
    publicId: String,
    caption: String
  }],
  documents: [{
    type: String,
    url: String,
    name: String
  }],
  msds: {
    url: String,
    verified: { type: Boolean, default: false }
  },
  specifications: {
    purity: String,
    moisture: String,
    contamination: String,
    packaging: String,
    storageConditions: String
  },
  hazardous: {
    type: Boolean,
    default: false
  },
  certifications: [String],
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'inactive', 'sold', 'expired', 'suspended']
  },
  views: {
    type: Number,
    default: 0
  },
  inquiries: [{
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  expiryDate: Date,
  featured: {
    type: Boolean,
    default: false
  },
  aiMatchScore: Number,
  tags: [String]
}, {
  timestamps: true
});

// Indexes for better query performance
wasteListingSchema.index({ seller: 1, status: 1 });
wasteListingSchema.index({ category: 1, status: 1 });
wasteListingSchema.index({ 'location.city': 1, 'location.state': 1 });
wasteListingSchema.index({ urgency: 1, createdAt: -1 });
wasteListingSchema.index({ featured: 1, createdAt: -1 });

// Text index for search functionality
wasteListingSchema.index({
  title: 'text',
  wasteType: 'text',
  description: 'text',
  tags: 'text'
});

// Virtual for total inquiries count
wasteListingSchema.virtual('inquiryCount').get(function() {
  return this.inquiries.length;
});

// Auto-expire listings after 30 days if no expiry date set
wasteListingSchema.pre('save', function(next) {
  if (!this.expiryDate && this.isNew) {
    this.expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }
  next();
});

module.exports = mongoose.model('WasteListing', wasteListingSchema);