import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Image,
  FileText,
  Calendar,
  MapPin,
  AlertTriangle,
  Package,
} from "lucide-react";
import { useApp } from "../context/AppContext";

const WasteListing: React.FC = () => {
  const { user, createWasteListing } = useApp();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    wasteType: "",
    category: "",
    quantity: "",
    unit: "kg",
    frequency: "daily" as "daily" | "weekly" | "monthly" | "one-time",
    price: "",
    location: "",
    urgency: "medium" as "low" | "medium" | "high",
    description: "",
    images: [] as string[],
    msds: "",
    storageConditions: "",
    hazardous: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const wasteCategories = [
    "Plastic Waste",
    "Metal Scrap",
    "Paper Waste",
    "Textile Waste",
    "Chemical Waste",
    "Electronic Waste",
    "Rubber Waste",
    "Glass Waste",
    "Wood Waste",
    "Organic Waste",
  ];

  const wasteTypes = {
    "Plastic Waste": [
      "HDPE",
      "LDPE",
      "PET",
      "PVC",
      "PP",
      "PS",
      "Mixed Plastic",
    ],
    "Metal Scrap": [
      "Steel",
      "Aluminum",
      "Copper",
      "Brass",
      "Iron",
      "Stainless Steel",
    ],
    "Paper Waste": ["Cardboard", "Office Paper", "Newspaper", "Mixed Paper"],
    "Textile Waste": ["Cotton", "Polyester", "Mixed Fabric", "Denim"],
    "Chemical Waste": ["Solvents", "Acids", "Bases", "Organic Chemicals"],
    "Electronic Waste": ["Circuit Boards", "Cables", "Batteries", "Components"],
    "Rubber Waste": ["Tire Rubber", "Industrial Rubber", "Foam Rubber"],
    "Glass Waste": ["Clear Glass", "Colored Glass", "Borosilicate Glass"],
    "Wood Waste": ["Hardwood", "Softwood", "Plywood", "Particle Board"],
    "Organic Waste": [
      "Food Waste",
      "Agricultural Waste",
      "Biodegradable Materials",
    ],
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      createWasteListing({
        seller: user!._id,
        title: `${formData.wasteType} (${formData.category}) - ${formData.quantity}${formData.unit}`,
        wasteType: formData.wasteType,
        category: formData.category,
        quantity: {
          value: parseFloat(formData.quantity),
          unit: formData.unit
        },
        frequency: formData.frequency,
        price: {
          value: parseFloat(formData.price),
          currency: "INR",
          negotiable: true
        },
        location: {
          address: "Provided upon request", // Or allow user to input this
          city: formData.location.split(",")[0]?.trim() || "Unknown",
          state: formData.location.split(",")[1]?.trim() || "Unknown"
        },
        urgency: formData.urgency,
        description: formData.description,
        images: formData.images.map((url) => ({
          url,
          publicId: "",     // Optional: you can extract this from Cloudinary URL if needed
          caption: ""
        })),
        msds: {
          url: formData.msds,
          verified: false
        },
        hazardous: formData.hazardous
      });

      setIsSubmitting(false);
      navigate("/dashboard");
    }, 1500);
  };

  // const handleImageUpload = () => {
    // Simulate image upload - in real app, this would handle file upload
    // const mockImageUrl = 'https://images.pexels.com/photos/3735218/pexels-photo-3735218.jpeg';
    // setFormData(prev => ({
    //   ...prev,
    //   images: [...prev.images, mockImageUrl]
    // }));
    const handleImageUpload = async (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "WasteEx"); // ⬅️ Change this to your Cloudinary upload preset

      try {
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/dg2rjn4qj/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();

        if (data.secure_url) {
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, data.secure_url],
          }));
        } else {
          alert("Upload failed.");
        }
      } catch (error) {
        console.error("Cloudinary upload error:", error);
        alert("Image upload failed!");
      }
    };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">
            Create Waste Listing
          </h1>
          <p className="text-gray-600 mt-2">
            List your industrial waste for potential buyers
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Waste Type & Category */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Waste Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    category: e.target.value,
                    wasteType: "",
                  }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Category</option>
                {wasteCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specific Waste Type *
              </label>
              <select
                value={formData.wasteType}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    wasteType: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={!formData.category}
              >
                <option value="">Select Type</option>
                {formData.category &&
                  wasteTypes[formData.category as keyof typeof wasteTypes]?.map(
                    (type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    )
                  )}
              </select>
            </div>
          </div>

          {/* Quantity & Pricing */}
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, quantity: e.target.value }))
                }
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
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, unit: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="tonnes">Tonnes</option>
                <option value="liters">Liters</option>
                <option value="pieces">Pieces</option>
                <option value="m3">Cubic Meters (m³)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (₹) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, price: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="25000"
                required
              />
            </div>
          </div>

          {/* Frequency & Urgency */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disposal Frequency *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(["daily", "weekly", "monthly", "one-time"] as const).map(
                  (freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, frequency: freq }))
                      }
                      className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.frequency === freq
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Calendar className="h-4 w-4 mx-auto mb-1" />
                      {freq.charAt(0).toUpperCase() +
                        freq.slice(1).replace("-", " ")}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency Level *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(["low", "medium", "high"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, urgency: level }))
                    }
                    className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.urgency === level
                        ? `border-${
                            level === "high"
                              ? "red"
                              : level === "medium"
                              ? "yellow"
                              : "green"
                          }-500 bg-${
                            level === "high"
                              ? "red"
                              : level === "medium"
                              ? "yellow"
                              : "green"
                          }-50 text-${
                            level === "high"
                              ? "red"
                              : level === "medium"
                              ? "yellow"
                              : "green"
                          }-700`
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4 mx-auto mb-1" />
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mumbai, Maharashtra"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Provide additional details about the waste condition, storage, handling requirements..."
            />
          </div>

          {/* Images Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Image className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium cursor-pointer">
                    Upload Images
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  PNG, JPG, GIF up to 10MB each
                </p>
              </div>

              {formData.images.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Waste ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* MSDS Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              MSDS (Material Safety Data Sheet)
            </label>
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-gray-400" />
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.msds}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, msds: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Upload or provide link to MSDS document"
                  />
                </div>
                <button
                  type="button"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Upload className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Hazardous Material Checkbox */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="hazardous"
              checked={formData.hazardous}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  hazardous: e.target.checked,
                }))
              }
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <label
              htmlFor="hazardous"
              className="text-sm font-medium text-gray-700"
            >
              This material is classified as hazardous waste
            </label>
          </div>

          {formData.hazardous && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">
                    Hazardous Material Notice
                  </h4>
                  <p className="text-sm text-red-700 mt-1">
                    This listing will require additional verification and
                    compliance checks. Ensure all safety protocols and
                    regulatory requirements are met.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
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
                  Creating Listing...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  Create Listing
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WasteListing;
