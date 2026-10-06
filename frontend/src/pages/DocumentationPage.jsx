import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Rocket,
  BookOpen,
  User,
  Settings,
  HelpCircle,
  ChevronDown,
  Shield,
  CreditCard,
  Award,
  Search,
  CheckCircle2,
  Info,
  Bot,
  Mail,
  Compass,
  ArrowRight,
  Layers,
  Sparkles,
  Cpu
} from 'lucide-react';

const DocumentationPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNav, setActiveNav] = useState('getting-started');
  const [activeCurriculumTab, setActiveCurriculumTab] = useState('Level Pathing');
  const [openFaq, setOpenFaq] = useState(null);

  const curriculumTabs = [
    {
      id: 'Level Pathing',
      title: 'Adaptive Level Pathing',
      description:
        'Our proprietary adaptive engine shifts content difficulty based on your retention rate and tracing accuracy. Every module is a step in a bespoke journey.',
      levels: [
        {
          tag: 'BEGINNER',
          sub: 'Foundation & Phonetics',
          bg: 'bg-[#67f2b1] hover:bg-[#5ae6a5]',
          text: 'text-[#064e2b]',
          subText: 'text-[#064e2b]/80',
        },
        {
          tag: 'INTERMEDIATE',
          sub: 'Grammar & Syntax',
          bg: 'bg-[#cddbff] hover:bg-[#bed0ff]',
          text: 'text-[#1e3a8a]',
          subText: 'text-[#1e3a8a]/80',
        },
        {
          tag: 'ADVANCED',
          sub: 'Fluency & Cultural Nuance',
          bg: 'bg-[#f4c6ff] hover:bg-[#efb5fd]',
          text: 'text-[#581c87]',
          subText: 'text-[#581c87]/80',
        },
      ],
      progressText:
        'The progress bar represents composite mastery across all active sub-modules.',
      progressPercent: '68%',
    },
    {
      id: 'Interactive Modules',
      title: 'Interactive Modules',
      description:
        'Engage with real-time feedback systems, stroke vector validation, audio phonetics analysis, and native speaker conversational prompts.',
      levels: [
        {
          tag: 'STROKE ACCURACY',
          sub: 'Hangul Tracing 2.0',
          bg: 'bg-[#67f2b1] hover:bg-[#5ae6a5]',
          text: 'text-[#064e2b]',
          subText: 'text-[#064e2b]/80',
        },
        {
          tag: 'VOICE SYNTHESIS',
          sub: 'Accent & Pitch Matching',
          bg: 'bg-[#cddbff] hover:bg-[#bed0ff]',
          text: 'text-[#1e3a8a]',
          subText: 'text-[#1e3a8a]/80',
        },
        {
          tag: 'VOCABULARY DECK',
          sub: 'Spaced Repetition (SRS)',
          bg: 'bg-[#f4c6ff] hover:bg-[#efb5fd]',
          text: 'text-[#581c87]',
          subText: 'text-[#581c87]/80',
        },
      ],
      progressText:
        'Interactive module completion status synced in real-time with your scholar dashboard.',
      progressPercent: '84%',
    },
    {
      id: 'Assessment Logic',
      title: 'Assessment Logic & Evaluation',
      description:
        'Continuous algorithmic diagnostic tests monitor retention decay, grammar comprehension, and contextual conversational fluency.',
      levels: [
        {
          tag: 'DIAGNOSTIC TEST',
          sub: 'Initial Skill Benchmark',
          bg: 'bg-[#67f2b1] hover:bg-[#5ae6a5]',
          text: 'text-[#064e2b]',
          subText: 'text-[#064e2b]/80',
        },
        {
          tag: 'UNIT MASTERY',
          sub: 'Checkpoint Evaluations',
          bg: 'bg-[#cddbff] hover:bg-[#bed0ff]',
          text: 'text-[#1e3a8a]',
          subText: 'text-[#1e3a8a]/80',
        },
        {
          tag: 'TOPIK SIMULATION',
          sub: 'Standardized Mock Exams',
          bg: 'bg-[#f4c6ff] hover:bg-[#efb5fd]',
          text: 'text-[#581c87]',
          subText: 'text-[#581c87]/80',
        },
      ],
      progressText:
        'Composite grading calculated using TOPIK standard performance metrics.',
      progressPercent: '92%',
    },
  ];

  const activeCurriculum =
    curriculumTabs.find((tab) => tab.id === activeCurriculumTab) ||
    curriculumTabs[0];

  const faqItems = [
    {
      question: 'How does the interactive tracing work?',
      answer:
        'Our Hangul Tracing 2.0 engine breaks each character down into vector stroke sequences. As you draw on touch screens, tablets, or with your mouse, the system evaluates stroke order, direction, curvature, and pressure in real-time, providing immediate visual and phonetic guidance.',
    },
    {
      question: 'Can I access courses offline?',
      answer:
        'Yes. Through our progressive web app and mobile companion, you can download lesson packets, stroke exercises, and listening audio packs to continue your study sessions without an active internet connection. Progress automatically syncs once reconnected.',
    },
    {
      question: 'Is there a certificate of completion?',
      answer:
        'Yes. Upon satisfying all curriculum requirements and achieving a passing grade on the capstone evaluation for each course tier, you are awarded an authenticated SRI-KO Scholar Certificate with verifiable credential hashing.',
    },
  ];

  const scrollToSection = (id) => {
    setActiveNav(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const filteredFaqs = faqItems.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-600 selection:text-white pb-0">
      {/* =========================================================
          HERO SECTION
      ========================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#2952e3] via-[#4d42ec] to-[#9b31ea] px-6 py-16 sm:py-20 lg:px-8 text-center text-white shadow-md">
        {/* Subtle background glow pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.1),transparent_50%)] pointer-events-none" />

        <div className="relative mx-auto max-w-4xl flex flex-col items-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight drop-shadow-sm">
            Documentation
          </h1>

          <p className="mt-4 max-w-2xl text-base sm:text-lg text-blue-100/90 font-normal leading-relaxed">
            Master the SRI-KO ecosystem with our comprehensive guides, technical
            references, and educational frameworks.
          </p>

          {/* Search Box */}
          <div className="mt-8 w-full max-w-xl">
            <div className="relative flex items-center rounded-2xl bg-white/15 backdrop-blur-md p-1.5 ring-1 ring-white/30 shadow-[0_10px_25px_rgba(0,0,0,0.12)] transition focus-within:bg-white/20 focus-within:ring-white/50">
              <Search className="ml-3.5 h-5 w-5 text-white/75 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What can we help you find today?"
                className="w-full bg-transparent px-3 py-2 text-sm sm:text-base text-white placeholder:text-white/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (searchQuery.trim()) {
                    scrollToSection('faq');
                  }
                }}
                className="rounded-xl bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-[#2d52e5] shadow-sm transition hover:bg-blue-50 active:scale-95 shrink-0"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          MAIN DOCUMENTATION CONTENT AREA
      ========================================================= */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
          {/* =====================================================
              LEFT QUICK NAVIGATION SIDEBAR
          ===================================================== */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <div>
                <p className="px-3 text-[11px] font-bold tracking-widest uppercase text-slate-400 mb-3">
                  Quick Navigation
                </p>

                <nav className="space-y-1">
                  <button
                    onClick={() => scrollToSection('getting-started')}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition ${
                      activeNav === 'getting-started'
                        ? 'bg-white text-[#2952e3] shadow-sm ring-1 ring-slate-200/60'
                        : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                    }`}
                  >
                    <Rocket
                      className={`h-4 w-4 ${
                        activeNav === 'getting-started'
                          ? 'text-[#2952e3]'
                          : 'text-slate-400'
                      }`}
                    />
                    <span>Getting Started</span>
                  </button>

                  <button
                    onClick={() => scrollToSection('courses-learning')}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition ${
                      activeNav === 'courses-learning'
                        ? 'bg-white text-[#2952e3] font-semibold shadow-sm ring-1 ring-slate-200/60'
                        : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                    }`}
                  >
                    <BookOpen
                      className={`h-4 w-4 ${
                        activeNav === 'courses-learning'
                          ? 'text-[#2952e3]'
                          : 'text-slate-400'
                      }`}
                    />
                    <span>Courses & Learning</span>
                  </button>

                  <button
                    onClick={() => scrollToSection('account-management')}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition ${
                      activeNav === 'account-management'
                        ? 'bg-white text-[#2952e3] font-semibold shadow-sm ring-1 ring-slate-200/60'
                        : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                    }`}
                  >
                    <User
                      className={`h-4 w-4 ${
                        activeNav === 'account-management'
                          ? 'text-[#2952e3]'
                          : 'text-slate-400'
                      }`}
                    />
                    <span>Account Management</span>
                  </button>

                  <button
                    onClick={() => scrollToSection('technical-support')}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition ${
                      activeNav === 'technical-support'
                        ? 'bg-white text-[#2952e3] font-semibold shadow-sm ring-1 ring-slate-200/60'
                        : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                    }`}
                  >
                    <Settings
                      className={`h-4 w-4 ${
                        activeNav === 'technical-support'
                          ? 'text-[#2952e3]'
                          : 'text-slate-400'
                      }`}
                    />
                    <span>Technical Support</span>
                  </button>

                  <button
                    onClick={() => scrollToSection('faq')}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition ${
                      activeNav === 'faq'
                        ? 'bg-white text-[#2952e3] font-semibold shadow-sm ring-1 ring-slate-200/60'
                        : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                    }`}
                  >
                    <HelpCircle
                      className={`h-4 w-4 ${
                        activeNav === 'faq' ? 'text-[#2952e3]' : 'text-slate-400'
                      }`}
                    />
                    <span>FAQ</span>
                  </button>
                </nav>
              </div>

              {/* Version Box */}
              <div className="rounded-2xl bg-[#eef4ff] border border-[#d8e5ff] p-4 text-left shadow-sm">
                <span className="text-[11px] font-extrabold tracking-wider text-[#2952e3] uppercase block">
                  VERSION 2.4.0
                </span>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  Recent updates include Hangul Tracing 2.0 and AI Tutors.
                </p>
                <Link
                  to="/announcements"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#2952e3] hover:text-[#1d3bb3] transition"
                >
                  View Changelog →
                </Link>
              </div>
            </div>
          </aside>

          {/* =====================================================
              RIGHT MAIN CONTENT SECTIONS
          ===================================================== */}
          <div className="min-w-0 space-y-12">
            {/* ===================================================
                SECTION 1: GETTING STARTED
            =================================================== */}
            <section id="getting-started" className="scroll-mt-24">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef2ff] text-[#2952e3]">
                  <Rocket className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Getting Started
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Platform Onboarding Card */}
                <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Platform Onboarding
                    </h3>
                    <p className="mt-2 text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                      Welcome to SRI-KO Academy. Our platform is designed to
                      provide an immersive, editorially-driven learning
                      experience for modern scholars.
                    </p>

                    <div className="mt-5 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-[#16a34a] mt-0.5 shrink-0" />
                        <span className="text-xs text-slate-700 leading-snug">
                          Complete your scholar profile to receive tailored
                          recommendations.
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-[#16a34a] mt-0.5 shrink-0" />
                        <span className="text-xs text-slate-700 leading-snug">
                          Configure your learning preferences and daily goals.
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-[#16a34a] mt-0.5 shrink-0" />
                        <span className="text-xs text-slate-700 leading-snug">
                          Download the mobile application for offline practice
                          sessions.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Initial Setup Guide Card */}
                <div className="rounded-2xl border border-slate-200/60 bg-[#f4f6fa] p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Initial Setup Guide
                    </h3>
                    <p className="mt-2 text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                      Ensure your hardware and software environment is optimized
                      for our interactive Hangul tracing modules.
                    </p>

                    <div className="mt-5 space-y-3">
                      <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-xs border border-slate-100">
                        <span className="text-xs font-medium text-slate-700">
                          System Diagnostic
                        </span>
                        <span className="rounded-full bg-[#22c55e] px-2.5 py-0.5 text-[10px] font-extrabold text-white tracking-wider">
                          OPTIMAL
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-xs border border-slate-100">
                        <span className="text-xs font-medium text-slate-700">
                          Browser Compatibility
                        </span>
                        <span className="rounded-full bg-[#22c55e] px-2.5 py-0.5 text-[10px] font-extrabold text-white tracking-wider">
                          VERIFIED
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ===================================================
                SECTION 2: COURSES & LEARNING
            =================================================== */}
            <section id="courses-learning" className="scroll-mt-24">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3e8ff] text-[#9333ea]">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Courses & Learning
                </h2>
              </div>

              {/* Framework Container */}
              <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr]">
                  {/* Left sub-panel */}
                  <div className="bg-[#f0f3f8] p-4 sm:p-5 border-b md:border-b-0 md:border-r border-slate-200/60">
                    <p className="text-xs font-bold text-slate-900 mb-3">
                      Curriculum Framework
                    </p>

                    <div className="space-y-1.5">
                      {curriculumTabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveCurriculumTab(tab.id)}
                          className={`w-full rounded-xl px-3 py-2.5 text-left text-xs font-medium transition ${
                            activeCurriculumTab === tab.id
                              ? 'bg-white font-bold text-[#2952e3] shadow-sm'
                              : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                          }`}
                        >
                          {tab.id}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right sub-panel */}
                  <div className="p-6 sm:p-8">
                    <h3 className="text-xl font-bold text-slate-900">
                      {activeCurriculum.title}
                    </h3>

                    <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                      {activeCurriculum.description}
                    </p>

                    {/* Level Cards */}
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {activeCurriculum.levels.map((lvl, index) => (
                        <div
                          key={index}
                          className={`rounded-xl p-4 text-center transition ${lvl.bg} ${lvl.text} shadow-xs`}
                        >
                          <div className="text-xs font-black tracking-wider uppercase">
                            {lvl.tag}
                          </div>
                          <div
                            className={`mt-1 text-[11px] font-medium leading-tight ${lvl.subText}`}
                          >
                            {lvl.sub}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Progress Tracker Logic Bar */}
                    <div className="mt-6 rounded-xl bg-[#f3f5f9] p-4 border border-slate-200/50">
                      <div className="flex items-center gap-2">
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#2563eb] text-white">
                          <Info className="h-2.5 w-2.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          Progress Tracker Logic
                        </span>
                      </div>

                      <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#16a34a] transition-all duration-500"
                          style={{ width: activeCurriculum.progressPercent }}
                        />
                      </div>

                      <p className="mt-2 text-[11px] text-slate-500">
                        {activeCurriculum.progressText}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ===================================================
                SECTION 3: ACCOUNT MANAGEMENT
            =================================================== */}
            <section id="account-management" className="scroll-mt-24">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#10b981]">
                  <User className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Account Management
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Privacy & Security */}
                <div className="rounded-2xl border border-slate-200/70 bg-white p-5 sm:p-6 shadow-sm transition hover:shadow-md">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563eb]">
                    <Shield className="h-4 w-4" />
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-slate-900">
                    Privacy & Security
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    Two-factor authentication and data encryption protocols for
                    your security.
                  </p>
                </div>

                {/* Subscription Plans */}
                <div className="rounded-2xl border border-slate-200/70 bg-white p-5 sm:p-6 shadow-sm transition hover:shadow-md">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563eb]">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-slate-900">
                    Subscription Plans
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    Manage your billing, upgrade plans, or view transaction
                    history anytime.
                  </p>
                </div>

                {/* Scholar Credentials */}
                <div className="rounded-2xl border border-slate-200/70 bg-white p-5 sm:p-6 shadow-sm transition hover:shadow-md">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563eb]">
                    <Award className="h-4 w-4" />
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-slate-900">
                    Scholar Credentials
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    Download verified certificates and share your learning
                    achievements.
                  </p>
                </div>
              </div>
            </section>

            {/* ===================================================
                SECTION 4: TECHNICAL SUPPORT
            =================================================== */}
            <section id="technical-support" className="scroll-mt-24">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Settings className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Technical Support
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-800">
                    Supported Browsers
                  </h4>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Chrome, Edge, Firefox, and Safari (desktop & mobile).
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-800">
                    Recommended Environment
                  </h4>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Modern browser with a stable internet connection.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-800">
                    Touch & Stylus Support
                  </h4>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Optimized canvas tracing for Apple Pencil and stylus pens.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-800">
                    Audio Permissions
                  </h4>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Enable browser microphone access for speech tests.
                  </p>
                </div>
              </div>
            </section>

            {/* ===================================================
                SECTION 5: FAQ
            =================================================== */}
            <section id="faq" className="scroll-mt-24 pt-4">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Frequently Asked Questions
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Quick answers to the most common queries from our global student
                  body.
                </p>
              </div>

              <div className="mx-auto mt-8 max-w-2xl space-y-3">
                {filteredFaqs.length === 0 ? (
                  <div className="rounded-xl bg-white p-6 text-center text-slate-500 text-sm border border-slate-200/60">
                    No matching FAQ found for &ldquo;{searchQuery}&rdquo;. Try another search keyword.
                  </div>
                ) : (
                  filteredFaqs.map((faq, index) => {
                    const isOpen = openFaq === index;
                    return (
                      <div
                        key={index}
                        className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-xs transition hover:border-slate-300"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaq(isOpen ? null : index)}
                          className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-50/50"
                        >
                          <span className="text-xs sm:text-sm font-semibold text-slate-800">
                            {faq.question}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-[#2563eb] transition-transform duration-200 shrink-0 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {isOpen && (
                          <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3.5">
                            <p className="text-xs sm:text-[13px] leading-relaxed text-slate-600">
                              {faq.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* =========================================================
          STILL NEED HELP? (FULL WIDTH FOOTER SECTION)
      ========================================================= */}
      <section className="bg-[#e7ecf2] px-4 sm:px-6 lg:px-8 py-14 sm:py-16 mt-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Still Need Help?
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            Our dedicated support ecosystem is here to assist your educational
            journey.
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {/* AI Chat Assistant */}
            <div className="rounded-2xl bg-white p-6 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col justify-between items-center transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ebf2fe] text-[#2160eb]">
                  <Bot className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">
                  AI Chat Assistant
                </h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed max-w-[210px]">
                  Instant guidance on grammar, platform features, or technical
                  issues 24/7.
                </p>
              </div>

              <Link
                to="/help-center#chat"
                className="mt-6 block w-full rounded-xl bg-[#0c57d8] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-[#0947b3] active:scale-98"
              >
                Launch Chat
              </Link>
            </div>

            {/* Contact Support */}
            <div className="rounded-2xl bg-white p-6 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col justify-between items-center transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f6e9fe] text-[#9333ea]">
                  <Mail className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">
                  Contact Support
                </h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed max-w-[210px]">
                  Escalate complex inquiries to our academic and technical
                  specialists.
                </p>
              </div>

              <Link
                to="/join-us"
                className="mt-6 block w-full rounded-xl bg-[#8c28dd] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-[#771ec0] active:scale-98"
              >
                Submit Ticket
              </Link>
            </div>

            {/* Browse Courses */}
            <div className="rounded-2xl bg-white p-6 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col justify-between items-center transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e6f4ea] text-[#0d7a3c]">
                  <Compass className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">
                  Browse Courses
                </h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed max-w-[210px]">
                  Return to the academy library and discover your next learning
                  milestone.
                </p>
              </div>

              <Link
                to="/courses"
                className="mt-6 block w-full rounded-xl bg-[#06612d] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-[#054d24] active:scale-98"
              >
                Library Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DocumentationPage;