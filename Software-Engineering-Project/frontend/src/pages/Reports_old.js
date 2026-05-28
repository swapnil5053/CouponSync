import React, { useState, useEffect } from 'react';
import { reportAPI, campaignAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ChartBarIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  TrophyIcon,
  CurrencyDollarIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

const Reports = () => {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [merchantReports, setMerchantReports] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [campaignMetrics, setCampaignMetrics] = useState(null);
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const promises = [
        reportAPI.getMerchantReports(),
        campaignAPI.getAll()
      ];
      
      if (isAdmin) {
        promises.push(reportAPI.getSystemStats());
      }

      const results = await Promise.all(promises);
      setMerchantReports(results[0].data);
      setCampaigns(results[1].data.campaigns || []);
      
      if (isAdmin && results[2]) {
        setSystemStats(results[2].data);
      }
    } catch (error) {
      console.error('Fetch reports error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignSelect = async (campaignId) => {
    if (!campaignId) {
      setCampaignMetrics(null);
      return;
    }

    try {
      setSelectedCampaign(campaignId);
      const response = await reportAPI.getCampaignMetrics(campaignId);
      setCampaignMetrics(response.data);
    } catch (error) {
      console.error('Fetch campaign metrics error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch campaign metrics');
    }
  };

  const handleExportCSV = async () => {
    try {
      const params = {
        ...dateRange,
        campaign_id: selectedCampaign || undefined
      };
      
      const response = await reportAPI.exportCSV(params);
      
      // Create a blob and download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Report exported successfully!');
    } catch (error) {
      toast.error('Failed to export report');
      console.error(error);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

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
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="mt-2 text-sm text-gray-600">
                Track performance metrics and export detailed reports
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* System Stats (Admin Only) */}
        {isAdmin && systemStats && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Merchants"
                value={systemStats.total_merchants || 0}
                icon={UsersIcon}
                color="bg-blue-500"
              />
              <StatCard
                title="Total Campaigns"
                value={systemStats.total_campaigns || 0}
                icon={ChartBarIcon}
                color="bg-green-500"
              />
              <StatCard
                title="Total Coupons"
                value={systemStats.total_coupons || 0}
                icon={TrophyIcon}
                color="bg-purple-500"
              />
              <StatCard
                title="Total Revenue Impact"
                value={`$${parseFloat(systemStats.total_revenue_impact || 0).toLocaleString()}`}
                icon={CurrencyDollarIcon}
                color="bg-orange-500"
              />
            </div>
          </div>
        )}

        {/* Merchant Reports */}
        {merchantReports && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Active Campaigns"
                value={merchantReports.active_campaigns || 0}
                icon={ChartBarIcon}
                color="bg-green-500"
                subtitle={`${merchantReports.total_campaigns || 0} total`}
              />
              <StatCard
                title="Total Coupons Generated"
                value={merchantReports.total_coupons_generated || 0}
                icon={TrophyIcon}
                color="bg-blue-500"
              />
              <StatCard
                title="Successful Redemptions"
                value={merchantReports.successful_redemptions || 0}
                icon={ChartBarIcon}
                color="bg-purple-500"
                subtitle={`${merchantReports.redemption_rate || 0}% rate`}
              />
              <StatCard
                title="Total Discount Given"
                value={`$${parseFloat(merchantReports.total_discount_given || 0).toLocaleString()}`}
                icon={CurrencyDollarIcon}
                color="bg-orange-500"
              />
            </div>
          </div>
        )}

        {/* Campaign Specific Metrics */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Campaign Analytics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Campaign
              </label>
              <select
                value={selectedCampaign}
                onChange={(e) => handleCampaignSelect(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Campaigns</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {campaignMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Coupons Generated</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">
                  {campaignMetrics.total_coupons || 0}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Redemptions</p>
                <p className="text-3xl font-bold text-green-900 mt-2">
                  {campaignMetrics.redemptions || 0}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Redemption Rate</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">
                  {campaignMetrics.redemption_rate || 0}%
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-600 font-medium">Total Discount</p>
                <p className="text-3xl font-bold text-orange-900 mt-2">
                  ${parseFloat(campaignMetrics.total_discount || 0).toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600 font-medium">Avg Discount</p>
                <p className="text-3xl font-bold text-red-900 mt-2">
                  ${parseFloat(campaignMetrics.avg_discount || 0).toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-lg">
                <p className="text-sm text-indigo-600 font-medium">ROI</p>
                <p className="text-3xl font-bold text-indigo-900 mt-2">
                  {campaignMetrics.roi || 0}%
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Top Performing Campaigns */}
        {merchantReports?.top_campaigns && merchantReports.top_campaigns.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Top Performing Campaigns</h2>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Redemptions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {merchantReports.top_campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">{campaign.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.redemptions || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ${parseFloat(campaign.total_discount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                        campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
