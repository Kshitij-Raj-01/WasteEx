import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Recycle, User, LogOut, Bell, Settings, Package } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Header: React.FC = () => {
  const { user, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  // Admin-specific navigation items
  const adminNavItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/admin', label: 'Admin Panel' }
  ];

  // Seller-specific navigation items
  const sellerNavItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/listings', label: 'Browse Listings' },
    { path: '/waste-listing', label: 'List Waste' },
    { path: '/negotiations', label: 'Negotiations' },
    { path: '/contracts', label: 'Contracts' },
    { path: '/logistics', label: 'Logistics' }
  ];

  // Buyer-specific navigation items
  const buyerNavItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/listings', label: 'Browse Listings' },
    { path: '/material-request', label: 'Request Materials' },
    { path: '/negotiations', label: 'Negotiations' },
    { path: '/contracts', label: 'Contracts' },
    { path: '/logistics', label: 'Logistics' }
  ];

  const getNavigationItems = () => {
    if (!user) return [];
    
    switch (user.type) {
      case 'admin':
        return adminNavItems;
      case 'seller':
        return sellerNavItems;
      case 'buyer':
        return buyerNavItems;
      default:
        return [];
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Recycle className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">WasteEx</span>
              <span className="text-sm text-gray-500 block leading-3">Industrial Exchange</span>
            </div>
          </Link>

          {user ? (
            <div className="flex items-center space-x-6">
              <nav className="hidden md:flex space-x-6">
                {getNavigationItems().map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center space-x-3">
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative"
                  >
                    <Bell className="h-5 w-5" />
                    {/* Notification badge */}
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      3
                    </span>
                  </button>
                  
                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                          <Link 
                            to="/notifications"
                            onClick={() => setShowNotifications(false)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            View All
                          </Link>
                        </div>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {/* Sample notifications */}
                        <div className="p-4 border-b border-gray-100 hover:bg-gray-50">
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">New contract signed</p>
                              <p className="text-xs text-gray-600">Your HDPE plastic contract has been signed</p>
                              <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 border-b border-gray-100 hover:bg-gray-50">
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Payment received</p>
                              <p className="text-xs text-gray-600">₹1,25,000 payment confirmed</p>
                              <p className="text-xs text-gray-500 mt-1">4 hours ago</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 hover:bg-gray-50">
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Shipment update</p>
                              <p className="text-xs text-gray-600">Your shipment is now in transit</p>
                              <p className="text-xs text-gray-500 mt-1">6 hours ago</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Link 
                  to="/settings"
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Settings className="h-5 w-5" />
                </Link>

                <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.company.name}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link
                to="/listings"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
              >
                <Package className="h-4 w-4 mr-1" />
                Browse Listings
              </Link>
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;