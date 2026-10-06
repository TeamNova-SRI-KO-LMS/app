import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Lock,
  BookOpen,
  Clock,
  Award,
  CreditCard,
  Loader2,
  Users,
  AlertCircle,
} from 'lucide-react';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = loadStripe(publishableKey);

function CheckoutForm({ course, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();

  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [cardholderName, setCardholderName] = useState(user?.name || '');

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error('Payment processor is loading. Please try again in a few seconds.');
      return;
    }

    if (!cardholderName.trim()) {
      toast.error('Please enter the cardholder name.');
      return;
    }

    if (!email.trim()) {
      toast.error('Please enter your email address.');
      return;
    }

    setProcessing(true);
    setErrorMessage('');

    try {
      // 1. Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: window.location.href,
          payment_method_data: {
            billing_details: {
              name: cardholderName.trim(),
              email: email.trim(),
            },
          },
        },
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed. Please check your card information.');
        toast.error(error.message || 'Payment could not be processed.');
        setProcessing(false);
        return;
      }

      // 2. If payment succeeded, confirm enrollment on the backend
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
        const confirmRes = await fetch(`${import.meta.env.VITE_API_URL}/payments/confirm-course-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            courseId: course._id,
          }),
        });

        const confirmData = await confirmRes.json();
        if (confirmData.success) {
          toast.success('Payment successful! Welcome to the course!');
          onSuccess();
        } else {
          toast.error(confirmData.message || 'Enrollment confirmation failed. Please contact support.');
          setErrorMessage(confirmData.message || 'Course enrollment could not be confirmed.');
        }
      } else {
        setErrorMessage('Payment requires additional steps or is still processing.');
      }
    } catch (err) {
      console.error('Payment confirmation error:', err);
      const msg = err.message || 'An unexpected error occurred during payment processing.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
          Billing Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@example.com"
          required
          className="w-full bg-gray-50 text-gray-900 rounded-xl px-4 py-3 text-sm font-medium outline-none border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
          Cardholder Name
        </label>
        <input
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="Name on credit or debit card"
          required
          className="w-full bg-gray-50 text-gray-900 rounded-xl px-4 py-3 text-sm font-medium outline-none border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
          Card Details
        </label>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl shadow-inner">
          <PaymentElement
            id="payment-element"
            options={{
              layout: 'tabs',
              defaultValues: {
                billingDetails: {
                  name: cardholderName,
                  email: email,
                },
              },
            }}
          />
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5">Order Total</p>
            <p className="text-sm font-semibold text-gray-800 line-clamp-1">{course.title}</p>
          </div>
          <p className="text-2xl font-black text-gray-900 ml-4 shrink-0">{formatPrice(course.price)}</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={processing || !stripe || !elements}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98] text-base cursor-pointer"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing Payment...</span>
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            <span>Pay {formatPrice(course.price)} Securely</span>
          </>
        )}
      </button>

      <p className="text-center text-[11px] text-gray-400 leading-relaxed">
        Payments are encrypted and processed by Stripe. SRI-KO never stores your sensitive payment card details.
      </p>
    </form>
  );
}

function PaymentSuccess({ course }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 max-w-lg w-full text-center border border-emerald-100">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-500 text-sm mb-2">You are officially enrolled in</p>
        <p className="text-xl font-bold text-blue-600 mb-8">{course?.title}</p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: BookOpen, label: 'Full Access' },
            { icon: Award, label: 'Certificate' },
            { icon: Clock, label: 'Self-Paced' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="bg-gray-50 rounded-2xl p-3 flex flex-col items-center gap-2 border border-gray-100">
              <Icon className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-semibold text-gray-700">{label}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate(`/course-info/${course?._id || ''}`)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl hover:opacity-95 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
          >
            Start Learning Now
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gray-100 text-gray-700 font-semibold py-3.5 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Go to My Dashboard
          </button>
          <button
            onClick={() => navigate('/courses')}
            className="w-full text-gray-500 hover:text-gray-700 text-xs font-medium py-2 transition-colors cursor-pointer"
          >
            Browse More Courses
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentInfoPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const courseId = searchParams.get('courseId');

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState('');

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to purchase this course');
      navigate('/login');
      return;
    }
    if (!courseId) {
      navigate('/courses');
      return;
    }
    createPaymentIntent();
  }, [courseId, isAuthenticated]);

  const createPaymentIntent = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/create-course-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.message === 'You are already enrolled in this course') {
          toast.success('You are already enrolled in this course!');
          navigate(`/course-info/${courseId}`);
          return;
        }
        if (data.isFree) {
          toast.success('This course is free!');
          navigate(`/courses/${courseId}`);
          return;
        }
        setError(data.message || 'Failed to initialize payment gateway');
        return;
      }

      setCourse(data.course);
      setClientSecret(data.clientSecret);
    } catch (err) {
      console.error('Error creating payment intent:', err);
      setError('Unable to connect to the payment service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (paymentSuccess) {
    return <PaymentSuccess course={course} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-gray-100 max-w-sm w-full mx-4">
          <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
          <h3 className="text-gray-900 font-bold text-lg mb-1">Initializing Secure Checkout</h3>
          <p className="text-gray-500 text-sm">Connecting with Stripe...</p>
          <div className="flex items-center justify-center gap-1.5 mt-4 text-xs font-semibold text-gray-400">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span>256-bit SSL Protected</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center border border-gray-100">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Checkout Notice</h2>
          <p className="text-gray-600 text-sm mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={createPaymentIntent}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm cursor-pointer"
            >
              Try Again
            </button>
            <Link
              to="/courses"
              className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-200 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const levelColors = {
    beginner: 'bg-emerald-100 text-emerald-700',
    intermediate: 'bg-amber-100 text-amber-700',
    advanced: 'bg-purple-100 text-purple-700',
  };

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#2563eb',
      colorBackground: '#f9fafb',
      colorText: '#1f2937',
      colorDanger: '#ef4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: '12px',
      spacingUnit: '4px',
    },
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            to={`/courses/${courseId}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course Details
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-gray-700">Guaranteed Safe Checkout</span>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-start">
          {/* Left Column: Course Summary & Benefits */}
          <div className="w-full lg:flex-1">
            {course?.level && (
              <span
                className={`inline-block text-[11px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider mb-4 ${
                  levelColors[course.level] || 'bg-gray-100 text-gray-700'
                }`}
              >
                {course.level} Level
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-gray-900 mb-3">
              {course?.title}
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed mb-6 max-w-xl">
              {course?.description}
            </p>

            <div className="flex items-baseline gap-3 mb-8 pb-6 border-b border-gray-200">
              <span className="text-4xl font-black text-gray-900">{formatPrice(course?.price)}</span>
              <span className="text-sm font-medium text-gray-500">One-time payment • Lifetime access</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="flex items-center gap-3 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs">
                <Clock className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Duration</p>
                  <p className="font-semibold">{course?.duration || 8} weeks</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs">
                <BookOpen className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Pace</p>
                  <p className="font-semibold">Self-paced learning</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-gray-200">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">
                What is Included with Your Enrollment
              </h3>
              <ul className="space-y-4">
                {[
                  {
                    icon: CheckCircle2,
                    title: 'Unlimited Lifetime Access',
                    desc: 'Rewatch video lessons and re-attempt practice exercises anytime.',
                  },
                  {
                    icon: Award,
                    title: 'Official SRI-KO Certificate',
                    desc: 'Digital completion certificate recognized for Korean language competency.',
                  },
                  {
                    icon: BookOpen,
                    title: 'Downloadable Resources',
                    desc: 'Vocabulary sheets, grammar guides, and MP3 audio files included.',
                  },
                  {
                    icon: Users,
                    title: 'Instructor Support & Community',
                    desc: 'Direct Q&A access and collaboration with fellow Korean learners.',
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <li key={title} className="flex items-start gap-3.5">
                    <div className="mt-0.5 shrink-0 bg-emerald-50 p-1 rounded-full">
                      <Icon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm leading-tight">{title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-2 mt-6 text-gray-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-medium">PCI-DSS compliant 256-bit encrypted Stripe gateway</span>
            </div>
          </div>

          {/* Right Column: Stripe Checkout Card */}
          <div className="w-full lg:w-[480px] shrink-0">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-gray-200/70 border border-gray-100">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/20">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Secure Payment</h2>
                    <p className="text-xs text-gray-400">Powered by Stripe</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-[11px] font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>256-Bit SSL</span>
                </div>
              </div>

              {clientSecret && (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance,
                  }}
                >
                  <CheckoutForm
                    course={course}
                    clientSecret={clientSecret}
                    onSuccess={() => setPaymentSuccess(true)}
                  />
                </Elements>
              )}
            </div>

            {/* Accepted Cards Logos */}
            <div className="flex justify-center items-center gap-2.5 mt-5 opacity-75">
              <div className="bg-white border border-gray-200 rounded px-2.5 py-1 text-[10px] font-black italic text-blue-900 shadow-2xs">
                VISA
              </div>
              <div className="bg-white border border-gray-200 rounded px-2.5 py-1 text-[10px] font-black text-red-600 shadow-2xs">
                Mastercard
              </div>
              <div className="bg-white border border-gray-200 rounded px-2.5 py-1 text-[10px] font-black text-blue-600 shadow-2xs">
                AMEX
              </div>
              <div className="bg-white border border-gray-200 rounded px-2.5 py-1 text-[10px] font-black text-yellow-600 shadow-2xs">
                Discover
              </div>
              <div className="bg-white border border-gray-200 rounded px-2.5 py-1 text-[10px] font-black text-emerald-600 shadow-2xs">
                UnionPay
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
