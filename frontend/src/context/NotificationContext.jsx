import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useSocket } from './SocketProvider';
import notificationService from '../services/notificationService';
import useAuth from './useAuth';

const NotificationContext = createContext(null);

// How often to re-fetch notifications when there is no live socket connection
const POLL_INTERVAL_MS = 60000;

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { socket, isConnected } = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications and unread count from API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const [notifData, countData] = await Promise.all([
        notificationService.getActiveNotifications().catch(() => ({ notifications: [] })),
        notificationService.getUnreadCount().catch(() => ({ count: 0 })),
      ]);

      const list = notifData?.notifications || [];
      // Calculate isRead for each notification based on current user
      const mapped = list.map((item) => {
        const isRead =
          item.isRead ||
          (item.readBy &&
            user?._id &&
            item.readBy.some((r) => (r.user?._id || r.user || '').toString() === user._id.toString()));
        return { ...item, isRead: !!isRead };
      });

      setNotifications(mapped);
      setUnreadCount(countData?.count ?? mapped.filter((n) => !n.isRead).length);
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?._id]);

  // Initial fetch on login
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, fetchNotifications]);

  // Without a live socket (sockets disabled, e.g. API on Vercel, or connection lost),
  // keep notifications fresh by polling and whenever the tab regains focus.
  useEffect(() => {
    if (!isAuthenticated || isConnected) return undefined;

    const refresh = () => {
      if (document.visibilityState === 'visible') fetchNotifications();
    };
    const timer = setInterval(refresh, POLL_INTERVAL_MS);
    window.addEventListener('focus', refresh);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [isAuthenticated, isConnected, fetchNotifications]);

  // Listen for real-time socket events
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewNotification = (notification) => {
      console.log('🔔 Real-time notification received via WebSocket:', notification);

      // Prepend new notification to state
      setNotifications((prev) => {
        // Avoid duplicate
        if (prev.some((n) => n._id === notification._id)) return prev;
        return [{ ...notification, isRead: false }, ...prev];
      });

      // Increment badge count
      setUnreadCount((prev) => prev + 1);

      // Rich in-app toast notification popup
      const isUrgent = notification.priority === 'urgent' || notification.priority === 'high';
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 p-4 border-l-4 ${
              isUrgent ? 'border-red-500' : 'border-blue-600'
            }`}
          >
            <div className="flex-1 w-0">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <span className="text-xl">
                    {notification.type === 'assignment'
                      ? '📝'
                      : notification.type === 'payment_due'
                      ? '💳'
                      : notification.type === 'course_update'
                      ? '📚'
                      : notification.type === 'message'
                      ? '💬'
                      : isUrgent
                      ? '🚨'
                      : '🔔'}
                  </span>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {notification.title}
                  </p>
                  <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                    {notification.message}
                  </p>
                  {notification.actionUrl && (
                    <a
                      href={notification.actionUrl}
                      onClick={() => toast.dismiss(t.id)}
                      className="inline-block mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {notification.actionText || 'View Details'} &rarr;
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-100 pl-3 ml-3 items-center">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="text-gray-400 hover:text-gray-600 text-xs font-medium"
              >
                ✕
              </button>
            </div>
          </div>
        ),
        {
          duration: isUrgent ? 8000 : 5000,
          position: 'top-right',
        }
      );
    };

    const handleReadConfirmed = ({ notificationId }) => {
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const handleAllReadConfirmed = () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('notification:read-confirmed', handleReadConfirmed);
    socket.on('notification:all-read-confirmed', handleAllReadConfirmed);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:read-confirmed', handleReadConfirmed);
      socket.off('notification:all-read-confirmed', handleAllReadConfirmed);
    };
  }, [socket, isConnected]);

  // Mark single notification as read
  const markAsRead = async (notificationId) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Emit via socket if connected for instant multi-tab sync
      if (socket && isConnected) {
        socket.emit('notification:read', notificationId);
      } else {
        await notificationService.markAsRead(notificationId);
      }
    } catch (err) {
      console.warn('Failed to mark notification as read:', err);
    }
  };

  // Mark clicked
  const markAsClicked = async (notificationId) => {
    try {
      if (socket && isConnected) {
        socket.emit('notification:click', notificationId);
      } else {
        await notificationService.markAsClicked(notificationId);
      }
      markAsRead(notificationId);
    } catch (err) {
      console.warn('Failed to record notification click:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      if (socket && isConnected) {
        socket.emit('notification:mark-all-read');
      } else {
        await notificationService.markAllAsRead();
      }
      toast.success('All notifications marked as read');
    } catch (err) {
      console.warn('Failed to mark all as read:', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAsClicked,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      notifications: [],
      unreadCount: 0,
      loading: false,
      fetchNotifications: () => {},
      markAsRead: () => {},
      markAsClicked: () => {},
      markAllAsRead: () => {},
    };
  }
  return context;
};

export default NotificationContext;
