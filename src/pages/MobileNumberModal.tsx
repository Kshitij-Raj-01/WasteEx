import React, { useState } from 'react';
import { X, Phone, Save } from 'lucide-react';
import { apiService } from '../services/api';

interface MobileNumberModalProps {
  isOpen: boolean;
  onClose: (phoneNumber?: string) => void;
  userName: string;
}

const MobileNumberModal: React.FC<MobileNumberModalProps> = ({ isOpen, onClose, userName }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid Indian mobile number (10 digits starting with 6-9)');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await apiService.updateUserProfile({
        phone: phoneNumber
      });

      if (response.success) {
        onClose(phoneNumber);
      } else {
        setError(response.message || 'Failed to update phone number');
      }
    } catch (error: any) {
      console.error('Error updating phone number:', error);
      setError(error.message || 'Failed to update phone number. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length <= 10) {
      setPhoneNumber(value);
      setError(''); // Clear error when user starts typing
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Phone className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Complete Your Profile</h2>
              <p className="text-sm text-gray-600">Hi {userName}!</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            We need your mobile number to send you important updates about your deals, shipments, and account activity.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">+91</span>
                </div>
                <input
                  type="tel"
                  id="phone"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="Enter 10-digit mobile number"
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
              </div>
              
              {phoneNumber && phoneNumber.length === 10 && validatePhoneNumber(phoneNumber) && (
                <p className="text-green-600 text-sm mt-1 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Valid mobile number
                </p>
              )}
              
              {error && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  {error}
                </p>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Why do we need this?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Order confirmations and shipment updates</li>
                <li>• Important account security notifications</li>
                <li>• Deal negotiation and contract updates</li>
                <li>• Customer support and assistance</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading || !phoneNumber || !validatePhoneNumber(phoneNumber)}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Saving...' : 'Save & Continue'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl">
          <p className="text-xs text-gray-500 text-center">
            Your phone number will be kept secure and used only for essential communications.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileNumberModal;