import React, { useState } from 'react';
import { redemptionAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  TicketIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const RedeemCoupon = () => {
  const [couponCode, setCouponCode] = useState('');
  const [orderAmount, setOrderAmount] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redemptionResult, setRedemptionResult] = useState(null);

  const handleRedeem = async (e) => {
    e.preventDefault();

    // Validation
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    if (!orderAmount || parseFloat(orderAmount) <= 0) {
      toast.error('Please enter a valid order amount');
      return;
    }

    setRedeeming(true);
    setRedemptionResult(null);

    try {
      const response = await redemptionAPI.redeem({
        code: couponCode.trim().toUpperCase(),
        order_amount: parseFloat(orderAmount)
      });

      // Show success result
      setRedemptionResult({
        success: true,
        data: response.data
      });

      toast.success(
        `🎉 Coupon Redeemed Successfully! You saved $${response.data.discount_applied.toFixed(2)}`,
        { duration: 5000 }
      );

      // Clear form
      setCouponCode('');
      setOrderAmount('');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Redemption failed';
      
      setRedemptionResult({
        success: false,
        message: errorMessage
      });

      toast.error(`❌ ${errorMessage}`);
    } finally {
      setRedeeming(false);
    }
  };

  const handleReset = () => {
    setCouponCode('');
    setOrderAmount('');
    setRedemptionResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full p-4 shadow-lg">
              <TicketIcon className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-650 bg-clip-text text-transparent mb-2">
            Redeem Your Coupon
          </h1>
          <p className="text-slate-600 text-lg">
            Enter your coupon code and order amount to get your discount
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <form onSubmit={handleRedeem} className="space-y-6">
            {/* Coupon Code Input */}
            <div>
              <label className="flex items-center text-sm font-bold text-slate-700 mb-3">
                <TicketIcon className="h-5 w-5 mr-2 text-emerald-600" />
                Coupon Code
              </label>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter your coupon code (e.g., SAVE20)"
                className="w-full border border-slate-200 rounded-xl px-5 py-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xl font-mono font-bold bg-white shadow-sm transition uppercase focus:outline-none"
                disabled={redeeming}
                autoFocus
              />
              <p className="mt-2 text-sm text-slate-500">
                💡 You can find your coupon codes in the "My Coupons" page
              </p>
            </div>

            {/* Order Amount Input */}
            <div>
              <label className="flex items-center text-sm font-bold text-slate-700 mb-3">
                <CurrencyDollarIcon className="h-5 w-5 mr-2 text-emerald-600" />
                Order Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={orderAmount}
                onChange={(e) => setOrderAmount(e.target.value)}
                placeholder="Enter your order total"
                className="w-full border border-slate-200 rounded-xl px-5 py-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xl font-semibold bg-white shadow-sm transition focus:outline-none"
                disabled={redeeming}
              />
              <p className="mt-2 text-sm text-slate-500">
                💰 Enter the total amount of your order before discount
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 px-6 py-4 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
                disabled={redeeming}
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={redeeming}
                className={`flex-1 px-6 py-4 rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-700 hover:to-teal-750 transition-all duration-300 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center ${
                  redeeming ? 'opacity-50 cursor-not-allowed' : ''
                }`}
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
                    <SparklesIcon className="h-6 w-6 mr-2" />
                    Redeem Coupon
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Result Display */}
          {redemptionResult && (
            <div className={`mt-8 p-6 rounded-xl border ${
              redemptionResult.success 
                ? 'bg-green-50/50 border-green-200' 
                : 'bg-red-50/50 border-red-200'
            }`}>
              <div className="flex items-start">
                {redemptionResult.success ? (
                  <CheckCircleIcon className="h-8 w-8 text-green-600 mr-4 flex-shrink-0" />
                ) : (
                  <XCircleIcon className="h-8 w-8 text-red-600 mr-4 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className={`text-lg font-bold mb-2 ${
                    redemptionResult.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {redemptionResult.success ? '✅ Redemption Successful!' : '❌ Redemption Failed'}
                  </h3>
                  
                  {redemptionResult.success ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b border-green-200/50">
                        <span className="text-green-700">Original Amount:</span>
                        <span className="font-bold text-green-900">
                          ${redemptionResult.data.original_amount?.toFixed(2) || orderAmount}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-green-200/50">
                        <span className="text-green-700">Discount Applied:</span>
                        <span className="font-bold text-green-600">
                          -${redemptionResult.data.discount_applied?.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-green-700 font-bold">Final Amount:</span>
                        <span className="font-bold text-green-900 text-xl">
                          ${redemptionResult.data.final_amount?.toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-4 p-3 bg-white rounded-lg border border-green-200/50">
                        <p className="text-xs text-green-700">
                          🎉 You saved <span className="font-bold">${redemptionResult.data.discount_applied?.toFixed(2)}</span> with this coupon!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-red-700">{redemptionResult.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white rounded-xl p-5 shadow-md border border-slate-100">
            <div className="text-3xl mb-2">🎫</div>
            <h3 className="font-bold text-slate-900 mb-1">Get Coupons</h3>
            <p className="text-sm text-slate-650">Browse campaigns to claim your coupon codes</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-md border border-slate-100">
            <div className="text-3xl mb-2">💰</div>
            <h3 className="font-bold text-slate-900 mb-1">Enter Amount</h3>
            <p className="text-sm text-slate-650">Input your order total to calculate discount</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-md border border-slate-100">
            <div className="text-3xl mb-2">✨</div>
            <h3 className="font-bold text-slate-900 mb-1">Save Money</h3>
            <p className="text-sm text-slate-650">Redeem and enjoy instant savings</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedeemCoupon;
