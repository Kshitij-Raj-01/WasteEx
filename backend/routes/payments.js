const express = require('express');
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Contract = require('../models/Contract');
const Shipment = require('../models/Shipment');
const { auth, authorize } = require('../middleware/auth');
const razorpay = require('../utils/razorpayInstance');
const crypto = require('crypto');

const router = express.Router();

// @route   POST /api/payments/create-order
// @desc    Create Razorpay order and save payment record
// @access  Private (Buyer only)
router.post('/create-order', [
  auth,
  authorize('buyer'),
  body('contractId').isMongoId().withMessage('Invalid contract ID')
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

    if (contract.parties.buyer.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the buyer can initiate payment'
      });
    }

    if (contract.status !== 'signed') {
      return res.status(400).json({
        success: false,
        message: 'Contract must be signed before payment'
      });
    }

    const existingPayment = await Payment.findOne({ contract: contract._id });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment already initiated for this contract'
      });
    }

    const totalAmount = contract.terms.totalValue;
    const platformFeePercentage = totalAmount > 100000 ? 0.025 : (totalAmount > 10000 ? 0.025 : 0.05);
    const platformFee = Math.round(totalAmount * platformFeePercentage);
    const sellerAmount = totalAmount - platformFee;

    // ✨ Create Razorpay Order
    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmount * 100, // Convert to paise
      currency: 'INR',
      receipt: contract._id.toString().slice(-10) // < 40 chars
    });

    // 💗 Create Payment entry (without paymentMethod or paymentId)
    const payment = new Payment({
      contract: contract._id,
      buyer: contract.parties.buyer.user,
      seller: contract.parties.seller.user,
      amount: {
        total: totalAmount,
        sellerAmount,
        platformFee
      },
      gatewayDetails: {
        provider: 'razorpay',
        gatewayOrderId: razorpayOrder.id
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    await payment.save();

    contract.payment = payment._id;
    contract.paymentStatus = 'pending';
    await contract.save();

    await payment.addTimelineEntry('pending', 'Payment order created', req.user._id);

    res.status(201).json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        payment,
        gatewayResponse: {
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          key: process.env.RAZORPAY_KEY_ID,
          name: 'WasteEx',
          description: `Payment for ${contract.terms.materialType}`,
          prefill: {
            name: req.user.name,
            email: req.user.email
          }
        }
      }
    });

  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating payment order'
    });
  }
});

// @route   POST /api/payments/verify
// @desc    Verify Razorpay payment signature
// @access  Private
router.post('/verify', [
  auth,
  body('paymentId').notEmpty().withMessage('Payment ID is required'),
  body('gatewayPaymentId').notEmpty().withMessage('Gateway payment ID is required'),
  body('signature').notEmpty().withMessage('Signature is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { paymentId, gatewayPaymentId, signature } = req.body;
    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${payment.gatewayDetails.gatewayOrderId}|${gatewayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== signature) {
      payment.status = 'failed';
      await payment.addTimelineEntry('failed', 'Payment verification failed', req.user._id);
      await payment.save();
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    payment.gatewayDetails.gatewayPaymentId = gatewayPaymentId;
    payment.gatewayDetails.signature = signature;
    payment.paymentMethod = 'razorpay';
    payment.status = 'held_in_escrow';
    payment.escrow.heldAt = new Date();
    payment.escrow.autoReleaseDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await payment.save();
    await payment.addTimelineEntry('held_in_escrow', 'Payment verified and held in escrow', req.user._id);

    const contract = await Contract.findById(payment.contract);
    contract.status = 'executed';
    contract.paymentStatus = 'held_in_escrow';
    await contract.save();

    res.json({
      success: true,
      message: 'Payment verified and held in escrow',
      data: { payment }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: 'Server error during verification' });
  }
});


// @route   POST /api/payments/:id/confirm-delivery
// @desc    Confirm delivery to release payment
// @access  Private (Buyer only)
router.post('/:id/confirm-delivery', [
  auth,
  authorize('buyer'),
  body('qualityApproved').isBoolean().withMessage('Quality approval status is required')
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

    const payment = await Payment.findById(req.params.id).populate('contract');
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the buyer can confirm delivery' });
    }

    if (payment.status !== 'held_in_escrow') {
      return res.status(400).json({ success: false, message: 'Payment is not in escrow' });
    }

    const shipment = await Shipment.findOne({ contract: payment.contract._id });
    const deliveryConfirmed = shipment && shipment.status === 'delivered';

    payment.escrow.releaseConditions.deliveryConfirmed = deliveryConfirmed || true;
    payment.escrow.releaseConditions.qualityApproved = req.body.qualityApproved;

    await payment.save();
    await payment.addTimelineEntry('delivery_confirmed', deliveryConfirmed ? 
      'Auto-confirmed based on shipment status' : 
      'Delivery manually confirmed by buyer', req.user._id);

    if (payment.canRelease) {
      await releasePaymentToSeller(payment, req.user._id);
    }

    res.json({
      success: true,
      message: deliveryConfirmed ? 'Delivery auto-confirmed and payment released' : 'Delivery confirmed manually',
      data: { payment }
    });
  } catch (error) {
    console.error('Confirm delivery error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while confirming delivery'
    });
  }
});


// @route   POST /api/payments/:id/release
// @desc    Release payment to seller (Admin or auto-release)
// @access  Private
router.post('/:id/release', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check authorization
    const isAdmin = req.user.type === 'admin';
    const isAutoRelease = payment.escrow.autoReleaseDate && new Date() > payment.escrow.autoReleaseDate;
    const canRelease = payment.canRelease;

    if (!isAdmin && !isAutoRelease && !canRelease) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to release payment'
      });
    }

    if (payment.status !== 'held_in_escrow') {
      return res.status(400).json({
        success: false,
        message: 'Payment is not in escrow'
      });
    }

    await releasePaymentToSeller(payment, req.user._id);

    res.json({
      success: true,
      message: 'Payment released to seller successfully',
      data: { payment }
    });
  } catch (error) {
    console.error('Release payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while releasing payment'
    });
  }
});

// @route   GET /api/payments
// @desc    Get user's payments
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      $or: [
        { buyer: req.user._id },
        { seller: req.user._id }
      ]
    };

    if (req.query.status) filter.status = req.query.status;

    const payments = await Payment.find(filter)
      .populate('buyer', 'name company.name')
      .populate('seller', 'name company.name')
      .populate('contract', 'contractNumber terms.materialType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(filter);

    res.json({
      success: true,
      data: {
        payments,
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
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payments'
    });
  }
});

// Helper function to release payment to seller
async function releasePaymentToSeller(payment, performedBy) {
  payment.status = 'released_to_seller';
  payment.escrow.releasedAt = new Date();
  
  await payment.save();
  await payment.addTimelineEntry('released_to_seller', 'Payment released to seller', performedBy);

  // Update contract status
  const contract = await Contract.findById(payment.contract);
  contract.status = 'completed';
  await contract.save();

  // In real implementation, initiate actual transfer to seller's account
  console.log(`Payment of ₹${payment.amount.sellerAmount} released to seller`);
}

module.exports = router;