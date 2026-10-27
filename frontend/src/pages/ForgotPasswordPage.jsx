import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import apiService from '../services/apiService';

const OTP_LENGTH = 6;

const ForgotPasswordPage = () => {
  const location = useLocation();
  const [initialEmail] = useState(
    () => location.state?.email || sessionStorage.getItem('lastLoginEmail') || '',
  );
  const [email, setEmail] = useState(initialEmail);
  const isAutoFilled = Boolean(initialEmail);
  const [otpSent, setOtpSent] = useState(false);
  const [resetRequestToken, setResetRequestToken] = useState('');
  const [verificationCode, setVerificationCode] = useState(
    () => Array(OTP_LENGTH).fill(''),
  );
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [emailWarning, setEmailWarning] = useState('');
  const otpInputRefs = useRef([]);
  const navigate = useNavigate();

  const isEmailLocked = isAutoFilled || otpSent;

  useEffect(() => {
    if (otpSent) {
      otpInputRefs.current[0]?.focus();
    }
  }, [otpSent]);

  const notifyEmailLocked = () => {
    setEmailWarning(
      'The email must be the same email that you are trying to change the password for.',
    );
  };

  const handleEmailKeyDown = event => {
    if (isEmailLocked) {
      if (['Tab', 'Escape'].includes(event.key)) {
        return;
      }
      event.preventDefault();
      notifyEmailLocked();
    }
  };

  const handleEmailClick = () => {
    if (isEmailLocked) {
      notifyEmailLocked();
    }
  };

  const handleEmailFocus = () => {
    if (isEmailLocked) {
      notifyEmailLocked();
    }
  };

  const handleEmailChange = event => {
    if (isEmailLocked) {
      notifyEmailLocked();
      return;
    }
    setEmail(event.target.value);
  };

  const handleSendOtp = async event => {
    event.preventDefault();
    setError('');
    setMessage('');
    setEmailWarning('');
    try {
      const response = await apiService.post('/auth/forgot-password', { email });
      const requestToken = response.data.resetRequestToken;
      if (!/^[a-f0-9]{64}$/.test(requestToken || '')) {
        setOtpSent(false);
        setVerificationCode(Array(OTP_LENGTH).fill(''));
        throw new Error('Unable to send the verification code.');
      }

      setResetRequestToken(requestToken);
      setOtpSent(true);
      setMessage('If an account exists for this email, a verification code has been sent.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to send the verification code.');
    }
  };

  const focusOtpInput = index => {
    if (index >= 0 && index < OTP_LENGTH) {
      otpInputRefs.current[index]?.focus();
    }
  };

  const updateVerificationCode = (index, value) => {
    setVerificationCode(currentCode => {
      const nextCode = [...currentCode];
      nextCode[index] = value;
      return nextCode;
    });
  };

  const distributeOtp = (value, startIndex = 0) => {
    const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!digits) return;

    setVerificationCode(currentCode => {
      const nextCode = [...currentCode];
      digits.split('').forEach((digit, offset) => {
        const targetIndex = startIndex + offset;
        if (targetIndex < OTP_LENGTH) {
          nextCode[targetIndex] = digit;
        }
      });
      return nextCode;
    });

    focusOtpInput(Math.min(startIndex + digits.length, OTP_LENGTH - 1));
  };

  const handleVerificationChange = (index, value) => {
    if (value.length > 1) {
      distributeOtp(value);
      return;
    }
    if (!/^\d?$/.test(value)) return;

    updateVerificationCode(index, value);
    if (value) {
      focusOtpInput(index + 1);
    }
  };

  const handleVerificationPaste = (event, index) => {
    const pastedValue = event.clipboardData.getData('text');
    if (!/\d/.test(pastedValue)) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    distributeOtp(pastedValue, pastedValue.replace(/\D/g, '').length > 1 ? 0 : index);
  };

  const handleVerificationKeyDown = (event, index) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusOtpInput(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusOtpInput(index + 1);
    } else if (event.key === 'Backspace' && !verificationCode[index]) {
      event.preventDefault();
      focusOtpInput(index - 1);
    }
  };

  const handleVerifyOtp = async event => {
    event.preventDefault();
    if (verificationCode.join('').length !== OTP_LENGTH) return;

    setError('');
    setEmailWarning('');
    try {
      const response = await apiService.post('/auth/verify-reset-otp', {
        resetRequestToken,
        otp: verificationCode.join(''),
      });
      navigate('/reset-password', {
        state: { email: email.trim().toLowerCase(), resetToken: response.data.resetToken },
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Invalid or expired verification code.');
    }
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
          {message && <p className="mt-3 text-center text-xs text-green-700">{message}</p>}
          {error && (
            <p
              id="verification-code-error"
              className="mt-3 text-center text-xs text-red-600"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </p>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSendOtp}>
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="reset-email"
                  className="block text-[10px] font-bold tracking-wider text-gray-600 uppercase"
                >
                  EMAIL ADDRESS
                </label>
                {isEmailLocked && (
                  <span className="flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    Locked
                  </span>
                )}
              </div>
              <div
                className="relative mt-1"
                onClick={handleEmailClick}
              >
                <input
                  id="reset-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="scholar@example.com"
                  value={email}
                  onChange={handleEmailChange}
                  onClick={handleEmailClick}
                  onFocus={handleEmailFocus}
                  onKeyDown={handleEmailKeyDown}
                  readOnly={isEmailLocked}
                  aria-readonly={isEmailLocked}
                  aria-describedby={
                    emailWarning ? 'email-locked-warning' : undefined
                  }
                  title={
                    isEmailLocked
                      ? 'The email must be the same email that you are trying to change the password for.'
                      : undefined
                  }
                  className={`w-full rounded-md border border-transparent px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-colors ${
                    isEmailLocked
                      ? 'cursor-not-allowed bg-gray-100 pr-10 text-gray-600 focus:border-gray-300 focus:bg-gray-100 focus:ring-0 select-none'
                      : 'bg-gray-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'
                  }`}
                />
                {isEmailLocked && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              {emailWarning && (
                <p
                  id="email-locked-warning"
                  className="mt-1.5 flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800"
                  role="alert"
                  aria-live="polite"
                >
                  <svg
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span>{emailWarning}</span>
                </p>
              )}
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
                id="verification-code-label"
                htmlFor="verification-code-1"
                className="block text-center text-[10px] font-bold tracking-wider text-gray-600"
              >
                VERIFICATION CODE
              </label>
              <div
                className="mt-2 flex justify-center gap-2 sm:gap-4"
                role="group"
                aria-labelledby="verification-code-label"
              >
                {Array.from({ length: OTP_LENGTH }, (_, index) => (
                  <input
                    key={index}
                    ref={input => {
                      otpInputRefs.current[index] = input;
                    }}
                    id={`verification-code-${index + 1}`}
                    name={`verificationCode-${index + 1}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    pattern="[0-9]*"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    aria-label={`Verification code digit ${index + 1}`}
                    aria-describedby={error ? 'verification-code-error' : undefined}
                    value={verificationCode[index]}
                    onChange={event =>
                      handleVerificationChange(index, event.target.value)
                    }
                    onPaste={event => handleVerificationPaste(event, index)}
                    onKeyDown={event => handleVerificationKeyDown(event, index)}
                    className="h-10 w-10 rounded-md border border-transparent bg-gray-200 text-center text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={!otpSent || verificationCode.join('').length !== OTP_LENGTH}
              className="w-full rounded-md bg-linear-to-r from-blue-700 to-purple-600 py-2 text-xs font-medium text-white shadow-md transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
