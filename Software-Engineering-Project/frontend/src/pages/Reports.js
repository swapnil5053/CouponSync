import React, { useState, useEffect, useCallback } from 'react';
import { reportAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ChartBarIcon,
  ArrowDownTrayIcon,
  TrophyIcon,
  UsersIcon,
  TicketIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const Reports = () => {
  const { isAdmin, isMerchant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [merchantReports, setMerchantReports] = useState([]);
  const [systemStats, setSystemStats] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const dashboardRes = await reportAPI.getDashboard();
      setDashboardStats(dashboardRes.data.stats);
      
      // Fetch merchant reports
      const reportsRes = await reportAPI.getMerchantReports();
      setMerchantReports(reportsRes.data.reports || []);
      
      // Fetch system stats if admin
      if (isAdmin) {
        const statsRes = await reportAPI.getSystemStats();
        setSystemStats(statsRes.data.stats);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Fetch reports error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportCSV = () => {
    try {
      // Convert merchant reports to CSV
      if (merchantReports.length === 0) {
        toast.error('No data to export');
        return;
      }

      const headers = ['Campaign Name', 'Status', 'Discount Type', 'Discount Value', 'Total Coupons', 'Redeemed Coupons', 'Start Date', 'End Date'];
      const csvData = merchantReports.map(report => [
        report.name,
        report.status,
        report.discount_type,
        report.discount_value,
        report.total_coupons || 0,
        report.redeemed_coupons || 0,
        new Date(report.start_date).toLocaleDateString(),
        new Date(report.end_date).toLocaleDateString()
      ]);

      let csvContent = headers.join(',') + '\n';
      csvData.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
      });

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `campaign_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Report exported successfully!');
    } catch (error) {
      toast.error('Failed to export report');
      // eslint-disable-next-line no-console
      console.error(error);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className={`bg-gradient-to-br ${color} rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-90">{title}</p>
          <p className="text-4xl font-bold mt-2">{value}</p>
          {subtitle && <p className="text-sm mt-2 opacity-80">{subtitle}</p>}
        </div>
        <Icon className="h-16 w-16 opacity-30" />
      </div>
    </div>
  );

  // Simple pie chart component using CSS
  const PieChart = ({ data, title }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
        <div className="flex items-center justify-center">
          <div className="relative w-48 h-48">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              {data.map((item, index) => {
                const prevTotal = data.slice(0, index).reduce((sum, d) => sum + d.value, 0);
                const offset = (prevTotal / total) * 100;
                const percentage = (item.value / total) * 100;
                
                return (
                  <circle
                    key={index}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={item.color}
                    strokeWidth="20"
                    strokeDasharray={`${percentage * 2.51} ${251 - percentage * 2.51}`}
                    strokeDashoffset={-offset * 2.51}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{total}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2`} style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-700">{item.label}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {item.value} ({((item.value / total) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Bar chart component using CSS
  const BarChart = ({ data, title }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                <span className="text-sm font-bold text-gray-900">{item.value}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="h-4 rounded-full transition-all duration-500"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const campaignStatusData = dashboardStats ? [
    { label: 'Active', value: dashboardStats.active_campaigns || 0, color: '#10b981' },
    { label: 'Paused', value: dashboardStats.paused_campaigns || 0, color: '#f59e0b' },
    { label: 'Completed', value: dashboardStats.completed_campaigns || 0, color: '#6b7280' }
  ] : [];

  const couponStatusData = dashboardStats ? [
    { label: 'Distributed', value: dashboardStats.distributed_coupons || 0, color: '#3b82f6' },
    { label: 'Redeemed', value: dashboardStats.redeemed_coupons || 0, color: '#10b981' },
    { label: 'Expired', value: dashboardStats.expired_coupons || 0, color: '#ef4444' },
    { label: 'Available', value: (dashboardStats.total_coupons || 0) - (dashboardStats.distributed_coupons || 0) - (dashboardStats.redeemed_coupons || 0) - (dashboardStats.expired_coupons || 0), color: '#0d9488' }
  ] : [];

  const topCampaignsData = merchantReports
    .sort((a, b) => (b.redeemed_coupons || 0) - (a.redeemed_coupons || 0))
    .slice(0, 5)
    .map(campaign => ({
      label: campaign.name.substring(0, 20) + (campaign.name.length > 20 ? '...' : ''),
      value: campaign.redeemed_coupons || 0,
      color: '#0d9488'
    }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center">
                <ChartBarIcon className="h-10 w-10 mr-3 text-primary-600" />
                Reports & Analytics
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {isMerchant ? 'Track your campaign performance and insights' : 'System-wide analytics and reports'}
              </p>
            </div>
            {merchantReports.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-lg text-base font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transform hover:scale-105 transition-all duration-200"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Campaigns"
              value={dashboardStats.total_campaigns || 0}
              icon={ChartBarIcon}
              color="from-blue-500 to-blue-600"
              subtitle={`${dashboardStats.active_campaigns || 0} active`}
            />
            <StatCard
              title="Active Campaigns"
              value={dashboardStats.active_campaigns || 0}
              icon={TrophyIcon}
              color="from-green-500 to-green-600"
              subtitle={`${dashboardStats.paused_campaigns || 0} paused`}
            />
            <StatCard
              title="Total Coupons"
              value={dashboardStats.total_coupons || 0}
              icon={TicketIcon}
              color="from-teal-500 to-teal-600"
              subtitle={`${dashboardStats.distributed_coupons || 0} distributed`}
            />
            <StatCard
              title="Redeemed"
              value={dashboardStats.redeemed_coupons || 0}
              icon={CheckCircleIcon}
              color="from-orange-500 to-orange-600"
              subtitle={`${dashboardStats.expired_coupons || 0} expired`}
            />
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {campaignStatusData.length > 0 && (
            <PieChart data={campaignStatusData} title="Campaign Status Distribution" />
          )}
          {couponStatusData.length > 0 && (
            <PieChart data={couponStatusData} title="Coupon Status Distribution" />
          )}
        </div>

        {topCampaignsData.length > 0 && (
          <div className="mb-8">
            <BarChart data={topCampaignsData} title="Top Performing Campaigns (by Redemptions)" />
          </div>
        )}

        {/* Campaign Reports Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <ChartBarIcon className="h-6 w-6 mr-2 text-primary-600" />
              Campaign Performance Report
            </h2>
          </div>

          <div className="overflow-x-auto">
            {merchantReports.length === 0 ? (
              <div className="text-center py-12">
                <ChartBarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No campaign data available</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Coupons
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Redeemed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Redemption Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {merchantReports.map((report) => {
                    const redemptionRate = report.total_coupons > 0 
                      ? ((report.redeemed_coupons / report.total_coupons) * 100).toFixed(1)
                      : 0;
                    
                    return (
                      <tr key={report.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{report.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            report.status === 'active' ? 'bg-green-100 text-green-800' :
                            report.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {report.discount_type === 'percentage' 
                              ? `${report.discount_value}%` 
                              : `$${report.discount_value}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{report.total_coupons || 0}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">{report.redeemed_coupons || 0}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${redemptionRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{redemptionRate}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs text-gray-500">
                            {new Date(report.start_date).toLocaleDateString()} - <br />
                            {new Date(report.end_date).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* System Stats for Admin */}
        {isAdmin && systemStats && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <UsersIcon className="h-6 w-6 mr-2 text-primary-600" />
              System Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-600">{systemStats.total_users || 0}</p>
                <p className="text-sm text-gray-600 mt-1">Total Users</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{systemStats.total_campaigns || 0}</p>
                <p className="text-sm text-gray-600 mt-1">Total Campaigns</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-teal-600">{systemStats.total_coupons || 0}</p>
                <p className="text-sm text-gray-600 mt-1">Total Coupons</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{systemStats.total_redemptions || 0}</p>
                <p className="text-sm text-gray-600 mt-1">Total Redemptions</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
