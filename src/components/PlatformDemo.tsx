import React, { useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';

interface PlatformDemoProps {
  isOpen: boolean;
  onClose: () => void;
}

const PlatformDemo: React.FC<PlatformDemoProps> = ({ isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(300); // 5 minutes demo

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // In real implementation, control actual video playback
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseInt(e.target.value);
    setCurrentTime(newTime);
    // In real implementation, seek video to this time
  };

  const demoSections = [
    {
      title: "Getting Started",
      timestamp: "0:00",
      description: "Account registration and company verification process"
    },
    {
      title: "Creating Listings",
      timestamp: "1:30",
      description: "How to list your industrial waste materials"
    },
    {
      title: "Finding Materials",
      timestamp: "2:45",
      description: "Searching and requesting specific materials"
    },
    {
      title: "AI Matching",
      timestamp: "3:30",
      description: "How our AI finds the best matches for you"
    },
    {
      title: "Negotiations",
      timestamp: "4:15",
      description: "Secure messaging and deal negotiations"
    },
    {
      title: "Smart Contracts",
      timestamp: "5:00",
      description: "Blockchain-secured contract generation"
    },
    {
      title: "Payment & Logistics",
      timestamp: "6:30",
      description: "Secure payments and shipment tracking"
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">WasteEx Platform Demo</h2>
            <p className="text-gray-600 mt-1">Complete walkthrough of the platform features</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 p-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              {/* Video Container */}
              <div className="aspect-video bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center relative">
                {/* Mock Video Content */}
                <div className="text-center text-white">
                  <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="h-12 w-12 text-white ml-1" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">WasteEx Platform Walkthrough</h3>
                  <p className="text-blue-200">Learn how to use all platform features</p>
                </div>

                {/* Play/Pause Overlay */}
                <button
                  onClick={handlePlayPause}
                  className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center group"
                >
                  <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {isPlaying ? (
                      <Pause className="h-8 w-8 text-gray-900" />
                    ) : (
                      <Play className="h-8 w-8 text-gray-900 ml-1" />
                    )}
                  </div>
                </button>
              </div>

              {/* Video Controls */}
              <div className="bg-gray-800 p-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handlePlayPause}
                    className="text-white hover:text-blue-400 transition-colors"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </button>

                  <button
                    onClick={() => setCurrentTime(0)}
                    className="text-white hover:text-blue-400 transition-colors"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </button>

                  <div className="flex-1 flex items-center space-x-3">
                    <span className="text-white text-sm">{formatTime(currentTime)}</span>
                    <input
                      type="range"
                      min="0"
                      max={duration}
                      value={currentTime}
                      onChange={handleSeek}
                      className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-white text-sm">{formatTime(duration)}</span>
                  </div>

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-white hover:text-blue-400 transition-colors"
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </button>

                  <button className="text-white hover:text-blue-400 transition-colors">
                    <Maximize className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Video Description */}
            <div className="mt-6 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What You'll Learn</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">For Sellers</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• How to list waste materials</li>
                    <li>• Setting competitive prices</li>
                    <li>• Managing inquiries</li>
                    <li>• Contract negotiations</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">For Buyers</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Finding quality materials</li>
                    <li>• Using AI recommendations</li>
                    <li>• Secure payment process</li>
                    <li>• Tracking shipments</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Chapter List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Demo Chapters</h3>
            <div className="space-y-3">
              {demoSections.map((section, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    const timeInSeconds = parseInt(section.timestamp.split(':')[0]) * 60 + 
                                        parseInt(section.timestamp.split(':')[1]);
                    setCurrentTime(timeInSeconds);
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{section.title}</h4>
                    <span className="text-sm text-blue-600 font-mono">{section.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-600">{section.description}</p>
                </div>
              ))}
            </div>

            {/* Demo Stats */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-3">Demo Highlights</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Duration:</span>
                  <span className="font-medium text-blue-900">8 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Features Covered:</span>
                  <span className="font-medium text-blue-900">15+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Use Cases:</span>
                  <span className="font-medium text-blue-900">Real scenarios</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Difficulty:</span>
                  <span className="font-medium text-blue-900">Beginner friendly</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Need help getting started? Our support team is here to assist you.
              </p>
            </div>
            <div className="flex space-x-3">
              <button className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                Download Guide
              </button>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformDemo;