import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Star, Filter, Package } from 'lucide-react';
import { useApp } from '../context/AppContext';

const MaterialRequest: React.FC = () => {
  const { user, addMaterialRequest } = useApp();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    materialType: '',
    category: '',
    quantity: '',
    unit: 'kg',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'one-time',
    maxPrice: '',
    location: '',
    qualityGrade: 'Grade A',
    description: '',
    urgency: 'medium' as 'low' | 'medium' | 'high',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const materialCategories = [
    'Plastic Materials',
    'Metal Materials',
    'Paper Materials',
    'Textile Materials',
    'Chemical Materials',
    'Electronic Materials',
    'Rubber Materials',
    'Glass Materials',
    'Wood Materials',
    'Organic Materials',
  ];

  const materialTypes = {
    'Plastic Materials': ['HDPE Granules', 'LDPE Pellets', 'PET Flakes', 'PVC Resin', 'PP Granules', 'PS Beads'],
    'Metal Materials': ['Steel Bars', 'Aluminum Sheets', 'Copper Wire', 'Brass Fittings', 'Iron Scrap', 'Stainless Steel'],
    'Paper Materials': ['Recycled Cardboard', 'Pulp', 'Newsprint', 'Office Paper'],
    'Textile Materials': ['Cotton Fiber', 'Polyester Yarn', 'Fabric Scraps', 'Denim Materials'],
    'Chemical Materials': ['Industrial Solvents', 'Cleaning Agents', 'Additives', 'Catalysts'],
    'Electronic Materials': ['Precious Metals', 'Rare Earth Elements', 'Copper Components', 'Circuit Materials'],
    'Rubber Materials': ['Rubber Granules', 'Tire Crumb', 'Industrial Rubber', 'Latex'],
    'Glass Materials': ['Cullet', 'Borosilicate', 'Tempered Glass', 'Fiber Glass'],
    'Wood Materials': ['Wood Chips', 'Sawdust', 'Plywood Sheets', 'Timber'],
    'Organic Materials': ['Compost', 'Biofuel', 'Agricultural Fiber', 'Food Grade Materials'],
  };

  const qualityGrades = ['Grade A', 'Grade B', 'Grade C', 'Industrial Grade', 'Food Grade', 'Medical Grade'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      addMaterialRequest({
        buyerId: user!.id,
        materialType: formData.materialType,
        quantity: parseInt(formData.quantity),
        unit: formData.unit,
        frequency: formData.frequency,
        maxPrice: parseInt(formData.maxPrice),
        location: formData.location,
        qualityGrade: formData.qualityGrade,
      });

      setIsSubmitting(false);
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">Request Materials</h1>
              <p className="text-gray-600 mt-2">Specify your raw material requirements and find suppliers</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Material Type & Category */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Material Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value, materialType: '' }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Category</option>
                    {materialCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specific Material *
                  </label>
                  <select
                    value={formData.materialType}
                    onChange={(e) => setFormData(prev => ({ ...prev, materialType: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={!formData.category}
                  >
                    <option value="">Select Material</option>
                    {formData.category && materialTypes[formData.category as keyof typeof materialTypes]?.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity & Pricing */}
              <div className="grid md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="kg">Kilograms</option>
                    <option value="tonnes">Tonnes</option>
                    <option value="liters">Liters</option>
                    <option value="pieces">Pieces</option>
                    <option value="m3">Cubic Meters</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.maxPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxPrice: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="45000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality Grade *
                  </label>
                  <select
                    value={formData.qualityGrade}
                    onChange={(e) => setFormData(prev => ({ ...prev, qualityGrade: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {qualityGrades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Frequency & Location */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Frequency *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['daily', 'weekly', 'monthly', 'one-time'] as const).map(freq => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, frequency: freq }))}
                        className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.frequency === freq
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Calendar className="h-4 w-4 mx-auto mb-1" />
                        {freq.charAt(0).toUpperCase() + freq.slice(1).replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Location *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Delhi, NCR"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Requirements
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Specify quality standards, certifications, packaging requirements, delivery preferences..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-colors flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Creating Request...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Create Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Recommendations */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">High Match Score</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-blue-700 ml-1">95%</span>
                    </div>
                  </div>
                  <p className="text-sm text-blue-800">HDPE Granules available in Mumbai</p>
                  <p className="text-xs text-blue-600 mt-1">₹42/kg • 500kg available</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-900">Good Match</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-green-700 ml-1">87%</span>
                    </div>
                  </div>
                  <p className="text-sm text-green-800">PP Granules in Pune</p>
                  <p className="text-xs text-green-600 mt-1">₹38/kg • 1000kg available</p>
                </div>
              </div>
            </div>
          </div>

          {/* Market Insights */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Insights</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg. Price Range</span>
                  <span className="text-sm font-medium text-gray-900">₹35-50/kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Market Trend</span>
                  <span className="text-sm font-medium text-green-600">↗ +5% this month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Available Suppliers</span>
                  <span className="text-sm font-medium text-gray-900">23 active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg. Delivery Time</span>
                  <span className="text-sm font-medium text-gray-900">3-5 days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Quick Tips</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Set realistic price ranges for better matches</li>
              <li>• Include quality specifications clearly</li>
              <li>• Consider logistics costs in your budget</li>
              <li>• Regular requests get priority matching</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialRequest;