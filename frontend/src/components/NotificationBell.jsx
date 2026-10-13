import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCheck, 
  ExternalLink, 
  BookOpen, 
  CreditCard, 
  MessageSquare, 
  AlertTriangle, 
  Info,
  Clock,
  Sparkles
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useSocket } from '../context/SocketProvider';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const { notifications, unreadCount, markAsRead, markAsClicked, markAllAsRead, loading } = useNotifications();
  const { isConnected } = useSocket();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Format relative time helper
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get icon and color scheme based on notification type & priority
  const getTypeConfig = (type, priority) => {
    if (priority === 'urgent' || priority === 'high') {
      return {
        icon: AlertTriangle,
        bg: 'bg-red-50 text-red-600',
        dot: 'bg-red-500'
      };
    }
    switch (type) {
      case 'course_update':
        return {
          icon: BookOpen,
          bg: 'bg-blue-50 text-blue-600',
          dot: 'bg-blue-500'
        };
      case 'payment_due':
        return {
          icon: CreditCard,
          bg: 'bg-emerald-50 text-emerald-600',
          dot: 'bg-emerald-500'
        };
      case 'message':
        return {
          icon: MessageSquare,
          bg: 'bg-purple-50 text-purple-600',
          dot: 'bg-purple-500'
        };
      default:
        return {
          icon: Info,
          bg: 'bg-indigo-50 text-indigo-600',
          dot: 'bg-indigo-500'
        };
    }
  };

  const handleNotificationClick = (notif) => {
    markAsClicked(notif._id);
    setIsOpen(false);
    if (notif.actionUrl) {
      if (notif.actionUrl.startsWith('http')) {
        window.open(notif.actionUrl, '_blank');
      } else {
        navigate(notif.actionUrl);
      }
    }
  };

  // Top 6 recent notifications for the dropdown
  const recentNotifications = notifications.slice(0, 6);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        aria-label="Notifications"
        title={isConnected ? 'Connected to live notifications' : 'Connecting to live notifications...'}
      >
        <Bell size={20} className={unreadCount > 0 ? 'text-gray-700' : 'text-gray-500'} />

        {/* Live connection indicator dot */}
        <span
          className={`absolute bottom-1 right-1 w-2 h-2 rounded-full border-2 border-white ${
            isConnected ? 'bg-emerald-500' : 'bg-amber-400'
          }`}
          title={isConnected ? 'Live WebSocket Active' : 'Connecting...'}
        />

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-50 overflow-hidden transform transition-all duration-200 animate-in fade-in slide-in-from-top-2">
          
          {/* Header */}
          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-600 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition"
                title="Mark all as read"
              >
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List of Notifications */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                Loading notifications...
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-500">
                  <Sparkles size={22} />
                </div>
                <p className="text-sm font-semibold text-gray-800">You're all caught up!</p>
                <p className="text-xs text-gray-500 mt-1">No new notifications at the moment.</p>
              </div>
            ) : (
              recentNotifications.map((notif) => {
                const config = getTypeConfig(notif.type, notif.priority);
                const IconComponent = config.icon;

                return (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`px-4 py-3 hover:bg-gray-50/80 transition cursor-pointer flex gap-3 items-start relative ${
                      !notif.isRead ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    {/* Unread blue dot */}
                    {!notif.isRead && (
                      <span className="absolute left-1.5 top-5 w-2 h-2 rounded-full bg-blue-600" />
                    )}

                    {/* Icon */}
                    <div className={`p-2 rounded-xl flex-shrink-0 ${config.bg}`}>
                      <IconComponent size={16} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs truncate ${!notif.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5 flex-shrink-0">
                          <Clock size={10} />
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                      </div>

                      {/* Korean Subtitle if present */}
                      {notif.koreanTitle && notif.koreanTitle !== notif.title && (
                        <p className="text-[11px] text-blue-600/80 font-medium truncate mt-0.5">
                          {notif.koreanTitle}
                        </p>
                      )}

                      <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Action text link preview */}
                      {notif.actionUrl && (
                        <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-800">
                          <span>{notif.actionText || 'View'}</span>
                          <ExternalLink size={10} />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-gray-400">
              {isConnected ? '🟢 Real-time sync active' : '🟡 Offline mode'}
            </span>
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="font-semibold text-blue-600 hover:text-blue-800 transition"
            >
              View all &rarr;
            </Link>
          </div>

        </div>
      )}
    </div>
  );
}
