const express = require('express');
const { body, validationResult } = require('express-validator');
const Negotiation = require('../models/Negotiation');
const WasteListing = require('../models/WasteListing');
const MaterialRequest = require('../models/MaterialRequest');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/negotiations
// @desc    Get user's negotiations
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      'participants.user': req.user._id
    };

    if (req.query.status) filter.status = req.query.status;

    const negotiations = await Negotiation.find(filter)
      .populate('participants.user', 'name company.name')
      .populate('relatedListing', 'title wasteType quantity price')
      .populate('relatedRequest', 'title materialType quantity budget')
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Negotiation.countDocuments(filter);

    res.json({
      success: true,
      data: {
        negotiations,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get negotiations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching negotiations'
    });
  }
});

// @route   GET /api/negotiations/:id
// @desc    Get single negotiation
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const negotiation = await Negotiation.findById(req.params.id)
      .populate('participants.user', 'name company.name avatar')
      .populate('relatedListing', 'title wasteType quantity price location')
      .populate('relatedRequest', 'title materialType quantity budget location')
      .populate('messages.sender', 'name avatar');

    if (!negotiation) {
      return res.status(404).json({
        success: false,
        message: 'Negotiation not found'
      });
    }

    // Check if user is participant
    const isParticipant = negotiation.participants.some(
      p => p.user._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this negotiation'
      });
    }

    // Mark messages as read
    negotiation.messages.forEach(message => {
      if (message.sender._id.toString() !== req.user._id.toString()) {
        const readEntry = message.readBy.find(
          read => read.user.toString() === req.user._id.toString()
        );
        if (!readEntry) {
          message.readBy.push({ user: req.user._id });
        }
      }
    });

    await negotiation.save();

    res.json({
      success: true,
      data: { negotiation }
    });
  } catch (error) {
    console.error('Get negotiation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching negotiation'
    });
  }
});

// @route   POST /api/negotiations
// @desc    Create new negotiation
// @access  Private
router.post('/', [
  auth,
  body('title').trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
  body('counterpartyId').isMongoId().withMessage('Invalid counterparty ID'),
  body('type').isIn(['listing', 'request']).withMessage('Type must be listing or request'),
  body('relatedId').isMongoId().withMessage('Invalid related ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, counterpartyId, type, relatedId } = req.body;

    // Determine roles based on type
    const participants = [
      {
        user: req.user._id,
        role: type === 'listing' ? 'buyer' : 'seller'
      },
      {
        user: counterpartyId,
        role: type === 'listing' ? 'seller' : 'buyer'
      }
    ];

    const negotiationData = {
      title,
      participants,
      status: 'active'
    };

    if (type === 'listing') {
      negotiationData.relatedListing = relatedId;
    } else {
      negotiationData.relatedRequest = relatedId;
    }

    const negotiation = new Negotiation(negotiationData);
    await negotiation.save();

    await negotiation.populate('participants.user', 'name company.name');

    res.status(201).json({
      success: true,
      message: 'Negotiation created successfully',
      data: { negotiation }
    });
  } catch (error) {
    console.error('Create negotiation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating negotiation'
    });
  }
});

// @route   POST /api/negotiations/:id/messages
// @desc    Send message in negotiation
// @access  Private
router.post('/:id/messages', [
  auth,
  body('content').trim().isLength({ min: 1 }).withMessage('Message content is required'),
  body('type').optional().isIn(['text', 'file', 'offer', 'price-discussion', 'terms-discussion']).withMessage('Invalid message type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const negotiation = await Negotiation.findById(req.params.id);

    if (!negotiation) {
      return res.status(404).json({
        success: false,
        message: 'Negotiation not found'
      });
    }

    // Check if user is participant
    const isParticipant = negotiation.participants.some(
      p => p.user.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send messages in this negotiation'
      });
    }

    const message = {
      sender: req.user._id,
      content: req.body.content,
      type: req.body.type || 'text',
      attachments: req.body.attachments || [],
      offer: req.body.offer
    };

    negotiation.messages.push(message);
    negotiation.lastActivity = new Date();

    await negotiation.save();

    res.json({
      success: true,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending message'
    });
  }
});

// @route   PUT /api/negotiations/:id/status
// @desc    Update negotiation status
// @access  Private
router.put('/:id/status', [
  auth,
  body('status').isIn(['active', 'pending', 'completed', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const negotiation = await Negotiation.findById(req.params.id);

    if (!negotiation) {
      return res.status(404).json({
        success: false,
        message: 'Negotiation not found'
      });
    }

    // Check if user is participant
    const isParticipant = negotiation.participants.some(
      p => p.user.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this negotiation'
      });
    }

    negotiation.status = req.body.status;
    negotiation.lastActivity = new Date();

    await negotiation.save();

    res.json({
      success: true,
      message: 'Negotiation status updated successfully',
      data: { negotiation }
    });
  } catch (error) {
    console.error('Update negotiation status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating negotiation status'
    });
  }
});

module.exports = router;