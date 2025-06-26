const express = require('express');
const { body, query, validationResult } = require('express-validator');
const MaterialRequest = require('../models/MaterialRequest');
const WasteListing = require('../models/WasteListing');
const { auth, authorize, verifyCompany } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/material-requests
// @desc    Get all material requests with filters
// @access  Private (Sellers can view to find matches)
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isString(),
  query('urgency').optional().isIn(['low', 'medium', 'high']),
  query('status').optional().isIn(['active', 'fulfilled', 'cancelled', 'expired']),
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
    if (req.query.urgency) filter.urgency = req.query.urgency;
    if (req.query.status) filter.status = req.query.status;
    else filter.status = 'active'; // Default to active requests

    // Text search
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // If user is a buyer, show only their requests
    if (req.user.type === 'buyer') {
      filter.buyer = req.user._id;
    }

    const requests = await MaterialRequest.find(filter)
      .populate('buyer', 'name company.name company.verified')
      .sort({ urgency: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MaterialRequest.countDocuments(filter);

    res.json({
      success: true,
      data: {
        requests,
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
    console.error('Get material requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching material requests'
    });
  }
});

// @route   GET /api/material-requests/:id
// @desc    Get single material request
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await MaterialRequest.findById(req.params.id)
      .populate('buyer', 'name company.name company.verified company.address phone')
      .populate('responses.seller', 'name company.name company.verified')
      .populate('matches.listing', 'title wasteType quantity price location');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Material request not found'
      });
    }

    // Check access permissions
    if (req.user.type === 'buyer' && request.buyer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this request'
      });
    }

    res.json({
      success: true,
      data: {
        request
      }
    });
  } catch (error) {
    console.error('Get material request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching material request'
    });
  }
});

// @route   POST /api/material-requests
// @desc    Create new material request
// @access  Private (Buyers only)
router.post('/', [
  auth,
  authorize('buyer'),
  verifyCompany,
  body('title').trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
  body('materialType').notEmpty().withMessage('Material type is required'),
  body('category').isIn([
    'Plastic Materials', 'Metal Materials', 'Paper Materials', 'Textile Materials',
    'Chemical Materials', 'Electronic Materials', 'Rubber Materials', 'Glass Materials',
    'Wood Materials', 'Organic Materials'
  ]).withMessage('Invalid category'),
  body('quantity.value').isFloat({ min: 0 }).withMessage('Quantity must be a positive number'),
  body('quantity.unit').isIn(['kg', 'tonnes', 'liters', 'pieces', 'm3']).withMessage('Invalid unit'),
  body('frequency').isIn(['daily', 'weekly', 'monthly', 'one-time']).withMessage('Invalid frequency'),
  body('budget.max').isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
  body('qualityGrade').isIn(['Grade A', 'Grade B', 'Grade C', 'Industrial Grade', 'Food Grade', 'Medical Grade']).withMessage('Invalid quality grade'),
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

    const requestData = {
      ...req.body,
      buyer: req.user._id
    };

    const materialRequest = new MaterialRequest(requestData);
    await materialRequest.save();

    // Find potential matches
    await findMatches(materialRequest);

    await materialRequest.populate('buyer', 'name company.name company.verified');

    res.status(201).json({
      success: true,
      message: 'Material request created successfully',
      data: {
        request: materialRequest
      }
    });
  } catch (error) {
    console.error('Create material request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating material request'
    });
  }
});

// @route   PUT /api/material-requests/:id
// @desc    Update material request
// @access  Private (Owner only)
router.put('/:id', [
  auth,
  authorize('buyer'),
  body('title').optional().trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
  body('quantity.value').optional().isFloat({ min: 0 }).withMessage('Quantity must be a positive number'),
  body('budget.max').optional().isFloat({ min: 0 }).withMessage('Budget must be a positive number')
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

    const request = await MaterialRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Material request not found'
      });
    }

    // Check ownership
    if (request.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this request'
      });
    }

    // Update request
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        request[key] = req.body[key];
      }
    });

    await request.save();

    // Re-find matches if material type or requirements changed
    if (req.body.materialType || req.body.category || req.body.quantity || req.body.budget) {
      await findMatches(request);
    }

    await request.populate('buyer', 'name company.name company.verified');

    res.json({
      success: true,
      message: 'Material request updated successfully',
      data: {
        request
      }
    });
  } catch (error) {
    console.error('Update material request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating material request'
    });
  }
});

// @route   DELETE /api/material-requests/:id
// @desc    Delete material request
// @access  Private (Owner only)
router.delete('/:id', auth, authorize('buyer'), async (req, res) => {
  try {
    const request = await MaterialRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Material request not found'
      });
    }

    // Check ownership
    if (request.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this request'
      });
    }

    await request.deleteOne();

    res.json({
      success: true,
      message: 'Material request deleted successfully'
    });
  } catch (error) {
    console.error('Delete material request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting material request'
    });
  }
});

// @route   POST /api/material-requests/:id/respond
// @desc    Respond to a material request
// @access  Private (Sellers only)
router.post('/:id/respond', [
  auth,
  authorize('seller'),
  verifyCompany,
  body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
  body('quotedPrice').optional().isFloat({ min: 0 }).withMessage('Quoted price must be a positive number'),
  body('listing').optional().isMongoId().withMessage('Invalid listing ID')
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

    const request = await MaterialRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Material request not found'
      });
    }

    if (request.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot respond to inactive request'
      });
    }

    // Check if seller already responded
    const existingResponse = request.responses.find(
      response => response.seller.toString() === req.user._id.toString()
    );

    if (existingResponse) {
      return res.status(400).json({
        success: false,
        message: 'You have already responded to this request'
      });
    }

    // Validate listing if provided
    if (req.body.listing) {
      const listing = await WasteListing.findOne({
        _id: req.body.listing,
        seller: req.user._id,
        status: 'active'
      });

      if (!listing) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or inactive listing'
        });
      }
    }

    // Add response
    request.responses.push({
      seller: req.user._id,
      listing: req.body.listing,
      message: req.body.message,
      quotedPrice: req.body.quotedPrice
    });

    await request.save();

    res.json({
      success: true,
      message: 'Response sent successfully'
    });
  } catch (error) {
    console.error('Respond to request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending response'
    });
  }
});

// Helper function to find matches for a material request
async function findMatches(request) {
  try {
    // Build search criteria
    const searchCriteria = {
      status: 'active',
      category: getCategoryMapping(request.category),
      'quantity.value': { $gte: request.quantity.value * 0.5 }, // At least 50% of required quantity
      'price.value': { $lte: request.budget.max * 1.2 } // Within 120% of budget
    };

    // Add location filter if specified
    if (request.location.preferredCities && request.location.preferredCities.length > 0) {
      searchCriteria['location.city'] = { $in: request.location.preferredCities };
    }

    const potentialMatches = await WasteListing.find(searchCriteria)
      .populate('seller', 'name company.name company.verified')
      .limit(10);

    // Calculate match scores and add to request
    const matches = potentialMatches.map(listing => {
      const matchScore = calculateMatchScore(request, listing);
      const reasons = getMatchReasons(request, listing);
      
      return {
        listing: listing._id,
        matchScore,
        reasons
      };
    });

    // Sort by match score and update request
    matches.sort((a, b) => b.matchScore - a.matchScore);
    request.matches = matches;
    
    await request.save();
  } catch (error) {
    console.error('Find matches error:', error);
  }
}

// Helper function to map material categories to waste categories
function getCategoryMapping(materialCategory) {
  const mapping = {
    'Plastic Materials': 'Plastic Waste',
    'Metal Materials': 'Metal Scrap',
    'Paper Materials': 'Paper Waste',
    'Textile Materials': 'Textile Waste',
    'Chemical Materials': 'Chemical Waste',
    'Electronic Materials': 'Electronic Waste',
    'Rubber Materials': 'Rubber Waste',
    'Glass Materials': 'Glass Waste',
    'Wood Materials': 'Wood Waste',
    'Organic Materials': 'Organic Waste'
  };
  
  return mapping[materialCategory] || materialCategory;
}

// Helper function to calculate match score
function calculateMatchScore(request, listing) {
  let score = 0;
  
  // Category match (40 points)
  if (getCategoryMapping(request.category) === listing.category) {
    score += 40;
  }
  
  // Quantity match (20 points)
  const quantityRatio = Math.min(listing.quantity.value / request.quantity.value, 1);
  score += quantityRatio * 20;
  
  // Price match (20 points)
  if (listing.price.value <= request.budget.max) {
    const priceScore = (request.budget.max - listing.price.value) / request.budget.max;
    score += priceScore * 20;
  }
  
  // Location match (10 points)
  if (request.location.preferredCities && 
      request.location.preferredCities.includes(listing.location.city)) {
    score += 10;
  }
  
  // Urgency match (5 points)
  if (request.urgency === listing.urgency) {
    score += 5;
  }
  
  // Frequency match (5 points)
  if (request.frequency === listing.frequency) {
    score += 5;
  }
  
  return Math.round(score);
}

// Helper function to get match reasons
function getMatchReasons(request, listing) {
  const reasons = [];
  
  if (getCategoryMapping(request.category) === listing.category) {
    reasons.push('Category match');
  }
  
  if (listing.quantity.value >= request.quantity.value) {
    reasons.push('Sufficient quantity available');
  }
  
  if (listing.price.value <= request.budget.max) {
    reasons.push('Within budget');
  }
  
  if (request.location.preferredCities && 
      request.location.preferredCities.includes(listing.location.city)) {
    reasons.push('Preferred location');
  }
  
  if (request.urgency === listing.urgency) {
    reasons.push('Matching urgency');
  }
  
  return reasons;
}

module.exports = router;