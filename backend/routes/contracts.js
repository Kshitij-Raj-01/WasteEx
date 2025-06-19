const express = require('express');
const { body, validationResult } = require('express-validator');
const Contract = require('../models/Contract');
const Negotiation = require('../models/Negotiation');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/contracts
// @desc    Get user's contracts
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      $or: [
        { 'parties.seller.user': req.user._id },
        { 'parties.buyer.user': req.user._id }
      ]
    };

    if (req.query.status) filter.status = req.query.status;

    const contracts = await Contract.find(filter)
      .populate('parties.seller.user', 'name company.name')
      .populate('parties.buyer.user', 'name company.name')
      .populate('relatedNegotiation', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Contract.countDocuments(filter);

    res.json({
      success: true,
      data: {
        contracts,
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
    console.error('Get contracts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching contracts'
    });
  }
});

// @route   GET /api/contracts/:id
// @desc    Get single contract
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('parties.seller.user', 'name company.name company.address phone')
      .populate('parties.buyer.user', 'name company.name company.address phone')
      .populate('relatedNegotiation', 'title')
      .populate('relatedListing', 'title wasteType');

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    // Check if user is party to the contract
    const isParty = contract.parties.seller.user._id.toString() === req.user._id.toString() ||
                   contract.parties.buyer.user._id.toString() === req.user._id.toString();

    if (!isParty && req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this contract'
      });
    }

    res.json({
      success: true,
      data: { contract }
    });
  } catch (error) {
    console.error('Get contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching contract'
    });
  }
});

// @route   POST /api/contracts
// @desc    Create new contract from negotiation
// @access  Private
router.post('/', [
  auth,
  body('negotiationId').isMongoId().withMessage('Invalid negotiation ID'),
  body('terms').isObject().withMessage('Contract terms are required'),
  body('terms.materialType').notEmpty().withMessage('Material type is required'),
  body('terms.quantity.value').isFloat({ min: 0 }).withMessage('Quantity must be positive'),
  body('terms.price.value').isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('terms.deliveryDate').isISO8601().withMessage('Valid delivery date is required'),
  body('terms.paymentTerms').isIn(['advance', 'cod', 'net-15', 'net-30', 'net-45']).withMessage('Invalid payment terms')
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

    const negotiation = await Negotiation.findById(req.body.negotiationId)
      .populate('participants.user', 'name company.name');

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
        message: 'Not authorized to create contract from this negotiation'
      });
    }

    // Find seller and buyer
    const seller = negotiation.participants.find(p => p.role === 'seller');
    const buyer = negotiation.participants.find(p => p.role === 'buyer');

    const contractData = {
      title: `Contract for ${req.body.terms.materialType}`,
      parties: {
        seller: {
          user: seller.user._id,
          company: seller.user.company.name
        },
        buyer: {
          user: buyer.user._id,
          company: buyer.user.company.name
        }
      },
      relatedNegotiation: negotiation._id,
      relatedListing: negotiation.relatedListing,
      terms: req.body.terms,
      status: 'draft'
    };

    const contract = new Contract(contractData);
    await contract.save();

    // Update negotiation status
    negotiation.status = 'completed';
    negotiation.contract = contract._id;
    await negotiation.save();

    await contract.populate('parties.seller.user', 'name company.name');
    await contract.populate('parties.buyer.user', 'name company.name');

    res.status(201).json({
      success: true,
      message: 'Contract created successfully',
      data: { contract }
    });
  } catch (error) {
    console.error('Create contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating contract'
    });
  }
});

// @route   POST /api/contracts/:id/sign
// @desc    Sign contract
// @access  Private
router.post('/:id/sign', [
  auth,
  body('signature').notEmpty().withMessage('Digital signature is required')
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

    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    // Check if user is party to the contract
    const isSeller = contract.parties.seller.user.toString() === req.user._id.toString();
    const isBuyer = contract.parties.buyer.user.toString() === req.user._id.toString();

    if (!isSeller && !isBuyer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to sign this contract'
      });
    }

    // Sign the contract
    const signatureData = {
      signedAt: new Date(),
      signature: req.body.signature,
      ipAddress: req.ip
    };

    if (isSeller) {
      contract.parties.seller = { ...contract.parties.seller, ...signatureData };
    } else {
      contract.parties.buyer = { ...contract.parties.buyer, ...signatureData };
    }

    // Check if both parties have signed
    if (contract.parties.seller.signedAt && contract.parties.buyer.signedAt) {
      contract.status = 'signed';
    } else {
      contract.status = 'pending';
    }

    // Add to audit trail
    contract.auditTrail.push({
      action: 'Contract signed',
      performedBy: req.user._id,
      details: { role: isSeller ? 'seller' : 'buyer' }
    });

    await contract.save();

    res.json({
      success: true,
      message: 'Contract signed successfully',
      data: { contract }
    });
  } catch (error) {
    console.error('Sign contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while signing contract'
    });
  }
});

module.exports = router;