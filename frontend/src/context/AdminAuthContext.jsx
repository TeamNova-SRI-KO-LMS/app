import { createContext, useContext, useReducer, useEffect } from 'react';
import toast from 'react-hot-toast';
import apiUrl, { getWorkingApiUrl } from '../config/apiConfig';

const AdminAuthContext = createContext();

// Admin Auth reducer
const adminAuthReducer = (state, action) => {
  switch (action.type) {
    case 'ADMIN_LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'ADMIN_LOGIN_SUCCESS':
      return {
        ...state,
        adminUser: action.payload.user,
        adminToken: action.payload.token,
        loading: false,
        error: null,
        isAdminAuthenticated: true,
      };
    case 'ADMIN_LOGIN_FAILURE':
      return {
        ...state,
        adminUser: null,
        adminToken: null,
        loading: false,
        error: action.payload,
        isAdminAuthenticated: false,
      };
    case 'ADMIN_LOGOUT':
      return {
        ...state,
        adminUser: null,
        adminToken: null,
        loading: false,
        error: null,
        isAdminAuthenticated: false,
      };
    case 'ADMIN_UPDATE_USER':
      return {
        ...state,
        adminUser: { ...state.adminUser, ...action.payload },
      };
    case 'ADMIN_SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
};

// Initial state
const initialState = {
  adminUser: null,
  adminToken: localStorage.getItem('adminToken') || null,
  loading: true,
  error: null,
  isAdminAuthenticated: false,
};

export const AdminAuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(adminAuthReducer, initialState);

  // Check for stored admin token on app start
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const adminToken = localStorage.getItem('adminToken');
        const adminUser = localStorage.getItem('adminUser');
        
        if (adminToken && adminUser) {
          try {
            const parsedAdminUser = JSON.parse(adminUser);
            
            // Use a timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('API timeout')), 5000)
            );
            
            const apiPromise = fetch(`http://localhost:5001/api/auth/me`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
              },
            });

            const response = await Promise.race([apiPromise, timeoutPromise]);

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.user.role === 'admin') {
                dispatch({
                  type: 'ADMIN_LOGIN_SUCCESS',
                  payload: {
                    user: data.user,
                    token: adminToken,
                  },
                });
              } else {
                // Token is invalid or user is not admin
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                dispatch({ type: 'ADMIN_LOGOUT' });
              }
            } else {
              // Token verification failed
              localStorage.removeItem('adminToken');
              localStorage.removeItem('adminUser');
              dispatch({ type: 'ADMIN_LOGOUT' });
            }
          } catch (error) {
            console.error('Admin auth check error:', error);
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            dispatch({ type: 'ADMIN_LOGOUT' });
          }
        } else {
          // No admin token, just set loading to false
          dispatch({ type: 'ADMIN_SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Admin auth check error:', error);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        dispatch({ type: 'ADMIN_LOGOUT' });
      } finally {
        // Always set loading to false, even if there's an error
        dispatch({ type: 'ADMIN_SET_LOADING', payload: false });
      }
    };

    checkAdminAuth();
  }, []);

  // Admin login function
  const adminLogin = async (email, password) => {
    dispatch({ type: 'ADMIN_LOGIN_START' });
    try {
      const workingApiUrl = await getWorkingApiUrl();
      const response = await fetch(`${workingApiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          const { token, user } = data;
          
          // Check if the user is actually an admin
          if (user.role !== 'admin') {
            throw new Error('Access denied. Admin privileges required.');
          }
          
          // Store admin-specific tokens (separate from user tokens)
          localStorage.setItem('adminToken', token);
          localStorage.setItem('adminUser', JSON.stringify(user));

          dispatch({
            type: 'ADMIN_LOGIN_SUCCESS',
            payload: { user, token },
          });

          toast.success('Admin login successful!');
          return { success: true, user };
        } else {
          throw new Error(data.message || 'Admin login failed');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Admin login failed');
      }
    } catch (error) {
      const message = error.message || 'Admin login failed';
      dispatch({
        type: 'ADMIN_LOGIN_FAILURE',
        payload: message,
      });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Admin logout function
  const adminLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    dispatch({ type: 'ADMIN_LOGOUT' });
    toast.success('Admin logged out successfully');
  };

  // Update admin user profile
  const updateAdminUser = userData => {
    dispatch({
      type: 'ADMIN_UPDATE_USER',
      payload: userData,
    });
  };

  const value = {
    ...state,
    adminLogin,
    adminLogout,
    updateAdminUser,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};



