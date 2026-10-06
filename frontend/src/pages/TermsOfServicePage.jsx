import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Check,
  CreditCard,
  RotateCcw,
  ChevronRight,
  Clock,
  Scale,
  Mail,
  MessageSquare,
  MapPin,
  ChevronDown
} from 'lucide-react';

const TermsOfServicePage = () => {
  const [activeSection, setActiveSection] = useState('acceptance');
  const [expandedPayment, setExpandedPayment] = useState(null);

  const sections = [
    { id: 'acceptance', label: 'Acceptance of Terms' },
    { id: 'responsibilities', label: 'User Responsibilities' },
    { id: 'services', label: 'Educational Services' },
    { id: 'payments', label: 'Payment & Refunds' },
    { id: 'intellectual-property', label: 'Intellectual Property' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const togglePaymentItem = (key) => {
    setExpandedPayment(expandedPayment === key ? null : key);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-12">
          <div className="max-w-xl">
            {/* Legal documentation badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100/80 text-blue-600 text-xs font-bold tracking-wider uppercase mb-5">
              <Scale className="w-3.5 h-3.5 text-blue-600" />
              <span>LEGAL DOCUMENTATION</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Terms of <span className="text-blue-600">Service</span>
            </h1>

            {/* Description */}
            <p className="text-slate-600 text-base leading-relaxed mb-6 font-normal">
              Welcome to SRI-KO. Our commitment to high-end educational excellence is governed by the following professional standards and agreements.
            </p>

            {/* Last Updated */}
            <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Last updated: April 30, 2026</span>
            </div>
          </div>

          {/* Glowing Shield Icon Card */}
          <div className="w-full lg:w-auto flex justify-center lg:justify-end">
            <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-xl shadow-indigo-500/20 flex items-center justify-center relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute inset-0 bg-white/10 opacity-30 group-hover:opacity-40 transition-opacity" />
              <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-inner">
                <svg
                  className="w-7 h-7 sm:w-9 sm:h-9 lg:w-11 lg:h-11 text-white drop-shadow-md"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4a3.5 3.5 0 110 7 3.5 3.5 0 010-7zm0 14c-2.7 0-5.8-1.27-7-3.23.03-1.99 4-3.08 7-3.08 2.99 0 6.97 1.09 7 3.08-1.2 1.96-4.3 3.23-7 3.23z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout with Sticky Sidebar on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar - Jump to section */}
          <div className="lg:col-span-3 lg:sticky lg:top-24">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/80 shadow-sm">
              <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-3 px-3">
                JUMP TO SECTION
              </p>
              <nav className="space-y-1">
                {sections.map((section) => {
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-between ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 shadow-sm border-l-4 border-blue-600 pl-3'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span>{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content Column */}
          <div className="lg:col-span-9 space-y-8">
            {/* Section 1: Acceptance of Terms */}
            <section
              id="acceptance"
              className="bg-white rounded-[2rem] p-8 sm:p-10 border border-slate-100 shadow-sm transition-all"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Acceptance of Terms
              </h2>
              <p className="text-slate-500 font-medium text-sm sm:text-base mt-1 mb-8">
                Agreement between SRI-KO and the Learner
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Digital Signature
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mt-1">
                      By accessing SRI-KO platforms, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Age Requirement
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mt-1">
                      Users must be at least 13 years of age, or have explicit parental consent in jurisdictions where required.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: User Responsibilities */}
            <section
              id="responsibilities"
              className="bg-[#F8FAFC] rounded-[2rem] p-8 sm:p-10 border border-slate-200/70 transition-all"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                User Responsibilities
              </h2>
              <p className="text-slate-500 font-medium text-sm sm:text-base mt-1 mb-8">
                Standards of conduct in our community
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Card 1: Account Security */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-5 h-5 text-blue-600 stroke-[2]" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-2">
                    Account Security
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    You are responsible for maintaining the confidentiality of your login credentials and all activities under your account.
                  </p>
                </div>

                {/* Card 2: Community Ethics */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                    <Users className="w-5 h-5 text-blue-600 stroke-[2]" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-2">
                    Community Ethics
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Users must engage respectfully with peers and educators, following our anti-harassment policy.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3: Educational Services */}
            <section
              id="services"
              className="bg-white rounded-[2rem] p-8 sm:p-10 border border-slate-100 shadow-sm relative overflow-hidden transition-all"
            >
              {/* Decorative Accent Glow */}
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-50 rounded-full blur-2xl pointer-events-none" />

              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Educational Services
              </h2>
              <p className="text-slate-500 font-medium text-sm sm:text-base mt-1 mb-8">
                Defining the scope of SRI-KO learning
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Curriculum Access
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mt-1">
                      Access to premium content is based on the specific plan purchased. Content may be updated or modified to maintain academic rigor.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Platform Uptime
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mt-1">
                      We strive for 99.9% availability but do not guarantee uninterrupted access during scheduled maintenance.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Payment & Refunds */}
            <section
              id="payments"
              className="bg-[#EBF1FF] rounded-[2rem] p-8 sm:p-10 border border-blue-100/80 transition-all"
            >
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Payment & Refunds
              </h2>
              <p className="text-blue-600 font-semibold text-sm sm:text-base mt-1 mb-6">
                Transparent financial transactions
              </p>

              <div className="space-y-3 mb-4">
                {/* Subscription Billing Button */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-white shadow-sm overflow-hidden transition-all">
                  <button
                    onClick={() => togglePaymentItem('billing')}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-white transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="font-bold text-slate-900 text-base sm:text-lg">
                        Subscription Billing
                      </span>
                    </div>
                    {expandedPayment === 'billing' ? (
                      <ChevronDown className="w-5 h-5 text-blue-600 transition-transform" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-blue-600 transition-transform" />
                    )}
                  </button>
                  {expandedPayment === 'billing' && (
                    <div className="px-5 pb-5 pt-1 text-sm text-slate-600 border-t border-slate-100 bg-white">
                      Subscriptions are billed in advance on a recurring monthly or annual cycle. You can manage, upgrade, or cancel your renewal anytime directly from your account settings.
                    </div>
                  )}
                </div>

                {/* 14-Day Refund Policy Button */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-white shadow-sm overflow-hidden transition-all">
                  <button
                    onClick={() => togglePaymentItem('refund')}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-white transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <RotateCcw className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="font-bold text-slate-900 text-base sm:text-lg">
                        14-Day Refund Policy
                      </span>
                    </div>
                    {expandedPayment === 'refund' ? (
                      <ChevronDown className="w-5 h-5 text-blue-600 transition-transform" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-blue-600 transition-transform" />
                    )}
                  </button>
                  {expandedPayment === 'refund' && (
                    <div className="px-5 pb-5 pt-1 text-sm text-slate-600 border-t border-slate-100 bg-white">
                      We offer a 14-day money-back guarantee for eligible full course enrollments if you have completed less than 20% of the lessons and are not fully satisfied.
                    </div>
                  )}
                </div>
              </div>

              {/* Footnote */}
              <p className="text-xs text-blue-800/80 font-medium italic">
                * Refund requests must be submitted in writing through the Help Center. Conditions apply to partially completed courses.
              </p>
            </section>

            {/* Section 5: Intellectual Property */}
            <section
              id="intellectual-property"
              className="bg-white rounded-[2rem] p-8 sm:p-10 border border-slate-100 shadow-sm transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    Intellectual Property
                  </h2>
                  <p className="text-slate-500 font-medium text-sm sm:text-base mt-1">
                    Protecting the integrity of our curriculum
                  </p>
                </div>
                <div>
                  <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold tracking-wider uppercase">
                    COPYRIGHT © 2024 SRI-KO
                  </span>
                </div>
              </div>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6 font-normal">
                All curriculum materials, video content, Hangul tracing guides, and algorithmic sequences are the exclusive property of SRI-KO. Users are granted a non-transferable, limited license to view materials for personal educational use only.
              </p>

              <div className="pt-2">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-3">
                  Prohibited actions include:
                </h3>
                <ul className="space-y-2.5 text-sm text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                    <span>Redistribution or reselling of course materials.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                    <span>Reverse engineering of the proprietary SRI-KO learning algorithm.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                    <span>Use of SRI-KO branding for unauthorized commercial purposes.</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 6: Still have questions? */}
            <div className="pt-4">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Still have questions?
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Support Email */}
                <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/70 hover:bg-white hover:shadow-md hover:border-blue-200 transition-all group">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Mail className="w-5 h-5 text-blue-600 stroke-[2]" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Support Email
                  </h3>
                  <a
                    href="mailto:legal@sriko.edu"
                    className="text-slate-500 text-sm mt-0.5 block hover:text-blue-600 transition-colors"
                  >
                    legal@sriko.edu
                  </a>
                </div>

                {/* Live Help */}
                <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/70 hover:bg-white hover:shadow-md hover:border-blue-200 transition-all group">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-5 h-5 text-blue-600 stroke-[2]" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Live Help
                  </h3>
                  <p className="text-slate-500 text-sm mt-0.5">
                    Available Mon-Fri
                  </p>
                </div>

                {/* HQ Address */}
                <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/70 hover:bg-white hover:shadow-md hover:border-blue-200 transition-all group">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <MapPin className="w-5 h-5 text-blue-600 stroke-[2]" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">
                    HQ Address
                  </h3>
                  <p className="text-slate-500 text-sm mt-0.5">
                    Seoul, S. Korea
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
