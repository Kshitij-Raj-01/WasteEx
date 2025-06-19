const express = require('express');
const { body, validationResult } = require('express-validator');
const Shipment = require('../models/Shipment');
const Contract = require('../models/Contract');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/logistics/shipments
// @desc    Get user's shipments
// @access  Private
router.get('/shipments', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      $or: [
        { seller: req.user._id },
        { buyer: req.user._id }
      ]
    };

    if (req.query.status) filter.status = req.query.status;

    const shipments = await Shipment.find(filter)
      .populate('seller', 'name company.name')
      .populate('buyer', 'name company.name')
      .populate('contract', 'contractNumber terms.materialType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Shipment.countDocuments(filter);

    res.json({
      success: true,
      data: {
        shipments,
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
    console.error('Get shipments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching shipments'
    });
  }
});

// @route   GET /api/logistics/shipments/:id
// @desc    Get single shipment
// @access  Private
router.get('/shipments/:id', auth, async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('seller', 'name company.name phone')
      .populate('buyer', 'name company.name phone')
      .populate('contract', 'contractNumber terms');

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    // Check if user is related to the shipment
    const isRelated = shipment.seller._id.toString() === req.user._id.toString() ||
                     shipment.buyer._id.toString() === req.user._id.toString();

    if (!isRelated && req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this shipment'
      });
    }

    res.json({
      success: true,
      data: { shipment }
    });
  } catch (error) {
    console.error('Get shipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching shipment'
    });
  }
});

// @route   POST /api/logistics/shipments
// @desc    Create new shipment
// @access  Private
router.post('/shipments', [
  auth,
  body('contractId').isMongoId().withMessage('Invalid contract ID'),
  body('logistics.provider').notEmpty().withMessage('Logistics provider is required'),
  body('pickup.address').isObject().withMessage('Pickup address is required'),
  body('delivery.address').isObject().withMessage('Delivery address is required'),
  body('cargo.description').notEmpty().withMessage('Cargo description is required')
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

    const contract = await Contract.findById(req.body.contractId);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    // Check if user is party to the contract
    const isParty = contract.parties.seller.user.toString() === req.user._id.toString() ||
                   contract.parties.buyer.user.toString() === req.user._id.toString();

    if (!isParty) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create shipment for this contract'
      });
    }

    const shipmentData = {
      contract: contract._id,
      seller: contract.parties.seller.user,
      buyer: contract.parties.buyer.user,
      logistics: req.body.logistics,
      pickup: req.body.pickup,
      delivery: req.body.delivery,
      cargo: req.body.cargo,
      status: 'created'
    };

    const shipment = new Shipment(shipmentData);
    await shipment.save();

    await shipment.populate('seller', 'name company.name');
    await shipment.populate('buyer', 'name company.name');

    res.status(201).json({
      success: true,
      message: 'Shipment created successfully',
      data: { shipment }
    });
  } catch (error) {
    console.error('Create shipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating shipment'
    });
  }
});

// @route   PUT /api/logistics/shipments/:id/status
// @desc    Update shipment status
// @access  Private
router.put('/shipments/:id/status', [
  auth,
  body('status').isIn([
    'created', 'pickup-scheduled', 'picked-up', 'in-transit',
    'out-for-delivery', 'delivered', 'cancelled', 'returned'
  ]).withMessage('Invalid status'),
  body('location').optional().isObject()
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

    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    // Check authorization
    const isRelated = shipment.seller.toString() === req.user._id.toString() ||
                     shipment.buyer.toString() === req.user._id.toString();

    if (!isRelated && req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this shipment'
      });
    }

    // Update status
    shipment.status = req.body.status;

    // Add tracking entry
    const trackingEntry = {
      status: req.body.status,
      location: req.body.location,
      description: req.body.description || `Status updated to ${req.body.status}`,
      source: 'manual'
    };

    shipment.tracking.push(trackingEntry);

    // Update specific dates based on status
    if (req.body.status === 'picked-up') {
      shipment.pickup.actualDate = new Date();
    } else if (req.body.status === 'delivered') {
      shipment.delivery.actualDate = new Date();
    }

    await shipment.save();

    res.json({
      success: true,
      message: 'Shipment status updated successfully',
      data: { shipment }
    });
  } catch (error) {
    console.error('Update shipment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating shipment status'
    });
  }
});

// @route   POST /api/logistics/shipments/:id/tracking
// @desc    Add tracking update
// @access  Private
router.post('/shipments/:id/tracking', [
  auth,
  body('status').notEmpty().withMessage('Status is required'),
  body('description').notEmpty().withMessage('Description is required')
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

    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    const trackingEntry = {
      status: req.body.status,
      location: req.body.location,
      description: req.body.description,
      source: 'manual'
    };

    shipment.tracking.push(trackingEntry);
    await shipment.save();

    res.json({
      success: true,
      message: 'Tracking update added successfully'
    });
  } catch (error) {
    console.error('Add tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding tracking update'
    });
  }
});

module.exports = router;