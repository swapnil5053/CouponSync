import React, { useState, useEffect, useCallback } from 'react';
import { redemptionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  TicketIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  ClockIcon,
  SparklesIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

const Redemptions = () => {
  const { user, isAdmin, isMerchant } = useAuth();
  const [redemptions, setRedemptions] = useState([]);
  const [fraudAttempts, setFraudAttempts] = useState([]);
  const [fraudStats, setFraudStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [redeemForm, setRedeemForm] = useState({
    coupon_code: '',
    user_id: user?.id || null,
    device_fingerprint: null
  });
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [redeeming, setRedeeming] = useState(false);

  const generateDeviceFingerprint = useCallback(() => {
    // Simple device fingerprinting (safe access to browser globals)
    const ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
    const lang = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : '';
    
    // Safely access window.screen properties to avoid ESLint no-restricted-globals
    const scrObj = (typeof window !== 'undefined' && window.screen) ? window.screen : {};
    const colorDepth = scrObj.colorDepth || '';
    const dims = scrObj.width ? `${scrObj.width}x${scrObj.height}` : '';
    const offset = new Date().getTimezoneOffset();

    const fingerprint = [ua, lang, colorDepth, dims, offset].join('|');

    // btoa is a browser API; fall back to Buffer for environments that have it
    const encoded = (typeof window !== 'undefined' && typeof window.btoa === 'function')
      ? window.btoa(fingerprint)
      : (typeof Buffer !== 'undefined' ? Buffer.from(fingerprint).toString('base64') : fingerprint);

    setRedeemForm(prev => ({
      ...prev,
      device_fingerprint: (encoded || '').substring(0, 255)
    }));
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (dateFilter !== 'all') {
        const now = new Date();
        const startDate = new Date();
        
        if (dateFilter === 'today') {
          startDate.setHours(0, 0, 0, 0);
        } else if (dateFilter === 'week') {
          startDate.setDate(now.getDate() - 7);
        } else if (dateFilter === 'month') {
          startDate.setMonth(now.getMonth() - 1);
        }
        
        params.start_date = startDate.toISOString();
        params.end_date = now.toISOString();
      }

      const redemptionsRes = await redemptionAPI.getHistory(params);
      setRedemptions(redemptionsRes.data.data || []);

      // Only fetch fraud attempts if admin
      if (isAdmin) {
        try {
          const fraudRes = await redemptionAPI.getFraudAttempts(params);
          setFraudAttempts(fraudRes.data.data || []);
          setFraudStats(fraudRes.data.statistics || null);
        } catch (fraudError) {
          // eslint-disable-next-line no-console
          console.error('Fraud data error:', fraudError);
          // Don't show error for fraud attempts - it's optional
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Fetch redemption data error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch redemption data');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, isAdmin]);

  useEffect(() => {
    fetchData();
    generateDeviceFingerprint();
  }, [fetchData, generateDeviceFingerprint]);

  const handleValidateCoupon = async (code) => {
    if (!code || code.trim().length === 0) {
      setValidationResult(null);
      return;
    }

    try {
      setValidating(true);
      const response = await redemptionAPI.validate(code);
      setValidationResult(response.data);
      
      if (response.data.valid) {
        toast.success('✅ Coupon is valid!', { icon: '🎉' });
      } else {
        toast.error(response.data.message, { icon: '❌' });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Validation failed';
      toast.error(message);
      setValidationResult({ valid: false, message });
    } finally {
      setValidating(false);
    }
  };

  const handleRedeemCoupon = async (e) => {
    e.preventDefault();

    if (!redeemForm.coupon_code) {
      toast.error('Please enter a coupon code');
      return;
    }

    try {
      setRedeeming(true);
      const response = await redemptionAPI.redeem({
        coupon_code: redeemForm.coupon_code,
        user_id: user?.id || null,
        device_fingerprint: redeemForm.device_fingerprint
      });
      
            // Success with fancy notification
      const { data } = response.data;
      const discountText = data.discount_type === 'percentage' 
        ? `${data.discount_value}% OFF` 
        : `$${data.discount_value} OFF`;
      
      toast.success(`🎉 Coupon Redeemed! ${discountText}`, { duration: 5000 });

      setShowRedeemModal(false);
      setRedeemForm(prev => ({ 
        ...prev,
        coupon_code: ''
      }));
      setValidationResult(null);
      fetchData();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Redemption failed';
      const reason = error.response?.data?.reason;
      
      let icon = '❌';
      if (reason === 'expired') icon = '⏰';
      if (reason === 'duplicate') icon = '🔒';
      if (reason === 'invalid') icon = '🚫';
      
      toast.error(errorMsg, { icon, duration: 4000 });
    } finally {
      setRedeeming(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      success: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircleIcon, label: 'Success' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircleIcon, label: 'Failed' },
      duplicate: { bg: 'bg-orange-100', text: 'text-orange-800', icon: ExclamationTriangleIcon, label: 'Duplicate' },
      expired: { bg: 'bg-gray-100', text: 'text-gray-800', icon: ClockIcon, label: 'Expired' },
      invalid: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircleIcon, label: 'Invalid' }
    };
    
    const badge = badges[status] || badges.failed;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="h-4 w-4 mr-1" />
        {badge.label}
      </span>
    );
  };

  const getFraudTypeBadge = (fraudType) => {
    const types = {
      duplicate_redemption: { label: 'Duplicate', color: 'bg-orange-500' },
      code_guessing: { label: 'Code Guessing', color: 'bg-red-500' },
      rate_limit: { label: 'Rate Limit', color: 'bg-yellow-500' },
      suspicious_pattern: { label: 'Suspicious', color: 'bg-cyan-600' },
      expired_code: { label: 'Expired Code', color: 'bg-gray-500' }
    };
    
    const type = types[fraudType] || { label: fraudType, color: 'bg-blue-500' };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white ${type.color}`}>
        {type.label}
      </span>
    );
  };

  const filteredRedemptions = redemptions.filter(redemption => {
    const searchLower = searchTerm.toLowerCase();
    return (
      redemption.coupon_code?.toLowerCase().includes(searchLower) ||
      redemption.campaign_name?.toLowerCase().includes(searchLower) ||
      redemption.user_email?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading redemption data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center">
                <TicketIcon className="h-10 w-10 mr-3 text-primary-600" />
                Coupon Redemption
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {isAdmin || isMerchant 
                  ? 'Track and manage coupon redemptions with fraud detection' 
                  : 'Redeem your coupons and enjoy discounts'}
              </p>
            </div>
            <button
              onClick={() => setShowRedeemModal(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-lg text-base font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 transform hover:scale-105 transition-all duration-200"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              Redeem Coupon
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Redemptions</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {redemptions.length}
                </p>
              </div>
              <CheckCircleIcon className="h-12 w-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Successful</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {redemptions.filter(r => r.redemption_status === 'success').length}
                </p>
              </div>
              <BoltIcon className="h-12 w-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed Attempts</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {redemptions.filter(r => r.redemption_status !== 'success').length}
                </p>
              </div>
              <XCircleIcon className="h-12 w-12 text-red-500" />
            </div>
          </div>

          {isAdmin && (
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Fraud Attempts</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {fraudStats?.totalBlocked || 0}
                  </p>
                </div>
                <ShieldExclamationIcon className="h-12 w-12 text-orange-500" />
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by code, campaign, or email..."
                  className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Period
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Redemption History Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">Redemption History</h2>
          </div>
          
          <div className="overflow-x-auto">
            {filteredRedemptions.length === 0 ? (
              <div className="text-center py-12">
                <TicketIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No redemptions found</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or redeem your first coupon</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coupon Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date/Time
                    </th>
                    {(isAdmin || isMerchant) && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRedemptions.map((redemption) => (
                    <tr key={redemption.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <TicketIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="font-mono text-sm font-medium text-gray-900">
                            {redemption.coupon_code}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {redemption.campaign_name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(redemption.redemption_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {redemption.discount_applied ? (
                          <span className="text-sm font-semibold text-green-600">
                            ${parseFloat(redemption.discount_applied).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(redemption.redeemed_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(redemption.redeemed_at).toLocaleTimeString()}
                        </div>
                      </td>
                      {(isAdmin || isMerchant) && (
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {redemption.user_email || 'Anonymous'}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Fraud Attempts Table (Admin Only) */}
        {isAdmin && fraudAttempts.length > 0 && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <ShieldExclamationIcon className="h-6 w-6 mr-2 text-red-600" />
                Fraud Detection Alerts
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detected At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fraudAttempts.map((attempt) => (
                    <tr key={attempt.id} className="hover:bg-red-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getFraudTypeBadge(attempt.fraud_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className={`h-2 rounded-full ${
                                attempt.risk_score >= 70 ? 'bg-red-600' :
                                attempt.risk_score >= 40 ? 'bg-orange-500' :
                                'bg-yellow-500'
                              }`}
                              style={{ width: `${attempt.risk_score}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{attempt.risk_score}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs text-gray-600">
                          {attempt.ip_address}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {attempt.user_email || 'Anonymous'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(attempt.detected_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(attempt.detected_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {attempt.blocked ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircleIcon className="h-3 w-3 mr-1" />
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                            Flagged
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Redeem Coupon Modal */}
      {showRedeemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <SparklesIcon className="h-6 w-6 mr-2" />
                  Redeem Your Coupon
                </h3>
                <button
                  onClick={() => {
                    setShowRedeemModal(false);
                    setValidationResult(null);
                    setRedeemForm(prev => ({ ...prev, coupon_code: '' }));
                  }}
                  className="text-white hover:text-gray-200 transition"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleRedeemCoupon} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coupon Code
                </label>
                <div className="relative">
                  <TicketIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={redeemForm.coupon_code}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setRedeemForm(prev => ({ ...prev, coupon_code: value }));
                      if (value.length >= 6) {
                        handleValidateCoupon(value);
                      } else {
                        setValidationResult(null);
                      }
                    }}
                    placeholder="Enter coupon code"
                    className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono uppercase"
                    required
                  />
                </div>
                
                {/* Validation Feedback */}
                {validating && (
                  <div className="mt-3 text-sm text-gray-600 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                    Validating...
                  </div>
                )}
                
                {validationResult && (
                  <div className={`mt-3 p-3 rounded-lg ${
                    validationResult.valid 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-start">
                      {validationResult.valid ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          validationResult.valid ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {validationResult.message}
                        </p>
                        {validationResult.valid && validationResult.data && (
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-green-700">
                              <span className="font-semibold">Campaign:</span> {validationResult.data.campaign_name}
                            </p>
                            <p className="text-sm text-green-700">
                              <span className="font-semibold">Discount:</span>{' '}
                              {validationResult.data.discount_type === 'percentage'
                                ? `${validationResult.data.discount_value}% OFF`
                                : `$${validationResult.data.discount_value} OFF`
                              }
                            </p>
                            <p className="text-xs text-green-600">
                              Expires: {new Date(validationResult.data.expiry_date).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRedeemModal(false);
                    setValidationResult(null);
                    setRedeemForm(prev => ({ ...prev, coupon_code: '' }));
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!validationResult?.valid || redeeming}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium text-white transition ${
                    validationResult?.valid && !redeeming
                      ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transform hover:scale-105'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {redeeming ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Redeeming...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Redeem Now
                    </span>
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

export default Redemptions;
