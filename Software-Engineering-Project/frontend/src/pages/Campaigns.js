import React, { useState, useEffect } from 'react';
import { campaignAPI, couponAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  TicketIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [couponCount, setCouponCount] = useState(10);
  const [generatingCoupons, setGeneratingCoupons] = useState(false);
  const [generatedCoupons, setGeneratedCoupons] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'percentage',
    discount: '',
    start_date: '',
    end_date: '',
    max_redemptions: '',
    budget: ''
  });

  useEffect(() => {
    fetchCampaigns();
    
    // Auto-refresh every 15 seconds to show updated campaign stats
    const interval = setInterval(() => {
      fetchCampaigns();
    }, 15000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await campaignAPI.getAll();
      setCampaigns(response.data.campaigns || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (mode, campaign = null) => {
    setModalMode(mode);
    setSelectedCampaign(campaign);
    if (campaign) {
      setFormData({
        name: campaign.name,
        description: campaign.description || '',
        type: campaign.type,
        discount: campaign.discount,
        start_date: campaign.start_date ? campaign.start_date.slice(0, 16) : '',
        end_date: campaign.end_date ? campaign.end_date.slice(0, 16) : '',
        max_redemptions: campaign.max_redemptions || '',
        budget: campaign.budget || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'percentage',
        discount: '',
        start_date: '',
        end_date: '',
        max_redemptions: '',
        budget: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCampaign(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    const errors = validateCampaignForm(formData);
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }
    
    try {
      let createdCampaign;
      if (modalMode === 'create') {
        const response = await campaignAPI.create(formData);
        createdCampaign = response.data.campaign;
        toast.success('🎉 Campaign created successfully!');
        handleCloseModal();
        fetchCampaigns();
        
        // Open coupon generation modal for newly created campaign
        setSelectedCampaign(createdCampaign);
        setShowCouponModal(true);
      } else {
        await campaignAPI.update(selectedCampaign.id, formData);
        toast.success('✅ Campaign updated successfully!');
        handleCloseModal();
        fetchCampaigns();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleGenerateCoupons = async () => {
    if (!selectedCampaign) return;
    
    if (couponCount < 1 || couponCount > 10000) {
      toast.error('Please enter a count between 1 and 10,000');
      return;
    }
    
    setGeneratingCoupons(true);
    try {
      const response = await couponAPI.generate({
        campaign_id: selectedCampaign.id,
        count: parseInt(couponCount),
        code_length: 12,
        prefix: selectedCampaign.name.substring(0, 3).toUpperCase()
      });
      
      setGeneratedCoupons(response.data.coupons || []);
      toast.success(`🎉 Generated ${response.data.count} unique coupon codes!`);
      fetchCampaigns(); // Refresh to show updated counts
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate coupons');
    } finally {
      setGeneratingCoupons(false);
    }
  };

  const handleOpenCouponModal = (campaign) => {
    setSelectedCampaign(campaign);
    setGeneratedCoupons([]);
    setCouponCount(10);
    setShowCouponModal(true);
  };

  const handleCloseCouponModal = () => {
    setShowCouponModal(false);
    setSelectedCampaign(null);
    setGeneratedCoupons([]);
  };

  const validateCampaignForm = (data) => {
    const errors = [];
    
    // Name validation
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Campaign name is required');
    } else if (data.name.length < 3) {
      errors.push('Campaign name must be at least 3 characters');
    } else if (data.name.length > 255) {
      errors.push('Campaign name cannot exceed 255 characters');
    }
    
    // Discount validation
    const discountNum = parseFloat(data.discount);
    if (!data.discount || isNaN(discountNum) || discountNum <= 0) {
      errors.push('Discount value must be a positive number');
    } else if (data.type === 'percentage' && discountNum > 100) {
      errors.push('Percentage discount cannot exceed 100%');
    } else if (data.type === 'percentage' && discountNum < 1) {
      errors.push('Percentage discount must be at least 1%');
    } else if (data.type === 'fixed' && discountNum > 10000) {
      errors.push('Fixed discount cannot exceed $10,000');
    }
    
    // Date validation
    if (!data.start_date || !data.end_date) {
      errors.push('Start date and end date are required');
    } else {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      
      if (endDate <= startDate) {
        errors.push('End date must be after start date');
      }
      
      const durationMs = endDate - startDate;
      const oneHour = 60 * 60 * 1000;
      const oneYear = 365 * 24 * 60 * 60 * 1000;
      
      if (durationMs < oneHour) {
        errors.push('Campaign duration must be at least 1 hour');
      }
      if (durationMs > oneYear) {
        errors.push('Campaign duration cannot exceed 1 year');
      }
    }
    
    // Max redemptions validation
    if (data.max_redemptions && data.max_redemptions !== '') {
      const maxRed = parseInt(data.max_redemptions);
      if (isNaN(maxRed) || maxRed < 1) {
        errors.push('Max redemptions must be a positive integer');
      } else if (maxRed > 1000000) {
        errors.push('Max redemptions cannot exceed 1,000,000');
      }
    }
    
    // Budget validation
    if (data.budget && data.budget !== '') {
      const budgetNum = parseFloat(data.budget);
      if (isNaN(budgetNum) || budgetNum < 0) {
        errors.push('Budget must be a non-negative number');
      } else if (budgetNum > 10000000) {
        errors.push('Budget cannot exceed $10,000,000');
      }
    }
    
    return errors;
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await campaignAPI.delete(id);
      toast.success('Campaign deleted successfully!');
      fetchCampaigns();
    } catch (error) {
      toast.error('Failed to delete campaign');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const statusMessages = {
      active: 'activated',
      paused: 'paused',
      completed: 'completed',
      draft: 'moved to draft'
    };
    
    try {
      await campaignAPI.updateStatus(id, newStatus);
      toast.success(`✅ Campaign ${statusMessages[newStatus] || newStatus} successfully!`);
      fetchCampaigns();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update campaign status');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-slate-100 text-slate-800',
      expired: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
              <p className="mt-2 text-sm text-gray-600">Manage your coupon campaigns</p>
            </div>
            <button
              onClick={() => handleOpenModal('create')}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-primary-600 to-teal-600 text-white rounded-lg hover:from-primary-700 hover:to-teal-700 transition duration-200 shadow-lg"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Campaign
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type & Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coupons</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No campaigns found. Create your first campaign to get started!
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                        <div className="text-sm text-gray-500">{campaign.description?.substring(0, 60)}...</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {campaign.type === 'percentage' ? `${campaign.discount}%` : `$${campaign.discount}`}
                        <span className="text-gray-500 ml-1">off</span>
                      </div>
                      <div className="text-xs text-gray-500 capitalize">{campaign.type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{new Date(campaign.start_date).toLocaleDateString()}</div>
                      <div className="text-sm text-gray-500">to {new Date(campaign.end_date).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(campaign.status)}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{campaign.total_coupons_generated || 0} generated</div>
                      <div className="text-xs text-gray-500">{campaign.current_redemptions || 0} / {campaign.max_redemptions || 0} used</div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleOpenCouponModal(campaign)} 
                          className="text-primary-600 hover:text-primary-900" 
                          title="Generate Coupons"
                        >
                          <TicketIcon className="h-5 w-5" />
                        </button>
                        {campaign.status === 'active' && (
                          <button onClick={() => handleStatusChange(campaign.id, 'paused')} className="text-yellow-600 hover:text-yellow-900" title="Pause">
                            <PauseIcon className="h-5 w-5" />
                          </button>
                        )}
                        {campaign.status === 'paused' && (
                          <button onClick={() => handleStatusChange(campaign.id, 'active')} className="text-green-600 hover:text-green-900" title="Activate">
                            <PlayIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button onClick={() => handleOpenModal('edit', campaign)} className="text-blue-600 hover:text-blue-900" title="Edit">
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button onClick={() => handleDelete(campaign.id)} className="text-red-600 hover:text-red-900" title="Delete">
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">{modalMode === 'create' ? 'Create New Campaign' : 'Edit Campaign'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                    <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                      <option value="bogo">Buy One Get One</option>
                      <option value="free_shipping">Free Shipping</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                    <input type="number" step="0.01" required value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input type="datetime-local" required value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input type="datetime-local" required value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Redemptions</label>
                    <input type="number" value={formData.max_redemptions} onChange={(e) => setFormData({ ...formData, max_redemptions: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
                    <input type="number" step="0.01" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={handleCloseModal} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-gradient-to-r from-primary-600 to-teal-600 text-white rounded-md hover:from-primary-700 hover:to-teal-700">{modalMode === 'create' ? 'Create' : 'Update'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Generation Modal */}
      {showCouponModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <SparklesIcon className="h-8 w-8" />
                <div>
                  <h2 className="text-2xl font-bold">Generate Coupons</h2>
                  <p className="text-teal-100 mt-1">{selectedCampaign.name}</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {generatedCoupons.length === 0 ? (
                <div className="space-y-6">
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                    <h3 className="font-semibold text-teal-900 mb-2">📋 Campaign Details</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <span className="ml-2 font-medium text-gray-900 capitalize">{selectedCampaign.type}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Discount:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {selectedCampaign.type === 'percentage' ? `${selectedCampaign.discount}%` : `$${selectedCampaign.discount}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Already Generated:</span>
                        <span className="ml-2 font-medium text-gray-900">{selectedCampaign.total_coupons_generated || 0} coupons</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span className="ml-2 font-medium text-green-600 capitalize">{selectedCampaign.status}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Coupons to Generate
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={couponCount}
                      onChange={(e) => setCouponCount(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                      placeholder="e.g., 100"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      💡 Each coupon will have a unique 12-character alphanumeric code
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">🔒 Security Features</h4>
                    <ul className="space-y-1 text-sm text-blue-800">
                      <li>✓ AES-256 encryption for all codes</li>
                      <li>✓ Cryptographically random generation</li>
                      <li>✓ Duplicate detection & prevention</li>
                      <li>✓ Automatic expiration rules applied</li>
                      <li>✓ Unique code guarantee across system</li>
                    </ul>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseCouponModal}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGenerateCoupons}
                      disabled={generatingCoupons || couponCount < 1}
                      className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-4 py-3 rounded-lg font-medium hover:from-teal-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {generatingCoupons ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="h-5 w-5" />
                          Generate {couponCount} Coupons
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                      ✅ Successfully Generated {generatedCoupons.length} Coupons
                    </h3>
                    <p className="text-sm text-green-700">
                      All codes are encrypted and stored securely. You can view them in the Coupons section.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Sample Codes (First 10):</h4>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-2">
                        {generatedCoupons.slice(0, 10).map((coupon, index) => (
                          <div
                            key={index}
                            className="bg-white border border-gray-200 rounded px-3 py-2 font-mono text-sm text-gray-800 flex items-center justify-between"
                          >
                            <span>{coupon.code}</span>
                            <span className="text-xs text-green-600">✓</span>
                          </div>
                        ))}
                      </div>
                      {generatedCoupons.length > 10 && (
                        <p className="text-sm text-gray-500 mt-3 text-center">
                          + {generatedCoupons.length - 10} more codes generated
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setGeneratedCoupons([]);
                        setCouponCount(10);
                      }}
                      className="flex-1 px-4 py-3 border border-teal-300 text-teal-700 rounded-lg font-medium hover:bg-teal-50 transition-colors"
                    >
                      Generate More
                    </button>
                    <button
                      onClick={handleCloseCouponModal}
                      className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-4 py-3 rounded-lg font-medium hover:from-teal-700 hover:to-emerald-700 transition-all"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
