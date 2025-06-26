import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, MapPin, Calendar, Eye, MessageCircle, Star, Package, TrendingUp, AlertTriangle, Plus } from 'lucide-react';
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
    };
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
    address?: string;
  };
  urgency: 'low' | 'medium' | 'high';
  description?: string;
  images: Array<{
    url: string;
    caption?: string;
  }>;
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

const Listings: React.FC = () => {
  const { user } = useApp();
  const [wasteListings, setWasteListings] = useState<WasteListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [inquiringListing, setInquiringListing] = useState<string | null>(null);

  const categories = [
    'Plastic Waste',
    'Metal Scrap',
    'Paper Waste',
    'Textile Waste',
    'Chemical Waste',
    'Electronic Waste',
    'Rubber Waste',
    'Glass Waste',
    'Wood Waste',
    'Organic Waste',
  ];

  const locations = [
    'Mumbai, Maharashtra',
    'Delhi, NCR',
    'Bangalore, Karnataka',
    'Chennai, Tamil Nadu',
    'Pune, Maharashtra',
    'Hyderabad, Telangana',
    'Kolkata, West Bengal',
    'Ahmedabad, Gujarat',
    'Surat, Gujarat',
    'Jaipur, Rajasthan',
  ];

  useEffect(() => {
    fetchWasteListings();
  }, []);

  const fetchWasteListings = async () => {
    try {
      setLoading(true);
      const params = {
        category: selectedCategory,
        urgency: selectedUrgency,
        search: searchTerm,
        sort: sortBy
      };
      
      // Remove empty params
      Object.keys(params).forEach(key => {
        if (!params[key as keyof typeof params]) {
          delete params[key as keyof typeof params];
        }
      });

      const response = await apiService.getWasteListings(params);
      if (response.success) {
        setWasteListings(response.data.listings);
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInquire = async (listingId: string) => {
    if (!user) {
      alert('Please login to inquire about listings');
      return;
    }

    if (user.type !== 'buyer') {
      alert('Only buyers can inquire about listings');
      return;
    }

    try {
      setInquiringListing(listingId);
      const message = `Hi, I'm interested in your ${wasteListings.find(l => l._id === listingId)?.title}. Can we discuss the details?`;
      
      const response = await apiService.inquireAboutListing(listingId, message);
      if (response.success) {
        alert('Inquiry sent successfully! The seller will contact you soon.');
        // Optionally refresh the listing to show updated inquiry count
        await fetchWasteListings();
      }
    } catch (error) {
      console.error('Failed to send inquiry:', error);
      alert('Failed to send inquiry. Please try again.');
    } finally {
      setInquiringListing(null);
    }
  };

  const startNegotiation = async (listingId: string) => {
    if (!user) {
      alert('Please login to start negotiations');
      return;
    }

    try {
      const listing = wasteListings.find(l => l._id === listingId);
      if (!listing) return;

      const response = await apiService.createNegotiation({
        title: `Negotiation for ${listing.title}`,
        counterpartyId: listing.seller._id,
        type: 'listing',
        relatedId: listingId
      });

      if (response.success) {
        alert('Negotiation started! You can now chat with the seller.');
        // Redirect to negotiations page
        window.location.href = '/negotiations';
      }
    } catch (error) {
      console.error('Failed to start negotiation:', error);
      alert('Failed to start negotiation. Please try again.');
    }
  };

  // Apply filters and sorting
  const filteredListings = wasteListings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.wasteType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || listing.category === selectedCategory;
    const matchesLocation = !selectedLocation || 
                           `${listing.location.city}, ${listing.location.state}` === selectedLocation;
    const matchesUrgency = !selectedUrgency || listing.urgency === selectedUrgency;

    return matchesSearch && matchesCategory && matchesLocation && matchesUrgency;
  });

  const sortedListings = [...filteredListings].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'price-high':
        return b.price.value - a.price.value;
      case 'price-low':
        return a.price.value - b.price.value;
      case 'quantity-high':
        return b.quantity.value - a.quantity.value;
      case 'quantity-low':
        return a.quantity.value - b.quantity.value;
      default:
        return 0;
    }
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return <AlertTriangle className="h-3 w-3" />;
      case 'medium':
        return <TrendingUp className="h-3 w-3" />;
      case 'low':
        return <Package className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Waste Listings</h1>
        <p className="text-gray-600 mt-2">Discover industrial waste materials available for purchase</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search by material type, description..."
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-high">Price: High to Low</option>
              <option value="price-low">Price: Low to High</option>
              <option value="quantity-high">Quantity: High to Low</option>
              <option value="quantity-low">Quantity: Low to High</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>

            <button
              onClick={fetchWasteListings}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Locations</option>
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                <select
                  value={selectedUrgency}
                  onChange={(e) => setSelectedUrgency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Urgency Levels</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    setSelectedLocation('');
                    setSelectedUrgency('');
                    setSearchTerm('');
                    fetchWasteListings();
                  }}
                  className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600">
          Showing {sortedListings.length} listings
        </p>
        {user?.type === 'seller' && (
          <Link
            to="/waste-listing"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Listing
          </Link>
        )}
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : sortedListings.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No listings found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search criteria or filters</p>
          {user?.type === 'seller' && (
            <Link
              to="/waste-listing"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center"
            >
              <Package className="h-4 w-4 mr-2" />
              Create First Listing
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedListings.map((listing) => (
            <Link
              key={listing._id}
              to={`/listings/${listing._id}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
            >
              {/* Image */}
              <div className="relative h-48 bg-gray-200">
                {listing.images && listing.images.length > 0 ? (
                  <img
                    src={listing.images[0].url}
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                
                {/* Urgency Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(listing.urgency)}`}>
                    {getUrgencyIcon(listing.urgency)}
                    <span className="ml-1 capitalize">{listing.urgency}</span>
                  </span>
                </div>

                {/* Verified Badge */}
                {listing.seller.company.verified && (
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Star className="h-3 w-3 mr-1" />
                      Verified
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{listing.title}</h3>
                    <p className="text-sm text-gray-600">{listing.wasteType}</p>
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-600 mb-3">
                  <MapPin className="h-4 w-4 mr-1" />
                  {listing.location.city}, {listing.location.state}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Quantity</p>
                    <p className="font-semibold">{listing.quantity.value} {listing.quantity.unit}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="font-semibold">₹{listing.price.value.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-1" />
                    {listing.frequency.charAt(0).toUpperCase() + listing.frequency.slice(1)}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Eye className="h-4 w-4 mr-1" />
                    {listing.views} views
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">{listing.seller.name}</p>
                    <p className="text-xs">{listing.seller.company.name}</p>
                  </div>
                  
                  {user?.type === 'buyer' && user._id !== listing.seller._id && (
                    <div className="flex space-x-2" onClick={(e) => e.preventDefault()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInquire(listing._id);
                        }}
                        disabled={inquiringListing === listing._id}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {inquiringListing === listing._id ? 'Sending...' : 'Inquire'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startNegotiation(listing._id);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Negotiate
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Load More */}
      {sortedListings.length > 0 && sortedListings.length >= 10 && (
        <div className="text-center mt-8">
          <button
            onClick={fetchWasteListings}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Load More Listings
          </button>
        </div>
      )}
    </div>
  );
};

export default Listings;