import React, { useState, useEffect } from 'react';
import { campaignAPI, couponAPI, redemptionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  SparklesIcon,
  CalendarIcon,
  TagIcon,
  TicketIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  GiftIcon,
  CheckCircleIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';

const BrowseCampaigns = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    fetchActiveCampaigns();
  }, []);

  const fetchActiveCampaigns = async () => {
    try {
      setLoading(true);
      // Fetch only active campaigns
      const response = await campaignAPI.getAll({ status: 'active' });
      setCampaigns(response.data.campaigns || []);
    } catch (error) {
      toast.error('Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

    const handleClaimCoupon = async (campaign) => {
    setClaiming(true);
    try {
      // Simple coupon generation for the user
      const response = await couponAPI.generate({
        campaign_id: campaign.id,
        count: 1,
        user_id: user.id
      });

      const generatedCoupon = response.data.coupons?.[0];
      
      if (generatedCoupon?.code) {
        // Show the code in a toast notification
        toast.success(
          <div className="flex flex-col">
            <span className="font-bold">🎉 Coupon Claimed!</span>
            <span className="text-sm mt-1">Your code: <span className="font-mono font-bold">{generatedCoupon.code}</span></span>
            <span className="text-xs mt-1 opacity-75">Check "My Coupons" to view all your coupons</span>
          </div>,
          { duration: 6000 }
        );
        fetchActiveCampaigns(); // Refresh the list
      } else {
        toast.error('Failed to claim coupon - no code generated');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to claim coupon');
    } finally {
      setClaiming(false);
    }
  };

  const handleRedeemNow = (campaign) => {
    setSelectedCampaign(campaign);
    setCouponCode(''); // Clear any previous code
    setTransactionAmount(''); // Clear amount
    setShowRedeemModal(true);
  };

  const handleRedeemSubmit = async (e) => {
    e.preventDefault();

    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    if (!transactionAmount || parseFloat(transactionAmount) <= 0) {
      toast.error('Please enter a valid transaction amount');
      return;
    }

    setRedeeming(true);
    try {
      const response = await redemptionAPI.redeem({
        code: couponCode.trim(),
        order_amount: parseFloat(transactionAmount)
      });

      toast.success(
        <div className="flex flex-col">
          <span className="font-bold">✅ Redemption Successful!</span>
          <span className="text-sm mt-1">You saved ${response.data.discount_applied.toFixed(2)}</span>
        </div>,
        { duration: 4000 }
      );
      setShowRedeemModal(false);
      setSelectedCampaign(null);
      setCouponCode('');
      setTransactionAmount('');
      fetchActiveCampaigns(); // Refresh campaigns
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Redemption failed';
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setRedeeming(false);
    }
  };

  const getDiscountDisplay = (campaign) => {
    const type = campaign.discount_type || campaign.type;
    const value = campaign.discount_value || campaign.discount;
    
    switch (type) {
      case 'percentage':
        return `${value}% OFF`;
      case 'fixed':
        return `$${value} OFF`;
      case 'bogo':
        return 'BUY 1 GET 1';
      case 'free_shipping':
        return 'FREE SHIPPING';
      default:
        return 'Special Offer';
    }
  };

  const getTypeColor = (campaign) => {
    const type = campaign.discount_type || campaign.type;
    const colors = {
      percentage: 'from-teal-500 to-emerald-500',
      fixed: 'from-blue-500 to-cyan-500',
      bogo: 'from-green-500 to-emerald-500',
      free_shipping: 'from-orange-500 to-red-500'
    };
    return colors[type] || 'from-gray-500 to-gray-700';
  };

  const getTypeIcon = (campaign) => {
    const type = campaign.discount_type || campaign.type;
    const icons = {
      percentage: <TagIcon className="h-6 w-6" />,
      fixed: <GiftIcon className="h-6 w-6" />,
      bogo: <ShoppingBagIcon className="h-6 w-6" />,
      free_shipping: <TicketIcon className="h-6 w-6" />
    };
    return icons[type] || <SparklesIcon className="h-6 w-6" />;
  };

  const isExpiringSoon = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return daysLeft <= 7 && daysLeft > 0;
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (campaign.description && campaign.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterType === 'all' || campaign.type === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">🎁 Available Campaigns</h1>
            <p className="text-xl text-primary-100">Discover amazing deals and save money!</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="percentage">Percentage Off</option>
                <option value="fixed">Fixed Amount</option>
                <option value="bogo">Buy One Get One</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-12">
            <SparklesIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                {/* Campaign Header with Gradient */}
                <div className={`bg-gradient-to-r ${getTypeColor(campaign)} p-6 text-white relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 opacity-20 transform rotate-12 scale-150">
                    {getTypeIcon(campaign)}
                  </div>
                  
                  {isExpiringSoon(campaign.end_date) && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold animate-pulse">
                      Ending Soon!
                    </span>
                  )}

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(campaign)}
                      <span className="text-sm font-medium opacity-90 uppercase tracking-wide">
                        {(campaign.discount_type || campaign.type)?.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-1">{campaign.name}</h3>
                    <div className="text-3xl font-black">
                      {getDiscountDisplay(campaign)}
                    </div>
                  </div>
                </div>

                {/* Campaign Body */}
                <div className="p-6">
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {campaign.description || 'Special offer available for limited time'}
                  </p>

                  {/* Merchant Info */}
                  <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                    <span className="font-medium">By: {campaign.merchant_name || 'Merchant'}</span>
                  </div>

                  {/* Campaign Details */}
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <CalendarIcon className="h-4 w-4" />
                      <span>
                        Valid until {new Date(campaign.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {campaign.max_redemptions && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <TicketIcon className="h-4 w-4" />
                        <span>
                          {campaign.total_redemptions || 0} / {campaign.max_redemptions} used
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {campaign.max_redemptions && (
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(((campaign.total_redemptions || 0) / campaign.max_redemptions) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleClaimCoupon(campaign)}
                      disabled={claiming || (campaign.max_redemptions && campaign.total_redemptions >= campaign.max_redemptions)}
                      className="flex-1 bg-gradient-to-r from-primary-600 to-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:from-primary-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <GiftIcon className="h-5 w-5" />
                      {claiming ? 'Claiming...' : 'Claim Coupon'}
                    </button>
                    
                    <button
                      onClick={() => handleRedeemNow(campaign)}
                      className="px-4 py-2 border-2 border-primary-600 text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-all flex items-center justify-center"
                      title="Redeem existing coupon"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Redeem Modal */}
      {showRedeemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className={`bg-gradient-to-r ${getTypeColor(selectedCampaign?.type)} p-6 text-white relative`}>
              <button
                onClick={() => {
                  setShowRedeemModal(false);
                  setSelectedCampaign(null);
                  setCouponCode('');
                  setTransactionAmount('');
                }}
                className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
              
              <div className="flex items-center gap-3 mb-2">
                {getTypeIcon(selectedCampaign?.type)}
                <h3 className="text-2xl font-bold">Redeem Coupon</h3>
              </div>
              <p className="text-primary-100">{selectedCampaign?.name}</p>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleRedeemSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coupon Code
                </label>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter your coupon code"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={transactionAmount}
                  onChange={(e) => setTransactionAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Discount Preview */}
              {transactionAmount && selectedCampaign && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Estimated Savings:</span>
                    <span className="text-lg font-bold text-green-600">
                      {selectedCampaign.type === 'percentage'
                        ? `$${((parseFloat(transactionAmount) * selectedCampaign.discount) / 100).toFixed(2)}`
                        : selectedCampaign.type === 'fixed'
                        ? `$${Math.min(selectedCampaign.discount, parseFloat(transactionAmount)).toFixed(2)}`
                        : 'Varies'}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRedeemModal(false);
                    setSelectedCampaign(null);
                    setCouponCode('');
                    setTransactionAmount('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={redeeming}
                  className="flex-1 bg-gradient-to-r from-primary-600 to-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:from-primary-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {redeeming ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Redeeming...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5" />
                      Redeem Now
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseCampaigns;
