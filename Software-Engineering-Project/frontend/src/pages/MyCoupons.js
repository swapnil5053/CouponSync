import React, { useState, useEffect } from 'react';
import { couponAPI, redemptionAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  TicketIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  SparklesIcon,
  CalendarIcon,
  TagIcon,
  CurrencyDollarIcon,
  GiftIcon,
  TruckIcon
} from '@heroicons/react/24/outline';

const MyCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    fetchMyCoupons();
  }, []);

  const fetchMyCoupons = async () => {
    try {
      setLoading(true);
      // Backend automatically filters coupons for the logged-in customer
      const response = await couponAPI.getAll();
      setCoupons(response.data.coupons || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch your coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemClick = (coupon) => {
    setSelectedCoupon(coupon);
    setRedeemAmount('');
    setShowRedeemModal(true);
  };

  const handleRedeemSubmit = async (e) => {
    e.preventDefault();
    
    if (!redeemAmount || parseFloat(redeemAmount) <= 0) {
      toast.error('Please enter a valid transaction amount');
      return;
    }

    setRedeeming(true);
    try {
      const response = await redemptionAPI.redeem({
        code: selectedCoupon.code,
        order_amount: parseFloat(redeemAmount)
      });
      
      toast.success(
        `🎉 Coupon Redeemed Successfully! You saved $${response.data.discount_applied.toFixed(2)}`,
        { duration: 4000 }
      );
      
      setShowRedeemModal(false);
      setSelectedCoupon(null);
      setRedeemAmount('');
      fetchMyCoupons();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Redemption failed');
    } finally {
      setRedeeming(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      generated: 'bg-gradient-to-r from-blue-400 to-blue-600 text-white border-blue-300 shadow-lg',
      distributed: 'bg-gradient-to-r from-green-400 to-emerald-600 text-white border-green-300 shadow-lg',
      active: 'bg-gradient-to-r from-emerald-400 to-green-600 text-white border-emerald-300 shadow-lg',
      redeemed: 'bg-gradient-to-r from-teal-400 to-teal-600 text-white border-teal-300 shadow-lg',
      expired: 'bg-gradient-to-r from-gray-300 to-gray-500 text-white border-gray-400 shadow',
      revoked: 'bg-gradient-to-r from-red-400 to-red-600 text-white border-red-300 shadow-lg'
    };
    return badges[status] || badges.generated;
  };

  const getStatusIcon = (status) => {
    const icons = {
      generated: <TicketIcon className="h-5 w-5" />,
      distributed: <SparklesIcon className="h-5 w-5" />,
      active: <SparklesIcon className="h-5 w-5" />,
      redeemed: <CheckCircleIcon className="h-5 w-5" />,
      expired: <ClockIcon className="h-5 w-5" />,
      revoked: <XCircleIcon className="h-5 w-5" />
    };
    return icons[status] || icons.generated;
  };

  const getDiscountTypeIcon = (type) => {
    const icons = {
      percentage: TagIcon,
      fixed: CurrencyDollarIcon,
      bogo: GiftIcon,
      free_shipping: TruckIcon
    };
    return icons[type] || TagIcon;
  };

  const getDiscountTypeColor = (type) => {
    const colors = {
      percentage: 'from-orange-500 to-amber-500',
      fixed: 'from-green-500 to-emerald-500',
      bogo: 'from-teal-500 to-cyan-500',
      free_shipping: 'from-blue-500 to-cyan-500'
    };
    return colors[type] || 'from-primary-500 to-teal-500';
  };

  const getDiscountDisplay = (coupon) => {
    const discountType = coupon.campaign_type || coupon.discount_type;
    const discountValue = coupon.campaign_discount || coupon.discount_value;
    
    switch (discountType) {
      case 'percentage':
        return `${discountValue}% OFF`;
      case 'fixed':
        return `$${discountValue} OFF`;
      case 'bogo':
        return 'BUY 1 GET 1';
      case 'free_shipping':
        return 'FREE SHIP';
      default:
        return 'DISCOUNT';
    }
  };

  const isExpired = (expiresAt) => {
    return expiresAt && new Date(expiresAt) < new Date();
  };

  const canRedeem = (coupon) => {
    return (coupon.status === 'distributed' || coupon.status === 'active' || coupon.status === 'generated') && !coupon.is_used && !isExpired(coupon.expiry_date);
  };

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          coupon.campaign_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || coupon.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your coupons...</p>
        </div>
      </div>
    );
  }

  const availableCount = coupons.filter(c => canRedeem(c)).length;
  const redeemedCount = coupons.filter(c => c.status === 'redeemed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-primary-600 to-teal-600 bg-clip-text text-transparent">
                My Coupons
              </h1>
              <p className="mt-2 text-gray-600 font-medium">
                💎 Your personal collection of savings and deals
              </p>
            </div>
            
            {/* Stats Cards */}
            <div className="flex gap-3">
              <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-green-200">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-600">Available</p>
                    <p className="text-2xl font-bold text-green-600">{availableCount}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-teal-200">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-6 w-6 text-teal-600" />
                  <div>
                    <p className="text-xs text-gray-600">Redeemed</p>
                    <p className="text-2xl font-bold text-teal-600">{redeemedCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-teal-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🔍 Search Coupons
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by code or campaign..."
                  className="pl-10 w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                />
              </div>
            </div>
 
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🎯 Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
              >
                <option value="all">All Statuses</option>
                <option value="generated">Generated</option>
                <option value="distributed">Distributed</option>
                <option value="active">Active</option>
                <option value="redeemed">Redeemed</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        </div>

        {/* Coupons Grid */}
        {filteredCoupons.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-gray-100">
            <TicketIcon className="mx-auto h-20 w-20 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No coupons found</h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? '🔍 Try adjusting your filters'
                : '🎁 You don\'t have any coupons yet. Check back soon for new offers!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoupons.map((coupon) => {
              const discountType = coupon.campaign_type || coupon.discount_type;
              const gradientColor = getDiscountTypeColor(discountType);
              const DiscountIcon = getDiscountTypeIcon(discountType);
              
              return (
                <div
                  key={coupon.id}
                  className={`bg-white rounded-2xl shadow-xl overflow-hidden border-2 transition-all hover:shadow-2xl hover:scale-105 transform ${
                    canRedeem(coupon) ? `border-${gradientColor.split('-')[0]}-200` : 'border-gray-200'
                  }`}
                >
                  {/* Coupon Header */}
                  <div className={`p-5 ${canRedeem(coupon) ? `bg-gradient-to-r ${gradientColor}` : 'bg-gradient-to-r from-gray-400 to-gray-500'}`}>
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center space-x-3">
                        <DiscountIcon className="h-8 w-8" />
                        <span className="font-bold text-xl">{getDiscountDisplay(coupon)}</span>
                      </div>
                      <SparklesIcon className="h-7 w-7 animate-pulse" />
                    </div>
                  </div>

                  {/* Coupon Body */}
                  <div className="p-6 bg-gradient-to-br from-white to-gray-50">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                      <TagIcon className="h-5 w-5 mr-2 text-primary-600" />
                      {coupon.campaign_name || 'Special Offer'}
                    </h3>
                    
                    <div className="space-y-3 mb-5">
                      {/* Coupon Code */}
                      <div className={`bg-gradient-to-r ${gradientColor} bg-opacity-10 rounded-xl p-4 border-2 border-${gradientColor.split('-')[0]}-200`}>
                        <p className="text-xs font-semibold text-gray-600 mb-1">🎫 COUPON CODE</p>
                        <p className="font-mono font-extrabold text-2xl text-gray-900 tracking-widest">
                          {coupon.code}
                        </p>
                      </div>

                      {/* Expiry Date */}
                      {coupon.expiry_date && (
                        <div className="flex items-center text-sm text-gray-700 bg-blue-50 rounded-lg p-3">
                          <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                          <span>
                            {isExpired(coupon.expiry_date) ? (
                              <span className="text-red-600 font-bold">⏰ Expired {new Date(coupon.expiry_date).toLocaleDateString()}</span>
                            ) : (
                              <span className="font-semibold">✅ Valid until {new Date(coupon.expiry_date).toLocaleDateString()}</span>
                            )}
                          </span>
                        </div>
                      )}

                      {/* Status Badge */}
                      <div>
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-md ${getStatusBadge(coupon.status)}`}>
                          <span className="mr-2">{getStatusIcon(coupon.status)}</span>
                          <span className="capitalize">{coupon.status}</span>
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    {canRedeem(coupon) ? (
                      <button
                        onClick={() => handleRedeemClick(coupon)}
                        className={`w-full bg-gradient-to-r ${gradientColor} hover:shadow-xl text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center shadow-lg`}
                      >
                        <SparklesIcon className="h-6 w-6 mr-2 animate-pulse" />
                        🎉 Redeem Now
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full bg-gradient-to-r from-gray-300 to-gray-400 text-gray-600 font-bold py-4 px-4 rounded-xl cursor-not-allowed shadow-md"
                      >
                        {coupon.status === 'redeemed' ? '✅ Already Redeemed' : '❌ Not Available'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Redeem Modal */}
      {showRedeemModal && selectedCoupon && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto w-full max-w-md shadow-2xl rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-100 border-2 border-emerald-200 overflow-hidden">
            {/* Decorative Header */}
            <div className={`bg-gradient-to-r ${getDiscountTypeColor(selectedCoupon.campaign_type || selectedCoupon.discount_type)} p-6 relative`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center text-white">
                  {(() => {
                    const Icon = getDiscountTypeIcon(selectedCoupon.campaign_type || selectedCoupon.discount_type);
                    return <Icon className="h-10 w-10 mr-3" />;
                  })()}
                  <div>
                    <p className="text-sm opacity-90 font-medium">🎉 You're redeeming</p>
                    <h3 className="text-3xl font-extrabold">{getDiscountDisplay(selectedCoupon)}</h3>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowRedeemModal(false);
                    setSelectedCoupon(null);
                    setRedeemAmount('');
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition"
                  disabled={redeeming}
                >
                  <XCircleIcon className="h-8 w-8" />
                </button>
              </div>
              
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-3 text-white relative z-10">
                <p className="text-xs font-semibold mb-1">COUPON CODE</p>
                <p className="text-xl font-mono font-bold tracking-widest">
                  {selectedCoupon.code}
                </p>
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleRedeemSubmit} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                  <CurrencyDollarIcon className="h-5 w-5 mr-2 text-green-600" />
                  💰 Transaction Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  placeholder="Enter purchase amount"
                  className="w-full border-2 border-emerald-200 rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-xl font-semibold bg-white shadow-sm transition"
                  required
                  autoFocus
                  disabled={redeeming}
                />
                <p className="mt-3 text-sm text-gray-600 bg-blue-50 rounded-lg p-3 border border-blue-200">
                  💡 <strong>Tip:</strong> Enter the total amount to calculate your discount
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRedeemModal(false);
                    setSelectedCoupon(null);
                    setRedeemAmount('');
                  }}
                  className="flex-1 px-5 py-4 border-2 border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition shadow-md"
                  disabled={redeeming}
                >
                  ❌ Cancel
                </button>
                <button
                  type="submit"
                  disabled={redeeming}
                  className={`flex-1 px-5 py-4 border-2 border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r ${getDiscountTypeColor(selectedCoupon.campaign_type || selectedCoupon.discount_type)} hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center ${redeeming ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {redeeming ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-6 w-6 mr-2" />
                      ✨ Confirm Redemption
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

export default MyCoupons;
