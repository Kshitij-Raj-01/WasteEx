import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Eye, CheckCircle, Clock, AlertTriangle, Shield, Calendar, User, Building, DollarSign } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';

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
  relatedListing?: {
    _id: string;
    title: string;
    wasteType: string;
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
    };
    paymentTerms: string;
    qualitySpecs?: string;
    packagingRequirements?: string;
  };
  status: 'draft' | 'pending' | 'signed' | 'executed' | 'completed' | 'cancelled' | 'disputed';
  blockchain?: {
    deployed: boolean;
    transactionHash?: string;
    contractAddress?: string;
    deployedAt?: string;
  };
  platformFee?: {
    percentage: number;
    amount: number;
    paid: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

const Contracts: React.FC = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getContracts();
      if (response.success) {
        setContracts(response.data.contracts);
      }
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContracts = contracts.filter(contract => 
    filterStatus === 'all' || contract.status === filterStatus
  );

  const getCounterparty = (contract: Contract) => {
    if (user?._id === contract.parties.seller.user._id) {
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

  const getUserRole = (contract: Contract) => {
    return user?._id === contract.parties.seller.user._id ? 'seller' : 'buyer';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-4 w-4 text-gray-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'signed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'executed':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
      case 'disputed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
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
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Smart Contracts</h1>
        <p className="text-gray-600 mt-2">Manage your blockchain-secured contracts and agreements</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">All Contracts</h2>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="signed">Signed</option>
              <option value="executed">Executed</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="p-6">
          {filteredContracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Contracts</h3>
              <p className="text-gray-600 mb-6">Contracts will appear here after successful negotiations</p>
              <button
                onClick={() => navigate('/negotiations')}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Start Negotiating
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredContracts.map((contract) => {
                const counterparty = getCounterparty(contract);
                const userRole = getUserRole(contract);
                
                return (
                  <div
                    key={contract._id}
                    onClick={() => navigate(`/contracts/${contract._id}`)}
                    className="p-6 border rounded-xl cursor-pointer transition-all hover:shadow-lg hover:border-blue-300 bg-gradient-to-r from-white to-gray-50"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{contract.title}</h3>
                          {contract.blockchain?.deployed && (
                            <div className="flex items-center px-2 py-1 bg-green-100 rounded-full">
                              <Shield className="h-3 w-3 text-green-600 mr-1" />
                              <span className="text-xs font-medium text-green-700">Blockchain Secured</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {counterparty.name}
                          </div>
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-1" />
                            {counterparty.company}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Created: {new Date(contract.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(contract.status)}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contract.status)}`}>
                          {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center mb-2">
                          <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                          <span className="text-sm text-gray-600">Contract Value</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">₹{contract.terms.totalValue.toLocaleString()}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border">
                        <p className="text-sm text-gray-600 mb-1">Quantity</p>
                        <p className="text-lg font-semibold text-gray-900">{contract.terms.quantity.value} {contract.terms.quantity.unit}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border">
                        <p className="text-sm text-gray-600 mb-1">Your Role</p>
                        <p className="text-lg font-semibold text-gray-900 capitalize">{userRole}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border">
                        <p className="text-sm text-gray-600 mb-1">Material</p>
                        <p className="text-lg font-semibold text-gray-900">{contract.terms.materialType}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center text-sm">
                          <span className="text-gray-600 mr-2">Seller:</span>
                          {contract.parties.seller.signedAt ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="text-gray-600 mr-2">Buyer:</span>
                          {contract.parties.buyer.signedAt ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/contracts/${contract._id}`);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {contract.blockchain?.deployed && contract.blockchain.transactionHash && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center text-sm text-green-700">
                          <Shield className="h-4 w-4 mr-2" />
                          <span className="font-medium">Blockchain Verified:</span>
                          <span className="ml-2 font-mono text-xs">
                            {contract.blockchain.transactionHash.substring(0, 20)}...
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contracts;