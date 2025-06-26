import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, Download, CheckCircle, Clock, AlertTriangle, Shield, 
  Calendar, User, Building, DollarSign, MapPin, CreditCard, Package, 
  Eye, Edit, MessageCircle, Truck, AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';
import html2pdf from 'html2pdf.js';

interface Contract {
  _id: string;
  contractNumber: string;
  title: string;
  parties: {
    seller: {
      user: {
        _id: string;
        name: string;
        company: {
          name: string;
        };
      };
      signedAt?: string;
      signature?: string;
    };
    buyer: {
      user: {
        _id: string;
        name: string;
        company: {
          name: string;
        };
      };
      signedAt?: string;
      signature?: string;
    };
  };
  relatedNegotiation?: {
    _id: string;
    title: string;
  };
  terms: {
    materialType: string;
    quantity: {
      value: number;
      unit: string;
    };
    price: {
      value: number;
      currency: string;
    };
    totalValue: number;
    deliveryDate: string;
    deliveryLocation?: {
      address: string;
      city: string;
      state: string;
      pincode: string;
    };
    paymentTerms: string;
    qualitySpecs?: string;
    packagingRequirements?: string;
    inspectionRights?: string;
    penalties?: {
      lateDelivery: string;
      qualityIssues: string;
      cancellation: string;
    };
  };
  status: 'draft' | 'pending' | 'signed' | 'executed' | 'completed' | 'cancelled' | 'disputed';
  blockchain?: {
    deployed: boolean;
    transactionHash?: string;
    contractAddress?: string;
    deployedAt?: string;
  };
  paymentStatus: 'not_initiated' | 'pending' | 'held' | 'released' | 'refunded';
  payment?: any;
  platformFee?: {
    percentage: number;
    amount: number;
    paid: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

const ContractDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useApp();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingContract, setSigningContract] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (id) {
      fetchContract();
    }
  }, [id]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      const response = await apiService.getContract(id!);
      if (response.success) {
        setContract(response.data.contract);
      }
    } catch (error) {
      console.error('Failed to fetch contract:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate platform fee amount
  const calculatePlatformFeeAmount = (contract: Contract) => {
    if (!contract.platformFee || !contract.terms.totalValue) {
      return 0;
    }
    return Math.round((contract.terms.totalValue * 2.5) / 100);
  };

  const confirmDelivery = async (payment: any) => {
    try {
      console.log('Confirming delivery for payment:', payment);
      // Add your delivery confirmation logic here
      alert('Delivery confirmed successfully!');
    } catch (error) {
      console.error('Failed to confirm delivery:', error);
      alert('Failed to confirm delivery. Please try again.');
    }
  };

  // Function to handle PDF download
  const handleDownloadPdf = async () => {
    if (!contract) return;

    try {
      setDownloadingPdf(true);
      
      // Create the PDF content element
      const element = document.createElement('div');
      element.innerHTML = `
        <div style="font-family: 'Times New Roman', serif; color: #2c3e50; padding: 40px; max-width: 800px; margin: 0 auto; background: white;">
          <!-- Header -->
          <div style="text-align: center; border-bottom: 2px solid #34495e; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; font-size: 24px; margin-bottom: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
              SMART CONTRACT AGREEMENT
            </h1>
          </div>
          
          <!-- Contract Meta -->
          <div style="background: #f8f9fa; padding: 15px; border: 1px solid #dee2e6; margin-bottom: 25px;">
            <p style="margin: 3px 0; font-size: 11px; color: #495057;"><strong>Contract Title:</strong> ${contract.title}</p>
            <p style="margin: 3px 0; font-size: 11px; color: #495057;"><strong>Contract Number:</strong> ${contract.contractNumber}</p>
            <p style="margin: 3px 0; font-size: 11px; color: #495057;"><strong>Status:</strong> ${contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}</p>
            <p style="margin: 3px 0; font-size: 11px; color: #495057;"><strong>Created:</strong> ${new Date(contract.createdAt).toLocaleString()}</p>
            <p style="margin: 3px 0; font-size: 11px; color: #495057;"><strong>Last Updated:</strong> ${new Date(contract.updatedAt).toLocaleString()}</p>
          </div>

          <!-- Parties Section -->
          <div style="margin: 25px 0;">
            <h2 style="color: #2c3e50; margin: 25px 0 15px 0; font-size: 16px; border-bottom: 1px solid #dee2e6; padding-bottom: 5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              CONTRACTING PARTIES
            </h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 15px 0;">
              <div style="background: #ffffff; padding: 15px; border: 1px solid #dee2e6;">
                <h3 style="margin-top: 0; color: #495057; font-size: 12px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">SELLER</h3>
                <p style="margin: 5px 0; font-size: 11px; color: #6c757d;"><strong>Name:</strong> ${contract.parties.seller.user.name}</p>
                <p style="margin: 5px 0; font-size: 11px; color: #6c757d;"><strong>Company:</strong> ${contract.parties.seller.user.company.name}</p>
                <div style="display: inline-block; padding: 3px 6px; border: 1px solid #dee2e6; font-size: 9px; font-weight: 600; margin-top: 8px; background: #f8f9fa; color: #495057;">
                  ${contract.parties.seller.signedAt ? `Signed on ${new Date(contract.parties.seller.signedAt).toLocaleDateString()}` : 'Pending Signature'}
                </div>
              </div>
              <div style="background: #ffffff; padding: 15px; border: 1px solid #dee2e6;">
                <h3 style="margin-top: 0; color: #495057; font-size: 12px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">BUYER</h3>
                <p style="margin: 5px 0; font-size: 11px; color: #6c757d;"><strong>Name:</strong> ${contract.parties.buyer.user.name}</p>
                <p style="margin: 5px 0; font-size: 11px; color: #6c757d;"><strong>Company:</strong> ${contract.parties.buyer.user.company.name}</p>
                <div style="display: inline-block; padding: 3px 6px; border: 1px solid #dee2e6; font-size: 9px; font-weight: 600; margin-top: 8px; background: #f8f9fa; color: #495057;">
                  ${contract.parties.buyer.signedAt ? `Signed on ${new Date(contract.parties.buyer.signedAt).toLocaleDateString()}` : 'Pending Signature'}
                </div>
              </div>
            </div>
          </div>

          <!-- Terms Section -->
          <div style="margin: 25px 0;">
            <h2 style="color: #2c3e50; margin: 25px 0 15px 0; font-size: 16px; border-bottom: 1px solid #dee2e6; padding-bottom: 5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              CONTRACT TERMS & CONDITIONS
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin: 15px 0;">
              <div style="background: #ffffff; padding: 12px; border: 1px solid #dee2e6;">
                <span style="font-weight: 600; color: #6c757d; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; display: block;">Material Type</span>
                <div style="color: #2c3e50; font-size: 11px; font-weight: 500;">${contract.terms.materialType}</div>
              </div>
              <div style="background: #ffffff; padding: 12px; border: 1px solid #dee2e6;">
                <span style="font-weight: 600; color: #6c757d; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; display: block;">Quantity</span>
                <div style="color: #2c3e50; font-size: 11px; font-weight: 500;">${contract.terms.quantity.value} ${contract.terms.quantity.unit}</div>
              </div>
              <div style="background: #ffffff; padding: 12px; border: 1px solid #dee2e6;">
                <span style="font-weight: 600; color: #6c757d; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; display: block;">Unit Price</span>
                <div style="color: #2c3e50; font-size: 11px; font-weight: 500;">₹${contract.terms.price.value.toLocaleString()} ${contract.terms.price.currency}</div>
              </div>
              <div style="background: #ffffff; padding: 12px; border: 1px solid #dee2e6;">
                <span style="font-weight: 600; color: #6c757d; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; display: block;">Total Contract Value</span>
                <div style="color: #2c3e50; font-size: 13px; font-weight: 700;">₹${contract.terms.totalValue.toLocaleString()}</div>
              </div>
              <div style="background: #ffffff; padding: 12px; border: 1px solid #dee2e6;">
                <span style="font-weight: 600; color: #6c757d; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; display: block;">Delivery Date</span>
                <div style="color: #2c3e50; font-size: 11px; font-weight: 500;">${new Date(contract.terms.deliveryDate).toLocaleDateString()}</div>
              </div>
              <div style="background: #ffffff; padding: 12px; border: 1px solid #dee2e6;">
                <span style="font-weight: 600; color: #6c757d; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; display: block;">Payment Terms</span>
                <div style="color: #2c3e50; font-size: 11px; font-weight: 500;">${contract.terms.paymentTerms.replace('-', ' ').toUpperCase()}</div>
              </div>
            </div>
            
            ${contract.terms.deliveryLocation ? `
            <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border: 1px solid #dee2e6;">
              <h3 style="color: #495057; margin: 15px 0 10px 0; font-size: 13px; font-weight: 600;">Delivery Location</h3>
              <div>
                <p style="margin: 5px 0; padding: 5px 0; border-bottom: 1px solid #dee2e6; font-size: 11px;"><strong>Address:</strong> ${contract.terms.deliveryLocation.address}</p>
                <p style="margin: 5px 0; padding: 5px 0; border-bottom: 1px solid #dee2e6; font-size: 11px;"><strong>City:</strong> ${contract.terms.deliveryLocation.city}</p>
                <p style="margin: 5px 0; padding: 5px 0; border-bottom: 1px solid #dee2e6; font-size: 11px;"><strong>State:</strong> ${contract.terms.deliveryLocation.state}</p>
                ${contract.terms.deliveryLocation.pincode ? `<p style="margin: 5px 0; padding: 5px 0; font-size: 11px;"><strong>Pincode:</strong> ${contract.terms.deliveryLocation.pincode}</p>` : ''}
              </div>
            </div>
            ` : ''}
            
            ${contract.terms.qualitySpecs ? `
            <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border: 1px solid #dee2e6;">
              <h3 style="color: #495057; margin: 15px 0 10px 0; font-size: 13px; font-weight: 600;">Quality Specifications</h3>
              <p style="font-size: 11px;">${contract.terms.qualitySpecs}</p>
            </div>
            ` : ''}
            
            ${contract.terms.packagingRequirements ? `
            <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border: 1px solid #dee2e6;">
              <h3 style="color: #495057; margin: 15px 0 10px 0; font-size: 13px; font-weight: 600;">Packaging Requirements</h3>
              <p style="font-size: 11px;">${contract.terms.packagingRequirements}</p>
            </div>
            ` : ''}
            
            ${contract.terms.inspectionRights ? `
            <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border: 1px solid #dee2e6;">
              <h3 style="color: #495057; margin: 15px 0 10px 0; font-size: 13px; font-weight: 600;">Inspection Rights</h3>
              <p style="font-size: 11px;">${contract.terms.inspectionRights}</p>
            </div>
            ` : ''}
            
            ${contract.terms.penalties ? `
            <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border: 1px solid #dee2e6;">
              <h3 style="color: #495057; margin: 15px 0 10px 0; font-size: 13px; font-weight: 600;">Penalty Terms</h3>
              <div>
                ${contract.terms.penalties.lateDelivery ? `<div style="margin: 5px 0; padding: 5px 0; border-bottom: 1px solid #dee2e6; font-size: 11px;"><strong>Late Delivery:</strong> ${contract.terms.penalties.lateDelivery}</div>` : ''}
                ${contract.terms.penalties.qualityIssues ? `<div style="margin: 5px 0; padding: 5px 0; border-bottom: 1px solid #dee2e6; font-size: 11px;"><strong>Quality Issues:</strong> ${contract.terms.penalties.qualityIssues}</div>` : ''}
                ${contract.terms.penalties.cancellation ? `<div style="margin: 5px 0; padding: 5px 0; font-size: 11px;"><strong>Cancellation:</strong> ${contract.terms.penalties.cancellation}</div>` : ''}
              </div>
            </div>
            ` : ''}
          </div>

          ${contract.blockchain?.deployed ? `
          <div style="background: #f8f9fa; padding: 15px; border: 1px solid #dee2e6; margin: 25px 0;">
            <h2 style="color: #495057; margin-top: 0; color: #2c3e50; margin: 25px 0 15px 0; font-size: 16px; border-bottom: 1px solid #dee2e6; padding-bottom: 5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">BLOCKCHAIN SECURITY</h2>
            <p style="font-size: 11px; color: #6c757d; margin-bottom: 15px; font-style: italic;">This contract is secured on the blockchain, ensuring immutability and transparency.</p>
            ${contract.blockchain.transactionHash ? `
            <div style="margin: 10px 0; padding: 8px; background: #ffffff; border: 1px solid #dee2e6; font-size: 10px;">
              <strong>Transaction Hash:</strong>
              <div style="background: #f8f9fa; padding: 2px 4px; font-family: 'Courier New', monospace; font-size: 9px; word-break: break-all; margin-top: 3px; border: 1px solid #dee2e6;">${contract.blockchain.transactionHash}</div>
            </div>` : ''}
            ${contract.blockchain.contractAddress ? `
            <div style="margin: 10px 0; padding: 8px; background: #ffffff; border: 1px solid #dee2e6; font-size: 10px;">
              <strong>Contract Address:</strong>
              <div style="background: #f8f9fa; padding: 2px 4px; font-family: 'Courier New', monospace; font-size: 9px; word-break: break-all; margin-top: 3px; border: 1px solid #dee2e6;">${contract.blockchain.contractAddress}</div>
            </div>` : ''}
            ${contract.blockchain.deployedAt ? `
            <div style="margin: 10px 0; padding: 8px; background: #ffffff; border: 1px solid #dee2e6; font-size: 10px;">
              <strong>Deployed At:</strong>
              <span style="margin-left: 5px;">${new Date(contract.blockchain.deployedAt).toLocaleString()}</span>
            </div>` : ''}
          </div>
          ` : ''}

          ${contract.platformFee ? `
          <div style="background: #f8f9fa; padding: 15px; border: 1px solid #dee2e6; margin: 25px 0;">
            <h2 style="color: #495057; margin-top: 0; color: #2c3e50; margin: 25px 0 15px 0; font-size: 16px; border-bottom: 1px solid #dee2e6; padding-bottom: 5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">PLATFORM FEE</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;">
              <div style="background: #ffffff; padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                <span style="display: block; font-size: 9px; color: #6c757d; font-weight: 600; margin-bottom: 3px; text-transform: uppercase;">Fee Rate</span>
                <span style="font-size: 11px; font-weight: 600; color: #2c3e50;">2.5%</span>
              </div>
              <div style="background: #ffffff; padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                <span style="display: block; font-size: 9px; color: #6c757d; font-weight: 600; margin-bottom: 3px; text-transform: uppercase;">Amount</span>
                <span style="font-size: 11px; font-weight: 600; color: #2c3e50;">₹${calculatePlatformFeeAmount(contract).toLocaleString()}</span>
              </div>
              <div style="background: #ffffff; padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                <span style="display: block; font-size: 9px; color: #6c757d; font-weight: 600; margin-bottom: 3px; text-transform: uppercase;">Status</span>
                <span style="font-size: 9px; font-weight: 600; padding: 2px 4px; border: 1px solid #dee2e6; background: #f8f9fa; color: #495057;">${contract.platformFee.paid ? 'PAID' : 'PENDING'}</span>
              </div>
            </div>
          </div>
          ` : ''}

          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d;">
            <p style="margin: 3px 0; font-size: 11px; font-weight: 600; color: #495057;">WasteExchange Platform</p>
            <p style="margin: 3px 0; font-size: 10px;"><em>Blockchain-Secured Smart Contract System</em></p>
            <p style="margin: 3px 0; font-size: 10px;"><small>Document generated on: ${new Date().toLocaleString()}</small></p>
          </div>
        </div>
      `;

      // Configure PDF options
      const options = {
        margin: 0.5,
        filename: `contract_${contract.contractNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true,
          allowTaint: false,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'in', 
          format: 'a4', 
          orientation: 'portrait'
        }
      };

      // Generate and download the PDF
      await html2pdf().set(options).from(element).save();
      
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSignContract = async () => {
    if (!contract) return;

    try {
      setSigningContract(true);
      const signature = `${user?.name}-${Date.now()}`;
      
      const response = await apiService.signContract(contract._id, signature);
      if (response.success) {
        await fetchContract();
        setShowSignModal(false);
        alert('Contract signed successfully!');
      }
    } catch (error) {
      console.error('Failed to sign contract:', error);
      alert('Failed to sign contract. Please try again.');
    } finally {
      setSigningContract(false);
    }
  };

  const getCounterparty = () => {
    if (!contract || !user) return null;
    
    if (user._id === contract.parties.seller.user._id) {
      return {
        name: contract.parties.buyer.user.name,
        company: contract.parties.buyer.user.company.name,
        type: 'buyer' as const
      };
    } else {
      return {
        name: contract.parties.seller.user.name,
        company: contract.parties.seller.user.company.name,
        type: 'seller' as const
      };
    }
  };

  const getUserRole = () => {
    if (!contract || !user) return null;
    return user._id === contract.parties.seller.user._id ? 'seller' : 'buyer';
  };

  const canUserSign = () => {
    if (!contract || !user) return false;
    const userRole = getUserRole();
    if (userRole === 'seller') {
      return !contract.parties.seller.signedAt;
    } else {
      return !contract.parties.buyer.signedAt;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-5 w-5 text-gray-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'signed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'executed':
        return <Shield className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
      case 'disputed':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'signed':
        return 'bg-green-100 text-green-800';
      case 'executed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'disputed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Contract Not Found</h2>
          <p className="text-gray-600 mb-6">The contract you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => navigate('/contracts')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Back to Contracts
          </button>
        </div>
      </div>
    );
  }

  const counterparty = getCounterparty();
  const userRole = getUserRole();
  const userIsBuyer = userRole === 'buyer';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/contracts')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contracts
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{contract.title}</h1>
            <p className="text-gray-600 mt-1">Contract #{contract.contractNumber}</p>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusIcon(contract.status)}
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(contract.status)}`}>
              {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Contract Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Contract Overview</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Counterparty</label>
                  <div className="mt-1">
                    <p className="font-semibold text-gray-900">{counterparty?.name}</p>
                    <p className="text-sm text-gray-600">{counterparty?.company}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Your Role</label>
                  <p className="mt-1 font-semibold text-gray-900 capitalize">{userRole}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Material Type</label>
                  <p className="mt-1 font-semibold text-gray-900">{contract.terms.materialType}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Contract Value</label>
                  <p className="mt-1 text-2xl font-bold text-green-600">₹{contract.terms?.totalValue?.toLocaleString() || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Quantity</label>
                  <p className="mt-1 font-semibold text-gray-900">{contract.terms.quantity.value} {contract.terms.quantity.unit}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Unit Price</label>
                  <p className="mt-1 font-semibold text-gray-900">₹{contract.terms?.price?.value?.toLocaleString() || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Delivery & Payment Terms */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Delivery Date</label>
                      <p className="font-semibold text-gray-900">{new Date(contract.terms.deliveryDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CreditCard className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Payment Terms</label>
                      <p className="font-semibold text-gray-900 capitalize">{contract.terms.paymentTerms.replace('-', ' ')}</p>
                    </div>
                  </div>
                </div>
                
                {contract.terms.deliveryLocation && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Delivery Location</label>
                      <div className="font-semibold text-gray-900">
                        <p>{contract.terms.deliveryLocation.address}</p>
                        <p>{contract.terms.deliveryLocation.city}, {contract.terms.deliveryLocation.state}</p>
                        {contract.terms.deliveryLocation.pincode && <p>{contract.terms.deliveryLocation.pincode}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Terms */}
            {(contract.terms.qualitySpecs || contract.terms.packagingRequirements || contract.terms.inspectionRights) && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Specifications</h3>
                <div className="space-y-4">
                  {contract.terms.qualitySpecs && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Quality Specifications</label>
                      <p className="mt-1 text-gray-900">{contract.terms.qualitySpecs}</p>
                    </div>
                  )}
                  {contract.terms.packagingRequirements && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Packaging Requirements</label>
                      <p className="mt-1 text-gray-900">{contract.terms.packagingRequirements}</p>
                    </div>
                  )}
                  {contract.terms.inspectionRights && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Inspection Rights</label>
                      <p className="mt-1 text-gray-900">{contract.terms.inspectionRights}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Blockchain Information */}
          {contract.blockchain?.deployed && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Shield className="h-6 w-6 text-green-600 mr-3" />
                <h2 className="text-xl font-semibold text-green-900">Blockchain Secured Contract</h2>
              </div>
              <p className="text-green-700 mb-4">
                This contract is secured on the blockchain, ensuring immutability and transparency.
              </p>
              {contract.blockchain.transactionHash && (
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Transaction Hash</label>
                      <p className="font-mono text-sm text-gray-900 break-all mt-1">
                        {contract.blockchain.transactionHash}
                      </p>
                    </div>
                    {contract.blockchain.contractAddress && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Contract Address</label>
                        <p className="font-mono text-sm text-gray-900 break-all mt-1">
                          {contract.blockchain.contractAddress}
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      window.open(
                        `https://sepolia.etherscan.io/address/${contract.blockchain?.contractAddress}`,
                        '_blank'
                      )
                    }
                    className="mt-3 text-sm text-green-700 hover:text-green-800 font-medium"
                  >
                    View on Blockchain Explorer →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Signing Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Signing Status</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="font-medium">Seller</div>
                    <div className="text-sm text-gray-600">{contract.parties.seller.user.name}</div>
                  </div>
                </div>
                {contract.parties.seller.signedAt ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-1" />
                    <span className="text-sm font-medium">Signed</span>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-400">
                    <Clock className="h-5 w-5 mr-1" />
                    <span className="text-sm">Pending</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="font-medium">Buyer</div>
                    <div className="text-sm text-gray-600">{contract.parties.buyer.user.name}</div>
                  </div>
                </div>
                {contract.parties.buyer.signedAt ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-1" />
                    <span className="text-sm font-medium">Signed</span>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-400">
                    <Clock className="h-5 w-5 mr-1" />
                    <span className="text-sm">Pending</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (contract) {
                    const element = document.createElement('div');
                    element.innerHTML = `
                    <div style="font-family: 'Times New Roman', serif; color: #2c3e50; padding: 40px; max-width: 800px; margin: 0 auto; background: white;">
                    <!-- Header -->
                    <div style="text-align: center; border-bottom: 2px solid #34495e; padding-bottom: 20px; margin-bottom: 30px;">
                      <h1 style="color: #2c3e50; font-size: 24px; margin-bottom: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                        SMART CONTRACT AGREEMENT
                      </h1>
                    </div>
                    
                    <!-- Contract Meta -->
                    <div style="background: #f8f9fa; padding: 15px; border: 1px solid #dee2e6; margin-bottom: 25px;">
                      <p style="margin: 3px 0; font-size: 11px; color: #495057;"><strong>Contract Title:</strong> ${contract.title}</p>
                      <p style="margin: 3px 0; font-size: 11px; color: #495057;"><strong>Contract Number:</strong> ${contract.contractNumber}</p>
                      <p style="margin: 3px 0; font-size: 11px; color: #495057;"><strong>Status:</strong> ${contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}</p>
                      <p style="margin: 3px 0; font-size: 11px; color: #495057;"><strong>Created:</strong> ${new Date(contract.createdAt).toLocaleString()}</p>
                      <p style="margin: 3px 0; font-size: 11px; color: #495057;"><strong>Last Updated:</strong> ${new Date(contract.updatedAt).toLocaleString()}</p>
                    </div>
          
                    <!-- Parties Section -->
                    <div style="margin: 25px 0;">
                      <h2 style="color: #2c3e50; margin: 25px 0 15px 0; font-size: 16px; border-bottom: 1px solid #dee2e6; padding-bottom: 5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                        CONTRACTING PARTIES
                      </h2>
                      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 15px 0;">
                        <div style="background: #ffffff; padding: 15px; border: 1px solid #dee2e6;">
                          <h3 style="margin-top: 0; color: #495057; font-size: 12px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">SELLER</h3>
                          <p style="margin: 5px 0; font-size: 11px; color: #6c757d;"><strong>Name:</strong> ${contract.parties.seller.user.name}</p>
                          <p style="margin: 5px 0; font-size: 11px; color: #6c757d;"><strong>Company:</strong> ${contract.parties.seller.user.company.name}</p>
                          <div style="display: inline-block; padding: 3px 6px; border: 1px solid #dee2e6; font-size: 9px; font-weight: 600; margin-top: 8px; background: #f8f9fa; color: #495057;">
                            ${contract.parties.seller.signedAt ? `Signed on ${new Date(contract.parties.seller.signedAt).toLocaleDateString()}` : 'Pending Signature'}
                          </div>
                        </div>
                        <div style="background: #ffffff; padding: 15px; border: 1px solid #dee2e6;">
                          <h3 style="margin-top: 0; color: #495057; font-size: 12px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">BUYER</h3>
                          <p style="margin: 5px 0; font-size: 11px; color: #6c757d;"><strong>Name:</strong> ${contract.parties.buyer.user.name}</p>
                          <p style="margin: 5px 0; font-size: 11px; color: #6c757d;"><strong>Company:</strong> ${contract.parties.buyer.user.company.name}</p>
                          <div style="display: inline-block; padding: 3px 6px; border: 1px solid #dee2e6; font-size: 9px; font-weight: 600; margin-top: 8px; background: #f8f9fa; color: #495057;">
                            ${contract.parties.buyer.signedAt ? `Signed on ${new Date(contract.parties.buyer.signedAt).toLocaleDateString()}` : 'Pending Signature'}
                          </div>
                        </div>
                      </div>
                    </div>
          
                    <!-- Terms Section -->
                    <div style="margin: 25px 0;">
                      <h2 style="color: #2c3e50; margin: 25px 0 15px 0; font-size: 16px; border-bottom: 1px solid #dee2e6; padding-bottom: 5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                        CONTRACT TERMS & CONDITIONS
                      </h2>
                      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin: 15px 0;">
                        <div style="background: #ffffff; padding: 12px; border: 1px solid #dee2e6;">
                          <span style="font-weight: 600; color: #6c757d; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; display: block;">Material Type</span>
                          <div style="color: #2c3e50; font-size: 11px; font-weight: 500;">${contract.terms.materialType}</div>
                        </div>
                        <div style="background: #ffffff; padding: 12px; border: 1px solid #dee2e6;">
                          <span style="font-weight: 600; color: #6c757d; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; display: block;">Quantity</span>
                          <div style="color: #2c3e50; font-size: 11px; font-weight: 500;">${contract.terms.quantity.value} ${contract.terms.quantity.unit}</div>
                        </div>
                        <div style="background: #ffffff; padding: 12px; border: 1px solid #dee2e6;">
                          <span style="font-weight: 600; color: #6c757d; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; display: block;">Unit Price</span>
                          <div style="color: #2c3e50; font-size: 11px; font-weight: 500;">₹${contract.terms.price.value.toLocaleString()} ${contract.terms.price.currency}</div>
                        </div>
                        <div style="background: #ffffff; padding: 12px; border: 1px solid #dee2e6;">
                          <span style="font-weight: 600; color: #6c757d; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; display: block;">Total Contract Value</span>
                          <div style="color: #2c3e50; font-size: 13px; font-weight: 700;">₹${contract.terms.totalValue.toLocaleString()}</div>
                        </div>
                        <div style="background: #ffffff; padding: 12px; border: 1px solid #dee2e6;">
                          <span style="font-weight: 600; color: #6c757d; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; display: block;">Delivery Date</span>
                          <div style="color: #2c3e50; font-size: 11px; font-weight: 500;">${new Date(contract.terms.deliveryDate).toLocaleDateString()}</div>
                        </div>
                        <div style="background: #ffffff; padding: 12px; border: 1px solid #dee2e6;">
                          <span style="font-weight: 600; color: #6c757d; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; display: block;">Payment Terms</span>
                          <div style="color: #2c3e50; font-size: 11px; font-weight: 500;">${contract.terms.paymentTerms.replace('-', ' ').toUpperCase()}</div>
                        </div>
                      </div>
                      
                      ${contract.terms.deliveryLocation ? `
                      <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border: 1px solid #dee2e6;">
                        <h3 style="color: #495057; margin: 15px 0 10px 0; font-size: 13px; font-weight: 600;">Delivery Location</h3>
                        <div>
                          <p style="margin: 5px 0; padding: 5px 0; border-bottom: 1px solid #dee2e6; font-size: 11px;"><strong>Address:</strong> ${contract.terms.deliveryLocation.address}</p>
                          <p style="margin: 5px 0; padding: 5px 0; border-bottom: 1px solid #dee2e6; font-size: 11px;"><strong>City:</strong> ${contract.terms.deliveryLocation.city}</p>
                          <p style="margin: 5px 0; padding: 5px 0; border-bottom: 1px solid #dee2e6; font-size: 11px;"><strong>State:</strong> ${contract.terms.deliveryLocation.state}</p>
                          ${contract.terms.deliveryLocation.pincode ? `<p style="margin: 5px 0; padding: 5px 0; font-size: 11px;"><strong>Pincode:</strong> ${contract.terms.deliveryLocation.pincode}</p>` : ''}
                        </div>
                      </div>
                      ` : ''}
                      
                      ${contract.terms.qualitySpecs ? `
                      <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border: 1px solid #dee2e6;">
                        <h3 style="color: #495057; margin: 15px 0 10px 0; font-size: 13px; font-weight: 600;">Quality Specifications</h3>
                        <p style="font-size: 11px;">${contract.terms.qualitySpecs}</p>
                      </div>
                      ` : ''}
                      
                      ${contract.terms.packagingRequirements ? `
                      <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border: 1px solid #dee2e6;">
                        <h3 style="color: #495057; margin: 15px 0 10px 0; font-size: 13px; font-weight: 600;">Packaging Requirements</h3>
                        <p style="font-size: 11px;">${contract.terms.packagingRequirements}</p>
                      </div>
                      ` : ''}
                      
                      ${contract.terms.inspectionRights ? `
                      <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border: 1px solid #dee2e6;">
                        <h3 style="color: #495057; margin: 15px 0 10px 0; font-size: 13px; font-weight: 600;">Inspection Rights</h3>
                        <p style="font-size: 11px;">${contract.terms.inspectionRights}</p>
                      </div>
                      ` : ''}
                      
                      ${contract.terms.penalties ? `
                      <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border: 1px solid #dee2e6;">
                        <h3 style="color: #495057; margin: 15px 0 10px 0; font-size: 13px; font-weight: 600;">Penalty Terms</h3>
                        <div>
                          ${contract.terms.penalties.lateDelivery ? `<div style="margin: 5px 0; padding: 5px 0; border-bottom: 1px solid #dee2e6; font-size: 11px;"><strong>Late Delivery:</strong> ${contract.terms.penalties.lateDelivery}</div>` : ''}
                          ${contract.terms.penalties.qualityIssues ? `<div style="margin: 5px 0; padding: 5px 0; border-bottom: 1px solid #dee2e6; font-size: 11px;"><strong>Quality Issues:</strong> ${contract.terms.penalties.qualityIssues}</div>` : ''}
                          ${contract.terms.penalties.cancellation ? `<div style="margin: 5px 0; padding: 5px 0; font-size: 11px;"><strong>Cancellation:</strong> ${contract.terms.penalties.cancellation}</div>` : ''}
                        </div>
                      </div>
                      ` : ''}
                    </div>
          
                    ${contract.blockchain?.deployed ? `
                    <div style="background: #f8f9fa; padding: 15px; border: 1px solid #dee2e6; margin: 25px 0;">
                      <h2 style="color: #495057; margin-top: 0; color: #2c3e50; margin: 25px 0 15px 0; font-size: 16px; border-bottom: 1px solid #dee2e6; padding-bottom: 5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">BLOCKCHAIN SECURITY</h2>
                      <p style="font-size: 11px; color: #6c757d; margin-bottom: 15px; font-style: italic;">This contract is secured on the blockchain, ensuring immutability and transparency.</p>
                      ${contract.blockchain.transactionHash ? `
                      <div style="margin: 10px 0; padding: 8px; background: #ffffff; border: 1px solid #dee2e6; font-size: 10px;">
                        <strong>Transaction Hash:</strong>
                        <div style="background: #f8f9fa; padding: 2px 4px; font-family: 'Courier New', monospace; font-size: 9px; word-break: break-all; margin-top: 3px; border: 1px solid #dee2e6;">${contract.blockchain.transactionHash}</div>
                      </div>` : ''}
                      ${contract.blockchain.contractAddress ? `
                      <div style="margin: 10px 0; padding: 8px; background: #ffffff; border: 1px solid #dee2e6; font-size: 10px;">
                        <strong>Contract Address:</strong>
                        <div style="background: #f8f9fa; padding: 2px 4px; font-family: 'Courier New', monospace; font-size: 9px; word-break: break-all; margin-top: 3px; border: 1px solid #dee2e6;">${contract.blockchain.contractAddress}</div>
                      </div>` : ''}
                      ${contract.blockchain.deployedAt ? `
                      <div style="margin: 10px 0; padding: 8px; background: #ffffff; border: 1px solid #dee2e6; font-size: 10px;">
                        <strong>Deployed At:</strong>
                        <span style="margin-left: 5px;">${new Date(contract.blockchain.deployedAt).toLocaleString()}</span>
                      </div>` : ''}
                    </div>
                    ` : ''}
          
                    ${contract.platformFee ? `
                    <div style="background: #f8f9fa; padding: 15px; border: 1px solid #dee2e6; margin: 25px 0;">
                      <h2 style="color: #495057; margin-top: 0; color: #2c3e50; margin: 25px 0 15px 0; font-size: 16px; border-bottom: 1px solid #dee2e6; padding-bottom: 5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">PLATFORM FEE</h2>
                      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;">
                        <div style="background: #ffffff; padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                          <span style="display: block; font-size: 9px; color: #6c757d; font-weight: 600; margin-bottom: 3px; text-transform: uppercase;">Fee Rate</span>
                          <span style="font-size: 11px; font-weight: 600; color: #2c3e50;">2.5%</span>
                        </div>
                        <div style="background: #ffffff; padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                          <span style="display: block; font-size: 9px; color: #6c757d; font-weight: 600; margin-bottom: 3px; text-transform: uppercase;">Amount</span>
                          <span style="font-size: 11px; font-weight: 600; color: #2c3e50;">₹${calculatePlatformFeeAmount(contract).toLocaleString()}</span>
                        </div>
                        <div style="background: #ffffff; padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                          <span style="display: block; font-size: 9px; color: #6c757d; font-weight: 600; margin-bottom: 3px; text-transform: uppercase;">Status</span>
                          <span style="font-size: 9px; font-weight: 600; padding: 2px 4px; border: 1px solid #dee2e6; background: #f8f9fa; color: #495057;">${contract.platformFee.paid ? 'PAID' : 'PENDING'}</span>
                        </div>
                      </div>
                    </div>
                    ` : ''}
          
                    <!-- Footer -->
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d;">
                      <p style="margin: 3px 0; font-size: 11px; font-weight: 600; color: #495057;">WasteExchange Platform</p>
                      <p style="margin: 3px 0; font-size: 10px;"><em>Blockchain-Secured Smart Contract System</em></p>
                      <p style="margin: 3px 0; font-size: 10px;"><small>Document generated on: ${new Date().toLocaleString()}</small></p>
                    </div>
                  </div>
                    `;
                    const newWindow = window.open();
                    if (newWindow) {
                      newWindow.document.write(element.innerHTML);
                      newWindow.document.close();
                    }
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Full Contract
              </button>
              
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="w-full border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <Download className="h-4 w-4 mr-2" />
                {downloadingPdf ? 'Generating PDF...' : 'Download PDF'}
              </button>

              {/* Step 1: Sign Contract */}
              {contract.status === 'pending' && canUserSign() && (
                <button
                  onClick={() => setShowSignModal(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Sign Contract
                </button>
              )}

              {/* Step 2: Make Payment */}
              {contract.status === 'signed' && userIsBuyer && contract.paymentStatus === 'not_initiated' && (
                <button
                  onClick={() => apiService.initiatePayment(contract._id)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay Now
                </button>
              )}

              {/* Step 4: Confirm Delivery */}
              {contract.status === 'executed' && userIsBuyer && (
                <button
                  onClick={() => confirmDelivery(contract.payment)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Confirm Delivery
                </button>
              )}

              {/* Step 5: Payment Released */}
              {contract.status === 'completed' && (
                <div className="w-full bg-green-100 border border-green-300 text-green-800 py-3 px-4 rounded-lg text-center font-semibold">
                  <CheckCircle className="h-5 w-5 inline mr-2" />
                  Payment Released to Seller ✅
                </div>
              )}

              {contract.relatedNegotiation && (
                <button
                  onClick={() => navigate('/negotiations')}
                  className="w-full border border-blue-300 hover:bg-blue-50 text-blue-700 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  View Negotiation
                </button>
              )}
            </div>
          </div>

          {/* Platform Fee */}
          {contract.platformFee && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Fee</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fee Rate</span>
                  <span className="font-medium">2.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-medium">₹{calculatePlatformFeeAmount(contract).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-medium ${contract.platformFee.paid ? 'text-green-600' : 'text-yellow-600'}`}>
                    {contract.platformFee.paid ? 'Paid' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sign Contract Modal */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Sign Contract</h2>
              <p className="text-gray-600 mb-6">
                By signing this contract, you agree to all the terms and conditions specified. 
                This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSignModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSignContract}
                  disabled={signingContract}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors"
                >
                  {signingContract ? 'Signing...' : 'Sign Contract'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractDetails;