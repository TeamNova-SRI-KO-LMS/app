const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;

// Map: userId -> Set of socket IDs (a user can have multiple active browser tabs)
const userSockets = new Map();

/**
 * Initialize Socket.IO with the HTTP server
 * @param {import('http').Server} httpServer
 * @returns {Server}
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // JWT Authentication middleware before connection establishment
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      // Also support Authorization header
      if (!token && socket.handshake.headers?.authorization) {
        const parts = socket.handshake.headers.authorization.split(' ');
        token = parts.length === 2 ? parts[1] : parts[0];
      }

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET not configured on server');
        return next(new Error('Internal server configuration error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name email role isActive');

      if (!user) {
        return next(new Error('User not found'));
      }

      if (!user.isActive) {
        return next(new Error('Account is deactivated'));
      }

      // Attach user details to socket instance
      socket.user = {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      };

      next();
    } catch (err) {
      console.warn('Socket authentication error:', err.message);
      next(new Error('Authentication failed: ' + err.message));
    }
  });

  // Connection event handler
  io.on('connection', (socket) => {
    const userId = socket.user._id;
    const role = socket.user.role;

    console.log(`🔌 Socket connected: ${socket.user.name} (${userId}) [Role: ${role}]`);

    // 1. Join user-specific room
    socket.join(`user:${userId}`);

    // 2. Join role-specific room (e.g. role:student, role:instructor, role:admin)
    socket.join(`role:${role}`);

    // Track active socket connections for the user
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    // Course room subscription
    socket.on('join-course', (courseId) => {
      if (courseId) {
        const roomName = `course:${courseId}`;
        socket.join(roomName);
        console.log(`User ${userId} joined room ${roomName}`);
      }
    });

    socket.on('leave-course', (courseId) => {
      if (courseId) {
        const roomName = `course:${courseId}`;
        socket.leave(roomName);
        console.log(`User ${userId} left room ${roomName}`);
      }
    });

    // Handle marking notification as read in real-time
    socket.on('notification:read', async (notificationId) => {
      try {
        const Notification = require('../models/Notification');
        const notification = await Notification.findById(notificationId);
        if (notification) {
          await notification.markAsRead(userId);
          // Notify other tabs of the same user
          io.to(`user:${userId}`).emit('notification:read-confirmed', { notificationId });
        }
      } catch (err) {
        console.error('Error handling socket notification:read:', err.message);
      }
    });

    // Handle notification click tracking
    socket.on('notification:click', async (notificationId) => {
      try {
        const Notification = require('../models/Notification');
        const notification = await Notification.findById(notificationId);
        if (notification) {
          await notification.markAsClicked(userId);
        }
      } catch (err) {
        console.error('Error handling socket notification:click:', err.message);
      }
    });

    // Mark all notifications as read for current user
    socket.on('notification:mark-all-read', async () => {
      try {
        const Notification = require('../models/Notification');
        const unreadNotifications = await Notification.find({
          isActive: true,
          'readBy.user': { $ne: userId },
          $or: [
            { targetAudience: 'all' },
            { targetAudience: `${role}s` },
            { targetRoles: role },
            { targetUsers: userId },
          ],
        });

        for (const notif of unreadNotifications) {
          await notif.markAsRead(userId);
        }

        // Notify client that all are marked read
        io.to(`user:${userId}`).emit('notification:all-read-confirmed', {
          count: unreadNotifications.length,
          unreadCount: 0
        });
      } catch (err) {
        console.error('Error handling socket notification:mark-all-read:', err.message);
      }
    });

    // Disconnect cleanup
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.user.name} (${reason})`);
      const userSocketsSet = userSockets.get(userId);
      if (userSocketsSet) {
        userSocketsSet.delete(socket.id);
        if (userSocketsSet.size === 0) {
          userSockets.delete(userId);
        }
      }
    });
  });

  console.log('✅ Socket.IO server initialized successfully');
  return io;
};

/**
 * Access the Socket.IO instance
 * @returns {Server}
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initSocket first.');
  }
  return io;
};

/**
 * Send notification/event to a specific user
 * @param {string} userId
 * @param {string} event
 * @param {any} data
 */
const sendToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

/**
 * Send notification/event to all users of a specific role
 * @param {string} role ('student' | 'instructor' | 'admin')
 * @param {string} event
 * @param {any} data
 */
const sendToRole = (role, event, data) => {
  if (io) {
    io.to(`role:${role}`).emit(event, data);
  }
};

/**
 * Send notification/event to all users in a course room
 * @param {string} courseId
 * @param {string} event
 * @param {any} data
 */
const sendToCourse = (courseId, event, data) => {
  if (io) {
    io.to(`course:${courseId}`).emit(event, data);
  }
};

/**
 * Broadcast event to all connected sockets
 * @param {string} event
 * @param {any} data
 */
const broadcast = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

/**
 * Check if a user is currently online
 * @param {string} userId
 * @returns {boolean}
 */
const isUserOnline = (userId) => {
  return userSockets.has(userId.toString()) && userSockets.get(userId.toString()).size > 0;
};

/**
 * Get count of active online users
 * @returns {number}
 */
const getOnlineCount = () => {
  return userSockets.size;
};

/**
 * Get total open socket connections for a user
 * @param {string} userId
 * @returns {number}
 */
const getUserSocketCount = (userId) => {
  return userSockets.get(userId.toString())?.size || 0;
};

module.exports = {
  initSocket,
  getIO,
  sendToUser,
  sendToRole,
  sendToCourse,
  broadcast,
  isUserOnline,
  getOnlineCount,
  getUserSocketCount,
};
