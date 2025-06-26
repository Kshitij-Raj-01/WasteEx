import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Package, Users, DollarSign, Clock, AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';
import MobileNumberModal from './MobileNumberModal';

interface DashboardStats {
  totalUsers?: number;
  monthlyGrowth?: number;
  totalVolume?: number;
  volumeGrowth?: number;
  activeDeals?: number;
  completedDeals?: number;
  platformRevenue?: number;
  revenueGrowth?: number;
  activeListings?: number;
  totalRevenue?: number;
  pendingDeals?: number;
  activeRequests?: number;
  totalSpent?: number;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  time: string;
  status: string;
}

const Dashboard: React.FC = () => {
  const { user, setUser } = useApp();
  const [stats, setStats] = useState<DashboardStats>({});
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileModal, setShowMobileModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    
    // Check if user needs to provide mobile number
    if (user && (!user.phone || user.phone.trim() === '')) {
      setShowMobileModal(true);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (user?.type === 'admin') {
        const response = await apiService.getAdminDashboard();
        if (response.success) {
          setStats(response.data.stats);
          setRecentActivity(response.data.recentActivity || []);
        }
      } else {
        // Fetch user-specific data
        const [contractsRes, listingsRes, requestsRes] = await Promise.all([
          apiService.getContracts({ limit: 5 }),
          user?.type === 'seller' ? apiService.getMyListings({ limit: 5 }) : Promise.resolve({ data: { listings: [] } }),
          user?.type === 'buyer' ? apiService.getMaterialRequests({ limit: 5 }) : Promise.resolve({ data: { requests: [] } })
        ]);

        // Calculate stats from real data
        const contracts = contractsRes.data?.contracts || [];
        const listings = listingsRes.data?.listings || [];
        const requests = requestsRes.data?.requests || [];

        if (user?.type === 'seller') {
          const completedContracts = contracts.filter(c => c.status === 'completed');
          const totalRevenue = completedContracts.reduce((sum, c) => sum + (c.terms?.totalValue || 0), 0);
          
          setStats({
            activeListings: listings.filter(l => l.status === 'active').length,
            totalRevenue,
            pendingDeals: contracts.filter(c => c.status === 'pending' || c.status === 'signed').length,
            completedDeals: completedContracts.length,
          });
        } else if (user?.type === 'buyer') {
          const completedContracts = contracts.filter(c => c.status === 'completed');
          const totalSpent = completedContracts.reduce((sum, c) => sum + (c.terms?.totalValue || 0), 0);
          
          setStats({
            activeRequests: requests.filter(r => r.status === 'active').length,
            totalSpent,
            pendingDeals: contracts.filter(c => c.status === 'pending' || c.status === 'signed').length,
            completedDeals: completedContracts.length,
          });
        }

        // Generate recent activity from contracts and listings
        const activities: Activity[] = [
          ...contracts.slice(0, 3).map(c => ({
            id: c._id,
            type: 'contract',
            title: `Contract ${c.status} for ${c.terms?.materialType || 'material'}`,
            time: new Date(c.updatedAt).toLocaleDateString(),
            status: c.status === 'completed' ? 'success' : c.status === 'pending' ? 'info' : 'success'
          })),
          ...listings.slice(0, 2).map(l => ({
            id: l._id,
            type: 'listing',
            title: `Listing created: ${l.title}`,
            time: new Date(l.createdAt).toLocaleDateString(),
            status: 'success'
          }))
        ];
        
        setRecentActivity(activities);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMobileNumberUpdate = (phoneNumber?: string) => {
    if (phoneNumber && user) {
      // Update user context with new phone number
      setUser({
        ...user,
        phone: phoneNumber
      });
    }
    setShowMobileModal(false);
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Mobile Number Modal */}
      <MobileNumberModal
        isOpen={showMobileModal}
        onClose={handleMobileNumberUpdate}
        userName={user.name}
      />

      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user.name}
        </h1>
        <p className="text-gray-600 mt-2">
          {user.type === 'admin' ? 'Platform Overview' : 
           user.type === 'seller' ? 'Manage your waste listings and track sales' :
           'Find materials and manage your purchases'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {user.type === 'seller' && (
          <>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Listings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeListings || 0}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-green-600 text-sm font-medium">Active on platform</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₹{(stats.totalRevenue || 0).toLocaleString()}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-green-600 text-sm font-medium">From completed deals</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Deals</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingDeals || 0}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-orange-600 text-sm font-medium">Awaiting completion</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Deals</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedDeals || 0}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-green-600 text-sm font-medium">Successfully delivered</span>
              </div>
            </div>
          </>
        )}

        {user.type === 'buyer' && (
          <>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeRequests || 0}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-blue-600 text-sm font-medium">Seeking materials</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">₹{(stats.totalSpent || 0).toLocaleString()}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-green-600 text-sm font-medium">On materials purchased</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Deals</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingDeals || 0}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-orange-600 text-sm font-medium">In progress</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Deals</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedDeals || 0}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-green-600 text-sm font-medium">Successfully received</span>
              </div>
            </div>
          </>
        )}

        {user.type === 'admin' && (
          <>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers || 0}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-green-600 text-sm font-medium">+{stats.monthlyGrowth || 0}% this month</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Volume</p>
                  <p className="text-2xl font-bold text-gray-900">₹{((stats.totalVolume || 0) / 100000).toFixed(1)}L</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-green-600 text-sm font-medium">+{stats.volumeGrowth || 0}% from last month</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Deals</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeDeals || 0}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Package className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-blue-600 text-sm font-medium">{stats.completedDeals || 0} completed</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Platform Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₹{((stats.platformRevenue || 0) / 100000).toFixed(1)}L</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-green-600 text-sm font-medium">+{stats.revenueGrowth || 0}% this month</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.status === 'success' ? 'bg-green-500' :
                        activity.status === 'info' ? 'bg-blue-500' : 'bg-orange-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                      <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {user.type === 'seller' && (
                <>
                  <Link
                    to="/waste-listing"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors block text-center"
                  >
                    Create New Listing
                  </Link>
                  <Link
                    to="/negotiations"
                    className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors block text-center"
                  >
                    View Negotiations
                  </Link>
                  <Link
                    to="/logistics"
                    className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors block text-center"
                  >
                    Track Shipments
                  </Link>
                </>
              )}
              
              {user.type === 'buyer' && (
                <>
                  <Link
                    to="/material-request"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors block text-center"
                  >
                    Request Materials
                  </Link>
                  <Link
                    to="/negotiations"
                    className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors block text-center"
                  >
                    Active Negotiations
                  </Link>
                  <Link
                    to="/contracts"
                    className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors block text-center"
                  >
                    View Contracts
                  </Link>
                </>
              )}

              {user.type === 'admin' && (
                <>
                  <Link
                    to="/admin"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors block text-center"
                  >
                    Admin Panel
                  </Link>
                  <button className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors">
                    Generate Report
                  </button>
                  <button className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors">
                    System Settings
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;