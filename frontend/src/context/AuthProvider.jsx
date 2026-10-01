import { useEffect, useReducer } from 'react';

import AuthContext from './AuthContext';
import apiService from '../services/apiService';

const SESSION_KEY = 'auth-session';

const isBrowser = typeof window !== 'undefined';

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const sanitizeUser = (user) => {
  if (!user || typeof user !== 'object') {
    return user;
  }

  const safeUser = { ...user };
  delete safeUser.password;
  delete safeUser.passwordHash;
  delete safeUser.passwordSalt;
  return safeUser;
};

const getStoredSession = () => {
  if (!isBrowser) {
    return { token: null, user: null };
  }

  const session = safeParse(localStorage.getItem(SESSION_KEY), { token: null, user: null });
  return {
    ...session,
    user: sanitizeUser(session.user),
  };
};

const persistSession = (session) => {
  if (isBrowser) {
    const safeSession = {
      ...session,
      user: sanitizeUser(session.user),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeSession));
    if (safeSession.token) {
      localStorage.setItem('token', safeSession.token);
    }
  }
};

const clearSession = () => {
  if (!isBrowser) {
    return;
  }

  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
};

const extractAuthPayload = (responseData) => {
  if (!responseData || typeof responseData !== 'object') {
    throw new Error('Invalid authentication response');
  }

  const token = responseData.token ?? responseData.data?.token ?? null;
  const user = responseData.user ?? responseData.data?.user ?? null;

  if (!token || !user) {
    throw new Error('Authentication response is missing token or user');
  }

  return { token, user };
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
        isAuthenticated: true,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload,
        isAuthenticated: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload,
        },
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
};

const storedSession = getStoredSession();

const initialState = {
  user: storedSession.user,
  token: storedSession.token,
  loading: true,
  error: null,
  isAuthenticated: Boolean(storedSession.token && storedSession.user),
};

const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const session = getStoredSession();
    const token = isBrowser ? localStorage.getItem('token') : null;

    if (session.token && session.user) {
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: session.user,
          token: session.token,
        },
      });
      return;
    }

    // If only token exists, try to fetch user from backend
    if (token) {
      dispatch({ type: 'SET_LOADING', payload: true });

      apiService.getCurrentUser()
        .then((responseData) => {
          const user = responseData?.user ?? responseData?.data?.user ?? responseData?.data ?? null;

          if (user) {
            const nextSession = { token, user };
            persistSession(nextSession);
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: nextSession,
            });
            return;
          }

          clearSession();
          dispatch({ type: 'SET_LOADING', payload: false });
        })
        .catch(() => {
          clearSession();
          dispatch({ type: 'SET_LOADING', payload: false });
        });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const responseData = await apiService.login({ email, password });
      const { token, user } = extractAuthPayload(responseData);
      const safeUser = sanitizeUser(user);

      persistSession({ token, user: safeUser });

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: safeUser,
          token,
        },
      });

      return { success: true, user: safeUser, token };
    } catch (error) {
      // Extract the error message from the API response or use a default
      const data = error.response?.data;
      const message =
        (data?.errors?.length ? data.errors[0].msg : null) ||
        data?.message ||
        error.message ||
        'Login failed. Please check your credentials.';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: message,
      });
      return { success: false, error: message };
    }
  };

  const register = async (name, email, password, role = 'student') => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const trimmedName = name.trim();
      const normalizedEmail = email.trim().toLowerCase();

      if (!trimmedName || !normalizedEmail || !password) {
        throw new Error('Please fill in all fields');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const responseData = await apiService.register({
        name: trimmedName,
        email: normalizedEmail,
        password,
        role,
      });
      const { token, user } = extractAuthPayload(responseData);
      const safeUser = sanitizeUser(user);

      persistSession({ token, user: safeUser });

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: safeUser,
          token,
        },
      });

      return { success: true, user: safeUser, token };
    } catch (error) {
      // Extract the error message from the API response or use a default
      const data = error.response?.data;
      const message =
        (data?.errors?.length ? data.errors[0].msg : null) ||
        data?.message ||
        error.message ||
        'Registration failed. Please try again.';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: message,
      });
      return { success: false, error: message };
    }
  };

  const googleLogin = async (idToken) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await apiService.post('/auth/google', { idToken });
      const responseData = response.data;
      const { token, user } = extractAuthPayload(responseData);
      const safeUser = sanitizeUser(user);

      persistSession({ token, user: safeUser });

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: safeUser,
          token,
        },
      });

      return { success: true, user: safeUser, token };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Google login failed.';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: message,
      });
      return { success: false, error: message };
    }
  };

  const logout = () => {
    clearSession();
    dispatch({ type: 'LOGOUT' });
  };

  const value = {
    ...state,
    login,
    register,
    googleLogin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
