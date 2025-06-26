import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Calendar, Eye, MessageCircle, Star, Package, 
  TrendingUp, AlertTriangle, Download, FileText,
  Shield, Clock, DollarSign, Scale, Building, Phone, Mail,
  CheckCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';

interface WasteListing {
  _id: string;
  seller: {
    _id: string;
    name: string;
    company: {
      name: string;
      verified: boolean;
      address?: string | {
        street?: string;
        city?: string;
        state?: string;
        pincode?: string;
        country?: string;
      };
    };
    phone?: string;
  };
  title: string;
  wasteType: string;
  category: string;
  quantity: {
    value: number;
    unit: string;
  };
  frequency: 'daily' | 'weekly' | 'monthly' | 'one-time';
  price: {
    value: number;
    currency: string;
    negotiable: boolean;
  };
  location: {
    city: string;
    state: string;
    address?: string | {
      street?: string;
      city?: string;
      state?: string;
      pincode?: string;
      country?: string;
    };
  };
  urgency: 'low' | 'medium' | 'high';
  description?: string;
  images: Array<{
    url: string;
    caption?: string;
  }>;
  documents: Array<{
    type: string;
    url: string;
    name: string;
  }>;
  msds: {
    url?: string;
    verified: boolean;
  };
  specifications: {
    purity?: string;
    moisture?: string;
    contamination?: string;
    packaging?: string;
    storageConditions?: string;
  };
  hazardous: boolean;
  certifications: string[];
  status: 'active' | 'inactive' | 'sold' | 'expired';
  views: number;
  inquiries: Array<{
    buyer: string;
    message: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const WasteListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useApp();
  const [listing, setListing] = useState<WasteListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [startingNegotiation, setStartingNegotiation] = useState(false);
  const [inquiring, setInquiring] = useState(false);

  useEffect(() => {
    if (id) {
      fetchListing();
    }
  }, [id]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      const response = await apiService.getWasteListing(id!);
      if (response.success) {
        setListing(response.data.listing);
      }
    } catch (error) {
      console.error('Failed to fetch listing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNegotiation = async () => {
    if (!user) {
      alert('Please login to start negotiations');
      return;
    }

    if (user.type !== 'buyer') {
      alert('Only buyers can start negotiations');
      return;
    }

    if (!listing) return;

    try {
      setStartingNegotiation(true);
      
      const response = await apiService.createNegotiation({
        title: `Negotiation for ${listing.title}`,
        counterpartyId: listing.seller._id,
        type: 'listing',
        relatedId: listing._id
      });

      if (response.success) {
        navigate('/negotiations');
      }
    } catch (error) {
      console.error('Failed to start negotiation:', error);
      alert('Failed to start negotiation. Please try again.');
    } finally {
      setStartingNegotiation(false);
    }
  };

  const handleInquire = async () => {
    if (!user) {
      alert('Please login to inquire about listings');
      return;
    }

    if (user.type !== 'buyer') {
      alert('Only buyers can inquire about listings');
      return;
    }

    if (!listing) return;

    try {
      setInquiring(true);
      const message = `Hi, I'm interested in your ${listing.title}. Can we discuss the details?`;
      
      const response = await apiService.inquireAboutListing(listing._id, message);
      if (response.success) {
        alert('Inquiry sent successfully! The seller will contact you soon.');
        await fetchListing(); // Refresh to show updated inquiry count
      }
    } catch (error) {
      console.error('Failed to send inquiry:', error);
      alert('Failed to send inquiry. Please try again.');
    } finally {
      setInquiring(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <TrendingUp className="h-4 w-4" />;
      case 'low':
        return <Package className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatAddress = (address: string | object | undefined): string => {
    if (!address) return '';
    
    if (typeof address === 'string') {
      return address;
    }
    
    if (typeof address === 'object') {
      const addr = address as {
        street?: string;
        city?: string;
        state?: string;
        pincode?: string;
        country?: string;
      };
      
      const parts = [
        addr.street,
        addr.city,
        addr.state,
        addr.pincode,
        addr.country
      ].filter(Boolean);
      
      return parts.join(', ');
    }
    
    return '';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded-xl"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Listing not found</h3>
          <p className="text-gray-600 mb-6">The listing you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/listings"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/listings"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Listings
        </Link>
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
            <p className="text-xl text-gray-600 mb-4">{listing.wasteType}</p>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {listing.location.city}, {listing.location.state}
              </div>
              <div className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                {listing.views} views
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(listing.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getUrgencyColor(listing.urgency)}`}>
              {getUrgencyIcon(listing.urgency)}
              <span className="ml-1 capitalize">{listing.urgency} Priority</span>
            </span>
            
            {listing.seller.company.verified && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                <Star className="h-4 w-4 mr-1" />
                Verified Seller
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Images and Documents */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image Gallery */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="aspect-w-16 aspect-h-9 bg-gray-200">
              {listing.images && listing.images.length > 0 ? (
                <img
                  src={listing.images[selectedImage]?.url}
                  alt={listing.images[selectedImage]?.caption || listing.title}
                  className="w-full h-96 object-cover"
                />
              ) : (
                <div className="w-full h-96 flex items-center justify-center">
                  <Package className="h-24 w-24 text-gray-400" />
                </div>
              )}
            </div>
            
            {listing.images && listing.images.length > 1 && (
              <div className="p-4 bg-gray-50 border-t">
                <div className="flex space-x-2 overflow-x-auto">
                  {listing.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={image.caption || `Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {listing.description && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
              <p className="text-gray-700 leading-relaxed">{listing.description}</p>
            </div>
          )}

          {/* Specifications */}
          {listing.specifications && Object.keys(listing.specifications).some(key => listing.specifications[key as keyof typeof listing.specifications]) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {listing.specifications.purity && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Purity</p>
                    <p className="text-gray-900">{listing.specifications.purity}</p>
                  </div>
                )}
                {listing.specifications.moisture && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Moisture Content</p>
                    <p className="text-gray-900">{listing.specifications.moisture}</p>
                  </div>
                )}
                {listing.specifications.contamination && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Contamination Level</p>
                    <p className="text-gray-900">{listing.specifications.contamination}</p>
                  </div>
                )}
                {listing.specifications.packaging && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Packaging</p>
                    <p className="text-gray-900">{listing.specifications.packaging}</p>
                  </div>
                )}
                {listing.specifications.storageConditions && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Storage Conditions</p>
                    <p className="text-gray-900">{listing.specifications.storageConditions}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents */}
          {(listing.documents?.length > 0 || listing.msds?.url) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents & Certifications</h3>
              
              <div className="space-y-3">
                {listing.msds?.url && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 text-red-600 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Material Safety Data Sheet (MSDS)</p>
                        <p className="text-sm text-gray-600">
                          {listing.msds.verified ? (
                            <span className="text-green-600 flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Verified
                            </span>
                          ) : (
                            <span className="text-yellow-600 flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              Pending Verification
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <a
                      href={listing.msds.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </a>
                  </div>
                )}
                
                {listing.documents?.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-blue-600 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <p className="text-sm text-gray-600 capitalize">{doc.type}</p>
                      </div>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {listing.certifications?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h3>
              <div className="flex flex-wrap gap-2">
                {listing.certifications.map((cert, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Details and Actions */}
        <div className="space-y-6">
          {/* Price and Quantity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">₹{listing.price.value.toLocaleString()}</p>
                <p className="text-sm text-gray-600">
                  {listing.price.negotiable ? 'Negotiable' : 'Fixed Price'}
                </p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Scale className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{listing.quantity.value}</p>
                <p className="text-sm text-gray-600">{listing.quantity.unit}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <span className="font-medium">{listing.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Frequency:</span>
                <span className="font-medium capitalize">{listing.frequency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium capitalize ${
                  listing.status === 'active' ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {listing.status}
                </span>
              </div>
              {listing.hazardous && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Hazardous:</span>
                  <span className="font-medium text-red-600 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Yes
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {user?.type === 'buyer' && user._id !== listing.seller._id && listing.status === 'active' && (
              <div className="space-y-3">
                <button
                  onClick={handleStartNegotiation}
                  disabled={startingNegotiation}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  {startingNegotiation ? 'Starting Negotiation...' : 'Start Negotiation'}
                </button>
                
                <button
                  onClick={handleInquire}
                  disabled={inquiring}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  {inquiring ? 'Sending...' : 'Send Inquiry'}
                </button>
              </div>
            )}
          </div>

          {/* Seller Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h3>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-900">{listing.seller.name}</h4>
                  {listing.seller.company.verified && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <p className="text-gray-600">{listing.seller.company.name}</p>
                
                {listing.seller.company.address && (
                  <p className="text-sm text-gray-500 mt-1">
                    {formatAddress(listing.seller.company.address)}
                  </p>
                )}
                
                {listing.seller.phone && (
                  <div className="flex items-center mt-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {listing.seller.phone}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
            
            <div className="space-y-2">
              <div className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                {listing.location.city}, {listing.location.state}
              </div>
              
              {listing.location.address && (
                <p className="text-sm text-gray-600 pl-6">
                  {formatAddress(listing.location.address)}
                </p>
              )}
            </div>
          </div>

          {/* Activity Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Views:</span>
                <span className="font-medium">{listing.views}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Inquiries:</span>
                <span className="font-medium">{listing.inquiries?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Listed:</span>
                <span className="font-medium">{new Date(listing.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WasteListingDetail;