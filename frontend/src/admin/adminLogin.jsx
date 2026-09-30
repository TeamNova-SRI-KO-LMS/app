import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../context/useAuth';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [localError, setLocalError] = useState('');

  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (localError) setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    try {
      const result = await login(formData.email, formData.password);
      if (result?.success) {
        if (result.user && result.user.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      } else {
        setLocalError(result?.error || 'Invalid email or password.');
      }
    } catch (err) {
      setLocalError(err?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F4F6FB] px-4 py-8 sm:px-6">
      <div className="w-full max-w-[430px] bg-white rounded-2xl shadow-[0_12px_45px_rgba(0,0,0,0.07)] p-8 sm:p-10 border border-gray-100/80 transition-all duration-300">
        {/* Logo Section */}
        <div className="flex justify-center mb-5">
          <img
            src="/sri-ko-logo.png"
            alt="SRI-KO Logo"
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Title & Subtitle */}
        <div className="text-center mb-7">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Please enter your details to continue
          </p>
        </div>

        {/* Error Alert if any */}
        {localError && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2 animate-fadeIn">
            <svg
              className="w-4 h-4 shrink-0 text-red-500"
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
            <span>{localError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full px-4 py-3 bg-[#EAEFF4] border border-transparent rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-colors duration-150"
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
              className="w-full px-4 py-3 bg-[#EAEFF4] border border-transparent rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-colors duration-150"
            />
          </div>

          {/* Remember Me */}
          <div className="flex items-center pt-1">
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
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-[#1E50DC] via-[#4338CA] to-[#8C3CF0] hover:opacity-95 shadow-md shadow-indigo-500/20 active:scale-[0.99] transition-all duration-200 flex items-center justify-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
      </div>
    </div>
  );
};

export default AdminLogin;
