import React, { useState, useEffect } from 'react';
import { MessageCircle, Phone, FileText, CheckCircle, Clock, AlertTriangle, Send, Paperclip, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';

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
    type: 'text' | 'file' | 'offer';
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

const Negotiations: React.FC = () => {
  const { user } = useApp();
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [selectedNegotiation, setSelectedNegotiation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

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
        // Update the specific negotiation in the list
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
      const response = await apiService.sendMessage(selectedNegotiation, {
        content: newMessage,
        type: 'text'
      });

      if (response.success) {
        setNewMessage('');
        // Refresh the negotiation details
        await fetchNegotiationDetails(selectedNegotiation);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSendingMessage(false);
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
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwn
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {message.type === 'file' && (
                          <div className="flex items-center space-x-2 mb-2">
                            <Paperclip className="h-4 w-4" />
                            <span className="text-sm">Document attached</span>
                          </div>
                        )}
                        {message.type === 'offer' && (
                          <div className="mb-2 p-2 bg-white bg-opacity-20 rounded">
                            <span className="text-sm font-medium">Offer Made</span>
                          </div>
                        )}
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-500'}`}>
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
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
    </div>
  );
};

export default Negotiations;