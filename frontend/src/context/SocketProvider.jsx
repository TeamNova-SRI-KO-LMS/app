import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { baseUrl } from '../config/apiConfig';
import { getAuthToken } from '../services/apiService';
import useAuth from './useAuth';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = getAuthToken();

    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Determine the socket server URL (strip /api if present)
    const socketUrl = baseUrl || 'http://localhost:5000';

    const socketInstance = io(socketUrl, {
      auth: { token },
      extraHeaders: {
        Authorization: `Bearer ${token}`
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      console.log('⚡ Socket.IO connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('⚠️ Socket.IO connection error:', err.message);
      setIsConnected(false);
    });

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [isAuthenticated, user?._id]);

  const joinCourse = (courseId) => {
    if (socketRef.current && isConnected && courseId) {
      socketRef.current.emit('join-course', courseId);
    }
  };

  const leaveCourse = (courseId) => {
    if (socketRef.current && isConnected && courseId) {
      socketRef.current.emit('leave-course', courseId);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        joinCourse,
        leaveCourse,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  return context || { socket: null, isConnected: false, joinCourse: () => {}, leaveCourse: () => {} };
};

export default SocketContext;
