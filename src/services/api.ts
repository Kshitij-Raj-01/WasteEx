const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {}

  private getToken(): string | null {
    return localStorage.getItem('token'); // Fetch fresh token every time
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // --- Auth ---
  async login(email: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
    }

    return response;
  }

  async register(userData: any) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
    }

    return response;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  logout() {
    localStorage.removeItem('token');
  }

  // --- Waste Listings ---
  async getWasteListings(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/waste-listings${queryString}`);
  }

  async getWasteListing(id: string) {
    return this.request(`/waste-listings/${id}`);
  }

  async createWasteListing(listingData: any) {
    return this.request('/waste-listings', {
      method: 'POST',
      body: JSON.stringify(listingData),
    });
  }

  async updateWasteListing(id: string, listingData: any) {
    return this.request(`/waste-listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(listingData),
    });
  }

  async deleteWasteListing(id: string) {
    return this.request(`/waste-listings/${id}`, {
      method: 'DELETE',
    });
  }

  async inquireAboutListing(id: string, message: string) {
    return this.request(`/waste-listings/${id}/inquire`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async getMyListings(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/waste-listings/my/listings${queryString}`);
  }

  // --- Material Requests ---
  async getMaterialRequests(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/material-requests${queryString}`);
  }

  async getMaterialRequest(id: string) {
    return this.request(`/material-requests/${id}`);
  }

  async createMaterialRequest(requestData: any) {
    return this.request('/material-requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async updateMaterialRequest(id: string, requestData: any) {
    return this.request(`/material-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(requestData),
    });
  }

  async deleteMaterialRequest(id: string) {
    return this.request(`/material-requests/${id}`, {
      method: 'DELETE',
    });
  }

  async respondToRequest(id: string, responseData: any) {
    return this.request(`/material-requests/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify(responseData),
    });
  }

  // --- Negotiations ---
  async getNegotiations(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/negotiations${queryString}`);
  }

  async getNegotiation(id: string) {
    return this.request(`/negotiations/${id}`);
  }

  async createNegotiation(negotiationData: any) {
    return this.request('/negotiations', {
      method: 'POST',
      body: JSON.stringify(negotiationData),
    });
  }

  async sendMessage(negotiationId: string, messageData: any) {
    return this.request(`/negotiations/${negotiationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async updateNegotiationStatus(id: string, status: string) {
    return this.request(`/negotiations/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // --- Contracts ---
  async getContracts(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/contracts${queryString}`);
  }

  async getContract(id: string) {
    return this.request(`/contracts/${id}`);
  }

  async createContract(contractData: any) {
    return this.request('/contracts', {
      method: 'POST',
      body: JSON.stringify(contractData),
    });
  }

  async signContract(id: string, signature: string) {
    return this.request(`/contracts/${id}/sign`, {
      method: 'POST',
      body: JSON.stringify({ signature }),
    });
  }

  // --- Logistics ---
  async getShipments(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/logistics/shipments${queryString}`);
  }

  async getShipment(id: string) {
    return this.request(`/logistics/shipments/${id}`);
  }

  async createShipment(shipmentData: any) {
    return this.request('/logistics/shipments', {
      method: 'POST',
      body: JSON.stringify(shipmentData),
    });
  }

  async updateShipmentStatus(id: string, statusData: any) {
    return this.request(`/logistics/shipments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
  }

  async addTrackingUpdate(id: string, trackingData: any) {
    return this.request(`/logistics/shipments/${id}/tracking`, {
      method: 'POST',
      body: JSON.stringify(trackingData),
    });
  }

  // --- Payments ---
  async getPayments(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/payments${queryString}`);
  }

  async createPaymentOrder(contractId: string, paymentMethod: string) {
    return this.request('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ contractId, paymentMethod }),
    });
  }

  async verifyPayment(paymentData: any) {
    return this.request('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async confirmDelivery(paymentId: string, qualityApproved: boolean) {
    return this.request(`/payments/${paymentId}/confirm-delivery`, {
      method: 'POST',
      body: JSON.stringify({ qualityApproved }),
    });
  }

  async releasePayment(paymentId: string) {
    return this.request(`/payments/${paymentId}/release`, {
      method: 'POST',
    });
  }

  // --- Admin ---
  async getAdminDashboard() {
    return this.request('/admin/dashboard');
  }

  async getAdminUsers(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/admin/users${queryString}`);
  }

  async getAdminTransactions(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/admin/transactions${queryString}`);
  }

  async getAdminAnalytics() {
    return this.request('/admin/analytics');
  }

  // --- Users ---
  async getUserProfile() {
    return this.request('/users/profile');
  }

  async updateUserProfile(profileData: any) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async verifyUser(userId: string) {
    return this.request(`/users/${userId}/verify`, {
      method: 'PUT',
    });
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    return this.request(`/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
