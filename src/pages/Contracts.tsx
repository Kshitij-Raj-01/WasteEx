import React, { useState, useEffect } from 'react';
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
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [signingContract, setSigningContract] = useState(false);

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

  const handleSignContract = async (contractId: string) => {
    try {
      setSigningContract(true);
      // Generate a mock digital signature
      const signature = `${user?.name}-${Date.now()}`;
      
      const response = await apiService.signContract(contractId, signature);
      if (response.success) {
        // Refresh contracts
        await fetchContracts();
      }
    } catch (error) {
      console.error('Failed to sign contract:', error);
    } finally {
      setSigningContract(false);
    }
  };

  const filteredContracts = contracts.filter(contract => 
    filterStatus === 'all' || contract.status === filterStatus
  );

  const selectedContractData = contracts.find(c => c._id === selectedContract);

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

  const canUserSign = (contract: Contract) => {
    const userRole = getUserRole(contract);
    if (userRole === 'seller') {
      return !contract.parties.seller.signedAt;
    } else {
      return !contract.parties.buyer.signedAt;
    }
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
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="h-64 bg-gray-200 rounded"></div>
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Contracts List */}
        <div className="lg:col-span-2">
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
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Contracts</h3>
                  <p className="text-gray-600">Contracts will appear here after successful negotiations</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredContracts.map((contract) => {
                    const counterparty = getCounterparty(contract);
                    const userRole = getUserRole(contract);
                    
                    return (
                      <div
                        key={contract._id}
                        onClick={() => setSelectedContract(contract._id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedContract === contract._id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{contract.title}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                {counterparty.name}
                              </div>
                              <div className="flex items-center">
                                <Building className="h-4 w-4 mr-1" />
                                {counterparty.company}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(contract.status)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                              {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-500">Contract Value</p>
                            <p className="font-semibold text-gray-900">₹{contract.terms.totalValue.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Quantity</p>
                            <p className="font-semibold text-gray-900">{contract.terms.quantity.value} {contract.terms.quantity.unit}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Your Role</p>
                            <p className="font-semibold text-gray-900 capitalize">{userRole}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-1" />
                            Created: {new Date(contract.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex space-x-2">
                            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {contract.blockchain?.deployed && (
                          <div className="mt-3 p-2 bg-green-50 rounded-md">
                            <div className="flex items-center text-xs text-green-700">
                              <Shield className="h-3 w-3 mr-1" />
                              Blockchain Verified: {contract.blockchain.transactionHash?.substring(0, 20)}...
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

        {/* Contract Details */}
        <div className="space-y-6">
          {selectedContractData ? (
            <>
              {/* Contract Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Contract Status</p>
                    <div className="flex items-center mt-1">
                      {getStatusIcon(selectedContractData.status)}
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedContractData.status)}`}>
                        {selectedContractData.status.charAt(0).toUpperCase() + selectedContractData.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Counterparty</p>
                    {(() => {
                      const counterparty = getCounterparty(selectedContractData);
                      return (
                        <>
                          <p className="font-medium">{counterparty.name}</p>
                          <p className="text-sm text-gray-500">{counterparty.company}</p>
                        </>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Contract Value</p>
                      <p className="font-semibold text-lg">₹{selectedContractData.terms.totalValue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Quantity</p>
                      <p className="font-semibold">{selectedContractData.terms.quantity.value} {selectedContractData.terms.quantity.unit}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Material Type</p>
                    <p className="font-medium">{selectedContractData.terms.materialType}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Payment Terms</p>
                    <p className="font-medium">{selectedContractData.terms.paymentTerms}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Created Date</p>
                      <p className="font-medium">{new Date(selectedContractData.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Delivery Date</p>
                      <p className="font-medium">{new Date(selectedContractData.terms.deliveryDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {selectedContractData.platformFee && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Platform Fee ({selectedContractData.platformFee.percentage}%)</span>
                        <span className="font-medium">₹{selectedContractData.platformFee.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Signing Status */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Signing Status</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="font-medium">Seller</div>
                        <div className="text-sm text-gray-600">{selectedContractData.parties.seller.user.name}</div>
                      </div>
                    </div>
                    {selectedContractData.parties.seller.signedAt ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <Clock className="h-6 w-6 text-gray-300" />
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="font-medium">Buyer</div>
                        <div className="text-sm text-gray-600">{selectedContractData.parties.buyer.user.name}</div>
                      </div>
                    </div>
                    {selectedContractData.parties.buyer.signedAt ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <Clock className="h-6 w-6 text-gray-300" />
                    )}
                  </div>
                </div>
              </div>

              {/* Blockchain Verification */}
              {selectedContractData.blockchain?.deployed && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center mb-3">
                    <Shield className="h-5 w-5 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-green-900">Blockchain Secured</h3>
                  </div>
                  <p className="text-sm text-green-700 mb-3">
                    This contract is secured on the blockchain and cannot be tampered with.
                  </p>
                  {selectedContractData.blockchain.transactionHash && (
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Transaction Hash</p>
                      <p className="font-mono text-sm text-gray-900 break-all">
                        {selectedContractData.blockchain.transactionHash}
                      </p>
                    </div>
                  )}
                  <button className="mt-3 text-sm text-green-700 hover:text-green-800 font-medium">
                    View on Blockchain Explorer →
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                <div className="space-y-3">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center">
                    <Eye className="h-4 w-4 mr-2" />
                    View Full Contract
                  </button>
                  <button className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </button>
                  {selectedContractData.status === 'pending' && canUserSign(selectedContractData) && (
                    <button
                      onClick={() => handleSignContract(selectedContractData._id)}
                      disabled={signingContract}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      {signingContract ? 'Signing...' : 'Sign Contract'}
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Contract</h3>
                <p className="text-gray-600">Choose a contract from the list to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contracts;