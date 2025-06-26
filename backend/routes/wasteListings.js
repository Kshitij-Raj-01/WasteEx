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
  
  // Basic required fields
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
  body('urgency').isIn(['low', 'medium', 'high']).withMessage('Invalid urgency level'),
  
  // Images validation
  body('images').optional().isArray().withMessage('Images must be an array'),
  body('images.*.url').optional().isURL().withMessage('Image URL must be valid'),
  body('images.*.caption').optional().isString().withMessage('Image caption must be a string'),
  body('images.*.publicId').optional().isString().withMessage('Image publicId must be a string'),
  
  // Documents validation
  body('documents').optional().isArray().withMessage('Documents must be an array'),
  body('documents.*.type').optional().isString().withMessage('Document type must be a string'),
  body('documents.*.url').optional().isURL().withMessage('Document URL must be valid'),
  body('documents.*.name').optional().isString().withMessage('Document name must be a string'),
  
  // MSDS validation
  body('msds').optional().isObject().withMessage('MSDS must be an object'),
  body('msds.url').optional().isURL().withMessage('MSDS URL must be valid'),
  body('msds.verified').optional().isBoolean().withMessage('MSDS verified must be a boolean'),
  
  // Specifications validation
  body('specifications').optional().isObject().withMessage('Specifications must be an object'),
  body('specifications.purity').optional().isString().withMessage('Purity must be a string'),
  body('specifications.moisture').optional().isString().withMessage('Moisture must be a string'),
  body('specifications.contamination').optional().isString().withMessage('Contamination must be a string'),
  body('specifications.packaging').optional().isString().withMessage('Packaging must be a string'),
  body('specifications.storageConditions').optional().isString().withMessage('Storage conditions must be a string'),
  
  // Other fields validation
  body('hazardous').optional().isBoolean().withMessage('Hazardous must be a boolean'),
  body('certifications').optional().isArray().withMessage('Certifications must be an array'),
  body('certifications.*').optional().isString().withMessage('Each certification must be a string'),
  body('description').optional().isString().withMessage('Description must be a string'),
  
  // Price validation
  body('price.currency').optional().isString().withMessage('Currency must be a string'),
  body('price.negotiable').optional().isBoolean().withMessage('Negotiable must be a boolean'),
  
  // Location validation
  body('location.address').optional().isString().withMessage('Address must be a string'),
  body('location.pincode').optional().isString().withMessage('Pincode must be a string'),
  body('location.coordinates').optional().isObject().withMessage('Coordinates must be an object'),
  body('location.coordinates.latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('location.coordinates.longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  
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

    // Additional custom validation
    const { images, documents, msds, specifications, certifications } = req.body;
    
    // Validate images array structure
    if (images && Array.isArray(images)) {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (!image.url || typeof image.url !== 'string') {
          return res.status(400).json({
            success: false,
            message: `Image at index ${i} must have a valid URL`
          });
        }
      }
    }
    
    // Validate documents array structure
    if (documents && Array.isArray(documents)) {
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        if (!doc.type || !doc.url || !doc.name) {
          return res.status(400).json({
            success: false,
            message: `Document at index ${i} must have type, url, and name`
          });
        }
      }
    }
    
    // Validate MSDS structure
    if (msds && typeof msds === 'object') {
      if (msds.url && typeof msds.url !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'MSDS URL must be a string'
        });
      }
      if (msds.verified !== undefined && typeof msds.verified !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'MSDS verified must be a boolean'
        });
      }
    }
    
    // Validate certifications array
    if (certifications && Array.isArray(certifications)) {
      for (let i = 0; i < certifications.length; i++) {
        if (typeof certifications[i] !== 'string') {
          return res.status(400).json({
            success: false,
            message: `Certification at index ${i} must be a string`
          });
        }
      }
    }
    
    // Validate specifications object
    if (specifications && typeof specifications === 'object') {
      const validSpecFields = ['purity', 'moisture', 'contamination', 'packaging', 'storageConditions'];
      for (const field of validSpecFields) {
        if (specifications[field] !== undefined && typeof specifications[field] !== 'string') {
          return res.status(400).json({
            success: false,
            message: `Specification ${field} must be a string`
          });
        }
      }
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
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
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
  
  // Optional validation for updates
  body('title').optional().trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
  body('quantity.value').optional().isFloat({ min: 0 }).withMessage('Quantity must be a positive number'),
  body('price.value').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  
  // Images validation (optional for updates)
  body('images').optional().isArray().withMessage('Images must be an array'),
  body('images.*.url').optional().isURL().withMessage('Image URL must be valid'),
  body('images.*.caption').optional().isString().withMessage('Image caption must be a string'),
  
  // Documents validation (optional for updates)
  body('documents').optional().isArray().withMessage('Documents must be an array'),
  body('documents.*.type').optional().isString().withMessage('Document type must be a string'),
  body('documents.*.url').optional().isURL().withMessage('Document URL must be valid'),
  body('documents.*.name').optional().isString().withMessage('Document name must be a string'),
  
  // MSDS validation (optional for updates)
  body('msds').optional().isObject().withMessage('MSDS must be an object'),
  body('msds.url').optional().isURL().withMessage('MSDS URL must be valid'),
  body('msds.verified').optional().isBoolean().withMessage('MSDS verified must be a boolean'),
  
  // Specifications validation (optional for updates)
  body('specifications').optional().isObject().withMessage('Specifications must be an object'),
  body('specifications.purity').optional().isString().withMessage('Purity must be a string'),
  body('specifications.moisture').optional().isString().withMessage('Moisture must be a string'),
  body('specifications.contamination').optional().isString().withMessage('Contamination must be a string'),
  body('specifications.packaging').optional().isString().withMessage('Packaging must be a string'),
  body('specifications.storageConditions').optional().isString().withMessage('Storage conditions must be a string'),
  
  // Other fields validation (optional for updates)
  body('hazardous').optional().isBoolean().withMessage('Hazardous must be a boolean'),
  body('certifications').optional().isArray().withMessage('Certifications must be an array'),
  body('certifications.*').optional().isString().withMessage('Each certification must be a string'),
  body('description').optional().isString().withMessage('Description must be a string'),
  
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

    // Update listing with nested object handling
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        if (key === 'specifications' && typeof req.body[key] === 'object') {
          // Merge specifications object
          listing.specifications = { ...listing.specifications, ...req.body[key] };
        } else if (key === 'msds' && typeof req.body[key] === 'object') {
          // Merge MSDS object
          listing.msds = { ...listing.msds, ...req.body[key] };
        } else if (key === 'location' && typeof req.body[key] === 'object') {
          // Merge location object
          listing.location = { ...listing.location, ...req.body[key] };
        } else if (key === 'price' && typeof req.body[key] === 'object') {
          // Merge price object
          listing.price = { ...listing.price, ...req.body[key] };
        } else if (key === 'quantity' && typeof req.body[key] === 'object') {
          // Merge quantity object
          listing.quantity = { ...listing.quantity, ...req.body[key] };
        } else {
          listing[key] = req.body[key];
        }
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
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
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