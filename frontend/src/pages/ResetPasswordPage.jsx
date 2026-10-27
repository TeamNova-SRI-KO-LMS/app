import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';

const EyeIcon = ({ hidden = false }) => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    {hidden ? (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.58 10.58a2 2 0 002.84 2.84M9.88 4.24A10.7 10.7 0 0112 4c5 0 8.5 4 9.5 8a10.7 10.7 0 01-3.06 4.7M6.1 6.1C3.96 7.5 2.72 9.53 2.5 12c.37 1.44 1.18 2.87 2.42 4.1"
        />
      </>
    ) : (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.5 12S6 4 12 4s9.5 8 9.5 8-3.5 8-9.5 8-9.5-8-9.5-8z"
        />
        <circle cx="12" cy="12" r="2.5" />
      </>
    )}
  </svg>
);

const LockIcon = () => (
  <svg
    aria-hidden="true"
    className="h-3.5 w-3.5 text-gray-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <rect x="5" y="10" width="14" height="10" rx="1.5" />
    <path strokeLinecap="round" d="M8 10V7a4 4 0 018 0v3" />
  </svg>
);

const ResetPasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const email = location.state?.email || 'Testuser@example.com';
  const resetToken = location.state?.resetToken;
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async event => {
    event.preventDefault();
    if (password.length < 6 || password !== confirmPassword) return;
    if (!resetToken) {
      setError('Your verification session is missing. Please request a new code.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await apiService.post('/auth/reset-password', { resetToken, password });
      navigate('/login', { replace: true, state: { passwordChanged: true } });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to reset your password.');
    } finally {
      setSubmitting(false);
    }
  };

  const passwordInput = (
    value,
    setValue,
    visible,
    setVisible,
    id,
    placeholder,
  ) => (
    <div className="relative mt-1">
      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
        <LockIcon />
      </div>
      <input
        id={id}
        name={id}
        type={visible ? 'text' : 'password'}
        required
        minLength={6}
        value={value}
        onChange={event => setValue(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-transparent bg-[#EAEFF4] pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
      />
      <button
        type="button"
        aria-label={visible ? `Hide ${id}` : `Show ${id}`}
        onClick={() => setVisible(current => !current)}
        className="absolute inset-y-0 right-2.5 flex items-center text-gray-400 hover:text-gray-600"
      >
        <EyeIcon hidden={!visible} />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#F4F6FB] px-4 py-8 text-gray-900 sm:px-6">
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <section className="w-full max-w-[460px] rounded-2xl border border-gray-100/80 bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] sm:rounded-3xl sm:p-10">
          <div className="mb-4 flex justify-center">
            <img
              src="/sri-ko-logo.png"
              alt="SRI-KO Foreign Language Training Center"
              className="h-20 w-auto object-contain"
            />
          </div>

          <h1 className="text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-[26px]">
            Reset Your Password
          </h1>
          <p className="mt-1 text-center text-sm text-gray-500">{email}</p>
          {error && <p className="mt-4 text-center text-xs text-red-600">{error}</p>}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="block text-[11px] font-bold uppercase tracking-wider text-gray-700">
                Password
              </label>
              {passwordInput(
                password,
                setPassword,
                showPassword,
                setShowPassword,
                'password',
                'Create a password',
              )}
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-[11px] font-bold uppercase tracking-wider text-gray-700">
                Confirm Password
              </label>
              {passwordInput(
                confirmPassword,
                setConfirmPassword,
                showConfirmPassword,
                setShowConfirmPassword,
                'confirm-password',
                'Repeat password',
              )}
            </div>
            <button
              type="submit"
              disabled={submitting || password.length < 6 || password !== confirmPassword}
              className="mt-1 h-11 w-full rounded-xl bg-linear-to-r from-blue-700 to-purple-600 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <Link
            to="/login"
            className="mt-5 block text-center text-xs text-gray-500 hover:text-blue-700"
          >
            <span aria-hidden="true">←</span> Back to Sign In
          </Link>
        </section>
      </main>
    </div>
  );
};

export default ResetPasswordPage;
