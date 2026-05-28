import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { reportAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  ChartBarIcon,
  TicketIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  PlusIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user, isAdmin, isMerchant } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch different data based on user role
      if (isAdmin || isMerchant) {
        const response = await reportAPI.getDashboard();
        setAnalytics(response.data);
      } else {
        // Customer - fetch customer-specific stats
        const response = await reportAPI.getCustomerStats();
        setAnalytics(response.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isMerchant]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
      </div>
    );
  }

  const stats = analytics?.stats || {};
  
  // Customer-specific stats - comes directly in response for customers
  const customerStats = (isAdmin || isMerchant) ? {} : analytics || {};

  const statCards = (isAdmin || isMerchant) ? [
    {
      title: 'Total Campaigns',
      value: stats.total_campaigns || 0,
      icon: ChartBarIcon,
      color: 'bg-blue-500',
      trend: `${stats.active_campaigns || 0} active`
    },
    {
      title: 'Active Campaigns',
      value: stats.active_campaigns || 0,
      icon: ArrowTrendingUpIcon,
      color: 'bg-green-500',
      trend: `${stats.paused_campaigns || 0} paused`
    },
    {
      title: 'Total Coupons',
      value: stats.total_coupons || 0,
      icon: TicketIcon,
      color: 'bg-teal-500',
      trend: `${stats.distributed_coupons || 0} distributed`
    },
    {
      title: 'Redeemed Coupons',
      value: stats.redeemed_coupons || 0,
      icon: CheckCircleIcon,
      color: 'bg-orange-500',
      trend: `${stats.expired_coupons || 0} expired`
    },
  ] : [
    {
      title: 'My Coupons',
      value: customerStats.total_coupons || 0,
      icon: TicketIcon,
      color: 'bg-teal-500',
      subtitle: `${customerStats.available_coupons || 0} available`
    },
    {
      title: 'Redeemed',
      value: customerStats.redeemed_coupons || 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      subtitle: 'Successfully used'
    },
    {
      title: 'Total Savings',
      value: `$${(customerStats.total_savings || 0).toFixed(2)}`,
      icon: ArrowTrendingUpIcon,
      color: 'bg-orange-500',
      subtitle: 'Money saved'
    },
    {
      title: 'Active Offers',
      value: customerStats.active_offers || 0,
      icon: ChartBarIcon,
      color: 'bg-blue-500',
      subtitle: 'Available to redeem'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-3xl font-bold leading-7 text-gray-900 sm:text-4xl sm:truncate">
                Welcome back, {user?.name}! 👋
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {(isAdmin || isMerchant) 
                  ? "Here's what's happening with your campaigns today"
                  : "Here are your available coupons and savings"}
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
              {(isAdmin || isMerchant) ? (
                <button 
                  onClick={() => navigate('/campaigns')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create New Campaign
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => navigate('/browse-campaigns')}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-teal-650 hover:from-primary-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Browse Campaigns
                  </button>
                  <button 
                    onClick={() => navigate('/redemptions')}
                    className="inline-flex items-center px-4 py-2 border border-primary-600 text-primary-600 rounded-md shadow-sm text-sm font-medium hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <TicketIcon className="h-5 w-5 mr-2" />
                    Redeem Coupon
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="card bg-white overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${stat.color} rounded-lg p-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.title}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value.toLocaleString()}
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        {stat.trend}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Redemptions */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Recent Redemptions
            </h3>
            <div className="space-y-3">
              {analytics?.recentRedemptions?.slice(0, 5).map((redemption, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {redemption.campaign_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Code: {redemption.code} • {new Date(redemption.redeemed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`badge ${redemption.redemption_status === 'success' ? 'badge-success' : 'badge-danger'}`}>
                    {redemption.redemption_status}
                  </span>
                </div>
              )) || <p className="text-gray-500 text-center py-4">No recent redemptions</p>}
            </div>
          </div>

          {/* Top Campaigns */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Top Performing Campaigns
            </h3>
            <div className="space-y-3">
              {analytics?.topCampaigns?.map((campaign, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">
                      {campaign.name}
                    </p>
                    <span className="text-sm font-bold text-primary-600">
                      {campaign.redemption_rate}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${campaign.redemption_rate}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {campaign.redeemed} / {campaign.total_coupons} coupons redeemed
                  </p>
                </div>
              )) || <p className="text-gray-500 text-center py-4">No campaign data available</p>}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button className="card text-center hover:scale-105 transition-transform cursor-pointer">
            <ChartBarIcon className="h-12 w-12 mx-auto text-primary-600 mb-2" />
            <h4 className="font-medium text-gray-900">View Reports</h4>
          </button>
          <button className="card text-center hover:scale-105 transition-transform cursor-pointer">
            <TicketIcon className="h-12 w-12 mx-auto text-teal-600 mb-2" />
            <h4 className="font-medium text-gray-900">Generate Coupons</h4>
          </button>
          <button className="card text-center hover:scale-105 transition-transform cursor-pointer">
            <UsersIcon className="h-12 w-12 mx-auto text-green-600 mb-2" />
            <h4 className="font-medium text-gray-900">Manage Users</h4>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
