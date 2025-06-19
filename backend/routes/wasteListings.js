const express = require('express');
const { body, query, validationResult } = require('express-validator');
const WasteListing = require('../models/WasteListing');
const { auth, authorize, verifyCompany } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/waste-listings
// @desc    Get all waste listings with filters
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isString(),
  query('city').optional().isString(),
  query('state').optional().isString(),
  query('urgency').optional().isIn(['low', 'medium', 'high']),
  query('status').optional().isIn(['active', 'inactive', 'sold', 'expired']),
  query('search').optional().isString()
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

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    if (req.query.category) filter.category = req.query.category;
    if (req.query.city) filter['location.city'] = new RegExp(req.query.city, 'i');
    if (req.query.state) filter['location.state'] = new RegExp(req.query.state, 'i');
    if (req.query.urgency) filter.urgency = req.query.urgency;
    if (req.query.status) filter.status = req.query.status;
    else filter.status = 'active'; // Default to active listings

    // Text search
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // Execute query
    const listings = await WasteListing.find(filter)
      .populate('seller', 'name company.name company.verified')
      .sort({ featured: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await WasteListing.countDocuments(filter);

    res.json({
      success: true,
      data: {
        listings,
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
    console.error('Get listings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching listings'
    });
  }
});

// @route   GET /api/waste-listings/:id
// @desc    Get single waste listing
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const listing = await WasteListing.findById(req.params.id)
      .populate('seller', 'name company.name company.verified company.address phone')
      .populate('inquiries.buyer', 'name company.name');

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Increment view count
    listing.views += 1;
    await listing.save();

    res.json({
      success: true,
      data: {
        listing
      }
    });
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching listing'
    });
  }
});

// @route   POST /api/waste-listings
// @desc    Create new waste listing
// @access  Private (Sellers only)
router.post('/', [
  auth,
  authorize('seller'),
  verifyCompany,
  body('title').trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
  body('wasteType').notEmpty().withMessage('Waste type is required'),
  body('category').isIn([
    'Plastic Waste', 'Metal Scrap', 'Paper Waste', 'Textile Waste',
    'Chemical Waste', 'Electronic Waste', 'Rubber Waste', 'Glass Waste',
    'Wood Waste', 'Organic Waste'
  ]).withMessage('Invalid category'),
  body('quantity.value').isFloat({ min: 0 }).withMessage('Quantity must be a positive number'),
  body('quantity.unit').isIn(['kg', 'tonnes', 'liters', 'pieces', 'm3']).withMessage('Invalid unit'),
  body('frequency').isIn(['daily', 'weekly', 'monthly', 'one-time']).withMessage('Invalid frequency'),
  body('price.value').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('location.city').notEmpty().withMessage('City is required'),
  body('location.state').notEmpty().withMessage('State is required'),
  body('urgency').isIn(['low', 'medium', 'high']).withMessage('Invalid urgency level')
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

    const listingData = {
      ...req.body,
      seller: req.user._id
    };

    const listing = new WasteListing(listingData);
    await listing.save();

    await listing.populate('seller', 'name company.name company.verified');

    res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      data: {
        listing
      }
    });
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating listing'
    });
  }
});

// @route   PUT /api/waste-listings/:id
// @desc    Update waste listing
// @access  Private (Owner only)
router.put('/:id', [
  auth,
  authorize('seller'),
  body('title').optional().trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
  body('quantity.value').optional().isFloat({ min: 0 }).withMessage('Quantity must be a positive number'),
  body('price.value').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number')
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

    const listing = await WasteListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Check ownership
    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this listing'
      });
    }

    // Update listing
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        listing[key] = req.body[key];
      }
    });

    await listing.save();
    await listing.populate('seller', 'name company.name company.verified');

    res.json({
      success: true,
      message: 'Listing updated successfully',
      data: {
        listing
      }
    });
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating listing'
    });
  }
});

// @route   DELETE /api/waste-listings/:id
// @desc    Delete waste listing
// @access  Private (Owner only)
router.delete('/:id', auth, authorize('seller'), async (req, res) => {
  try {
    const listing = await WasteListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Check ownership
    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this listing'
      });
    }

    await listing.deleteOne();

    res.json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting listing'
    });
  }
});

// @route   POST /api/waste-listings/:id/inquire
// @desc    Send inquiry about a listing
// @access  Private (Buyers only)
router.post('/:id/inquire', [
  auth,
  authorize('buyer'),
  verifyCompany,
  body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters')
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

    const listing = await WasteListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    if (listing.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot inquire about inactive listing'
      });
    }

    // Check if user already inquired
    const existingInquiry = listing.inquiries.find(
      inquiry => inquiry.buyer.toString() === req.user._id.toString()
    );

    if (existingInquiry) {
      return res.status(400).json({
        success: false,
        message: 'You have already inquired about this listing'
      });
    }

    // Add inquiry
    listing.inquiries.push({
      buyer: req.user._id,
      message: req.body.message
    });

    await listing.save();

    res.json({
      success: true,
      message: 'Inquiry sent successfully'
    });
  } catch (error) {
    console.error('Inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending inquiry'
    });
  }
});

// @route   GET /api/waste-listings/my/listings
// @desc    Get current user's listings
// @access  Private (Sellers only)
router.get('/my/listings', auth, authorize('seller'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { seller: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const listings = await WasteListing.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await WasteListing.countDocuments(filter);

    res.json({
      success: true,
      data: {
        listings,
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
    console.error('Get my listings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your listings'
    });
  }
});

module.exports = router;