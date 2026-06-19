import { useState, useEffect } from 'react';
import { paymentService } from '../services/subscriptionService';
import toast from 'react-hot-toast';
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  UsersIcon,
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const AdminSubscriptionManagementPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    refunded: 0,
    totalAmount: 0,
    completedAmount: 0,
  });
  const [recentPayments, setRecentPayments] = useState([]);
  const [revenueByPlan, setRevenueByPlan] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    plan: '',
    startDate: '',
    endDate: '',
  });
  const [allPayments, setAllPayments] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
  });
  const [updatingPayments, setUpdatingPayments] = useState(new Set());

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch payment statistics
      const statsResponse = await paymentService.getPaymentStats();
      if (statsResponse.success) {
        setStats(statsResponse.stats);
        setRevenueByPlan(statsResponse.revenueByPlan || []);
        setMonthlyRevenue(statsResponse.monthlyRevenue || []);
      } else {
        console.warn('Failed to get payment stats:', statsResponse);
        toast.error('Failed to load payment statistics');
      }

      // Fetch recent payments
      const recentResponse = await paymentService.getRecentPayments(10);
      if (recentResponse.success) {
        setRecentPayments(recentResponse.payments || []);
      } else {
        console.warn('Failed to get recent payments:', recentResponse);
        toast.error('Failed to load recent payments');
      }

      // Fetch all payments
      await fetchAllPayments();
    } catch (error) {
      toast.error('Failed to load subscription data');
      console.error('Dashboard error:', error);
      
      // Set default values to prevent UI crashes
      setStats({
        total: 0,
        completed: 0,
        pending: 0,
        failed: 0,
        refunded: 0,
        totalAmount: 0,
        completedAmount: 0,
      });
      setRecentPayments([]);
      setRevenueByPlan([]);
      setMonthlyRevenue([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPayments = async (page = 1, filtersToUse = filters) => {
    try {
      console.log('📊 Fetching payments with filters:', filtersToUse);
      const response = await paymentService.getAllPayments(page, 20, filtersToUse);
      if (response.success) {
        setAllPayments(response.payments || []);
        setPagination(response.pagination || { current: 1, pages: 1, total: 0 });
      } else {
        console.warn('Failed to get all payments:', response);
        toast.error('Failed to load payments list');
        setAllPayments([]);
        setPagination({ current: 1, pages: 1, total: 0 });
      }
    } catch (error) {
      toast.error('Failed to load payments');
      console.error('Payments error:', error);
      setAllPayments([]);
      setPagination({ current: 1, pages: 1, total: 0 });
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const applyFilters = () => {
    console.log('🔍 Applying filters:', filters);
    fetchAllPayments(1, filters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      status: '',
      plan: '',
      startDate: '',
      endDate: '',
    };
    setFilters(emptyFilters);
    fetchAllPayments(1, emptyFilters);
  };

  const handleStatusChange = async (paymentId, newStatus) => {
    if (!paymentId || !newStatus) {
      toast.error('Invalid payment or status');
      return;
    }

    try {
      setUpdatingPayments(prev => new Set(prev).add(paymentId));
      
      // Update payment status via the service
      await paymentService.updatePaymentStatus(paymentId, newStatus);
      
      toast.success(`Payment status updated to ${newStatus}`);
      
      // Refresh the payments list
      await fetchAllPayments(pagination.current);
      
      // Also refresh the dashboard data to update stats
      await fetchDashboardData();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error(error.message || 'Failed to update payment status');
    } finally {
      setUpdatingPayments(prev => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircleIcon },
      refunded: { color: 'bg-gray-100 text-gray-800', icon: ExclamationTriangleIcon },
      processing: { color: 'bg-blue-100 text-blue-800', icon: ClockIcon },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircleIcon },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPlanBadge = (plan) => {
    const planConfig = {
      starter: 'bg-gray-100 text-gray-800',
      pro: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${planConfig[plan] || planConfig.starter}`}>
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Subscription Management
              </h1>
              <p className="mt-2 text-gray-600">
                Manage subscriptions, payments, and revenue analytics
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={fetchDashboardData}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ChartBarIcon className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.completedAmount)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CreditCardIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.completed}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pending}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue by Plan */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Revenue by Plan
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {revenueByPlan.map((plan, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getPlanBadge(plan._id)}
                      <span className="ml-3 text-sm text-gray-600">
                        {plan.count} payments
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(plan.totalAmount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Avg: {formatCurrency(plan.averageAmount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Payments
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentPayments.map((payment) => (
                  <div key={payment._id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {payment.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {payment.user?.name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {payment.user?.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </p>
                      {getStatusBadge(payment.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* All Payments Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                All Payments
              </h2>
              
              {/* Filters */}
              <div className="flex items-center space-x-4">
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 cursor-pointer"
                >
                  <option value="">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
                
                <select
                  value={filters.plan}
                  onChange={(e) => handleFilterChange('plan', e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 cursor-pointer"
                >
                  <option value="">All Plans</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="premium">Premium</option>
                </select>
                
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1"
                />
                
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1"
                />
                
                <button
                  onClick={applyFilters}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Apply
                </button>
                
                <button
                  onClick={clearFilters}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {payment.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {payment.user?.name || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payment.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPlanBadge(payment.plan)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.paymentDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.paymentMethod?.replace('_', ' ').toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <select
                        value={payment.status}
                        onChange={(e) => handleStatusChange(payment._id, e.target.value)}
                        disabled={updatingPayments.has(payment._id)}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        style={{ 
                          color: payment.status === 'completed' ? '#059669' : 
                                 payment.status === 'pending' ? '#D97706' :
                                 payment.status === 'failed' ? '#DC2626' : 
                                 '#6B7280'
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                      </select>
                      {updatingPayments.has(payment._id) && (
                        <span className="ml-2 text-xs text-gray-500">Updating...</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {pagination.current} of {pagination.pages} ({pagination.total} total)
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => fetchAllPayments(pagination.current - 1)}
                    disabled={pagination.current === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchAllPayments(pagination.current + 1)}
                    disabled={pagination.current === pagination.pages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSubscriptionManagementPage;
