import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Recycle, TrendingUp, Shield, Truck, Brain, FileText, Users, BarChart3, MapPin, Play } from 'lucide-react';
import PlatformDemo from '../components/PlatformDemo';

const LandingPage: React.FC = () => {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                Transform Industrial Waste into 
                <span className="text-blue-300"> Valuable Resources</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                India's premier digital marketplace connecting industrial waste generators with resource buyers. 
                Powered by AI matching, blockchain contracts, and integrated logistics.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center group"
                >
                  Start Trading Now
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button
                  onClick={() => setIsDemoOpen(true)}
                  className="border-2 border-blue-300 text-blue-100 px-8 py-4 rounded-lg font-semibold hover:bg-blue-800 transition-colors flex items-center justify-center group"
                >
                  <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  View Platform Demo
                </button>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-300">₹2.5Cr+</div>
                  <div className="text-blue-100">Monthly Trade Volume</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-300">500+</div>
                  <div className="text-blue-100">Verified Companies</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-300">15+</div>
                  <div className="text-blue-100">Waste Categories</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-300">95%</div>
                  <div className="text-blue-100">Match Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Complete End-to-End Solution
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From waste listing to final delivery, our platform handles every aspect of industrial resource exchange
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-xl hover:shadow-lg transition-shadow">
              <div className="bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI-Powered Matching</h3>
              <p className="text-gray-600">
                Advanced algorithms match waste generators with buyers based on material type, quantity, location, and price preferences.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-xl hover:shadow-lg transition-shadow">
              <div className="bg-green-600 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Government Verified</h3>
              <p className="text-gray-600">
                All companies verified through GSTIN, PAN, and ROC integration. Secure transactions with digital compliance.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-xl hover:shadow-lg transition-shadow">
              <div className="bg-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Blockchain Contracts</h3>
              <p className="text-gray-600">
                Smart contracts automatically generated and deployed on blockchain for immutable, transparent agreements.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-xl hover:shadow-lg transition-shadow">
              <div className="bg-orange-600 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Integrated Logistics</h3>
              <p className="text-gray-600">
                Seamless logistics integration with major Indian partners. Real-time tracking and dynamic pricing.
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 p-8 rounded-xl hover:shadow-lg transition-shadow">
              <div className="bg-red-600 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Real-time Negotiations</h3>
              <p className="text-gray-600">
                Secure messaging platform for buyers and sellers to negotiate terms, share documents, and finalize deals.
              </p>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-8 rounded-xl hover:shadow-lg transition-shadow">
              <div className="bg-teal-600 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Analytics Dashboard</h3>
              <p className="text-gray-600">
                Comprehensive insights on trading patterns, ESG impact metrics, and revenue optimization opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How WasteEx Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple, secure, and efficient process from listing to delivery
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Register & Verify</h3>
              <p className="text-gray-600">
                Create account with government credentials. Get verified through our automated KYC process.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">List or Request</h3>
              <p className="text-gray-600">
                Sellers list waste materials. Buyers post material requirements. AI finds optimal matches.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Negotiate & Contract</h3>
              <p className="text-gray-600">
                Secure messaging for negotiations. Smart contracts auto-generated and deployed on blockchain.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">4</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Execute & Track</h3>
              <p className="text-gray-600">
                Logistics partners handle pickup and delivery. Real-time tracking for complete transparency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Pay only for successful transactions. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-gray-50 p-8 rounded-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Small Transactions</h3>
              <div className="text-3xl font-bold text-blue-600 mb-2">₹500</div>
              <div className="text-gray-600 mb-6">Per transaction (₹0 - ₹10,000)</div>
              <ul className="space-y-3 text-gray-600">
                <li>• AI-powered matching</li>
                <li>• Basic contract templates</li>
                <li>• Standard logistics options</li>
                <li>• Email support</li>
              </ul>
            </div>

            <div className="bg-blue-600 p-8 rounded-xl text-white relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <h3 className="text-xl font-bold mb-4">Medium Transactions</h3>
              <div className="text-3xl font-bold mb-2">₹2,500</div>
              <div className="text-blue-100 mb-6">Per transaction (₹10,001 - ₹1,00,000)</div>
              <ul className="space-y-3 text-blue-100">
                <li>• Advanced AI matching</li>
                <li>• Custom contract templates</li>
                <li>• Premium logistics partners</li>
                <li>• Priority phone support</li>
                <li>• Transaction insurance</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-8 rounded-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Large Transactions</h3>
              <div className="text-3xl font-bold text-green-600 mb-2">2.5%</div>
              <div className="text-gray-600 mb-6">Commission (₹1,00,001+)</div>
              <ul className="space-y-3 text-gray-600">
                <li>• Dedicated account manager</li>
                <li>• Custom contract terms</li>
                <li>• Express logistics</li>
                <li>• 24/7 phone support</li>
                <li>• Full transaction insurance</li>
                <li>• ESG impact reporting</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to Transform Your Industrial Waste?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join India's fastest-growing industrial resource exchange platform. Start converting waste to revenue today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <button 
              onClick={() => setIsDemoOpen(true)}
              className="border-2 border-blue-300 text-blue-100 px-8 py-4 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Platform Demo Modal */}
      <PlatformDemo isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
    </div>
  );
};

export default LandingPage;