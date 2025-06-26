const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },  
  type: {
    type: String,
    enum: ['text', 'file', 'offer', 'system', 'price-discussion', 'terms-discussion'],  // <- UPDATED LINE
    default: 'text'
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  offer: {
    price: Number,
    quantity: Number,
    deliveryDate: Date,
    terms: String
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: Date
}, {
  timestamps: true
});

const negotiationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['buyer', 'seller'],
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  relatedListing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WasteListing'
  },
  relatedRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaterialRequest'
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'completed', 'cancelled', 'expired'],
    default: 'active'
  },
  messages: [messageSchema],
  currentOffer: {
    price: Number,
    quantity: Number,
    deliveryDate: Date,
    terms: String,
    offeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    offeredAt: Date,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'countered'],
      default: 'pending'
    }
  },
  dealValue: Number,
  agreedTerms: {
    price: Number,
    quantity: Number,
    deliveryDate: Date,
    paymentTerms: String,
    qualitySpecs: String,
    logistics: String
  },
  contract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  tags: [String],
  notes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    private: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
negotiationSchema.index({ 'participants.user': 1, status: 1 });
negotiationSchema.index({ relatedListing: 1 });
negotiationSchema.index({ relatedRequest: 1 });
negotiationSchema.index({ status: 1, lastActivity: -1 });

// Virtual for unread message count per user
negotiationSchema.methods.getUnreadCount = function(userId) {
  let unreadCount = 0;
  this.messages.forEach(message => {
    const isRead = message.readBy.some(read => read.user.toString() === userId.toString());
    if (!isRead && message.sender.toString() !== userId.toString()) {
      unreadCount++;
    }
  });
  return unreadCount;
};

// Update last activity on message add
negotiationSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.lastActivity = new Date();
  }
  next();
});

module.exports = mongoose.model('Negotiation', negotiationSchema);