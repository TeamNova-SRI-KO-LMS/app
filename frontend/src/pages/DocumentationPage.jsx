import {
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  GraduationCap,
  HelpCircle,
  Library,
  Mail,
  MessageSquare,
  Monitor,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCircle,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';

const DocumentationPage = () => {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [activeTab, setActiveTab] = useState('Level Pathing');
  const [openFaq, setOpenFaq] = useState(null);

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const navigation = [
    {
      id: 'getting-started',
      label: 'Getting Started',
      icon: Rocket,
    },
    {
      id: 'courses',
      label: 'Courses & Learning',
      icon: BookOpen,
    },
    {
      id: 'account',
      label: 'Account Management',
      icon: UserCircle,
    },
    {
      id: 'technical',
      label: 'Technical Support',
      icon: Settings,
    },
    {
      id: 'faq',
      label: 'FAQ',
      icon: HelpCircle,
    },
  ];

  /* =========================================================
     FAQ
  ========================================================= */

  const faqs = [
    {
      question: 'How does the interactive tracing work?',
      answer:
        'Interactive tracing allows you to practice Korean characters directly within the learning environment. Your strokes are evaluated while you practice and your progress is automatically recorded.',
    },
    {
      question: 'Can I access courses offline?',
      answer:
        'Yes. Supported course materials can be downloaded so you can continue studying when an internet connection is unavailable.',
    },
    {
      question: 'Is there a certificate of completion?',
      answer:
        'Yes. Eligible courses provide a certificate after you successfully complete the required lessons and assessments.',
    },
  ];

  /* =========================================================
     CURRICULUM
  ========================================================= */

  const curriculumTabs = [
    {
      id: 'Level Pathing',
      title: 'Adaptive Level Pathing',
      description:
        'Our proprietary adaptive engine shifts content difficulty based on your retention rate and tracing accuracy. Every module is a step in a bespoke journey.',
    },
    {
      id: 'Interactive Modules',
      title: 'Interactive Modules',
      description:
        'Practice Korean through interactive exercises, tracing activities, quizzes, and engaging learning modules designed around your learning progress.',
    },
    {
      id: 'Assessment Logic',
      title: 'Assessment Logic',
      description:
        'Assessment results are used to evaluate your learning progress and determine the most suitable content for your current skill level.',
    },
  ];

  const activeCurriculum =
    curriculumTabs.find((item) => item.id === activeTab) ||
    curriculumTabs[0];

  /* =========================================================
     SCROLL SPY
  ========================================================= */

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180;

      for (const section of navigation) {
        const element = document.getElementById(section.id);

        if (!element) continue;

        const top = element.offsetTop;
        const height = element.offsetHeight;

        if (
          scrollPosition >= top &&
          scrollPosition < top + height
        ) {
          setActiveSection(section.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  /* =========================================================
     SCROLL TO SECTION
  ========================================================= */

  const scrollToSection = (id) => {
    setActiveSection(id);

    const element = document.getElementById(id);

    if (element) {
      const offset = 100;

      const elementPosition =
        element.getBoundingClientRect().top +
        window.pageYOffset -
        offset;

      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 text-white">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">

          <div className="text-center">

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5">
              Documentation
            </h1>

            <p className="max-w-3xl mx-auto text-base sm:text-lg leading-relaxed text-blue-100">
              Master the SRI-KO ecosystem with our comprehensive guides,
              technical references, and educational frameworks.
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto mt-8">

              <div className="flex items-center bg-white/15 backdrop-blur-md border border-white/10 rounded-2xl p-2 shadow-xl">

                <Search className="w-5 h-5 ml-4 text-white/60 shrink-0" />

                <input
                  type="text"
                  placeholder="What can we help you find today?"
                  className="flex-1 min-w-0 bg-transparent px-4 py-4 text-base text-white placeholder:text-white/60 outline-none"
                />

                <button className="px-7 py-3 bg-white text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors">
                  Search
                </button>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          MAIN DOCUMENTATION CONTENT
      ===================================================== */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* =================================================
              SIDEBAR
          ================================================= */}

          <aside className="lg:col-span-3 lg:sticky lg:top-24 z-10">

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">

              <p className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-4 px-3">
                Quick Navigation
              </p>

              <nav className="space-y-2">

                {navigation.map((item) => {

                  const Icon = item.icon;
                  const active = activeSection === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 text-left ${
                        active
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 pl-3 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >

                      <Icon className="w-5 h-5 shrink-0" />

                      <span>
                        {item.label}
                      </span>

                    </button>
                  );

                })}

              </nav>


              {/* Version Card */}

              <div className="mt-7 pt-6 border-t border-slate-200">

                <div className="rounded-xl bg-blue-50 p-5">

                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Version 2.4.0
                  </p>

                  <p className="text-sm text-slate-500 leading-relaxed mt-2">
                    Recent updates include Hangul Tracing 2.0 and AI Tutors.
                  </p>

                  <button className="text-sm font-bold text-blue-600 mt-4 hover:underline">
                    View Changelog →
                  </button>

                </div>

              </div>

            </div>

          </aside>


          {/* =================================================
              RIGHT CONTENT
          ================================================= */}

          <div className="lg:col-span-9 space-y-12">

            {/* =================================================
                GETTING STARTED
            ================================================= */}

            <section
              id="getting-started"
              className="scroll-mt-24"
            >

              <SectionHeading
                icon={<Rocket className="w-5 h-5" />}
                iconClass="bg-blue-50 text-blue-600"
                title="Getting Started"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-7">

                {/* Platform Onboarding */}

                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">

                  <h3 className="text-xl font-bold text-slate-900">
                    Platform Onboarding
                  </h3>

                  <p className="text-base text-slate-500 leading-relaxed mt-3">
                    Welcome to SRI-KO Academy. Our platform is designed to
                    provide an immersive, daily-driven learning experience
                    for modern scholars.
                  </p>

                  <div className="space-y-5 mt-7">

                    <ChecklistItem>
                      Complete your scholar profile to receive tailored
                      recommendations.
                    </ChecklistItem>

                    <ChecklistItem>
                      Configure your learning preferences and daily goals.
                    </ChecklistItem>

                    <ChecklistItem>
                      Download the mobile application for offline practice
                      sessions.
                    </ChecklistItem>

                  </div>

                </div>


                {/* Initial Setup */}

                <div className="bg-slate-100 rounded-3xl p-8 border border-slate-200">

                  <h3 className="text-xl font-bold text-slate-900">
                    Initial Setup Guide
                  </h3>

                  <p className="text-base text-slate-500 leading-relaxed mt-3">
                    Ensure your hardware and software environment is optimized
                    for our interactive Hangul tracing modules.
                  </p>

                  <div className="space-y-4 mt-7">

                    <StatusRow
                      icon={<Monitor className="w-5 h-5" />}
                      title="System Diagnostic"
                      status="OPTIMAL"
                    />

                    <StatusRow
                      icon={<Smartphone className="w-5 h-5" />}
                      title="Browser Compatibility"
                      status="VERIFIED"
                    />

                  </div>

                </div>

              </div>

            </section>


            {/* =================================================
                COURSES & LEARNING
            ================================================= */}

            <section
              id="courses"
              className="scroll-mt-24"
            >

              <SectionHeading
                icon={<BookOpen className="w-5 h-5" />}
                iconClass="bg-purple-50 text-purple-600"
                title="Courses & Learning"
              />


              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">

                <div className="grid grid-cols-1 md:grid-cols-[250px_1fr]">

                  {/* Curriculum Framework */}

                  <div className="bg-slate-100 p-7">

                    <h3 className="text-base font-bold text-slate-800">
                      Curriculum Framework
                    </h3>

                    <div className="mt-6 space-y-2">

                      {curriculumTabs.map((tab) => (

                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full text-left px-4 py-3.5 rounded-xl text-sm transition-all ${
                            activeTab === tab.id
                              ? 'bg-white text-blue-600 font-bold shadow-sm'
                              : 'text-slate-600 hover:bg-white'
                          }`}
                        >
                          {tab.id}
                        </button>

                      ))}

                    </div>

                  </div>


                  {/* Curriculum Content */}

                  <div className="p-8 sm:p-10">

                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
                      {activeCurriculum.title}
                    </h3>

                    <p className="text-base text-slate-500 leading-relaxed mt-4 max-w-2xl">
                      {activeCurriculum.description}
                    </p>


                    {/* Levels */}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8">

                      <LevelCard
                        level="BEGINNER"
                        subtitle="Foundation & Phonetics"
                        className="bg-emerald-100 border-emerald-200 text-emerald-800"
                      />

                      <LevelCard
                        level="INTERMEDIATE"
                        subtitle="Grammar & Syntax"
                        className="bg-indigo-100 border-indigo-200 text-indigo-800"
                      />

                      <LevelCard
                        level="ADVANCED"
                        subtitle="Fluency & Cultural Nuance"
                        className="bg-purple-100 border-purple-200 text-purple-800"
                      />

                    </div>


                    {/* Progress Tracker */}

                    <div className="mt-8 bg-slate-50 rounded-2xl p-6 border border-slate-100">

                      <div className="flex items-center gap-3">

                        <div className="w-10 h-10 rounded-full bg-white border border-blue-200 flex items-center justify-center">

                          <Sparkles className="w-5 h-5 text-blue-600" />

                        </div>

                        <span className="text-base font-bold text-slate-800">
                          Progress Tracker Logic
                        </span>

                      </div>


                      <div className="h-2.5 rounded-full bg-slate-200 mt-5 overflow-hidden">

                        <div className="h-full w-[63%] bg-blue-600 rounded-full" />

                      </div>


                      <p className="text-sm text-slate-500 mt-3">
                        The progress bar represents cognitive mastery across
                        all active sub-modules.
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </section>


            {/* =================================================
                ACCOUNT MANAGEMENT
            ================================================= */}

            <section
              id="account"
              className="scroll-mt-24"
            >

              <SectionHeading
                icon={<UserCircle className="w-5 h-5" />}
                iconClass="bg-emerald-50 text-emerald-600"
                title="Account Management"
              />


              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <InfoCard
                  icon={<ShieldCheck className="w-6 h-6" />}
                  title="Privacy & Security"
                  description="Two-factor authentication and data encryption protocols for your security."
                />

                <InfoCard
                  icon={<CreditCard className="w-6 h-6" />}
                  title="Subscription Plans"
                  description="Manage your billing, upgrade plans, or view transaction history anytime."
                />

                <InfoCard
                  icon={<GraduationCap className="w-6 h-6" />}
                  title="Scholar Credentials"
                  description="Download verified certificates and share your learning achievements."
                />

              </div>

            </section>


            {/* =================================================
                TECHNICAL SUPPORT
            ================================================= */}

            <section
              id="technical"
              className="scroll-mt-24"
            >

              <SectionHeading
                icon={<Settings className="w-5 h-5" />}
                iconClass="bg-orange-50 text-orange-600"
                title="Technical Support"
              />


              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                  <TechnicalCard
                    title="Supported Browsers"
                    description="Chrome, Edge, Firefox and Safari are supported."
                  />

                  <TechnicalCard
                    title="Recommended Environment"
                    description="Use a modern browser with a stable internet connection."
                  />

                  <TechnicalCard
                    title="Mobile Support"
                    description="Our platform provides a responsive experience for mobile devices."
                  />

                  <TechnicalCard
                    title="Audio & Video"
                    description="Allow browser permissions for multimedia lessons and activities."
                  />

                </div>

              </div>

            </section>


            {/* =================================================
                FAQ
            ================================================= */}

            <section
              id="faq"
              className="scroll-mt-24"
            >

              <div className="text-center mb-8">

                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                  Frequently Asked Questions
                </h2>

                <p className="text-base text-slate-500 mt-3 max-w-xl mx-auto">
                  Quick answers to the most common queries from our global
                  student body.
                </p>

              </div>


              <div className="max-w-4xl mx-auto space-y-4">

                {faqs.map((faq, index) => {

                  const isOpen = openFaq === index;

                  return (

                    <div
                      key={index}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                    >

                      <button
                        onClick={() =>
                          setOpenFaq(isOpen ? null : index)
                        }
                        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                      >

                        <span className="text-base font-semibold text-slate-800">
                          {faq.question}
                        </span>

                        <ChevronDown
                          className={`w-5 h-5 text-blue-600 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />

                      </button>


                      {isOpen && (

                        <div className="px-6 pb-6 border-t border-slate-100 pt-5">

                          <p className="text-sm text-slate-600 leading-relaxed">
                            {faq.answer}
                          </p>

                        </div>

                      )}

                    </div>

                  );

                })}

              </div>

            </section>

          </div>

        </div>

      </main>


      {/* =====================================================
          STILL NEED HELP
      ===================================================== */}

      <section className="bg-slate-200/80 py-16 px-4 sm:px-6 lg:px-8">

        <div className="max-w-6xl mx-auto">

          <div className="text-center">

            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Still Need Help?
            </h2>

            <p className="text-base text-slate-500 mt-3">
              Our dedicated support ecosystem is here to assist your
              educational journey.
            </p>

          </div>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">

            {/* AI Assistant */}

            <SupportCard
              icon={<Bot className="w-6 h-6" />}
              iconClass="bg-blue-50 text-blue-600"
              title="AI Chat Assistant"
              description="Instant guidance on grammar, platform features, or technical issues 24/7."
              button="Launch Chat"
              buttonClass="bg-blue-700 hover:bg-blue-800"
              to="/help-center"
            />


            {/* Contact Support */}

            <SupportCard
              icon={<Mail className="w-6 h-6" />}
              iconClass="bg-purple-50 text-purple-600"
              title="Contact Support"
              description="Escalate complex inquiries to our academic and technical specialists."
              button="Submit Ticket"
              buttonClass="bg-purple-600 hover:bg-purple-700"
              to="/join-us#get-in-touch"
            />


            {/* Browse Courses */}

            <SupportCard
              icon={<Library className="w-6 h-6" />}
              iconClass="bg-emerald-50 text-emerald-600"
              title="Browse Courses"
              description="Return to the academy library and discover your next learning milestone."
              button="Library Home"
              buttonClass="bg-emerald-700 hover:bg-emerald-800"
              to="/courses"
            />

          </div>

        </div>

      </section>

    </div>
  );
};


/* =============================================================
   SECTION HEADING
============================================================= */

const SectionHeading = ({
  icon,
  iconClass,
  title,
}) => {
  return (
    <div className="flex items-center gap-4 mb-7">

      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconClass}`}
      >
        {icon}
      </div>

      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
        {title}
      </h2>

    </div>
  );
};


/* =============================================================
   CHECKLIST ITEM
============================================================= */

const ChecklistItem = ({ children }) => {
  return (
    <div className="flex items-start gap-4">

      <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />

      <span className="text-base text-slate-600 leading-relaxed">
        {children}
      </span>

    </div>
  );
};


/* =============================================================
   STATUS ROW
============================================================= */

const StatusRow = ({
  icon,
  title,
  status,
}) => {
  return (
    <div className="flex items-center justify-between bg-white rounded-xl px-5 py-4 border border-slate-100">

      <div className="flex items-center gap-3">

        <span className="text-blue-600">
          {icon}
        </span>

        <span className="text-sm font-semibold text-slate-700">
          {title}
        </span>

      </div>

      <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
        {status}
      </span>

    </div>
  );
};


/* =============================================================
   LEVEL CARD
============================================================= */

const LevelCard = ({
  level,
  subtitle,
  className,
}) => {
  return (
    <div className={`rounded-2xl border p-6 ${className}`}>

      <p className="text-sm font-extrabold tracking-wide">
        {level}
      </p>

      <p className="text-sm mt-2 opacity-80">
        {subtitle}
      </p>

    </div>
  );
};


/* =============================================================
   ACCOUNT INFO CARD
============================================================= */

const InfoCard = ({
  icon,
  title,
  description,
}) => {
  return (
    <div className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">

      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
        {icon}
      </div>

      <h3 className="text-lg font-bold text-slate-900">
        {title}
      </h3>

      <p className="text-sm text-slate-600 leading-relaxed mt-3">
        {description}
      </p>

    </div>
  );
};


/* =============================================================
   TECHNICAL CARD
============================================================= */

const TechnicalCard = ({
  title,
  description,
}) => {
  return (
    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">

      <h3 className="text-lg font-bold text-slate-900">
        {title}
      </h3>

      <p className="text-sm text-slate-600 leading-relaxed mt-2">
        {description}
      </p>

    </div>
  );
};


/* =============================================================
   SUPPORT CARD
============================================================= */

const SupportCard = ({
  icon,
  iconClass,
  title,
  description,
  button,
  buttonClass,
  to,
}) => {
  return (
    <div className="bg-white rounded-2xl p-7 text-center border border-slate-100 shadow-sm hover:shadow-md transition-shadow">

      <div
        className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${iconClass}`}
      >
        {icon}
      </div>

      <h3 className="text-lg font-bold text-slate-900 mt-5">
        {title}
      </h3>

      <p className="text-sm text-slate-500 leading-relaxed mt-3 max-w-xs mx-auto">
        {description}
      </p>

      <Link
        to={to}
        className={`block mt-6 w-full rounded-xl py-3 text-sm font-semibold text-white transition-colors ${buttonClass}`}
      >
        {button}
      </Link>

    </div>
  );
};

export default DocumentationPage;