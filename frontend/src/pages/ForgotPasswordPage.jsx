import { Link } from 'react-router-dom';
import { useState } from 'react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOtp = event => {
    event.preventDefault();
    setOtpSent(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10">
        <div className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-purple-100/70 blur-3xl" />

        <section className="relative w-full max-w-md rounded-xl bg-white px-6 py-6 shadow-lg sm:px-8">
          <div className="flex justify-center">
            <img
              src="/sri-ko-logo.png"
              alt="SRI-KO Foreign Language Training Center"
              className="h-14 w-auto object-contain"
            />
          </div>

          <h1 className="mt-4 text-center text-xl font-bold text-gray-900">
            Reset Your Password
          </h1>
          <p className="mt-1 text-center text-xs text-gray-500">
            Enter your email address to receive a one-time verification code.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSendOtp}>
            <div>
              <label
                htmlFor="reset-email"
                className="block text-[10px] font-bold tracking-wider text-gray-600"
              >
                EMAIL ADDRESS
              </label>
              <input
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="scholar@example.com"
                value={email}
                onChange={event => setEmail(event.target.value)}
                disabled={otpSent}
                className="mt-1 w-full rounded-md border border-transparent bg-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <button
              type="submit"
              disabled={otpSent}
              className={`w-full rounded-md py-2 text-xs font-medium text-white shadow-md transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                otpSent
                  ? 'cursor-default bg-linear-to-r from-green-600 to-green-900'
                  : 'bg-linear-to-r from-blue-700 to-purple-600 hover:opacity-90 focus:ring-blue-500'
              }`}
            >
              {otpSent ? 'OTP Sent' : 'Send OTP'}
              {!otpSent && <span aria-hidden="true"> →</span>}
            </button>

            <div className="flex items-center gap-3 pt-1">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-[8px] font-medium uppercase text-gray-400">
                Verification
              </span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <div>
              <label
                htmlFor="verification-code"
                className="block text-center text-[10px] font-bold tracking-wider text-gray-600"
              >
                VERIFICATION CODE
              </label>
              <div className="mt-2 flex justify-center gap-4">
                {[0, 1, 2, 3].map(index => (
                  <input
                    key={index}
                    id={index === 0 ? 'verification-code' : undefined}
                    name={`verificationCode-${index + 1}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    aria-label={`Verification code digit ${index + 1}`}
                    className="h-10 w-10 rounded-md border border-transparent bg-gray-200 text-center text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              className="w-full rounded-md bg-linear-to-r from-blue-700 to-purple-600 py-2 text-xs font-medium text-white shadow-md transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Submit
            </button>
          </form>

          <Link
            to="/login"
            className="mt-5 block text-center text-xs text-gray-600 hover:text-blue-700"
          >
            <span aria-hidden="true">←</span> Back to Sign In
          </Link>
        </section>
      </main>

      <footer className="bg-slate-50 pb-6 text-center text-[9px] text-gray-400">
        <p className="mb-6 uppercase tracking-widest">
          🔒 Secure Encryption &nbsp; | &nbsp; 🛡 Privacy Protected
        </p>
        <p>© 2024 SRI-KO Academic Institute. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default ForgotPasswordPage;
