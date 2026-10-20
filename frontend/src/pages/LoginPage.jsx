
import { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import useAuth from '../context/useAuth';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  // Preserve password reset success state from the feature branch.
  const [successDismissed, setSuccessDismissed] = useState(false);

  // Preserve authentication error handling from develop.
  const [localError, setLocalError] = useState('');

  const { login, googleLogin, loading, error, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/home';

  const displayError = localError || error;

  // Display the password reset confirmation for five seconds.
  useEffect(() => {
    if (location.state?.passwordChanged) {
      const timeoutId = window.setTimeout(() => {
        setSuccessDismissed(true);
        navigate(location.pathname, {
          replace: true,
          state: {},
        });
      }, 5000);

      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [location.pathname, location.state, navigate]);

  // Support both text fields and the Remember Me checkbox.
  const handleChange = event => {
    const { name, value, type, checked } = event.target;

    setFormData(current => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (localError) {
      setLocalError('');
    }
  };

  // User portal authentication: administrators must use the admin portal.
  const handleSubmit = async event => {
    event.preventDefault();
    setLocalError('');

    const result = await login(
      formData.email,
      formData.password,
      'user',
    );

    if (result.success) {
      if (result.user?.role === 'admin') {
        setLocalError(
          'Admin accounts cannot log in through the user login. Please use the Admin Access Portal.',
        );
      } else {
        navigate(from, { replace: true });
      }
    } else {
      setLocalError(
        result.error || 'Login failed. Please check your credentials.',
      );
    }
  };

  // Google authentication is available through the user portal only.
  const handleGoogleCredentialResponse = async credentialResponse => {
    if (typeof googleLogin !== 'function') {
      setLocalError('Google login is not configured.');
      return;
    }

    setLocalError('');

    const result = await googleLogin(credentialResponse.credential);

    if (result.success) {
      if (result.user?.role === 'admin') {
        setLocalError(
          'Admin accounts cannot log in through the user login. Please use the Admin Access Portal.',
        );
      } else {
        navigate(from, { replace: true });
      }
    } else {
      setLocalError(result.error || 'Google sign-in failed.');
    }
  };

  // While auth is initializing, show a neutral spinner so the form doesn't flash
  if (loading && !displayError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6FB]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If already logged in, redirect away
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F4F6FB] px-4 py-8 sm:px-6 text-gray-900">
      {/* Password reset success notification */}
      {location.state?.passwordChanged && !successDismissed && (
        <div className="fixed right-4 top-4 z-50 flex w-72 items-start gap-3 rounded-xl border border-green-200 bg-[#e8f8ed] p-3.5 shadow-lg shadow-green-900/10">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs text-white">
            ✓
          </span>
          <div className="flex-1">
            <p className="text-xs font-semibold text-green-900">
              Success
            </p>
            <p className="text-xs text-green-700 mt-0.5">
              Password has been successfully changed.
            </p>
          </div>
          <button
            type="button"
            aria-label="Dismiss success message"
            onClick={() => {
              setSuccessDismissed(true);
              navigate(location.pathname, {
                replace: true,
                state: {},
              });
            }}
            className="text-sm font-semibold text-green-700/60 hover:text-green-900 transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Login Card */}
      <div className="w-full max-w-[460px] bg-white rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.06)] p-8 sm:p-10 border border-gray-100/80 transition-all duration-300">
        {/* SRI-KO Logo */}
        <div className="flex justify-center mb-4">
          <img
            src="/sri-ko-logo.png"
            alt="SRI-KO Foreign Language Training Center"
            className="h-20 w-auto object-contain"
          />
        </div>

        {/* Title & Subtitle */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-normal">
            Please enter your details to continue
          </p>
        </div>

        {/* Error Notification */}
        {displayError && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 animate-fadeIn">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <span className="font-medium">{displayError}</span>
              {displayError.toLowerCase().includes('admin') && (
                <div className="mt-1">
                  <Link
                    to="/admin/login"
                    className="font-semibold text-blue-700 underline hover:text-blue-800"
                  >
                    Go to Admin Access Portal →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Email Address */}
          <div>
            <label
              htmlFor="email"
              className="block text-[11px] font-bold tracking-wider text-gray-700 uppercase mb-2"
            >
              EMAIL ADDRESS
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="scholar@sriko-editorial.com"
              className="w-full h-11 px-4 bg-[#EAEFF4] border border-transparent rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-colors duration-150"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="password"
                className="block text-[11px] font-bold tracking-wider text-gray-700 uppercase"
              >
                PASSWORD
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full h-11 px-4 bg-[#EAEFF4] border border-transparent rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-colors duration-150"
            />
          </div>

          {/* Remember Me */}
          <div className="flex items-center pt-0.5">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
            />
            <label
              htmlFor="rememberMe"
              className="ml-2.5 text-xs sm:text-sm font-normal text-gray-600 cursor-pointer select-none"
            >
              Remember me for 30 days
            </label>
          </div>

          {/* Sign In Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-[#1E50DC] via-[#4338CA] to-[#8C3CF0] hover:opacity-95 shadow-md shadow-indigo-500/20 active:scale-[0.99] transition-all duration-200 flex items-center justify-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        {/* OR Divider */}
        <div className="my-5 flex items-center justify-center">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="px-3 text-[11px] font-medium uppercase tracking-wider text-gray-400">
            OR
          </span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Google Sign In */}
        <div className="flex justify-center w-full overflow-hidden">
          <GoogleLogin
            onSuccess={handleGoogleCredentialResponse}
            onError={() => setLocalError('Google login failed.')}
            useOneTap={false}
            width="380"
            text="continue_with"
            shape="rectangular"
            theme="outline"
            size="large"
            logo_alignment="left"
          />
        </div>

        {/* Access Admin Portal Button */}
        <div className="mt-5 flex justify-center">
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-2 rounded-full bg-[#EAEFF4] hover:bg-gray-200/80 px-4 py-2 text-xs font-semibold text-gray-700 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5 text-blue-600 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <circle cx="12" cy="11" r="1.5" />
              <path d="M12 12.5V15" />
            </svg>
            Access Admin Portal
          </Link>
        </div>

        {/* Membership Footer */}
        <div className="mt-6 text-center text-xs text-gray-500 font-normal">
          New to the scholar community?{' '}
          <Link
            to="/register"
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            Apply for Membership
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
