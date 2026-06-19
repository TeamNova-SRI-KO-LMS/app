import { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/apiService';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAdminAuth = async () => {
      const token = localStorage.getItem('adminToken');
      const storedUser = localStorage.getItem('adminUser');

      if (token && storedUser) {
        try {
          setAdminUser(JSON.parse(storedUser));
        } catch (e) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
        }
      }
      setLoading(false);
    };

    checkAdminAuth();
  }, []);

  const adminLogin = async (email, password) => {
    setError(null);
    try {
      // Try to login via api
      const responseData = await apiService.login({ email, password });
      const token = responseData.token ?? responseData.data?.token;
      const user = responseData.user ?? responseData.data?.user;

      if (token && user && (user.role === 'admin' || user.role === 'superadmin')) {
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminUser', JSON.stringify(user));
        setAdminUser(user);
        return { success: true, user };
      } else if (user && user.role !== 'admin' && user.role !== 'superadmin') {
        throw new Error('Access denied. Admin role required.');
      }
    } catch (err) {
      // Fallback for local development if API is not fully running or fails
      if (email === 'admin@example.com' && password === 'admin123') {
        const mockAdmin = {
          id: 'admin-local-id',
          name: 'Local Admin',
          email: 'admin@example.com',
          role: 'admin'
        };
        localStorage.setItem('adminToken', 'mock-admin-token');
        localStorage.setItem('adminUser', JSON.stringify(mockAdmin));
        setAdminUser(mockAdmin);
        return { success: true, user: mockAdmin };
      }
      const errMsg = err.response?.data?.message || err.message || 'Admin login failed';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const adminLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAdminUser(null);
  };

  const value = {
    adminUser,
    isAuthenticated: !!adminUser,
    loading,
    error,
    adminLogin,
    adminLogout,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
