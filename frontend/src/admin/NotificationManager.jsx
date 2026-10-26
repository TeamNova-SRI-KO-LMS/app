import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { 
  BellRing, 
  Clock, 
  SlidersHorizontal, 
  RotateCw, 
  Send, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  Sliders,
  Trash2,
  ExternalLink,
  Search,
  AlertTriangle,
  Info,
  BookOpen,
  CreditCard,
  MessageSquare,
  Sparkles,
  Radio
} from 'lucide-react';
import notificationService from '../services/notificationService';
import { useSocket } from '../context/SocketProvider';

export default function NotificationManager() {
  const { isConnected } = useSocket();

  // State
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sentList, setSentList] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pinned: 0
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  // Filter state
  const [typeFilter, setTypeFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('system');
  const [priority, setPriority] = useState('medium');
  const [audience, setAudience] = useState('all');
  const [expiryDate, setExpiryDate] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [actionText, setActionText] = useState('');
  const [koreanTitle, setKoreanTitle] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load stats from server
  const fetchStats = useCallback(async () => {
    try {
      const res = await notificationService.getNotificationStats();
      if (res?.success && res?.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.warn('Failed to fetch notification stats:', err);
    }
  }, []);

  // Load sent notifications history from server
  const fetchNotifications = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10
      };
      if (typeFilter) params.type = typeFilter;
      if (searchFilter.trim()) params.search = searchFilter.trim();

      const res = await notificationService.getAllNotifications(params);
      if (res?.success) {
        setSentList(res.notifications || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      toast.error('Failed to load sent notifications');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, searchFilter]);

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchNotifications(1);
  }, [fetchStats, fetchNotifications]);

  // Handle Form Submission
  const handlePublish = async (e) => {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      toast.error('Please enter both a title and message body');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        title: title.trim(),
        message: body.trim(),
        type,
        priority,
        targetAudience: audience,
        actionUrl: actionUrl.trim() || undefined,
        actionText: actionText.trim() || undefined,
        koreanTitle: koreanTitle.trim() || undefined,
        expiresAt: expiryDate ? new Date(expiryDate).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const res = await notificationService.createNotification(payload);

      if (res?.success) {
        setIsPublished(true);
        toast.success('Notification dispatched live to user panel!');
        
        // Reset form
        setTitle('');
        setBody('');
        setActionUrl('');
        setActionText('');
        setKoreanTitle('');
        setExpiryDate('');

        // Refresh stats and history table
        fetchStats();
        fetchNotifications(1);

        setTimeout(() => {
          setIsPublished(false);
        }, 2000);
      } else {
        toast.error(res?.message || 'Failed to dispatch notification');
      }
    } catch (err) {
      console.error('Error dispatching notification:', err);
      toast.error(err.response?.data?.message || 'Server error dispatching notification');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Notification
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      const res = await notificationService.deleteNotification(id);
      if (res?.success) {
        toast.success('Notification removed');
        fetchStats();
        fetchNotifications(pagination.page);
      } else {
        toast.error(res?.message || 'Failed to delete notification');
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      toast.error(err.response?.data?.message || 'Failed to delete notification');
    }
  };

  // Helpers for badge styling
  const getTypeBadge = (notifType) => {
    switch (notifType) {
      case 'assignment':
        return { label: 'Assignment', bg: 'bg-indigo-100 text-indigo-700' };
      case 'course_update':
        return { label: 'Course Alert', bg: 'bg-blue-100 text-blue-700' };
      case 'payment_due':
        return { label: 'Payment Notice', bg: 'bg-emerald-100 text-emerald-700' };
      case 'message':
        return { label: 'Announcement', bg: 'bg-purple-100 text-purple-700' };
      case 'other':
        return { label: 'General', bg: 'bg-amber-100 text-amber-700' };
      default:
        return { label: 'System Update', bg: 'bg-slate-100 text-slate-700' };
    }
  };

  const getAudienceBadge = (aud) => {
    switch (aud) {
      case 'students':
        return { label: 'Students', bg: 'text-indigo-600 bg-indigo-50' };
      case 'instructors':
        return { label: 'Instructors', bg: 'text-amber-600 bg-amber-50' };
      case 'admins':
        return { label: 'Admins', bg: 'text-rose-600 bg-rose-50' };
      case 'specific_users':
        return { label: 'Targeted Users', bg: 'text-cyan-600 bg-cyan-50' };
      default:
        return { label: 'All Users', bg: 'text-blue-600 bg-blue-50' };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No expiry';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'No expiry' : d.toLocaleDateString();
  };

  const isExpired = (expiryStr) => {
    if (!expiryStr) return false;
    return new Date(expiryStr) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Title Header & KPI Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block">
              COMMUNICATION HUB
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {isConnected ? 'Live WebSocket Active' : 'Connecting...'}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Notification Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Broadcast instant notifications, system announcements, and course alerts directly to student and instructor panels.
          </p>
        </div>

        {/* Top Right KPI Cards */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Active Alerts */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 min-w-[130px]">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <BellRing size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 block uppercase">Active Alerts</span>
              <span className="text-xl font-extrabold text-gray-900 leading-tight">
                {stats.active ?? 0}
              </span>
            </div>
          </div>

          {/* Total Dispatched */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 min-w-[130px]">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Send size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 block uppercase">Total Sent</span>
              <span className="text-xl font-extrabold text-gray-900 leading-tight">
                {stats.total ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Compose Notification Card */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <SlidersHorizontal size={18} />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900 leading-tight">Compose Notification</h3>
                <p className="text-xs text-gray-400">Broadcast live to client user panels</p>
              </div>
            </div>
          </div>

          <form onSubmit={handlePublish} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Notification Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Scheduled System Maintenance"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Message Body <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Detail the notification content that will appear in the user's notification bell..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
              />
            </div>

            {/* Type & Priority Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:bg-white focus:border-blue-600 cursor-pointer"
                >
                  <option value="system">System Update</option>
                  <option value="assignment">Assignment</option>
                  <option value="course_update">Course Alert</option>
                  <option value="message">Announcement</option>
                  <option value="payment_due">Payment Due</option>
                  <option value="other">General</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Priority
                </label>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPriority('medium')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      priority === 'medium' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('high')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      priority === 'high' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600'
                    }`}
                  >
                    High
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('urgent')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      priority === 'urgent' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600'
                    }`}
                  >
                    Urgent
                  </button>
                </div>
              </div>
            </div>

            {/* Audience & Expiry Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Target Audience
                </label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:bg-white focus:border-blue-600 cursor-pointer"
                >
                  <option value="all">All Users (Everyone)</option>
                  <option value="students">Students Only</option>
                  <option value="instructors">Instructors Only</option>
                  <option value="admins">Admins Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:bg-white focus:border-blue-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Collapsible Advanced Options (Action URL & Korean title) */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition flex items-center gap-1 cursor-pointer"
              >
                <span>{showAdvanced ? '− Hide Link & Action Options' : '+ Add Action Link & Subtitle'}</span>
              </button>

              {showAdvanced && (
                <div className="mt-3 p-3.5 bg-gray-50 rounded-xl space-y-3 border border-gray-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">
                        Action URL
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. /courses or /announcements"
                        value={actionUrl}
                        onChange={(e) => setActionUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">
                        Button Label
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. View Now"
                        value={actionText}
                        onChange={(e) => setActionText(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Korean Title (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 시스템 점검 안내"
                      value={koreanTitle}
                      onChange={(e) => setKoreanTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Broadcasting Live...</span>
                </>
              ) : isPublished ? (
                <>
                  <Check size={16} />
                  <span>Dispatched Live!</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Publish Notification</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Sent Notifications Table Card */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between overflow-hidden">
          <div>
            {/* Header & Filter Bar */}
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-base text-gray-900">Sent Notifications</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white uppercase tracking-wider">
                  LIVE DATABASE
                </span>
              </div>

              {/* Action & Filter buttons */}
              <div className="flex items-center gap-2">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
                >
                  <option value="">All Types</option>
                  <option value="system">System Updates</option>
                  <option value="assignment">Assignments</option>
                  <option value="course_update">Course Alerts</option>
                  <option value="payment_due">Payment Due</option>
                  <option value="message">Announcements</option>
                </select>

                <button 
                  onClick={() => { fetchStats(); fetchNotifications(pagination.page); }}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                  title="Refresh List"
                >
                  <RotateCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-gray-50/80 text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3.5">TITLE & MESSAGE</th>
                    <th className="px-4 py-3.5">TYPE</th>
                    <th className="px-4 py-3.5">AUDIENCE</th>
                    <th className="px-4 py-3.5">STATUS</th>
                    <th className="px-5 py-3.5 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading && sentList.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-12 text-center text-gray-400">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Loading notifications from database...
                      </td>
                    </tr>
                  ) : sentList.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-12 text-center text-gray-400">
                        <BellRing size={28} className="mx-auto mb-2 text-gray-300" />
                        <p className="font-semibold text-gray-700">No sent notifications found</p>
                        <p className="text-xs text-gray-400 mt-1">Compose and publish a notification on the left to broadcast live.</p>
                      </td>
                    </tr>
                  ) : (
                    sentList.map((item) => {
                      const typeConfig = getTypeBadge(item.type);
                      const audConfig = getAudienceBadge(item.targetAudience);
                      const expired = isExpired(item.expiresAt);

                      return (
                        <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-start gap-2.5">
                              <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                                expired ? 'bg-gray-300' : 'bg-emerald-500'
                              }`} />
                              <div className="min-w-0 max-w-xs sm:max-w-sm">
                                <h4 className="font-bold text-gray-900 text-xs sm:text-sm leading-snug truncate">
                                  {item.title}
                                </h4>
                                <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                                  {item.message}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                                  <span>Sent: {new Date(item.createdAt).toLocaleDateString()}</span>
                                  {item.deliveryStats?.totalRead > 0 && (
                                    <span className="text-blue-600 font-medium">
                                      • {item.deliveryStats.totalRead} reads
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold ${typeConfig.bg}`}>
                              {typeConfig.label}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${audConfig.bg}`}>
                              {audConfig.label}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <span className={`text-xs font-semibold ${
                              expired ? 'text-red-500 font-bold' : 'text-gray-600'
                            }`}>
                              {expired ? 'Expired' : formatDate(item.expiresAt)}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Delete Notification"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Pagination */}
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>
              Showing {sentList.length} of {pagination.total || sentList.length} notifications
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchNotifications(pagination.page - 1)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 rounded-lg font-semibold cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchNotifications(pagination.page + 1)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 rounded-lg font-semibold cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
