import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

const PricingPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [billingCycle, setBillingCycle] = useState('monthly');

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for individual learners and small institutions',
      monthlyPrice: 0,
      yearlyPrice: 0,
      currency: 'LKR',
      period: billingCycle === 'monthly' ? 'month' : 'year',
      features: [
        'Up to 5 courses',
        'Basic course creation tools',
        'Student progress tracking',
        'Email support',
        'Basic analytics',
        'Mobile app access',
        'Certificate generation',
        'Up to 50 students',
      ],
      limitations: [
        'Limited customization options',
        'Basic reporting only',
        'No priority support',
      ],
      popular: false,
      cta: 'Get Started Free',
      color: 'blue',
    },
    {
      name: 'Pro',
      description: 'Ideal for growing institutions and training centers',
      monthlyPrice: 15000,
      yearlyPrice: 150000, // 2 months free
      currency: 'LKR',
      period: billingCycle === 'monthly' ? 'month' : 'year',
      features: [
        'Unlimited courses',
        'Advanced course creation tools',
        'Comprehensive analytics & reporting',
        'Priority email support',
        'Custom branding',
        'Advanced student management',
        'Bulk student enrollment',
        'Advanced certificate templates',
        'Up to 500 students',
        'API access',
        'Integration with external tools',
        'Advanced progress tracking',
      ],
      limitations: [
        'No phone support',
        'Limited custom integrations',
      ],
      popular: true,
      cta: 'Start Pro Trial',
      color: 'purple',
    },
    {
      name: 'Premium',
      description: 'Complete solution for large institutions and enterprises',
      monthlyPrice: 35000,
      yearlyPrice: 350000, // 2 months free
      currency: 'LKR',
      period: billingCycle === 'monthly' ? 'month' : 'year',
      features: [
        'Everything in Pro',
        'Unlimited students',
        'White-label solution',
        '24/7 phone & chat support',
        'Custom integrations',
        'Advanced security features',
        'SSO integration',
        'Custom domain',
        'Advanced user roles',
        'Bulk operations',
        'Advanced reporting & analytics',
        'Dedicated account manager',
        'Custom training & onboarding',
        'SLA guarantee',
        'Data export/import tools',
      ],
      limitations: [],
      popular: false,
      cta: 'Contact Sales',
      color: 'green',
    },
  ];

  const formatPrice = (price) => {
    if (price === 0) return 'Free';
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: 'bg-blue-600',
        hover: 'hover:bg-blue-700',
        text: 'text-blue-600',
        border: 'border-blue-600',
        ring: 'ring-blue-600',
        badge: 'bg-blue-100 text-blue-800',
      },
      purple: {
        bg: 'bg-purple-600',
        hover: 'hover:bg-purple-700',
        text: 'text-purple-600',
        border: 'border-purple-600',
        ring: 'ring-purple-600',
        badge: 'bg-purple-100 text-purple-800',
      },
      green: {
        bg: 'bg-green-600',
        hover: 'hover:bg-green-700',
        text: 'text-green-600',
        border: 'border-green-600',
        ring: 'ring-green-600',
        badge: 'bg-green-100 text-green-800',
      },
    };
    return colors[color] || colors.blue;
  };

  const handlePlanSelect = (plan) => {
    if (plan.name === 'Starter') {
      // Redirect to registration or dashboard
      if (isAuthenticated) {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/register';
      }
    } else if (plan.name === 'Pro') {
      // Start Pro trial
      if (isAuthenticated) {
        // Redirect to payment page
        window.location.href = `/payment?plan=${plan.name.toLowerCase()}&billing=${billingCycle}`;
      } else {
        window.location.href = '/register';
      }
    } else {
      // Contact sales for Premium
      window.location.href = 'mailto:sales@sri-ko-lms.com?subject=Premium Plan Inquiry';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Choose Your Perfect Plan
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Transform your institution with our comprehensive learning management system. 
              Start free or upgrade to unlock advanced features.
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center mb-12">
              <span className={`text-lg font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-blue-200'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className="mx-4 relative inline-flex h-6 w-11 items-center rounded-full bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
              >
                <span
                  className={`${
                    billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </button>
              <span className={`text-lg font-medium ${billingCycle === 'yearly' ? 'text-white' : 'text-blue-200'}`}>
                Yearly
              </span>
              {billingCycle === 'yearly' && (
                <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Save 17%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const colors = getColorClasses(plan.color);
            const currentPrice = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
            
            return (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl shadow-xl border-2 ${
                  plan.popular ? `${colors.border} ring-2 ${colors.ring}` : 'border-gray-200'
                } overflow-hidden`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0">
                    <div className={`${colors.bg} text-white text-center py-2 text-sm font-medium`}>
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className={`p-8 ${plan.popular ? 'pt-12' : ''}`}>
                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-6">{plan.description}</p>
                    
                    {/* Price */}
                    <div className="mb-6">
                      <span className="text-5xl font-bold text-gray-900">
                        {formatPrice(currentPrice)}
                      </span>
                      {currentPrice > 0 && (
                        <span className="text-gray-600 ml-2">/{plan.period}</span>
                      )}
                    </div>
                    
                    {/* CTA Button */}
                    <button
                      onClick={() => handlePlanSelect(plan)}
                      className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
                        plan.name === 'Starter'
                          ? 'bg-gray-600 hover:bg-gray-700'
                          : `${colors.bg} ${colors.hover}`
                      }`}
                    >
                      {plan.cta}
                    </button>
                  </div>

                  {/* Features */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 mb-4">What's included:</h4>
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                    
                    {plan.limitations.length > 0 && (
                      <>
                        <h4 className="font-semibold text-gray-900 mb-4 mt-6">Limitations:</h4>
                        {plan.limitations.map((limitation, index) => (
                          <div key={index} className="flex items-start">
                            <XMarkIcon className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                            <span className="text-gray-500">{limitation}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Compare All Features
          </h2>
          <p className="text-xl text-gray-600">
            See exactly what each plan includes
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Features
                  </th>
                  {plans.map((plan) => (
                    <th key={plan.name} className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { feature: 'Number of Courses', starter: 'Up to 5', pro: 'Unlimited', premium: 'Unlimited' },
                  { feature: 'Number of Students', starter: 'Up to 50', pro: 'Up to 500', premium: 'Unlimited' },
                  { feature: 'Course Creation Tools', starter: 'Basic', pro: 'Advanced', premium: 'Advanced' },
                  { feature: 'Analytics & Reporting', starter: 'Basic', pro: 'Comprehensive', premium: 'Advanced' },
                  { feature: 'Custom Branding', starter: 'No', pro: 'Yes', premium: 'Yes' },
                  { feature: 'API Access', starter: 'No', pro: 'Yes', premium: 'Yes' },
                  { feature: 'White-label Solution', starter: 'No', pro: 'No', premium: 'Yes' },
                  { feature: '24/7 Support', starter: 'No', pro: 'No', premium: 'Yes' },
                  { feature: 'SSO Integration', starter: 'No', pro: 'No', premium: 'Yes' },
                  { feature: 'Custom Domain', starter: 'No', pro: 'No', premium: 'Yes' },
                  { feature: 'Dedicated Account Manager', starter: 'No', pro: 'No', premium: 'Yes' },
                ].map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {row.feature}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-600">
                      {row.starter}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-600">
                      {row.pro}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-600">
                      {row.premium}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about our pricing
          </p>
        </div>

        <div className="space-y-8">
          {[
            {
              question: 'Can I change my plan at any time?',
              answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle, and we\'ll prorate any differences.',
            },
            {
              question: 'What payment methods do you accept?',
              answer: 'We accept all major credit cards, bank transfers, and digital wallets. For enterprise customers, we also offer invoice-based billing.',
            },
            {
              question: 'Is there a setup fee?',
              answer: 'No, there are no setup fees for any of our plans. You only pay the monthly or yearly subscription fee.',
            },
            {
              question: 'Do you offer discounts for educational institutions?',
              answer: 'Yes, we offer special educational discounts for schools, universities, and non-profit organizations. Contact our sales team for more information.',
            },
            {
              question: 'What happens if I exceed my plan limits?',
              answer: 'We\'ll notify you when you\'re approaching your limits. You can upgrade your plan or purchase additional capacity as needed.',
            },
            {
              question: 'Can I cancel my subscription anytime?',
              answer: 'Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.',
            },
          ].map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {faq.question}
              </h3>
              <p className="text-gray-600">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
