import { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../context/useAuth';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [successDismissed, setSuccessDismissed] = useState(false);

  const { login, googleLogin, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/home';

  useEffect(() => {
    if (location.state?.passwordChanged) {
      const timeoutId = window.setTimeout(() => {
        setSuccessDismissed(true);
        navigate(location.pathname, { replace: true, state: {} });
      }, 5000);
      return () => window.clearTimeout(timeoutId);
    }
    return undefined;
  }, [location.pathname, location.state, navigate]);

  const handleChange = event => {
    const { name, value, type, checked } = event.target;
    setFormData(current => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    const result = await login(formData.email, formData.password);
    if (result.success) {
      navigate(
        result.user?.role === 'admin' ? '/admin/dashboard' : from,
        { replace: true },
      );
    }
  };

  const handleGoogleCredentialResponse = async credentialResponse => {
    if (typeof googleLogin !== 'function') {
      console.error('Google login is not configured');
      return;
    }

    const result = await googleLogin(credentialResponse.credential);
    if (result.success) {
      navigate(
        result.user?.role === 'admin' ? '/admin/dashboard' : from,
        { replace: true },
      );
    }
  };

  return (
    <div className="min-h-screen overflow-auto bg-[#f7f8fc] px-4 py-8 text-gray-900 sm:py-10">
      {location.state?.passwordChanged && !successDismissed && (
        <div className="fixed right-4 top-3 z-10 flex w-56 items-start gap-2 rounded-lg border border-green-100 bg-[#e8f8ed] px-3 py-2.5 shadow-[0_5px_15px_rgba(40,120,70,0.12)]">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-[10px] text-white">
            ✓
          </span>
          <div className="flex-1">
            <p className="text-[10px] font-semibold text-green-800">Success</p>
            <p className="text-[8px] text-green-700">Password changed</p>
          </div>
          <button
            type="button"
            aria-label="Dismiss success message"
            onClick={() => {
              setSuccessDismissed(true);
              navigate(location.pathname, { replace: true, state: {} });
            }}
            className="text-xs text-green-700/50 hover:text-green-700"
          >
            ×
          </button>
        </div>
      )}

      <main className="mx-auto flex w-full max-w-62.5 flex-col items-center sm:max-w-67.5">
        <header className="w-full bg-white px-4 pb-2 pt-2 text-center">
          <img
            src="/sri-ko-logo.png"
            alt="SRI-KO Foreign Language Training Center"
            className="mx-auto h-16 w-auto object-contain"
          />
          <p className="mt-1 text-[9px] text-gray-700">
            Elevate your linguistic scholarship
          </p>
        </header>

        <section className="w-full rounded-b-lg bg-white px-5 pb-4 pt-4 shadow-[0_10px_25px_rgba(45,55,90,0.07)]">
          <h1 className="text-[15px] font-semibold text-gray-900">Welcome back</h1>
          <p className="mt-0.5 text-[9px] text-gray-500">
            Please enter your details to continue
          </p>

          {error && (
            <p className="mt-3 rounded-md bg-red-50 px-2 py-1.5 text-[9px] text-red-600">
              {error}
            </p>
          )}

          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-[8px] font-bold tracking-wide text-gray-700"
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
                className="mt-1 h-7 w-full rounded-md border border-transparent bg-gray-200 px-2.5 text-[9px] text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-200"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-[8px] font-bold tracking-wide text-gray-700"
                >
                  PASSWORD
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[8px] font-semibold text-blue-700 hover:underline"
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
                className="mt-1 h-7 w-full rounded-md border border-transparent bg-gray-200 px-2.5 text-[9px] text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-200"
              />
            </div>

            <label className="flex items-center gap-1.5 pt-0.5 text-[8px] text-gray-700">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="h-3 w-3 rounded border-gray-300 accent-blue-600"
              />
              Remember me for 30 days
            </label>

            <button
              type="submit"
              disabled={loading}
              className="h-8 w-full rounded-md bg-linear-to-r from-blue-700 via-indigo-600 to-purple-600 text-[10px] font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="my-4 flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[7px] text-gray-500">OR</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="flex justify-center overflow-hidden rounded-md border border-gray-200">
            <GoogleLogin
              onSuccess={handleGoogleCredentialResponse}
              onError={() => console.error('Google login failed')}
              useOneTap={false}
              width="205"
              text="continue_with"
              shape="rectangular"
              logo_alignment="left"
            />
          </div>

          <div className="mt-4 text-center">
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-[8px] font-medium text-gray-700 hover:bg-gray-200"
            >
              <span className="text-blue-600">◉</span> Access Admin Portal
            </Link>
          </div>
        </section>

        <p className="mt-8 text-center text-[8px] text-gray-500">
          New to the scholar community?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">
            Apply for Membership
          </Link>
        </p>
        <p className="mt-8 text-[7px] uppercase tracking-[0.16em] text-gray-500">
          © 2024 SRI-KO Editorial Scholar. All rights reserved.
        </p>
      </main>
    </div>
  );
};

export default LoginPage;
