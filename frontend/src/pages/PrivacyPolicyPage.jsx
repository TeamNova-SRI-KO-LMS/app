import React, { useState, useEffect } from 'react';
import {
  Inbox,
  TrendingUp,
  Shield,
  ShieldCheck,
  Scale,
  AtSign,
  Check,
  Eye,
  Sliders,
  Trash2,
  Mail,
  MapPin,
  Send,
  Lock,
  Cpu
} from 'lucide-react';
import toast from 'react-hot-toast';

const PrivacyPolicyPage = () => {
  const [activeSection, setActiveSection] = useState('collection');
  const [contactName, setContactName] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sections = [
    { id: 'collection', label: 'Collection', icon: Inbox },
    { id: 'data-usage', label: 'Data Usage', icon: TrendingUp },
    { id: 'protection', label: 'Protection', icon: Shield },
    { id: 'your-rights', label: 'Your Rights', icon: Scale },
    { id: 'contact', label: 'Contact', icon: AtSign },
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
        behavior: 'smooth',
      });
    }
  };

  const handleInquirySubmit = (e) => {
    e.preventDefault();
    if (!contactName.trim() || !contactMessage.trim()) {
      toast.error('Please enter your name and message.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('Inquiry submitted to the SRI-KO Legal team!');
      setContactName('');
      setContactMessage('');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-start justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            {/* Legal documentation badge */}
            <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-blue-50 border border-blue-100/80 text-blue-600 text-xs font-bold tracking-wider uppercase mb-4 shadow-xs">
              <span>LEGAL DOCUMENTATION</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 mb-4">
              Privacy Policy
            </h1>

            {/* Description */}
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
              At SRI-KO, your educational journey is a private endeavor. This policy outlines
              how we protect your scholarly data with the same rigor we apply to our curriculum.
            </p>
          </div>

          {/* Effective Date Block */}
          <div className="lg:text-right shrink-0 pt-1">
            <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
              EFFECTIVE DATE
            </p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
              April 30, 2026
            </p>
          </div>
        </div>

        {/* Main Content Layout with Sticky Sidebar on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar - On This Page */}
          <div className="lg:col-span-3 lg:sticky lg:top-24">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/80 shadow-sm">
              <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-3 px-3">
                ON THIS PAGE
              </p>
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-3 cursor-pointer ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                      <span>{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Right Column - Policy Sections */}
          <div className="lg:col-span-9 space-y-12">
            {/* Section 1: Information Collection */}
            <section id="collection" className="scroll-mt-28">
              <div className="flex items-start gap-4 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Inbox className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Information Collection
                  </h2>
                  <p className="text-slate-600 text-sm leading-relaxed mt-1">
                    We collect information to provide a personalized learning experience. This data allows us to tailor
                    vocabulary exercises and track your progression through the SRI-KO curriculum.
                  </p>
                </div>
              </div>

              {/* Two Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:border-slate-300 transition-colors">
                  <h3 className="font-bold text-slate-900 text-base mb-1.5">
                    Personal Identity
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    Legal name, email address, and academic level indicators provided during registration.
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:border-slate-300 transition-colors">
                  <h3 className="font-bold text-slate-900 text-base mb-1.5">
                    Academic Metrics
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    Course completion rates, assessment scores, and vocabulary retention data.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2: Usage & Optimization */}
            <section id="data-usage" className="scroll-mt-28">
              <div className="flex items-start gap-4 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Usage & Optimization
                  </h2>
                  <p className="text-slate-600 text-sm leading-relaxed mt-1">
                    Your data is never sold. We utilize it exclusively to refine our editorial algorithms and enhance the
                    Scholar's experience through predictive learning paths.
                  </p>
                </div>
              </div>

              {/* List of checked items */}
              <div className="space-y-3 mt-6">
                <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span className="text-slate-700 font-medium text-xs sm:text-sm">
                    Personalizing curriculum complexity based on student level
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span className="text-slate-700 font-medium text-xs sm:text-sm">
                    Generating monthly academic progress reports
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span className="text-slate-700 font-medium text-xs sm:text-sm">
                    Ensuring compliance with international education standards
                  </span>
                </div>
              </div>
            </section>

            {/* Section 3: Uncompromising Protection */}
            <section id="protection" className="scroll-mt-28">
              <div className="bg-gradient-to-r from-blue-600 via-[#0B63E5] to-blue-700 rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden shadow-xl shadow-blue-500/15">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
                  <div className="max-w-xl">
                    <div className="flex items-center gap-2.5 text-2xl sm:text-3xl font-bold tracking-tight">
                      <ShieldCheck className="w-8 h-8 text-blue-200" />
                      <h2>Uncompromising Protection</h2>
                    </div>

                    <p className="text-blue-100 text-xs sm:text-sm leading-relaxed mt-4">
                      We employ bank-grade encryption and architectural “tonal depth” in our security protocols. Your
                      data is housed in isolated silos to prevent unauthorized access.
                    </p>

                    <div className="flex flex-wrap items-center gap-2.5 mt-6">
                      <span className="px-3.5 py-1.5 rounded-full bg-blue-700/60 border border-blue-400/30 text-[11px] font-semibold text-blue-50 backdrop-blur-sm shadow-xs">
                        AES-256 Encryption
                      </span>
                      <span className="px-3.5 py-1.5 rounded-full bg-blue-700/60 border border-blue-400/30 text-[11px] font-semibold text-blue-50 backdrop-blur-sm shadow-xs">
                        Multi-Factor Auth
                      </span>
                      <span className="px-3.5 py-1.5 rounded-full bg-blue-700/60 border border-blue-400/30 text-[11px] font-semibold text-blue-50 backdrop-blur-sm shadow-xs">
                        SSL/TLS Security
                      </span>
                    </div>
                  </div>

                  {/* Visual Cyber Graphic */}
                  <div className="w-52 h-44 sm:w-60 sm:h-48 rounded-2xl bg-slate-950/70 border border-cyan-500/30 p-4 relative overflow-hidden flex items-center justify-center shrink-0 shadow-2xl backdrop-blur-md">
                    {/* Glowing Circuit Lines Effect */}
                    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:12px_12px]" />
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 p-0.5 shadow-lg shadow-cyan-400/40 relative z-10 flex items-center justify-center">
                      <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                        <Cpu className="w-9 h-9 text-cyan-400 animate-pulse" />
                      </div>
                    </div>
                    {/* Circuit lines */}
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-400/60 to-transparent" />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Your Sovereign Rights */}
            <section id="your-rights" className="scroll-mt-28">
              <div className="flex items-start gap-4 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Your Sovereign Rights
                  </h2>
                  <p className="text-slate-600 text-sm leading-relaxed mt-1">
                    As a scholar at SRI-KO, you maintain full sovereignty over your data. In accordance with GDPR and
                    international privacy frameworks, you have the right to access, rectify, or erase your personal
                    information at any moment.
                  </p>
                </div>
              </div>

              {/* 3 Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-slate-100/70 border border-slate-200/60 rounded-2xl p-5 hover:bg-slate-100 transition-colors">
                  <Eye className="w-5 h-5 text-blue-600 mb-3" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Right to Access
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed mt-1.5">
                    Request a complete copy of all scholarly data we hold about you.
                  </p>
                </div>

                <div className="bg-slate-100/70 border border-slate-200/60 rounded-2xl p-5 hover:bg-slate-100 transition-colors">
                  <Sliders className="w-5 h-5 text-blue-600 mb-3" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Right to Rectify
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed mt-1.5">
                    Correct any inaccuracies in your academic profile instantly.
                  </p>
                </div>

                <div className="bg-slate-100/70 border border-slate-200/60 rounded-2xl p-5 hover:bg-slate-100 transition-colors">
                  <Trash2 className="w-5 h-5 text-blue-600 mb-3" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Right to Erase
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed mt-1.5">
                    Request the complete deletion of your account and related data history.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5: Legal Inquiry & Support */}
            <section id="contact" className="scroll-mt-28">
              <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left contact info */}
                <div className="lg:col-span-7">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    Legal Inquiry & Support
                  </h2>
                  <p className="text-slate-600 text-sm leading-relaxed mt-2 mb-8">
                    Questions regarding our editorial privacy standards? Our dedicated legal support team is available
                    for scholarly consultation.
                  </p>

                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          EMAIL US
                        </p>
                        <a
                          href="mailto:privacy@sri-ko.edu"
                          className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors"
                        >
                          privacy@sri-ko.edu
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          EDITORIAL OFFICE
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                          Gangnam-gu, Seoul, South Korea
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right quick contact form */}
                <div className="lg:col-span-5">
                  <div className="bg-slate-100/70 rounded-2xl p-6 border border-slate-200/60 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900 mb-4">
                      Quick Contact
                    </h3>
                    <form onSubmit={handleInquirySubmit} className="space-y-3">
                      <div>
                        <input
                          type="text"
                          placeholder="Scholar Name"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                          required
                        />
                      </div>
                      <div>
                        <textarea
                          placeholder="Message"
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          rows={3}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none shadow-xs"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#0B63E5] hover:bg-blue-700 active:scale-[0.99] text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-blue-500/25 text-sm cursor-pointer disabled:opacity-70"
                      >
                        {isSubmitting ? 'Sending...' : 'Send Inquiry'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
