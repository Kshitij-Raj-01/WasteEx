import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Image,
  Calendar,
  MapPin,
  AlertTriangle,
  Package,
  X,
  File,
  Shield,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { apiService } from "../services/api";

const WasteListing: React.FC = () => {
  const { user } = useApp();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    wasteType: "",
    category: "",
    quantity: "",
    unit: "kg",
    frequency: "daily" as "daily" | "weekly" | "monthly" | "one-time",
    price: "",
    location: "",
    urgency: "medium" as "low" | "medium" | "high",
    description: "",
    images: [] as Array<{ url: string; caption?: string }>,
    documents: [] as Array<{ type: string; url: string; name: string }>,
    msds: {
      url: "",
      verified: false
    },
    specifications: {
      purity: "",
      moisture: "",
      contamination: "",
      packaging: "",
      storageConditions: ""
    },
    hazardous: false,
    certifications: [] as string[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [uploadingMSDS, setUploadingMSDS] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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

  const documentTypes = [
    "Certificate of Analysis",
    "Quality Report",
    "Compliance Certificate",
    "Environmental Permit",
    "Waste Characterization",
    "Transport License",
    "Other"
  ];

  const displayValidationErrors = (errors: any[]) => {
    const errorMessages: string[] = [];
    
    errors.forEach((error) => {
      if (error.field && error.message) {
        // Format field names to be more user-friendly
        const fieldName = error.field
          .replace(/\./g, ' → ')
          .replace(/(\d+)/g, (match: string) => `[${match}]`)
          .replace(/([A-Z])/g, ' $1')
          .toLowerCase()
          .replace(/^\w/, (c: string) => c.toUpperCase());
        
        errorMessages.push(`${fieldName}: ${error.message}`);
      } else if (error.message) {
        errorMessages.push(error.message);
      } else if (typeof error === 'string') {
        errorMessages.push(error);
      }
    });
    
    setValidationErrors(errorMessages);
  };

  const clearValidationErrors = () => {
    setValidationErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearValidationErrors();

    try {
      // Client-side validation
      const clientErrors: string[] = [];
      
      if (!formData.wasteType) clientErrors.push("Waste type is required");
      if (!formData.category) clientErrors.push("Category is required");
      if (!formData.quantity || isNaN(parseFloat(formData.quantity))) {
        clientErrors.push("Valid quantity is required");
      }
      if (!formData.price || isNaN(parseFloat(formData.price))) {
        clientErrors.push("Valid price is required");
      }
      if (!formData.location) clientErrors.push("Location is required");

      if (clientErrors.length > 0) {
        setValidationErrors(clientErrors);
        setIsSubmitting(false);
        return;
      }

      // Clean and validate documents - ensure proper structure
      const cleanDocuments = formData.documents
        .filter(doc => doc && typeof doc === 'object' && doc.type && doc.url && doc.name)
        .map(doc => ({
          type: String(doc.type).trim(),
          url: String(doc.url).trim(),
          name: String(doc.name).trim()
        }));

      // Clean specifications - remove empty values
      const cleanSpecifications = Object.fromEntries(
        Object.entries(formData.specifications).filter(([_, value]) => value && value.trim())
      );

      // Clean certifications - remove empty values
      const cleanCertifications = formData.certifications.filter(cert => cert && cert.trim());

      // Build listing data with proper structure
      const listingData = {
        title: formData.title || `${formData.wasteType} (${formData.category}) - ${formData.quantity}${formData.unit}`,
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
          address: "Provided upon request",
          city: formData.location.split(",")[0]?.trim() || "Unknown",
          state: formData.location.split(",")[1]?.trim() || "Unknown"
        },
        urgency: formData.urgency,
        description: formData.description || "",
        images: formData.images || [],
        documents: cleanDocuments,
        msds: {
          url: "",
          verified: false
        },
        specifications: cleanSpecifications,
        hazardous: Boolean(formData.hazardous),
        certifications: cleanCertifications
      };

      // Only include MSDS if URL exists
      if (formData.msds.url && formData.msds.url.trim()) {
        listingData.msds = {
          url: formData.msds.url.trim(),
          verified: false
        };
      }

      console.log('Final listing data:', JSON.stringify(listingData, null, 2));

      const response = await apiService.createWasteListing(listingData);
      
      if (response.success) {
        navigate("/dashboard");
      } else {
        console.error('API Error Response:', response);
        
        // Handle different types of error responses
        if (response.errors && Array.isArray(response.errors)) {
          displayValidationErrors(response.errors);
        } else if (response.message) {
          setValidationErrors([response.message]);
        } else {
          setValidationErrors(["Failed to create listing. Please check your data and try again."]);
        }
      }
      console.log('Final listing data:', JSON.stringify(listingData, null, 2))
    } catch (error: any) {
      console.error("Failed to create listing:", error);
      
      // Try to extract error details from the caught error
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (errorData.errors && Array.isArray(errorData.errors)) {
          displayValidationErrors(errorData.errors);
        } else if (errorData.message) {
          setValidationErrors([errorData.message]);
        } else {
          setValidationErrors(["Server error occurred. Please try again."]);
        }
      } else if (error.message) {
        setValidationErrors([error.message]);
      } else {
        setValidationErrors(["Network error occurred. Please check your connection and try again."]);
      }

    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("upload_preset", "WasteEx");

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dqa5ura3f/image/upload`,
        {
          method: "POST",
          body: uploadData,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, { url: data.secure_url, caption: "" }],
        }));
      } else {
        alert("Image upload failed.");
      }
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      alert("Image upload failed!");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDocumentType) {
      alert("Please select a document type first");
      return;
    }

    setUploadingDocument(true);
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("upload_preset", "WasteEx");

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dg2rjn4qj/raw/upload`,
        {
          method: "POST",
          body: uploadData,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        const newDocument = {
          type: selectedDocumentType,
          url: data.secure_url,
          name: file.name
        };

        console.log('Adding document:', newDocument);

        setFormData((prev) => ({
          ...prev,
          documents: [...prev.documents, newDocument],
        }));

        // Reset document type selection
        setSelectedDocumentType("");
        
        // Reset file input
        e.target.value = "";
      } else {
        alert("Document upload failed.");
      }
    } catch (error) {
      console.error("Document upload error:", error);
      alert("Document upload failed!");
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleMSDSUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMSDS(true);
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("upload_preset", "WasteEx");

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dg2rjn4qj/raw/upload`,
        {
          method: "POST",
          body: uploadData,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        setFormData((prev) => ({
          ...prev,
          msds: {
            url: data.secure_url,
            verified: false
          }
        }));
      } else {
        alert("MSDS upload failed.");
      }
    } catch (error) {
      console.error("MSDS upload error:", error);
      alert("MSDS upload failed!");
    } finally {
      setUploadingMSDS(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const addCertification = () => {
    const cert = prompt("Enter certification name:");
    if (cert && cert.trim()) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, cert.trim()]
      }));
    }
  };

  const removeCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
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

        {/* Validation Errors Display */}
        {validationErrors.length > 0 && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 mb-2">
                  Please fix the following errors:
                </h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-block w-1 h-1 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={clearValidationErrors}
                className="text-red-500 hover:text-red-700 ml-3"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Listing Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, title: e.target.value }));
                clearValidationErrors();
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., High-Quality HDPE Plastic Waste - 500kg Available"
            />
            <p className="text-sm text-gray-500 mt-1">
              Leave blank to auto-generate from waste details
            </p>
          </div>

          {/* Waste Type & Category */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Waste Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    category: e.target.value,
                    wasteType: "",
                  }));
                  clearValidationErrors();
                }}
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
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    wasteType: e.target.value,
                  }));
                  clearValidationErrors();
                }}
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
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, quantity: e.target.value }));
                  clearValidationErrors();
                }}
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
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, price: e.target.value }));
                  clearValidationErrors();
                }}
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
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, location: e.target.value }));
                  clearValidationErrors();
                }}
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

          {/* Technical Specifications */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Technical Specifications
            </label>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Purity Level
                </label>
                <input
                  type="text"
                  value={formData.specifications.purity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      specifications: { ...prev.specifications, purity: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 95% pure"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Moisture Content
                </label>
                <input
                  type="text"
                  value={formData.specifications.moisture}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      specifications: { ...prev.specifications, moisture: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., <2%"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Contamination Level
                </label>
                <input
                  type="text"
                  value={formData.specifications.contamination}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      specifications: { ...prev.specifications, contamination: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Minimal"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Packaging
                </label>
                <input
                  type="text"
                  value={formData.specifications.packaging}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      specifications: { ...prev.specifications, packaging: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Baled, Loose"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Storage Conditions
                </label>
                <input
                  type="text"
                  value={formData.specifications.storageConditions}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      specifications: { ...prev.specifications, storageConditions: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Dry, covered storage"
                />
              </div>
            </div>
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
                  <label className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium cursor-pointer">
                    {uploadingImage ? "Uploading..." : "Upload Images"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
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
                        src={image.url}
                        alt={`Waste ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Documents Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supporting Documents
            </label>
            <div className="space-y-4">
              {/* Document Upload Section */}
              <div className="border border-gray-300 rounded-lg p-4">
                <div className="flex items-center gap-4 mb-3">
                  <select
                    value={selectedDocumentType}
                    onChange={(e) => setSelectedDocumentType(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Document Type</option>
                    {documentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  
                  <label className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                    selectedDocumentType && !uploadingDocument
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}>
                    {uploadingDocument ? "Uploading..." : "Upload Document"}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                      className="hidden"
                      onChange={handleDocumentUpload}
                      disabled={uploadingDocument || !selectedDocumentType}
                    />
                  </label>
                </div>
                
                {uploadingDocument && (
                  <div className="text-center py-4">
                    <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Uploading document...</p>
                  </div>
                )}

                {/* Uploaded Documents List */}
                {formData.documents.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 mb-2">Uploaded Documents:</h4>
                    {formData.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <File className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">{doc.name}</p>
                            <p className="text-sm text-gray-600">{doc.type}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MSDS Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              MSDS (Material Safety Data Sheet)
            </label>
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="font-medium text-gray-900">Safety Data Sheet</p>
                    <p className="text-sm text-gray-600">
                      {formData.msds.url ? "MSDS uploaded" : "Upload MSDS document"}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {formData.msds.url && (
                    <a
                      href={formData.msds.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      View
                    </a>
                  )}
                  <label className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-2 rounded-lg text-sm font-medium cursor-pointer">
                    {uploadingMSDS ? "Uploading..." : formData.msds.url ? "Replace" : "Upload"}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleMSDSUpload}
                      disabled={uploadingMSDS}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certifications
            </label>
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600">Add relevant certifications</p>
                <button
                  type="button"
                  onClick={addCertification}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
                >
                  Add Certification
                </button>
              </div>
              
              {formData.certifications.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.certifications.map((cert, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {cert}
                      <button
                        type="button"
                        onClick={() => removeCertification(index)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
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