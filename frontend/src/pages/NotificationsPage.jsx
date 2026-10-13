import { useState, useMemo } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Search, 
  Filter, 
  ExternalLink, 
  BookOpen, 
  CreditCard, 
  MessageSquare, 
  AlertTriangle, 
  Info,
  Clock,
  Pin,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useSocket } from '../context/SocketProvider';

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAsClicked, markAllAsRead, loading } = useNotifications();
  const { isConnected } = useSocket();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread' | 'course_update' | 'payment_due' | 'system'
  const [searchQuery, setSearchQuery] = useState('');
  const [showKorean, setShowKorean] = useState(true);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      // Tab filter
      if (activeTab === 'unread' && notif.isRead) return false;
      if (activeTab === 'course_update' && notif.type !== 'course_update') return false;
      if (activeTab === 'payment_due' && notif.type !== 'payment_due') return false;
      if (activeTab === 'system' && notif.type !== 'system') return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = notif.title?.toLowerCase().includes(query);
        const matchesMessage = notif.message?.toLowerCase().includes(query);
        const matchesKoreanTitle = notif.koreanTitle?.toLowerCase().includes(query);
        const matchesKoreanMessage = notif.koreanMessage?.toLowerCase().includes(query);
        return matchesTitle || matchesMessage || matchesKoreanTitle || matchesKoreanMessage;
      }

      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  // Group by time (Today, Yesterday, Earlier)
  const groupedNotifications = useMemo(() => {
    const today = [];
    const yesterday = [];
    const earlier = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

    filteredNotifications.forEach((notif) => {
      const time = new Date(notif.createdAt).getTime();
      if (time >= startOfToday) {
        today.push(notif);
      } else if (time >= startOfYesterday) {
        yesterday.push(notif);
      } else {
        earlier.push(notif);
      }
    });

    return [
      { label: 'Today', items: today },
      { label: 'Yesterday', items: yesterday },
      { label: 'Earlier', items: earlier },
    ].filter((group) => group.items.length > 0);
  }, [filteredNotifications]);

  const getTypeConfig = (type, priority) => {
    if (priority === 'urgent' || priority === 'high') {
      return {
        icon: AlertTriangle,
        bg: 'bg-red-50 text-red-600 border-red-200',
        badge: 'bg-red-100 text-red-700',
        badgeText: 'Urgent'
      };
    }
    switch (type) {
      case 'course_update':
        return {
          icon: BookOpen,
          bg: 'bg-blue-50 text-blue-600 border-blue-200',
          badge: 'bg-blue-100 text-blue-700',
          badgeText: 'Course'
        };
      case 'payment_due':
        return {
          icon: CreditCard,
          bg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          badge: 'bg-emerald-100 text-emerald-700',
          badgeText: 'Payment'
        };
      case 'message':
        return {
          icon: MessageSquare,
          bg: 'bg-purple-50 text-purple-600 border-purple-200',
          badge: 'bg-purple-100 text-purple-700',
          badgeText: 'Message'
        };
      default:
        return {
          icon: Info,
          bg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
          badge: 'bg-indigo-100 text-indigo-700',
          badgeText: 'System'
        };
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        {/* Page Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                  <Bell size={24} />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Notifications Center
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Stay up-to-date with course activities, payments, and system updates
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* WebSocket Status Indicator */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                <span>{isConnected ? 'Real-Time Active' : 'Connecting...'}</span>
              </div>

              {/* Mark All Read Button */}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl text-xs sm:text-sm transition cursor-pointer"
                >
                  <CheckCheck size={16} />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Search & Language Toggle */}
          <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notifications..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <label className="flex items-center gap-2 text-xs text-gray-600 font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showKorean}
                  onChange={(e) => setShowKorean(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span>Show Korean translations (한국어)</span>
              </label>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All', count: notifications.length },
              { id: 'unread', label: 'Unread', count: unreadCount },
              { id: 'course_update', label: 'Courses' },
              { id: 'payment_due', label: 'Payments' },
              { id: 'system', label: 'System' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      activeTab === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-6">
          {loading && notifications.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
              <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-700">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                <Sparkles size={28} />
              </div>
              <h3 className="text-base font-bold text-gray-900">No notifications found</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? `No results matching "${searchQuery}". Try a different keyword.`
                  : activeTab === 'unread'
                  ? "You don't have any unread notifications right now."
                  : 'You have no notifications in this category.'}
              </p>
            </div>
          ) : (
            groupedNotifications.map((group) => (
              <div key={group.label} className="space-y-3">
                <div className="flex items-center gap-2 px-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {group.label}
                  </span>
                  <div className="h-px bg-gray-200 flex-1" />
                </div>

                <div className="space-y-2">
                  {group.items.map((notif) => {
                    const config = getTypeConfig(notif.type, notif.priority);
                    const IconComponent = config.icon;

                    return (
                      <div
                        key={notif._id}
                        onClick={() => markAsClicked(notif._id)}
                        className={`bg-white rounded-2xl p-4 sm:p-5 border transition duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:shadow-md ${
                          !notif.isRead
                            ? 'border-blue-200 bg-blue-50/20 shadow-sm'
                            : 'border-gray-100'
                        }`}
                      >
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          {/* Left Icon */}
                          <div className={`p-2.5 rounded-xl border flex-shrink-0 ${config.bg}`}>
                            <IconComponent size={20} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${config.badge}`}>
                                {config.badgeText}
                              </span>

                              {notif.isPinned && (
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                  <Pin size={10} />
                                  Pinned
                                </span>
                              )}

                              {!notif.isRead && (
                                <span className="w-2 h-2 rounded-full bg-blue-600" />
                              )}

                              <span className="text-[11px] text-gray-400 flex items-center gap-1 ml-auto">
                                <Clock size={11} />
                                {formatTime(notif.createdAt)}
                              </span>
                            </div>

                            <h3 className={`text-sm ${!notif.isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                              {notif.title}
                            </h3>

                            {/* Korean Title if available and enabled */}
                            {showKorean && notif.koreanTitle && notif.koreanTitle !== notif.title && (
                              <p className="text-xs text-blue-700/80 font-medium mt-0.5">
                                {notif.koreanTitle}
                              </p>
                            )}

                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                              {notif.message}
                            </p>

                            {/* Korean Message */}
                            {showKorean && notif.koreanMessage && notif.koreanMessage !== notif.message && (
                              <p className="text-xs text-gray-500 mt-1 leading-relaxed italic">
                                {notif.koreanMessage}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 flex-shrink-0">
                          {notif.actionUrl && (
                            <a
                              href={notif.actionUrl}
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsClicked(notif._id);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
                            >
                              <span>{notif.actionText || 'Open'}</span>
                              <ChevronRight size={14} />
                            </a>
                          )}

                          {!notif.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notif._id);
                              }}
                              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg font-medium transition cursor-pointer"
                              title="Mark as read"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
