// contracts.js (Updated with wait for tx confirmation and comments)
const express = require('express');
const { body, validationResult } = require('express-validator');
const Contract = require('../models/Contract');
const Negotiation = require('../models/Negotiation');
const { auth } = require('../middleware/auth');
const deployContract = require('../blockchain/DeployWasteContract');
const User = require('../models/User');
const abiJson = require('../blockchain/WasteContractAbi.json');
const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const router = express.Router();

// GET /api/contracts - Fetch all contracts for current user
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
    res.status(500).json({ success: false, message: 'Server error while fetching contracts' });
  }
});

// GET /api/contracts/:id - Get single contract by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('parties.seller.user', 'name company.name company.address phone')
      .populate('parties.buyer.user', 'name company.name company.address phone')
      .populate('relatedNegotiation', 'title')
      .populate('relatedListing', 'title wasteType');

    if (!contract) return res.status(404).json({ success: false, message: 'Contract not found' });

    const isParty = contract.parties.seller.user._id.toString() === req.user._id.toString() ||
                    contract.parties.buyer.user._id.toString() === req.user._id.toString();

    if (!isParty && req.user.type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this contract' });
    }

    const contractInstance = new ethers.Contract(contract.blockchain.contractAddress, abiJson.abi, wallet);
    const sellerSigned = await contractInstance.sellerSigned();
    const buyerSigned = await contractInstance.buyerSigned();
    const isFullySigned = await contractInstance.isFullySigned();

    console.log("Seller Signed:", sellerSigned);
    console.log("Buyer Signed:", buyerSigned);
    console.log("Is Fully Signed?", isFullySigned);

    res.json({ success: true, data: { contract } });
  } catch (error) {
    console.error('Get contract error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching contract' });
  }
});

// POST /api/contracts - Create new contract from negotiation
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
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const negotiation = await Negotiation.findById(req.body.negotiationId).populate('participants.user', 'name company.name blockchainAddress');
    if (!negotiation) return res.status(404).json({ success: false, message: 'Negotiation not found' });

    const isParticipant = negotiation.participants.some(p => p.user._id.toString() === req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ success: false, message: 'Not authorized' });

    const seller = negotiation.participants.find(p => p.role === 'seller');
    const buyer = negotiation.participants.find(p => p.role === 'buyer');

    const getCode = name => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 6);
    const sellerCode = getCode(seller.user.company.name);
    const buyerCode = getCode(buyer.user.company.name);
    const year = new Date().getFullYear();

    const lastContract = await Contract.findOne({ 'parties.seller.company': seller.user.company.name, 'parties.buyer.company': buyer.user.company.name }).sort({ createdAt: -1 });
    let sequence = 1001;
    if (lastContract?.contractNumber) {
      const parts = lastContract.contractNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastSeq)) sequence = lastSeq + 1;
    }
    const newContractNumber = `C-${year}-${sellerCode}-${buyerCode}-${sequence}`;

    const contract = new Contract({
      contractNumber: newContractNumber,
      title: `Contract for ${req.body.terms.materialType}`,
      parties: {
        seller: { user: seller.user._id, company: seller.user.company.name },
        buyer: { user: buyer.user._id, company: buyer.user.company.name }
      },
      relatedNegotiation: negotiation._id,
      relatedListing: negotiation.relatedListing,
      terms: req.body.terms,
      status: 'pending'
    });
    await contract.save();

    const deployed = await deployContract(JSON.stringify(req.body.terms));
    contract.blockchain = {
      deployed: true,
      contractAddress: deployed.address,
      transactionHash: deployed.transactionHash,
      deployedAt: new Date().toISOString()
    };
    await contract.save();

    negotiation.status = 'completed';
    negotiation.contract = contract._id;
    await negotiation.save();

    await contract.populate('parties.seller.user', 'name company.name');
    await contract.populate('parties.buyer.user', 'name company.name');

    res.status(201).json({ success: true, message: 'Contract created', data: { contract } });
  } catch (error) {
    console.error('Create contract error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/contracts/:id/sign - Sign a contract (updates both DB and blockchain)
router.post('/:id/sign', [
  auth,
  body('signature').notEmpty().withMessage('Digital signature is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const contract = await Contract.findById(req.params.id);
    if (!contract) return res.status(404).json({ success: false, message: 'Contract not found' });

    const isSeller = contract.parties.seller.user.toString() === req.user._id.toString();
    const isBuyer = contract.parties.buyer.user.toString() === req.user._id.toString();
    if (!isSeller && !isBuyer) return res.status(403).json({ success: false, message: 'Not authorized' });

    const signatureData = { signedAt: new Date(), signature: req.body.signature, ipAddress: req.ip };
    if (isSeller) contract.parties.seller = { ...contract.parties.seller, ...signatureData };
    if (isBuyer) contract.parties.buyer = { ...contract.parties.buyer, ...signatureData };

    if (contract.blockchain?.contractAddress) {
      const contractInstance = new ethers.Contract(contract.blockchain.contractAddress, abiJson.abi, wallet);
      if (isSeller) {
        const tx = await contractInstance.signAsSeller();
        await tx.wait();
      }
      if (isBuyer) {
        const tx = await contractInstance.signAsBuyer();
        await tx.wait();
      }

      const fullySigned = await contractInstance.isFullySigned();
      console.log("fullySigned: ", fullySigned);
      contract.status = fullySigned ? 'signed' : 'pending';
      if (fullySigned) {
        contract.auditTrail.push({
          action: 'Contract fully signed on blockchain',
          performedBy: req.user._id,
          details: { blockAddress: contract.blockchain.contractAddress }
        });
      }
    }

    contract.auditTrail.push({
      action: 'Contract signed',
      performedBy: req.user._id,
      details: { role: isSeller ? 'seller' : 'buyer' }
    });

    await contract.save();
    res.json({ success: true, message: 'Contract signed successfully', data: { contract } });
  } catch (error) {
    console.error('Sign contract error:', error);
    res.status(500).json({ success: false, message: 'Server error while signing contract' });
  }
});

module.exports = router;
