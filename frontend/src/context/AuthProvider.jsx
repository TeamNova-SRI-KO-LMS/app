import { useEffect, useReducer } from 'react';

import AuthContext from './AuthContext';
import apiService from '../services/apiService';

const USERS_KEY = 'auth-users';
const SESSION_KEY = 'auth-session';

const isBrowser = typeof window !== 'undefined';
const inMemoryUsers = [];

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

const getStoredUsers = () => {
  if (!isBrowser) {
    return [];
  }

  if (inMemoryUsers.length > 0) {
    return inMemoryUsers;
  }

  const storedUsers = safeParse(localStorage.getItem(USERS_KEY), []);
  if (storedUsers.length > 0) {
    inMemoryUsers.push(...storedUsers);
    localStorage.removeItem(USERS_KEY);
  }

  return inMemoryUsers;
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

const persistUsers = (users) => {
  if (isBrowser) {
    inMemoryUsers.splice(0, inMemoryUsers.length, ...users);
    localStorage.removeItem(USERS_KEY);
  }
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

const buildToken = (email) => `local-${btoa(email)}-${Date.now()}`;

const toHex = (buffer) => Array.from(new Uint8Array(buffer))
  .map((byte) => byte.toString(16).padStart(2, '0'))
  .join('');

const fromHex = (hex) => {
  if (!hex) {
    return new Uint8Array();
  }

  const pairs = hex.match(/.{1,2}/g) ?? [];
  return new Uint8Array(pairs.map((pair) => parseInt(pair, 16)));
};

const hashPassword = async (password, salt) => {
  if (!isBrowser || !crypto?.subtle || !crypto?.getRandomValues) {
    throw new Error(
      'Your browser does not support secure password storage. Please use a modern browser to sign in.'
    );
  }

  const saltBytes = salt ? fromHex(salt) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  );

  return {
    hash: toHex(derivedBits),
    salt: toHex(saltBytes),
  };
};

const legacyHashPassword = async (password) => {
  if (!isBrowser || !crypto?.subtle) {
    throw new Error(
      'Your browser does not support secure password storage. Please use a modern browser to sign in.'
    );
  }

  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(password),
  );

  return toHex(hashBuffer);
};

const constantTimeCompare = (value, other) => {
  if (!value || !other || value.length !== other.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result |= value.charCodeAt(index) ^ other.charCodeAt(index);
  }

  return result === 0;
};

const buildLocalUserId = () => {
  if (typeof crypto?.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  if (crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
  }

  throw new Error(
    'Your browser does not support secure ID generation. Please use a modern browser to sign up.'
  );
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

    // Keep a backend-ready path when only token is present (for example after storage migrations).
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
      } catch {
        // Fallback keeps auth usable without a live backend during setup.
      }

      const users = getStoredUsers();
      const normalizedEmail = email.trim().toLowerCase();
      const userRecord = users.find(
        (user) => user.email.toLowerCase() === normalizedEmail
      );

      if (!userRecord) {
        throw new Error('Invalid email or password');
      }

      let matchedUser = null;
      if (userRecord.passwordHash && userRecord.passwordSalt) {
        const { hash } = await hashPassword(password, userRecord.passwordSalt);
        if (constantTimeCompare(userRecord.passwordHash, hash)) {
          matchedUser = userRecord;
        }
      } else if (userRecord.passwordHash) {
        const legacyHash = await legacyHashPassword(password);
        if (constantTimeCompare(userRecord.passwordHash, legacyHash)) {
          const { hash, salt } = await hashPassword(password);
          matchedUser = { ...userRecord, passwordHash: hash, passwordSalt: salt };
        }
      } else if (userRecord.password && constantTimeCompare(userRecord.password, password)) {
        const { hash, salt } = await hashPassword(password);
        matchedUser = { ...userRecord, passwordHash: hash, passwordSalt: salt };
      }

      if (!matchedUser) {
        throw new Error('Invalid email or password');
      }

      const storedUser = { ...matchedUser };
      delete storedUser.password;
      const nextUsers = users.map((user) =>
        user.email.toLowerCase() === normalizedEmail ? storedUser : user
      );
      persistUsers(nextUsers);

      const token = buildToken(storedUser.email);
      const safeUser = sanitizeUser(storedUser);

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
      const message = error.message || 'Login failed';
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

      try {
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
      } catch {
        // Fallback keeps auth usable without a live backend during setup.
      }

      const users = getStoredUsers();
      const existingUser = users.find(
        (user) => user.email.toLowerCase() === normalizedEmail
      );

      if (existingUser) {
        throw new Error('An account with this email already exists');
      }

      const { hash, salt } = await hashPassword(password);
      const userProfile = {
        id: buildLocalUserId(),
        name: trimmedName,
        email: normalizedEmail,
        role,
      };

      const userForStorage = {
        ...userProfile,
        passwordHash: hash,
        passwordSalt: salt,
      };

      const nextUsers = [...users, userForStorage];
      persistUsers(nextUsers);

      const token = buildToken(normalizedEmail);
      persistSession({ token, user: userProfile });

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: userProfile,
          token,
        },
      });

      return { success: true, user: userProfile, token };
    } catch (error) {
      const message = error.message || 'Registration failed';
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
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
