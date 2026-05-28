import React, { useState, useEffect } from 'react';
import { couponAPI, campaignAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  QrCodeIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  XCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  TicketIcon
} from '@heroicons/react/24/outline';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCampaign, setFilterCampaign] = useState('all');
  const [generateForm, setGenerateForm] = useState({
    campaign_id: '',
    quantity: 10,
    expires_at: ''
  });

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 10 seconds to show updated coupon statuses
    const interval = setInterval(() => {
      fetchData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [couponsRes, campaignsRes] = await Promise.all([
        couponAPI.getAll(),
        campaignAPI.getAll()
      ]);
      setCoupons(couponsRes.data.coupons || []);
      setCampaigns(campaignsRes.data.campaigns || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCoupons = async (e) => {
    e.preventDefault();
    
    if (!generateForm.campaign_id) {
      toast.error('Please select a campaign');
      return;
    }
    
    if (generateForm.quantity < 1 || generateForm.quantity > 1000) {
      toast.error('Quantity must be between 1 and 1000');
      return;
    }

    try {
      const response = await couponAPI.generate(generateForm);
      toast.success(`✨ Generated ${response.data.generated} coupons successfully!`);
      setShowGenerateModal(false);
      setGenerateForm({ campaign_id: '', quantity: 10, expires_at: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate coupons');
    }
  };

  const handleGenerateQR = async (couponId) => {
    try {
      const response = await couponAPI.generateQR(couponId);
      const qrUrl = response.data.qr_code_url;
      window.open(qrUrl, '_blank');
      toast.success('QR Code generated!');
    } catch (error) {
      toast.error('Failed to generate QR code');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      available: 'bg-green-100 text-green-800',
      assigned: 'bg-blue-100 text-blue-800',
      redeemed: 'bg-teal-100 text-teal-800',
      expired: 'bg-gray-100 text-gray-800',
      revoked: 'bg-red-100 text-red-800'
    };
    return badges[status] || badges.available;
  };

  const getStatusIcon = (status) => {
    const icons = {
      available: <CheckCircleIcon className="h-4 w-4" />,
      assigned: <UserPlusIcon className="h-4 w-4" />,
      redeemed: <CheckCircleIcon className="h-4 w-4" />,
      expired: <ClockIcon className="h-4 w-4" />,
      revoked: <XCircleIcon className="h-4 w-4" />
    };
    return icons[status] || icons.available;
  };

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || coupon.status === filterStatus;
    const matchesCampaign = filterCampaign === 'all' || coupon.campaign_id.toString() === filterCampaign;
    return matchesSearch && matchesStatus && matchesCampaign;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Coupon Management</h1>
              <p className="mt-2 text-sm text-gray-600">
                Generate and manage discount coupons for your campaigns
              </p>
            </div>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Generate Coupons
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Coupon Code
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by code..."
                  className="pl-10 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="redeemed">Redeemed</option>
                <option value="expired">Expired</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Campaign
              </label>
              <select
                value={filterCampaign}
                onChange={(e) => setFilterCampaign(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Campaigns</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Coupons Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <TicketIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium">No coupons found</p>
                    <p className="text-sm">Generate coupons to get started</p>
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => {
                  const campaign = campaigns.find(c => c.id === coupon.campaign_id);
                  return (
                    <tr key={coupon.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-mono font-medium text-gray-900">
                            {coupon.code}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {campaign?.name || 'Unknown Campaign'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(coupon.status)}`}>
                          {getStatusIcon(coupon.status)}
                          <span className="ml-1 capitalize">{coupon.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'No expiry'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {coupon.assigned_to || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleGenerateQR(coupon.id)}
                          className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                          title="Generate QR Code"
                        >
                          <QrCodeIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination Info */}
          {filteredCoupons.length > 0 && (
            <div className="bg-white px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{filteredCoupons.length}</span> coupon(s)
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fancy Generate Coupons Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl transform transition-all animate-slideUp">
            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-teal-600 px-8 py-6 rounded-t-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-white opacity-10 animate-pulse"></div>
              <div className="relative flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <PlusIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Generate Coupons</h3>
                    <p className="text-primary-100 text-sm mt-1">Create discount codes for your campaigns</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="text-white hover:text-primary-100 transition-colors bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleGenerateCoupons} className="p-8">
              <div className="space-y-6">
                {/* Campaign Selection with Preview */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Select Campaign *
                  </label>
                  <select
                    value={generateForm.campaign_id}
                    onChange={(e) => setGenerateForm({ ...generateForm, campaign_id: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base font-medium"
                    required
                  >
                    <option value="">Choose a campaign...</option>
                    {campaigns.filter(c => c.status === 'active' || c.status === 'scheduled').map(campaign => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name} - {campaign.discount_type === 'percentage' ? `${campaign.discount_value}% OFF` : `$${campaign.discount_value} OFF`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Campaign Preview Card */}
                {generateForm.campaign_id && (() => {
                  const selectedCampaign = campaigns.find(c => c.id === parseInt(generateForm.campaign_id));
                  return selectedCampaign ? (
                    <div className="bg-gradient-to-r from-primary-50 to-teal-50 border-2 border-primary-200 rounded-xl p-6 animate-fadeIn">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                              {selectedCampaign.status}
                            </div>
                            <div className="bg-white px-3 py-1 rounded-full text-xs font-semibold text-gray-700 border border-gray-200">
                              {selectedCampaign.discount_type}
                            </div>
                          </div>
                          <h4 className="text-xl font-bold text-gray-900 mb-2">{selectedCampaign.name}</h4>
                          <p className="text-gray-600 text-sm mb-4">{selectedCampaign.description}</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Discount Value</p>
                              <p className="text-2xl font-bold text-primary-600">
                                {selectedCampaign.discount_type === 'percentage' 
                                  ? `${selectedCampaign.discount_value}%` 
                                  : `$${selectedCampaign.discount_value}`}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Valid Until</p>
                              <p className="text-sm font-semibold text-gray-700">
                                {new Date(selectedCampaign.end_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="bg-gradient-to-br from-primary-600 to-teal-600 rounded-full p-4 shadow-lg">
                            <TicketIcon className="h-12 w-12 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Quantity Input with Visual Indicator */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Number of Coupons * (1-1000)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={generateForm.quantity}
                      onChange={(e) => setGenerateForm({ ...generateForm, quantity: parseInt(e.target.value) || 0 })}
                      min="1"
                      max="1000"
                      className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base font-medium"
                      required
                    />
                    <div className="mt-2 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-primary-500 to-teal-500 h-full transition-all duration-300"
                        style={{ width: `${Math.min((generateForm.quantity / 1000) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {generateForm.quantity > 0 && `Generating ${generateForm.quantity} coupon${generateForm.quantity > 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>

                {/* Expiry Date Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Custom Expiry Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={generateForm.expires_at}
                    onChange={(e) => setGenerateForm({ ...generateForm, expires_at: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
                  />
                  <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
                    <ClockIcon className="h-4 w-4" />
                    <span>Leave empty to use campaign end date</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl text-base font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 border-2 border-transparent rounded-xl text-base font-semibold text-white bg-gradient-to-r from-primary-600 to-teal-600 hover:from-primary-700 hover:to-teal-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center space-x-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Generate Coupons</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coupons;
