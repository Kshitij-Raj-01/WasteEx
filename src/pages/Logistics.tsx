import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Calendar, Clock, Package, Phone, MessageCircle, CheckCircle, AlertTriangle, Navigation } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';

interface Shipment {
  _id: string;
  shipmentNumber: string;
  contract: {
    _id: string;
    contractNumber: string;
    terms: {
      materialType: string;
    };
  };
  seller: {
    _id: string;
    name: string;
    company: {
      name: string;
    };
  };
  buyer: {
    _id: string;
    name: string;
    company: {
      name: string;
    };
  };
  logistics: {
    provider: string;
    trackingNumber?: string;
    contactPerson?: {
      name: string;
      phone: string;
    };
  };
  pickup: {
    address: {
      street: string;
      city: string;
      state: string;
    };
    scheduledDate: string;
    actualDate?: string;
  };
  delivery: {
    address: {
      street: string;
      city: string;
      state: string;
    };
    scheduledDate: string;
    estimatedDate: string;
    actualDate?: string;
  };
  cargo: {
    description: string;
    weight: {
      value: number;
      unit: string;
    };
    value: number;
  };
  status: 'created' | 'pickup-scheduled' | 'picked-up' | 'in-transit' | 'out-for-delivery' | 'delivered' | 'cancelled' | 'returned';
  tracking: Array<{
    status: string;
    location?: {
      city: string;
      state: string;
    };
    timestamp: string;
    description: string;
    source: 'system' | 'partner' | 'manual';
  }>;
  cost?: {
    total: number;
    currency: string;
  };
  createdAt: string;
  updatedAt: string;
}

const Logistics: React.FC = () => {
  const { user } = useApp();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const response = await apiService.getShipments();
      if (response.success) {
        setShipments(response.data.shipments);
      }
    } catch (error) {
      console.error('Failed to fetch shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateShipmentStatus = async (shipmentId: string, status: string, description?: string) => {
    try {
      const response = await apiService.updateShipmentStatus(shipmentId, {
        status,
        description
      });
      
      if (response.success) {
        // Refresh shipments
        await fetchShipments();
      }
    } catch (error) {
      console.error('Failed to update shipment status:', error);
    }
  };

  const filteredShipments = shipments.filter(shipment => 
    filterStatus === 'all' || shipment.status === filterStatus
  );

  const selectedShipmentData = shipments.find(s => s._id === selectedShipment);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'created':
      case 'pickup-scheduled':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'picked-up':
      case 'in-transit':
      case 'out-for-delivery':
        return <Truck className="h-4 w-4 text-yellow-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
      case 'returned':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created':
      case 'pickup-scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'picked-up':
      case 'in-transit':
      case 'out-for-delivery':
        return 'bg-yellow-100 text-yellow-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'returned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'created': return 10;
      case 'pickup-scheduled': return 25;
      case 'picked-up': return 40;
      case 'in-transit': return 65;
      case 'out-for-delivery': return 85;
      case 'delivered': return 100;
      case 'cancelled':
      case 'returned': return 0;
      default: return 0;
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-500';
      case 'in-transit':
      case 'out-for-delivery':
        return 'bg-yellow-500';
      case 'cancelled':
      case 'returned':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
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
        <h1 className="text-3xl font-bold text-gray-900">Logistics & Tracking</h1>
        <p className="text-gray-600 mt-2">Track your shipments and manage logistics operations</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Shipments List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Shipments</h2>
                <div className="flex items-center space-x-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="created">Created</option>
                    <option value="pickup-scheduled">Pickup Scheduled</option>
                    <option value="picked-up">Picked Up</option>
                    <option value="in-transit">In Transit</option>
                    <option value="out-for-delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6">
              {filteredShipments.length === 0 ? (
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Shipments</h3>
                  <p className="text-gray-600">Shipments will appear here once contracts are executed</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredShipments.map((shipment) => (
                    <div
                      key={shipment._id}
                      onClick={() => setSelectedShipment(shipment._id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedShipment === shipment._id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{shipment.cargo.description}</h3>
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {shipment.shipmentNumber}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {shipment.pickup.address.city} → {shipment.delivery.address.city}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(shipment.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                            {shipment.status.charAt(0).toUpperCase() + shipment.status.slice(1).replace('-', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{getProgressPercentage(shipment.status)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(shipment.status)}`}
                            style={{ width: `${getProgressPercentage(shipment.status)}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Partner</p>
                          <p className="font-medium text-sm">{shipment.logistics.provider}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Weight</p>
                          <p className="font-medium text-sm">{shipment.cargo.weight.value} {shipment.cargo.weight.unit}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Value</p>
                          <p className="font-medium text-sm">₹{shipment.cargo.value.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-1" />
                          ETA: {new Date(shipment.delivery.estimatedDate).toLocaleDateString()}
                        </div>
                        {shipment.logistics.trackingNumber && (
                          <div className="text-xs font-mono text-gray-500">
                            {shipment.logistics.trackingNumber}
                          </div>
                        )}
                      </div>

                      {shipment.tracking.length > 0 && (
                        <div className="mt-3 p-2 bg-yellow-50 rounded-md">
                          <div className="flex items-center text-xs text-yellow-700">
                            <Navigation className="h-3 w-3 mr-1" />
                            {shipment.tracking[shipment.tracking.length - 1].description}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Shipment Details */}
        <div className="space-y-6">
          {selectedShipmentData ? (
            <>
              {/* Tracking Details */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tracking Details</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <div className="flex items-center">
                      {getStatusIcon(selectedShipmentData.status)}
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedShipmentData.status)}`}>
                        {selectedShipmentData.status.charAt(0).toUpperCase() + selectedShipmentData.status.slice(1).replace('-', ' ')}
                      </span>
                    </div>
                  </div>

                  {selectedShipmentData.logistics.trackingNumber && (
                    <div>
                      <span className="text-sm text-gray-600">Tracking Number</span>
                      <p className="font-mono text-sm font-medium">{selectedShipmentData.logistics.trackingNumber}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">From</span>
                      <p className="font-medium">{selectedShipmentData.pickup.address.city}, {selectedShipmentData.pickup.address.state}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">To</span>
                      <p className="font-medium">{selectedShipmentData.delivery.address.city}, {selectedShipmentData.delivery.address.state}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Scheduled</span>
                      <p className="font-medium">{new Date(selectedShipmentData.pickup.scheduledDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">ETA</span>
                      <p className="font-medium">{new Date(selectedShipmentData.delivery.estimatedDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {selectedShipmentData.delivery.actualDate && (
                    <div>
                      <span className="text-sm text-gray-600">Delivered On</span>
                      <p className="font-medium text-green-600">{new Date(selectedShipmentData.delivery.actualDate).toLocaleDateString()}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>{getProgressPercentage(selectedShipmentData.status)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(selectedShipmentData.status)}`}
                        style={{ width: `${getProgressPercentage(selectedShipmentData.status)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Logistics Partner */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Logistics Partner</h3>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-600">Partner</span>
                    <p className="font-semibold text-lg">{selectedShipmentData.logistics.provider}</p>
                  </div>

                  {selectedShipmentData.logistics.contactPerson && (
                    <div>
                      <span className="text-sm text-gray-600">Contact</span>
                      <p className="font-medium">{selectedShipmentData.logistics.contactPerson.name}</p>
                      <p className="text-sm text-gray-600">{selectedShipmentData.logistics.contactPerson.phone}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <button className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                      <Phone className="h-4 w-4" />
                      <span>Call</span>
                    </button>
                    <button className="flex items-center justify-center space-x-2 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      <span>Message</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tracking History */}
              {selectedShipmentData.tracking.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tracking History</h3>
                  
                  <div className="space-y-4">
                    {selectedShipmentData.tracking.map((track, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{track.status}</p>
                          <p className="text-sm text-gray-600">{track.description}</p>
                          {track.location && (
                            <p className="text-xs text-gray-500">{track.location.city}, {track.location.state}</p>
                          )}
                          <p className="text-xs text-gray-500">{new Date(track.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shipment Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipment Info</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Shipment Number</span>
                    <span className="font-medium">{selectedShipmentData.shipmentNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Contract</span>
                    <span className="font-medium">{selectedShipmentData.contract.contractNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Weight</span>
                    <span className="font-medium">{selectedShipmentData.cargo.weight.value} {selectedShipmentData.cargo.weight.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Value</span>
                    <span className="font-semibold">₹{selectedShipmentData.cargo.value.toLocaleString()}</span>
                  </div>
                  {selectedShipmentData.cost && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Shipping Cost</span>
                      <span className="font-medium">₹{selectedShipmentData.cost.total.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Shipment</h3>
                <p className="text-gray-600">Choose a shipment from the list to view tracking details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Logistics;