import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Recycle, User, LogOut, Bell, Settings, Package, Menu, X
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const Header: React.FC = () => {
  const { user, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const adminNavItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/admin', label: 'Admin Panel' }
  ];

  const sellerNavItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/listings', label: 'Browse Listings' },
    { path: '/waste-listing', label: 'List Waste' },
    { path: '/negotiations', label: 'Negotiations' },
    { path: '/contracts', label: 'Contracts' },
    { path: '/logistics', label: 'Logistics' }
  ];

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
      case 'admin': return adminNavItems;
      case 'seller': return sellerNavItems;
      case 'buyer': return buyerNavItems;
      default: return [];
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 w-full overflow-x-hidden">
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

          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          <nav className="hidden md:flex space-x-6">
            {user && getNavigationItems().map((item) => (
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

          {user ? (
            <div className="hidden md:flex items-center space-x-4">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg relative"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    3
                  </span>
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Notifications</h3>
                        <Link to="/notifications" onClick={() => setShowNotifications(false)} className="text-blue-600 hover:text-blue-800 text-sm">View All</Link>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="p-4 hover:bg-gray-50 border-b">
                        <p className="text-sm font-medium">New contract signed</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                      <div className="p-4 hover:bg-gray-50 border-b">
                        <p className="text-sm font-medium">Payment received</p>
                        <p className="text-xs text-gray-500">4 hours ago</p>
                      </div>
                      <div className="p-4 hover:bg-gray-50">
                        <p className="text-sm font-medium">Shipment in transit</p>
                        <p className="text-xs text-gray-500">6 hours ago</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Link to="/settings" className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <Settings className="h-5 w-5" />
              </Link>

              <div className="flex items-center space-x-2 border-l pl-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.company.name}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <button onClick={handleLogout} className="p-1 text-gray-400 hover:text-red-600">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/listings" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm">
                <Package className="h-4 w-4 mr-1 inline" />
                Browse Listings
              </Link>
              <Link to="/login" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm">Login</Link>
              <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">Register</Link>
            </div>
          )}
        </div>

        {/* Mobile Nav Items */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 space-y-2 pb-4 border-t pt-2">
            {user && getNavigationItems().map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-md text-sm font-medium ${
                  isActive(item.path)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            ))}

            {!user && (
              <>
                <Link to="/listings" className="block px-4 py-2 text-sm text-gray-700">Browse Listings</Link>
                <Link to="/login" className="block px-4 py-2 text-sm text-gray-700">Login</Link>
                <Link to="/register" className="block px-4 py-2 text-sm text-white bg-blue-600 rounded-md">Register</Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
