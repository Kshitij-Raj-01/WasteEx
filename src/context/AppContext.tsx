import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  type: 'seller' | 'buyer' | 'admin';
  company: {
    name: string;
    gstin: string;
    pan: string;
    verified: boolean;
  };
  phone?: string;
  avatar?: string;
  isActive: boolean;
}

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
  createdAt: string;
  updatedAt: string;
}

interface MaterialRequest {
  _id: string;
  buyer: {
    _id: string;
    name: string;
    company: {
      name: string;
      verified: boolean;
    };
  };
  title: string;
  materialType: string;
  category: string;
  quantity: {
    value: number;
    unit: string;
  };
  frequency: 'daily' | 'weekly' | 'monthly' | 'one-time';
  budget: {
    max: number;
    currency: string;
  };
  location: {
    preferredCities: string[];
    state?: string;
  };
  qualityGrade: string;
  description?: string;
  status: 'active' | 'fulfilled' | 'cancelled' | 'expired';
  createdAt: string;
  updatedAt: string;
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  wasteListings: WasteListing[];
  setWasteListings: (listings: WasteListing[]) => void;
  materialRequests: MaterialRequest[];
  setMaterialRequests: (requests: MaterialRequest[]) => void;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
  fetchWasteListings: (params?: any) => Promise<void>;
  fetchMaterialRequests: (params?: any) => Promise<void>;
  createWasteListing: (listingData: any) => Promise<boolean>;
  createMaterialRequest: (requestData: any) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [wasteListings, setWasteListings] = useState<WasteListing[]>([]);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize user from token on app start
  useEffect(() => {
    const initializeUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          setLoading(true);
          const response = await apiService.getCurrentUser();
          if (response.success) {
            setUser(response.data.user);
          }
        } catch (error) {
          console.error('Failed to initialize user:', error);
          localStorage.removeItem('token');
        } finally {
          setLoading(false);
        }
      }
    };

    initializeUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.login(email, password);
      
      if (response.success) {
        setUser(response.data.user);
        return true;
      } else {
        setError(response.message || 'Login failed');
        return false;
      }
    } catch (error: any) {
      setError(error.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.register(userData);
      
      if (response.success) {
        setUser(response.data.user);
        return true;
      } else {
        setError(response.message || 'Registration failed');
        return false;
      }
    } catch (error: any) {
      setError(error.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
    setWasteListings([]);
    setMaterialRequests([]);
  };

  const fetchWasteListings = async (params?: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getWasteListings(params);
      
      if (response.success) {
        setWasteListings(response.data.listings);
      } else {
        setError(response.message || 'Failed to fetch listings');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterialRequests = async (params?: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getMaterialRequests(params);
      
      if (response.success) {
        setMaterialRequests(response.data.requests);
      } else {
        setError(response.message || 'Failed to fetch requests');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const createWasteListing = async (listingData: any): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.createWasteListing(listingData);
      
      if (response.success) {
        // Refresh listings
        await fetchWasteListings();
        return true;
      } else {
        setError(response.message || 'Failed to create listing');
        return false;
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create listing');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const createMaterialRequest = async (requestData: any): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.createMaterialRequest(requestData);
      
      if (response.success) {
        // Refresh requests
        await fetchMaterialRequests();
        return true;
      } else {
        setError(response.message || 'Failed to create request');
        return false;
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create request');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      wasteListings,
      setWasteListings,
      materialRequests,
      setMaterialRequests,
      loading,
      error,
      login,
      register,
      logout,
      fetchWasteListings,
      fetchMaterialRequests,
      createWasteListing,
      createMaterialRequest,
    }}>
      {children}
    </AppContext.Provider>
  );
};