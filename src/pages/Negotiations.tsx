import React, { useState, useEffect } from 'react';
import { MessageCircle, Phone, FileText, CheckCircle, Clock, AlertTriangle, Shield, Send, Paperclip, User, DollarSign, FileCheck, X, Plus, Calendar, MapPin, CreditCard } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface Negotiation {
  _id: string;
  title: string;
  participants: Array<{
    user: {
      _id: string;
      name: string;
      company: {
        name: string;
      };
    };
    role: 'buyer' | 'seller';
  }>;
  relatedListing?: {
    _id: string;
    title: string;
    wasteType: string;
  };
  relatedRequest?: {
    _id: string;
    title: string;
    materialType: string;
  };
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  messages: Array<{
    _id: string;
    sender: {
      _id: string;
      name: string;
    };
    content: string;
    type: 'text' | 'file' | 'offer' | 'price-discussion' | 'terms-discussion';
    offer?: {
      price: number;
      quantity: number;
      deliveryDate: string;
      terms: string;
    };
    attachments?: Array<{
      name: string;
      url: string;
      type: string;
      size: number;
    }>;
    createdAt: string;
    readBy: Array<{
      user: string;
      readAt: string;
    }>;
  }>;
  currentOffer?: {
    price: number;
    quantity: number;
    deliveryDate: string;
    terms: string;
    offeredBy: string;
    status: 'pending' | 'accepted' | 'rejected' | 'countered';
  };
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
}

interface ContractFormData {
  materialType: string;
  quantity: {
    value: number;
    unit: string;
  };
  price: {
    value: number;
    currency: string;
  };
  deliveryDate: string;
  deliveryLocation: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentTerms: string;
  qualitySpecs: string;
  packagingRequirements: string;
  inspectionRights: string;
  penalties: {
    lateDelivery: string;
    qualityIssues: string;
    cancellation: string;
  };
}

const Negotiations: React.FC = () => {
  const { user } = useApp();
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [selectedNegotiation, setSelectedNegotiation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'text' | 'price-discussion' | 'terms-discussion' | 'offer'>('text');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [creatingContract, setCreatingContract] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [offerData, setOfferData] = useState({
    price: '',
    quantity: '',
    deliveryDate: '',
    terms: ''
  });

  const navigate = useNavigate();

  const [contractForm, setContractForm] = useState<ContractFormData>({
    materialType: '',
    quantity: {
      value: 0,
      unit: 'tons'
    },
    price: {
      value: 0,
      currency: 'INR'
    },
    deliveryDate: '',
    deliveryLocation: {
      address: '',
      city: '',
      state: '',
      pincode: ''
    },
    paymentTerms: 'net-30',
    qualitySpecs: '',
    packagingRequirements: '',
    inspectionRights: '',
    penalties: {
      lateDelivery: '',
      qualityIssues: '',
      cancellation: ''
    }
  });

  useEffect(() => {
    fetchNegotiations();
  }, []);

  const fetchNegotiations = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNegotiations();
      if (response.success) {
        setNegotiations(response.data.negotiations);
      }
    } catch (error) {
      console.error('Failed to fetch negotiations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNegotiationDetails = async (id: string) => {
    try {
      const response = await apiService.getNegotiation(id);
      if (response.success) {
        setNegotiations(prev => 
          prev.map(neg => neg._id === id ? response.data.negotiation : neg)
        );
      }
    } catch (error) {
      console.error('Failed to fetch negotiation details:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedNegotiation) return;

    try {
      setSendingMessage(true);
      let messageData: any = {
        content: newMessage,
        type: messageType
      };

      // Add offer data if it's an offer message
      if (messageType === 'offer' && offerData.price && offerData.quantity) {
        messageData.offer = {
          price: parseFloat(offerData.price),
          quantity: parseFloat(offerData.quantity),
          deliveryDate: offerData.deliveryDate,
          terms: offerData.terms
        };
      }

      const response = await apiService.sendMessage(selectedNegotiation, messageData);

      if (response.success) {
        setNewMessage('');
        setOfferData({ price: '', quantity: '', deliveryDate: '', terms: '' });
        setMessageType('text');
        setShowQuickActions(false);
        await fetchNegotiationDetails(selectedNegotiation);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCreateContract = async () => {
    if (!selectedNegotiation) return;

    try {
      setCreatingContract(true);
      
      // Calculate total value
      const totalValue = contractForm.quantity.value * contractForm.price.value;
      
      // Get the selected negotiation data to extract related information
      const selectedNegotiationData = negotiations.find(n => n._id === selectedNegotiation);
      
      // Get buyer and seller information from the negotiation
      const sellerParticipant = selectedNegotiationData?.participants.find(p => p.role === 'seller');
      const buyerParticipant = selectedNegotiationData?.participants.find(p => p.role === 'buyer');
      
      if (!sellerParticipant || !buyerParticipant) {
        throw new Error('Unable to identify buyer and seller from negotiation');
      }
      
      // Prepare contract data in the exact format expected by the backend
      const contractData = {
        title: `${contractForm.materialType} Supply Contract`,
        parties: {
          seller: {
            user: sellerParticipant.user._id,
            company: sellerParticipant.user.company.name
          },
          buyer: {
            user: buyerParticipant.user._id,
            company: buyerParticipant.user.company.name
          }
        },
        relatedNegotiation: selectedNegotiation,
        ...(selectedNegotiationData?.relatedListing && {
          relatedListing: selectedNegotiationData.relatedListing._id
        }),
        terms: {
          materialType: contractForm.materialType,
          quantity: {
            value: contractForm.quantity.value,
            unit: contractForm.quantity.unit
          },
          price: {
            value: contractForm.price.value,
            currency: contractForm.price.currency
          },
          totalValue: totalValue,
          deliveryDate: contractForm.deliveryDate,
          ...(contractForm.deliveryLocation.address && {
            deliveryLocation: {
              address: contractForm.deliveryLocation.address,
              city: contractForm.deliveryLocation.city,
              state: contractForm.deliveryLocation.state,
              pincode: contractForm.deliveryLocation.pincode
            }
          }),
          paymentTerms: contractForm.paymentTerms,
          ...(contractForm.qualitySpecs && { qualitySpecs: contractForm.qualitySpecs }),
          ...(contractForm.packagingRequirements && { packagingRequirements: contractForm.packagingRequirements }),
          ...(contractForm.inspectionRights && { inspectionRights: contractForm.inspectionRights }),
          ...(contractForm.penalties.lateDelivery || contractForm.penalties.qualityIssues || contractForm.penalties.cancellation) && {
            penalties: {
              ...(contractForm.penalties.lateDelivery && { lateDelivery: contractForm.penalties.lateDelivery }),
              ...(contractForm.penalties.qualityIssues && { qualityIssues: contractForm.penalties.qualityIssues }),
              ...(contractForm.penalties.cancellation && { cancellation: contractForm.penalties.cancellation })
            }
          }
        }
      };

      console.log('Creating contract with data:', JSON.stringify(contractData, null, 2));

      const response = await apiService.createContract(contractData);
      
      if (response.success) {
        setShowContractModal(false);
        // Reset form
        setContractForm({
          materialType: '',
          quantity: { value: 0, unit: 'tons' },
          price: { value: 0, currency: 'INR' },
          deliveryDate: '',
          deliveryLocation: { address: '', city: '', state: '', pincode: '' },
          paymentTerms: 'net-30',
          qualitySpecs: '',
          packagingRequirements: '',
          inspectionRights: '',
          penalties: { lateDelivery: '', qualityIssues: '', cancellation: '' }
        });
        
        // Refresh negotiations
        await fetchNegotiations();
        navigate("/contracts");
      }
    } catch (error) {
      console.error('Failed to create contract:', error);
      alert(`Failed to create contract: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setCreatingContract(false);
    }
  };

  const filteredNegotiations = negotiations.filter(neg => 
    filterStatus === 'all' || neg.status === filterStatus
  );

  const selectedNegotiationData = negotiations.find(n => n._id === selectedNegotiation);

  const getCounterparty = (negotiation: Negotiation) => {
    return negotiation.participants.find(p => p.user._id !== user?._id);
  };

  const getUnreadCount = (negotiation: Negotiation) => {
    if (!user) return 0;
    return negotiation.messages.filter(message => {
      const isRead = message.readBy.some(read => read.user === user._id);
      return !isRead && message.sender._id !== user._id;
    }).length;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'price-discussion':
        return 'border-l-4 border-blue-500 bg-blue-50';
      case 'terms-discussion':
        return 'border-l-4 border-green-500 bg-green-50';
      case 'offer':
        return 'border-l-4 border-purple-500 bg-purple-50';
      case 'file':
        return 'border-l-4 border-orange-500 bg-orange-50';
      default:
        return '';
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'price-discussion':
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      case 'terms-discussion':
        return <FileCheck className="h-4 w-4 text-green-500" />;
      case 'offer':
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
      case 'file':
        return <Paperclip className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="h-full bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Negotiations</h1>
        <p className="text-gray-600 mt-2">Manage your ongoing deals and communications</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Negotiations List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Negotiations</h2>
              <div className="flex space-x-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredNegotiations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Negotiations</h3>
                <p className="text-gray-600 mb-4">Start negotiating by inquiring about listings</p>
              </div>
            ) : (
              filteredNegotiations.map((negotiation) => {
                const counterparty = getCounterparty(negotiation);
                const unreadCount = getUnreadCount(negotiation);
                
                return (
                  <div
                    key={negotiation._id}
                    onClick={() => {
                      setSelectedNegotiation(negotiation._id);
                      fetchNegotiationDetails(negotiation._id);
                    }}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedNegotiation === negotiation._id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm">{negotiation.title}</h3>
                        <p className="text-xs text-gray-600 mt-1">
                          With {counterparty?.user.name}
                        </p>
                        <p className="text-xs text-gray-500">{counterparty?.user.company.name}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(negotiation.status)}
                        {unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(negotiation.status)}`}>
                        {negotiation.status.charAt(0).toUpperCase() + negotiation.status.slice(1)}
                      </span>
                      <span className="text-xs font-medium text-gray-900">
                        {negotiation.currentOffer?.price
                          ? `₹${negotiation.currentOffer.price.toLocaleString()}`
                          : 'No offer yet'}
                      </span>
                    </div>
                    
                    {negotiation.messages.length > 0 && (
                      <p className="text-xs text-gray-600 mt-2 truncate">
                        {negotiation.messages[negotiation.messages.length - 1].content}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(negotiation.lastActivity).toLocaleDateString()}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
          {selectedNegotiationData ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      {(() => {
                        const counterparty = getCounterparty(selectedNegotiationData);
                        return (
                          <>
                            <h3 className="font-semibold text-gray-900">{counterparty?.user.name}</h3>
                            <p className="text-sm text-gray-600">{counterparty?.user.company.name}</p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <Phone className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <FileText className="h-5 w-5" />
                    </button>
                    {(() => {
                      // Check if current user is a seller in this negotiation
                      const isCurrentUserSeller = selectedNegotiationData && user && 
                        selectedNegotiationData.participants.some(p => 
                          p.user._id === user._id && p.role === 'seller'
                        );
                      
                      return isCurrentUserSeller && (
                        <button
                          onClick={() => setShowContractModal(true)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors font-medium"
                        >
                          Make Contract
                        </button>
                      );
                    })()}
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedNegotiationData.status)}`}>
                      {selectedNegotiationData.status.charAt(0).toUpperCase() + selectedNegotiationData.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deal Summary */}
              {selectedNegotiationData.currentOffer && (
                <div className="p-4 bg-blue-50 border-b border-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600">Current Offer</p>
                      <p className="font-semibold text-gray-900">
                        {selectedNegotiationData.currentOffer?.price != null
                          ? `₹${selectedNegotiationData.currentOffer.price.toLocaleString()}`
                          : 'No price'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Quantity</p>
                      <p className="font-semibold text-gray-900">{selectedNegotiationData.currentOffer.quantity}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Delivery</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(selectedNegotiationData.currentOffer.deliveryDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedNegotiationData.messages.map((message) => {
                  const isOwn = message.sender._id === user?._id;
                  
                  return (
                    <div
                      key={message._id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md rounded-lg ${
                          isOwn
                            ? 'bg-blue-600 text-white'
                            : `bg-gray-100 text-gray-900 ${getMessageTypeColor(message.type)}`
                        }`}
                      >
                        {/* Message type indicator for non-text messages */}
                        {message.type !== 'text' && !isOwn && (
                          <div className="px-4 pt-3 pb-1">
                            <div className="flex items-center space-x-2">
                              {getMessageTypeIcon(message.type)}
                              <span className="text-xs font-medium capitalize">
                                {message.type.replace('-', ' ')}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="px-4 py-2">
                          {message.type === 'file' && message.attachments && (
                            <div className="mb-2">
                              {message.attachments.map((attachment, index) => (
                                <div key={index} className="flex items-center space-x-2 p-2 bg-white bg-opacity-20 rounded mb-1">
                                  <Paperclip className="h-4 w-4" />
                                  <span className="text-sm">{attachment.name}</span>
                                  <span className="text-xs opacity-75">
                                    ({Math.round(attachment.size / 1024)}KB)
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {message.type === 'offer' && message.offer && (
                            <div className="mb-2 p-3 bg-white bg-opacity-20 rounded">
                              <div className="text-sm font-medium mb-2">Offer Details</div>
                              <div className="text-xs space-y-1">
                                <div>Price: ₹{message.offer.price.toLocaleString()}</div>
                                <div>Quantity: {message.offer.quantity}</div>
                                <div>Delivery: {new Date(message.offer.deliveryDate).toLocaleDateString()}</div>
                                {message.offer.terms && <div>Terms: {message.offer.terms}</div>}
                              </div>
                            </div>
                          )}
                          
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-500'}`}>
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Actions */}
              {showQuickActions && (
                <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">Quick Actions:</span>
                    <button
                      onClick={() => setMessageType('price-discussion')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        messageType === 'price-discussion' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      <DollarSign className="h-3 w-3 inline mr-1" />
                      Price Discussion
                    </button>
                    <button
                      onClick={() => setMessageType('terms-discussion')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        messageType === 'terms-discussion' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      <FileCheck className="h-3 w-3 inline mr-1" />
                      Terms Discussion
                    </button>
                    <button
                      onClick={() => setMessageType('offer')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        messageType === 'offer' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      }`}
                    >
                      <CheckCircle className="h-3 w-3 inline mr-1" />
                      Make Offer
                    </button>
                    <button
                      onClick={() => setShowQuickActions(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Offer Form */}
                  {messageType === 'offer' && (
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        type="number"
                        placeholder="Price (₹)"
                        value={offerData.price}
                        onChange={(e) => setOfferData(prev => ({ ...prev, price: e.target.value }))}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Quantity"
                        value={offerData.quantity}
                        onChange={(e) => setOfferData(prev => ({ ...prev, quantity: e.target.value }))}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="date"
                        value={offerData.deliveryDate}
                        onChange={(e) => setOfferData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Terms"
                        value={offerData.terms}
                        onChange={(e) => setOfferData(prev => ({ ...prev, terms: e.target.value }))}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setShowQuickActions(!showQuickActions)}
                    className={`p-2 rounded-lg transition-colors ${
                      showQuickActions 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={
                      messageType === 'price-discussion' ? 'Discuss pricing...' :
                      messageType === 'terms-discussion' ? 'Discuss terms...' :
                      messageType === 'offer' ? 'Describe your offer...' :
                      'Type your message...'
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={sendingMessage}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
                {messageType !== 'text' && (
                  <div className="mt-2 text-xs text-gray-500">
                    Sending as: {messageType.replace('-', ' ')}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Negotiation</h3>
                <p className="text-gray-600">Choose a negotiation from the list to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contract Creation Modal */}
      {showContractModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Create Contract</h2>
                <button
                  onClick={() => setShowContractModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Material Type
                    </label>
                    <input
                      type="text"
                      value={contractForm.materialType}
                      onChange={(e) => setContractForm(prev => ({ ...prev, materialType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Plastic Waste, Metal Scrap"
                    />
                  </div>
                </div>
              </div>

              {/* Quantity & Pricing */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quantity & Pricing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={contractForm.quantity.value || ''}
                        onChange={(e) => setContractForm(prev => ({ 
                          ...prev, 
                          quantity: { ...prev.quantity, value: parseFloat(e.target.value) || 0 }
                        }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Amount"
                      />
                      <select
                        value={contractForm.quantity.unit}
                        onChange={(e) => setContractForm(prev => ({ 
                          ...prev, 
                          quantity: { ...prev.quantity, unit: e.target.value }
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="tons">Tons</option>
                        <option value="kg">Kg</option>
                        <option value="pieces">Pieces</option>
                        <option value="liters">Liters</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Price (₹)
                    </label>
                    <input
                      type="number"
                      value={contractForm.price.value || ''}
                      onChange={(e) => setContractForm(prev => ({ 
                        ...prev, 
                        price: { ...prev.price, value: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Price per unit"
                    />
                  </div>
                </div>
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-700">Total Contract Value:</span>
                    <span className="text-lg font-bold text-green-800">
                      ₹{(contractForm.quantity.value * contractForm.price.value).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery & Payment Terms */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Details</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Delivery Date
                    </label>
                    <input
                      type="date"
                      value={contractForm.deliveryDate}
                      onChange={(e) => setContractForm(prev => ({ ...prev, deliveryDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <CreditCard className="h-4 w-4 inline mr-1" />
                      Payment Terms
                    </label>
                    <select
                      value={contractForm.paymentTerms}
                      onChange={(e) => setContractForm(prev => ({ ...prev, paymentTerms: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="advance">Payment in Advance</option>
                      <option value="cod">Cash on Delivery</option>
                      <option value="net-15">Net 15 Days</option>
                      <option value="net-30">Net 30 Days</option>
                      <option value="net-45">Net 45 Days</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Delivery Location
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={contractForm.deliveryLocation.address}
                      onChange={(e) => setContractForm(prev => ({ 
                        ...prev, 
                        deliveryLocation: { ...prev.deliveryLocation, address: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Address"
                    />
                    <input
                      type="text"
                      value={contractForm.deliveryLocation.city}
                      onChange={(e) => setContractForm(prev => ({ 
                        ...prev, 
                        deliveryLocation: { ...prev.deliveryLocation, city: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="City"
                    />
                    <input
                      type="text"
                      value={contractForm.deliveryLocation.state}
                      onChange={(e) => setContractForm(prev => ({ 
                        ...prev, 
                        deliveryLocation: { ...prev.deliveryLocation, state: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="State"
                    />
                    <input
                      type="text"
                      value={contractForm.deliveryLocation.pincode}
                      onChange={(e) => setContractForm(prev => ({ 
                        ...prev, 
                        deliveryLocation: { ...prev.deliveryLocation, pincode: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Pincode"
                    />
                  </div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quality Specifications
                    </label>
                    <textarea
                      value={contractForm.qualitySpecs}
                      onChange={(e) => setContractForm(prev => ({ ...prev, qualitySpecs: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Describe quality requirements, standards, certifications..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Packaging Requirements
                    </label>
                    <textarea
                      value={contractForm.packagingRequirements}
                      onChange={(e) => setContractForm(prev => ({ ...prev, packagingRequirements: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      placeholder="Specify packaging standards, materials, labeling..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Inspection Rights
                    </label>
                    <textarea
                      value={contractForm.inspectionRights}
                      onChange={(e) => setContractForm(prev => ({ ...prev, inspectionRights: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      placeholder="Define inspection procedures, timelines, acceptance criteria..."
                    />
                  </div>
                </div>
              </div>

              {/* Penalties */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Penalty Terms</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Late Delivery Penalty
                    </label>
                    <input
                      type="text"
                      value={contractForm.penalties.lateDelivery}
                      onChange={(e) => setContractForm(prev => ({ 
                        ...prev, 
                        penalties: { ...prev.penalties, lateDelivery: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 2% of contract value per day"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quality Issues Penalty
                    </label>
                    <input
                      type="text"
                      value={contractForm.penalties.qualityIssues}
                      onChange={(e) => setContractForm(prev => ({ 
                        ...prev, 
                        penalties: { ...prev.penalties, qualityIssues: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Replacement or 10% price reduction"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cancellation Terms
                    </label>
                    <input
                      type="text"
                      value={contractForm.penalties.cancellation}
                      onChange={(e) => setContractForm(prev => ({ 
                        ...prev, 
                        penalties: { ...prev.penalties, cancellation: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 15% of contract value as cancellation fee"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <div>Total Contract Value: <span className="font-semibold text-gray-900">
                    ₹{(contractForm.quantity.value * contractForm.price.value).toLocaleString()}
                  </span></div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowContractModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateContract}
                    disabled={creatingContract || !contractForm.materialType || !contractForm.quantity.value || !contractForm.price.value}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors"
                  >
                    {creatingContract ? 'Creating Contract...' : 'Create Contract'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Negotiations;