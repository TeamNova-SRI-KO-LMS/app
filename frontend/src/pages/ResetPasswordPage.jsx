import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

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

  const handleSubmit = event => {
    event.preventDefault();
    if (password.length < 6 || password !== confirmPassword) return;
    navigate('/login', {
      replace: true,
      state: { passwordChanged: true },
    });
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
        className="h-10 w-full rounded-md border border-transparent bg-gray-200 pl-8 pr-9 text-[10px] text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
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
    <div className="min-h-screen bg-[#f7f8fc]">
      <main className="flex min-h-[calc(100vh-78px)] items-center justify-center px-4 py-10">
        <section className="w-full max-w-59 rounded-md bg-white px-6 py-5 shadow-[0_10px_25px_rgba(45,55,90,0.08)] sm:max-w-67.5">
          <div className="flex justify-center">
            <img
              src="/sri-ko-logo.png"
              alt="SRI-KO Foreign Language Training Center"
              className="h-12 w-auto object-contain"
            />
          </div>

          <h1 className="mt-2 text-center text-[12px] font-bold text-gray-900">
            Reset Your Password
          </h1>
          <p className="mt-1 text-center text-[9px] text-gray-500">{email}</p>

          <form className="mt-4 space-y-2.5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="block text-[8px] font-medium text-gray-600">
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
              <label htmlFor="confirm-password" className="block text-[8px] font-medium text-gray-600">
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
              disabled={password.length < 6 || password !== confirmPassword}
              className="mt-1 h-8 w-full rounded-md bg-linear-to-r from-blue-700 to-purple-600 text-[10px] font-semibold text-white shadow-md transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset Password
            </button>
          </form>

          <Link
            to="/login"
            className="mt-4 block text-center text-[9px] text-gray-500 hover:text-blue-700"
          >
            <span aria-hidden="true">←</span> Back to Sign In
          </Link>
        </section>
      </main>
    </div>
  );
};

export default ResetPasswordPage;
