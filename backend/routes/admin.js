const express = require('express');
const { query, validationResult } = require('express-validator');
const User = require('../models/User');
const WasteListing = require('../models/WasteListing');
const MaterialRequest = require('../models/MaterialRequest');
const Contract = require('../models/Contract');
const Shipment = require('../models/Shipment');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard data
// @access  Private (Admin only)
router.get('/dashboard', [auth, authorize('admin')], async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const totalUsers = await User.countDocuments();
    const usersThisMonth = await User.countDocuments({ createdAt: { $gte: startOfMonth } });
    const usersLastMonth = await User.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } });

    const totalListings = await WasteListing.countDocuments();
    const activeListings = await WasteListing.countDocuments({ status: 'active' });

    const totalContracts = await Contract.countDocuments();
    const signedContracts = await Contract.countDocuments({
      status: { $in: ['signed', 'executed'] }
    });
    const completedContracts = await Contract.countDocuments({ status: 'completed' });

    const completedContractsData = await Contract.find({ status: 'completed' });
    const totalVolume = completedContractsData.reduce(
      (sum, contract) => sum + contract.terms.totalValue,
      0
    );
    
    const platformRevenue = completedContractsData.reduce(
      (sum, contract) => sum + (contract.platformFee?.amount || contract.terms.totalValue * 0.025),
      0
    );
    

    const userGrowth = usersLastMonth > 0 ? ((usersThisMonth - usersLastMonth) / usersLastMonth * 100) : 0;

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email type company.name company.verified createdAt');

    const recentContracts = await Contract.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('parties.seller.user', 'name company.name')
      .populate('parties.buyer.user', 'name company.name');

      const startedAt = new Date(Date.now() - process.uptime() * 1000);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          userGrowth: Math.round(userGrowth * 10) / 10,
          totalVolume,
          volumeGrowth: 18.3,
          activeDeals: signedContracts,
          completedDeals: completedContracts,
          platformRevenue,
          revenueGrowth: 0
        },
        recentUsers,
        recentContracts,
        systemHealth: {
          startedAt,
          memoryUsage: process.memoryUsage(),
          activeConnections: totalUsers
        }
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data'
    });
  }
});


// @route   GET /api/admin/users
// @desc    Get all users with filters
// @access  Private (Admin only)
router.get('/users', [
  auth,
  authorize('admin'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isIn(['seller', 'buyer']),
  query('verified').optional().isBoolean()
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
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.verified !== undefined) filter['company.verified'] = req.query.verified === 'true';
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { 'company.name': { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
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
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// @route   GET /api/admin/transactions
// @desc    Get all transactions
// @access  Private (Admin only)
router.get('/transactions', [auth, authorize('admin')], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const contracts = await Contract.find({ status: { $in: ['signed', 'executed', 'completed'] } })
      .populate('parties.seller.user', 'name company.name')
      .populate('parties.buyer.user', 'name company.name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Contract.countDocuments({ status: { $in: ['signed', 'executed', 'completed'] } });

    // Prepare transactions and sum commission
    let totalRevenue = 0;

    const transactions = contracts.map(contract => {
      const commission = contract.platformFee?.amount || (contract.terms.totalValue * 0.025);
      totalRevenue += commission;

      return {
        id: contract._id,
        contractNumber: contract.contractNumber,
        seller: contract.parties.seller.user.name,
        sellerCompany: contract.parties.seller.user.company.name,
        buyer: contract.parties.buyer.user.name,
        buyerCompany: contract.parties.buyer.user.company.name,
        material: contract.terms.materialType,
        amount: contract.terms.totalValue,
        commission,
        status: contract.status,
        date: contract.createdAt
      };
    });

    res.json({
      success: true,
      data: {
        transactions,
        totalRevenue,
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
    console.error('Get admin transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transactions'
    });
  }
});


// @route   GET /api/admin/analytics
// @desc    Get platform analytics
// @access  Private (Admin only)
router.get('/analytics', [auth, authorize('admin')], async (req, res) => {
  try {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // User growth over time
    const userGrowth = await User.aggregate([
      {
        $match: { createdAt: { $gte: last30Days } }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Transaction volume over time
    const transactionVolume = await Contract.aggregate([
      {
        $match: { 
          createdAt: { $gte: last30Days },
          status: { $in: ['signed', 'executed', 'completed'] }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          volume: { $sum: "$terms.totalValue" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Category distribution
    const categoryDistribution = await WasteListing.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Geographic distribution
    const geographicDistribution = await User.aggregate([
      {
        $group: {
          _id: "$company.address.state",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        userGrowth,
        transactionVolume,
        categoryDistribution,
        geographicDistribution
      }
    });
  } catch (error) {
    console.error('Get admin analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics'
    });
  }
});

module.exports = router;