import React, { useState, useEffect, useCallback } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  Download, 
  Search, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  RotateCcw, 
  RotateCw, 
  Eye, 
  Filter, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Copy, 
  Check, 
  X, 
  ArrowUpDown, 
  BookOpen, 
  User, 
  AlertCircle,
  FileSpreadsheet,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiService from '../services/apiService';

const PaymentDetails = () => {
  // Main Data States
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Statistics State
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    completedTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    refundedTransactions: 0,
    avgTransactionValue: 0
  });

  // Filter & Search States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal States
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Manual payment form states
  const [manualForm, setManualForm] = useState({
    userId: '',
    courseId: '',
    amount: '',
    paymentMethod: 'bank_transfer',
    receiptNumber: '',
    notes: '',
    markCompleted: true,
  });
  const [coursesList, setCoursesList] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // Fetch Payment Statistics
  const fetchStats = async () => {
    try {
      const res = await apiService.get('/payments/stats');
      if (res.data?.success && res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.warn('Could not load payment stats:', err.message);
    }
  };

  // Fetch Payments from MongoDB with full query parameters
  const fetchPayments = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        sortBy,
        sortOrder,
      };

      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (methodFilter !== 'all') params.paymentMethod = methodFilter;
      if (typeFilter !== 'all') params.paymentType = typeFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await apiService.get('/payments/all', { params });

      if (response.data?.success) {
        setPayments(response.data.payments || []);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages || 1);
          setTotalRecords(response.data.pagination.total || 0);
        }
      } else {
        setError('Failed to load payments from database');
      }
    } catch (err) {
      console.error('Error fetching payments from MongoDB:', err);
      setError(err.response?.data?.message || 'Error connecting to database');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, pageSize, search, statusFilter, methodFilter, typeFilter, startDate, endDate, sortBy, sortOrder]);

  // Initial load
  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [fetchPayments]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPayments(true), fetchStats()]);
    toast.success('Payment data refreshed');
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setMethodFilter('all');
    setTypeFilter('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Copy helper
  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!payments.length) {
      toast.error('No payment records to export');
      return;
    }

    const headers = [
      'Transaction ID',
      'Receipt Number',
      'Student Name',
      'Student Email',
      'Item/Course',
      'Type',
      'Amount (LKR)',
      'Payment Method',
      'Payment Gateway',
      'Status',
      'Payment Date',
    ];

    const rows = payments.map((p) => [
      `"${p.gatewayTransactionId || p._id || ''}"`,
      `"${p.receiptNumber || ''}"`,
      `"${p.user?.name || 'N/A'}"`,
      `"${p.user?.email || 'N/A'}"`,
      `"${p.course?.title || p.plan || p.metadata?.courseTitle || 'Course Purchase'}"`,
      `"${p.paymentType || 'course'}"`,
      `"${p.amount || 0}"`,
      `"${p.paymentMethod || 'credit_card'}"`,
      `"${p.paymentGateway || 'stripe'}"`,
      `"${p.status || 'pending'}"`,
      `"${p.paidDate || p.paymentDate || p.createdAt || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SRI-KO_Payments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully');
  };

  // Load auxiliary data for Manual Payment Modal
  const openManualModal = async () => {
    setIsManualModalOpen(true);
    try {
      const [coursesRes, usersRes] = await Promise.all([
        apiService.get('/courses'),
        apiService.get('/users?role=student'),
      ]);
      if (coursesRes.data?.courses) {
        setCoursesList(coursesRes.data.courses);
      } else if (Array.isArray(coursesRes.data)) {
        setCoursesList(coursesRes.data);
      }
      if (usersRes.data?.data) {
        setUsersList(usersRes.data.data);
      }
    } catch (err) {
      console.warn('Could not preload courses/users for manual modal:', err.message);
    }
  };

  // Submit Manual Payment
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.userId || !manualForm.courseId || !manualForm.amount) {
      toast.error('Please fill in student, course, and amount');
      return;
    }

    setActionLoading(true);
    try {
      const res = await apiService.post('/payments/admin/manual', manualForm);
      if (res.data?.success) {
        toast.success('Payment recorded and student enrolled successfully!');
        setIsManualModalOpen(false);
        setManualForm({
          userId: '',
          courseId: '',
          amount: '',
          paymentMethod: 'bank_transfer',
          receiptNumber: '',
          notes: '',
          markCompleted: true,
        });
        fetchPayments();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record manual payment');
    } finally {
      setActionLoading(false);
    }
  };

  // Update Status of a payment
  const handleStatusUpdate = async (paymentId, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this transaction as ${newStatus}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await apiService.put(`/payments/admin/${paymentId}/status`, {
        status: newStatus,
      });
      if (res.data?.success) {
        toast.success(`Payment status updated to ${newStatus}`);
        if (selectedPayment && selectedPayment._id === paymentId) {
          setSelectedPayment({ ...selectedPayment, status: newStatus });
        }
        fetchPayments(true);
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update payment status');
    } finally {
      setActionLoading(false);
    }
  };

  // Format Helpers
  const formatCurrency = (amt, curr = 'LKR') => {
    const val = Number(amt) || 0;
    return `${curr} ${val.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full text-xs font-semibold">
            <CheckCircle2 size={13} className="text-emerald-600" />
            Completed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-full text-xs font-semibold">
            <Clock size={13} className="text-amber-600 animate-pulse" />
            Pending
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 border border-rose-200/60 px-2.5 py-1 rounded-full text-xs font-semibold">
            <XCircle size={13} className="text-rose-600" />
            Failed
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1.5 text-purple-700 bg-purple-50 border border-purple-200/60 px-2.5 py-1 rounded-full text-xs font-semibold">
            <RotateCcw size={13} className="text-purple-600" />
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full text-xs font-semibold">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  const getMethodBadge = (method, gateway) => {
    const isStripe = gateway === 'stripe' || method === 'credit_card';
    return (
      <div className="flex flex-col">
        <span className="text-xs font-medium text-gray-800 capitalize">
          {method?.replace('_', ' ') || 'Credit Card'}
        </span>
        <span className="text-[10px] text-gray-400 capitalize">
          {isStripe ? 'Stripe Gateway' : gateway || 'Manual Deposit'}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Payment Management
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-100">
              MongoDB Live
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time tracking of student course transactions, revenue, and bank slip verifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh database records"
          >
            <RotateCw size={15} className={refreshing ? 'animate-spin text-blue-600' : ''} />
            <span>Refresh</span>
          </button>

          {/* Record Manual Payment */}
          <button
            onClick={openManualModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={16} className="text-emerald-600" />
            <span>Record Slip / Manual</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 shrink-0">
            <DollarSign size={24} />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-gray-500 block truncate">Total Settled Revenue</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {formatCurrency(stats.totalRevenue)}
              </span>
            </div>
            <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">
              {stats.completedTransactions} successful payments
            </span>
          </div>
        </div>

        {/* Completed Payments */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 block">Completed</span>
            <span className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 block">
              {stats.completedTransactions}
            </span>
            <span className="text-[11px] text-gray-400 font-medium block mt-0.5">
              Fully verified & enrolled
            </span>
          </div>
        </div>

        {/* Pending Verification */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 block">Pending / Processing</span>
            <span className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 block">
              {stats.pendingTransactions}
            </span>
            <span className="text-[11px] text-amber-600 font-medium block mt-0.5">
              Awaiting confirmation
            </span>
          </div>
        </div>

        {/* Total Records / Avg */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600 shrink-0">
            <CreditCard size={24} />
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 block">Avg Transaction</span>
            <span className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 block truncate">
              {formatCurrency(Math.round(stats.avgTransactionValue))}
            </span>
            <span className="text-[11px] text-gray-400 font-medium block mt-0.5">
              {stats.totalTransactions} total database records
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by student name, email, txn ID, receipt #, or course..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            {/* Payment Method */}
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Methods</option>
              <option value="credit_card">Credit Card</option>
              <option value="bank_transfer">Bank Transfer / Slip</option>
              <option value="digital_wallet">Digital Wallet</option>
              <option value="cash">Cash / Direct</option>
            </select>

            {/* Payment Type */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Types</option>
              <option value="course">Course Purchase</option>
              <option value="subscription">Subscription</option>
            </select>

            {/* Reset Filters */}
            {(search || statusFilter !== 'all' || methodFilter !== 'all' || typeFilter !== 'all' || startDate || endDate) && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Date Filter Row */}
        <div className="flex items-center gap-3 pt-2 border-t border-gray-50 flex-wrap text-xs text-gray-500">
          <span className="font-medium flex items-center gap-1 text-gray-600">
            <Calendar size={13} /> Date Range:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700"
            />
          </div>

          <div className="ml-auto text-xs text-gray-400">
            Showing <span className="font-semibold text-gray-700">{payments.length}</span> of{' '}
            <span className="font-semibold text-gray-700">{totalRecords}</span> entries
          </div>
        </div>
      </div>

      {/* Main Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm sm:text-base text-gray-900">
              Database Transactions
            </h3>
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-medium">
              {totalRecords} records
            </span>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Sort by:</span>
            <button
              onClick={() => {
                setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
              }}
              className="inline-flex items-center gap-1 font-semibold text-gray-700 hover:text-blue-600 cursor-pointer"
            >
              <ArrowUpDown size={13} />
              {sortBy === 'createdAt' ? 'Date' : 'Amount'} ({sortOrder.toUpperCase()})
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between gap-4 py-3 border-b border-gray-50">
                <div className="w-28 h-4 bg-gray-200 rounded"></div>
                <div className="w-40 h-4 bg-gray-200 rounded"></div>
                <div className="w-48 h-4 bg-gray-200 rounded"></div>
                <div className="w-20 h-4 bg-gray-200 rounded"></div>
                <div className="w-24 h-6 bg-gray-200 rounded-full"></div>
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertCircle size={40} className="text-rose-500 mx-auto mb-3" />
            <h4 className="text-base font-bold text-gray-900 mb-1">Could not fetch payment data</h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto mb-4">{error}</p>
            <button
              onClick={() => fetchPayments()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-xs"
            >
              Try Again
            </button>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center">
            <FileSpreadsheet size={44} className="text-gray-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-gray-800 mb-1">No payment transactions found</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
              {search || statusFilter !== 'all'
                ? 'No transactions match your current filters. Try resetting the search or filter options.'
                : 'No payments have been recorded in MongoDB yet. Once students checkout or you record a manual payment, they will appear here.'}
            </p>
            {search || statusFilter !== 'all' ? (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Reset All Filters
              </button>
            ) : (
              <button
                onClick={openManualModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Record First Payment
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-gray-600">
              <thead className="bg-gray-50/80 text-[11px] uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5">Txn ID / Receipt</th>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5">Purchased Item</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Payment Method</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((tx) => {
                  const displayId = tx.receiptNumber || tx.gatewayTransactionId || tx._id;
                  const studentName = tx.user?.name || 'Unknown Student';
                  const studentEmail = tx.user?.email || 'No email';
                  const itemTitle = tx.course?.title || tx.metadata?.courseTitle || tx.plan || 'Course Purchase';

                  return (
                    <tr key={tx._id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Txn / Receipt */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-medium text-gray-800">
                          <span className="truncate max-w-[130px] sm:max-w-[170px]" title={displayId}>
                            {displayId}
                          </span>
                          <button
                            onClick={() => handleCopy(displayId, tx._id)}
                            className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-700 cursor-pointer"
                            title="Copy ID"
                          >
                            {copiedId === tx._id ? (
                              <Check size={12} className="text-emerald-600" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                        {tx.receiptNumber && tx.gatewayTransactionId && tx.receiptNumber !== tx.gatewayTransactionId && (
                          <div className="text-[10px] text-gray-400 font-mono truncate max-w-[150px]">
                            GW: {tx.gatewayTransactionId}
                          </div>
                        )}
                      </td>

                      {/* Student */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {studentName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-gray-900 block truncate max-w-[140px]">
                              {studentName}
                            </span>
                            <span className="text-[11px] text-gray-400 block truncate max-w-[140px]">
                              {studentEmail}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Course / Plan */}
                      <td className="px-5 py-4">
                        <div className="max-w-[200px]">
                          <span className="font-medium text-gray-800 block truncate" title={itemTitle}>
                            {itemTitle}
                          </span>
                          <span className="text-[10px] uppercase tracking-wide font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                            {tx.paymentType || 'course'}
                          </span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4 font-bold text-gray-900 whitespace-nowrap">
                        {formatCurrency(tx.amount, tx.currency || 'LKR')}
                      </td>

                      {/* Method */}
                      <td className="px-5 py-4">
                        {getMethodBadge(tx.paymentMethod, tx.paymentGateway)}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {getStatusBadge(tx.status)}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(tx.paidDate || tx.paymentDate || tx.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedPayment(tx);
                              setIsDetailsOpen(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="View Transaction Details"
                          >
                            <Eye size={16} />
                          </button>

                          {tx.status === 'pending' && (
                            <button
                              onClick={() => handleStatusUpdate(tx._id, 'completed')}
                              disabled={actionLoading}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                              title="Approve & Complete payment"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalRecords > 0 && (
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-md font-semibold text-gray-700 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>per page</span>
            </div>

            <div className="flex items-center gap-1.5 self-center sm:self-auto">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage <= 1 || loading}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="px-3 font-semibold text-gray-700">
                Page {currentPage} of {totalPages || 1}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage >= totalPages || loading}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Payment Details Modal */}
      {isDetailsOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">Payment Breakdown</h3>
                  <p className="text-xs font-mono text-gray-400">ID: {selectedPayment._id}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Status and Financial Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-50/60 to-indigo-50/40 border border-blue-100/60">
                <div>
                  <span className="text-xs text-gray-500 font-medium">Total Charge</span>
                  <div className="text-2xl font-black text-gray-900">
                    {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">Status:</span>
                  {getStatusBadge(selectedPayment.status)}
                </div>
              </div>

              {/* Grid 2-col Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Student Info */}
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/30 space-y-2">
                  <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5 uppercase tracking-wider text-[10px] text-gray-400">
                    <User size={13} /> Student Information
                  </h4>
                  <div>
                    <span className="text-gray-500 block">Name:</span>
                    <span className="font-semibold text-gray-900">{selectedPayment.user?.name || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Email:</span>
                    <span className="font-semibold text-gray-900">{selectedPayment.user?.email || 'N/A'}</span>
                  </div>
                  {selectedPayment.user?.phone && (
                    <div>
                      <span className="text-gray-500 block">Phone:</span>
                      <span className="font-semibold text-gray-900">{selectedPayment.user.phone}</span>
                    </div>
                  )}
                </div>

                {/* Course Info */}
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/30 space-y-2">
                  <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5 uppercase tracking-wider text-[10px] text-gray-400">
                    <BookOpen size={13} /> Program Information
                  </h4>
                  <div>
                    <span className="text-gray-500 block">Title:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedPayment.course?.title || selectedPayment.metadata?.courseTitle || selectedPayment.plan || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Category:</span>
                    <span className="font-semibold text-gray-900">{selectedPayment.course?.category || 'Korean Language'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Payment Type:</span>
                    <span className="font-semibold text-gray-900 uppercase">{selectedPayment.paymentType || 'course'}</span>
                  </div>
                </div>

                {/* Transaction & Gateway Info */}
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/30 space-y-2">
                  <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5 uppercase tracking-wider text-[10px] text-gray-400">
                    <CreditCard size={13} /> Gateway & Processing
                  </h4>
                  <div>
                    <span className="text-gray-500 block">Gateway:</span>
                    <span className="font-semibold text-gray-900 capitalize">{selectedPayment.paymentGateway || 'Stripe'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Payment Method:</span>
                    <span className="font-semibold text-gray-900 capitalize">
                      {selectedPayment.paymentMethod?.replace('_', ' ') || 'Credit Card'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Transaction ID:</span>
                    <span className="font-mono text-gray-800 break-all">
                      {selectedPayment.gatewayTransactionId || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Receipt Number:</span>
                    <span className="font-mono text-gray-800 break-all font-semibold">
                      {selectedPayment.receiptNumber || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Timeline */}
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/30 space-y-2">
                  <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5 uppercase tracking-wider text-[10px] text-gray-400">
                    <Calendar size={13} /> Timeline
                  </h4>
                  <div>
                    <span className="text-gray-500 block">Initiated Date:</span>
                    <span className="font-semibold text-gray-900">{formatDate(selectedPayment.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Paid Date:</span>
                    <span className="font-semibold text-gray-900">{formatDate(selectedPayment.paidDate || selectedPayment.paymentDate)}</span>
                  </div>
                  {selectedPayment.refundDate && (
                    <div>
                      <span className="text-rose-500 block">Refund Date:</span>
                      <span className="font-semibold text-rose-700">{formatDate(selectedPayment.refundDate)}</span>
                    </div>
                  )}
                  {selectedPayment.notes && (
                    <div>
                      <span className="text-gray-500 block">Admin Notes:</span>
                      <span className="text-gray-700 italic">{selectedPayment.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Change Controls for Admin */}
              <div className="p-4 rounded-xl border border-amber-200/60 bg-amber-50/30 space-y-3">
                <h4 className="font-bold text-amber-900 text-xs">Admin Status Overrides</h4>
                <p className="text-[11px] text-gray-500">
                  Changing status to <strong>Completed</strong> will automatically enroll the student into the course and notify them.
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedPayment.status !== 'completed' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedPayment._id, 'completed')}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      Mark as Completed
                    </button>
                  )}
                  {selectedPayment.status !== 'refunded' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedPayment._id, 'refunded')}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      Process Refund
                    </button>
                  )}
                  {selectedPayment.status !== 'failed' && selectedPayment.status !== 'completed' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedPayment._id, 'failed')}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      Mark as Failed
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-2 bg-gray-50/50">
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Manual / Bank Transfer Payment */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">Record Offline Payment</h3>
                  <p className="text-xs text-gray-400">Log bank deposit slips or manual cash payments into MongoDB.</p>
                </div>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleManualSubmit} className="p-6 space-y-4 overflow-y-auto">
              {/* Student Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Student *</label>
                <select
                  value={manualForm.userId}
                  onChange={(e) => setManualForm({ ...manualForm, userId: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Choose Student --</option>
                  {usersList.map((u) => (
                    <option key={u._id || u.id} value={u._id || u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Course Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Course Program *</label>
                <select
                  value={manualForm.courseId}
                  onChange={(e) => {
                    const selectedCourse = coursesList.find((c) => c._id === e.target.value);
                    setManualForm({
                      ...manualForm,
                      courseId: e.target.value,
                      amount: selectedCourse ? selectedCourse.price : manualForm.amount,
                    });
                  }}
                  required
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Choose Course --</option>
                  {coursesList.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title} (LKR {Number(c.price || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount and Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Amount (LKR) *</label>
                  <input
                    type="number"
                    value={manualForm.amount}
                    onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                    required
                    min="0"
                    placeholder="e.g. 13500"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={manualForm.paymentMethod}
                    onChange={(e) => setManualForm({ ...manualForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="bank_transfer">Bank Transfer / Slip</option>
                    <option value="cash">Direct Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="digital_wallet">Digital Wallet</option>
                  </select>
                </div>
              </div>

              {/* Slip / Reference Number */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Bank Slip Ref / Receipt Number (Optional)
                </label>
                <input
                  type="text"
                  value={manualForm.receiptNumber}
                  onChange={(e) => setManualForm({ ...manualForm, receiptNumber: e.target.value })}
                  placeholder="e.g. SLIP-BOC-99214 or leave blank for auto-generate"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Admin Notes</label>
                <textarea
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  placeholder="e.g. Verified via bank account statement deposit slip."
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Enroll Immediately Checkbox */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <input
                  type="checkbox"
                  id="markCompleted"
                  checked={manualForm.markCompleted}
                  onChange={(e) => setManualForm({ ...manualForm, markCompleted: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
                <label htmlFor="markCompleted" className="text-xs font-medium text-emerald-900 cursor-pointer">
                  Mark as Completed & immediately enroll student in course
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save & Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDetails;
