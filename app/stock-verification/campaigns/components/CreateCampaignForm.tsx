'use client';

import React, { useState, useEffect } from 'react';
import { createCampaignSchema } from '@/lib/stock-verification/validation';

interface State {
  id: number;
  name: string;
  code: string;
}

interface Lga {
  id: number;
  name: string;
  stateId: number;
}

interface Category {
  id: number;
  name: string;
  description?: string;
}

interface CreateCampaignFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCampaignForm({ isOpen, onClose, onSuccess }: CreateCampaignFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    assignedStates: [] as number[],
    assignedLgas: [] as number[],
    assignedCategories: [] as number[],
    budget: '',
    instructions: '',
  });

  const [states, setStates] = useState<State[]>([]);
  const [lgas, setLgas] = useState<Lga[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredLgas, setFilteredLgas] = useState<Lga[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');

  // Fetch reference data
  useEffect(() => {
    if (isOpen) {
      fetchReferenceData();
    }
  }, [isOpen]);

  // Filter LGAs based on selected states
  useEffect(() => {
    if (formData.assignedStates.length > 0) {
      const filtered = lgas.filter(lga => formData.assignedStates.includes(lga.stateId));
      setFilteredLgas(filtered);
    } else {
      setFilteredLgas([]);
    }
  }, [formData.assignedStates, lgas]);

  const fetchReferenceData = async () => {
    try {
      const [statesRes, lgasRes, categoriesRes] = await Promise.all([
        fetch('/api/states'),
        fetch('/api/lgas'),
        fetch('/api/categories'),
      ]);

      if (statesRes.ok) {
        const statesData = await statesRes.json();
        setStates(statesData.data || []);
      }

      if (lgasRes.ok) {
        const lgasData = await lgasRes.json();
        setLgas(lgasData.data || []);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.data || []);
      }
    } catch (error) {
      console.error('Error fetching reference data:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleMultiSelectChange = (field: string, value: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
        ? [...(prev[field as keyof typeof prev] as number[]), value]
        : (prev[field as keyof typeof prev] as number[]).filter(id => id !== value)
    }));
  };

  const validateForm = () => {
    try {
      // Prepare data for validation
      const validationData = {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : '',
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : '',
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
      };

      createCampaignSchema.parse(validationData);
      setErrors({});
      return true;
    } catch (error: any) {
      const fieldErrors: Record<string, string> = {};
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const field = err.path?.[0];
          if (field) {
            fieldErrors[field] = err.message;
          }
        });
      }
      setErrors(fieldErrors);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSubmitError('');

    try {
      const submitData = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
      };

      console.log('Submitting campaign data:', submitData);
      
      const response = await fetch('/api/stock-verification/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response data:', errorData);
        throw new Error(errorData.error || 'Failed to create campaign');
      }

      const result = await response.json();
      console.log('Success response data:', result);
      
      if (result.success) {
        // Reset form
        setFormData({
          name: '',
          description: '',
          startDate: '',
          endDate: '',
          assignedStates: [],
          assignedLgas: [],
          assignedCategories: [],
          budget: '',
          instructions: '',
        });
        onSuccess();
        onClose();
      } else {
        throw new Error(result.error || 'Failed to create campaign');
      }
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      setSubmitError(error.message || 'Failed to create campaign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      // Reset form and errors
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        assignedStates: [],
        assignedLgas: [],
        assignedCategories: [],
        budget: '',
        instructions: '',
      });
      setErrors({});
      setSubmitError('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create New Campaign</h2>
            <p className="text-sm text-gray-600 mt-1">Set up a new asset verification campaign</p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Submit Error */}
          {submitError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                <p className="text-red-800 text-sm">{submitError}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">📋 Basic Information</h3>
                
                {/* Campaign Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter campaign name"
                    maxLength={255}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Campaign description (optional)"
                    maxLength={2000}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/2000 characters
                  </p>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.startDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.startDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.endDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.endDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
                    )}
                  </div>
                </div>

                {/* Budget */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget (₦)
                  </label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Campaign budget (optional)"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">📝 Instructions</h3>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => handleInputChange('instructions', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Special instructions for verifiers (optional)"
                  maxLength={2000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.instructions.length}/2000 characters
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Assignment - States */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">🗺️ Geographic Assignment</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned States *
                  </label>
                  {errors.assignedStates && (
                    <p className="text-red-500 text-sm mb-2">{errors.assignedStates}</p>
                  )}
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-white">
                    {states.map((state) => (
                      <label key={state.id} className="flex items-center py-1">
                        <input
                          type="checkbox"
                          checked={formData.assignedStates.includes(state.id)}
                          onChange={(e) => handleMultiSelectChange('assignedStates', state.id, e.target.checked)}
                          className="mr-2 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">{state.name} ({state.code})</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.assignedStates.length} state(s) selected
                  </p>
                </div>

                {/* LGAs */}
                {formData.assignedStates.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specific LGAs (Optional)
                    </label>
                    <p className="text-xs text-gray-600 mb-2">
                      Leave empty to include all LGAs in selected states
                    </p>
                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-white">
                      {filteredLgas.map((lga) => {
                        const state = states.find(s => s.id === lga.stateId);
                        return (
                          <label key={lga.id} className="flex items-center py-1">
                            <input
                              type="checkbox"
                              checked={formData.assignedLgas.includes(lga.id)}
                              onChange={(e) => handleMultiSelectChange('assignedLgas', lga.id, e.target.checked)}
                              className="mr-2 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-gray-700">
                              {lga.name} ({state?.name})
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.assignedLgas.length} LGA(s) selected
                    </p>
                  </div>
                )}
              </div>

              {/* Categories */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">🏷️ Asset Categories</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Leave empty to include all asset categories
                </p>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-white">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center py-1">
                      <input
                        type="checkbox"
                        checked={formData.assignedCategories.includes(category.id)}
                        onChange={(e) => handleMultiSelectChange('assignedCategories', category.id, e.target.checked)}
                        className="mr-2 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm text-gray-700">{category.name}</span>
                        {category.description && (
                          <p className="text-xs text-gray-500">{category.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.assignedCategories.length} categor{formData.assignedCategories.length === 1 ? 'y' : 'ies'} selected
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t mt-8">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <span className="mr-2">✅</span>
                  Create Campaign
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}