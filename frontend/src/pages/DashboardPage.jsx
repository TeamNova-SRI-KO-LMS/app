import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  User,
  Settings,
  Folder,
  HelpCircle,
  LogOut,
  Clock,
  CheckCircle2,
  Award,
  Play,
  Flame,
  Calendar,
  ChevronDown,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import useAuth from '../context/useAuth';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeFilter, setTimeFilter] = useState('This Month');

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'courses', label: 'My Courses', icon: BookOpen, path: '/my-courses' },
    { id: 'profile', label: 'Student Profile', icon: User, path: '/attendance' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
    { id: 'resources', label: 'Resources', icon: Folder, path: '/docs' },
  ];

  const stats = [
    {
      label: 'Courses Enrolled',
      value: '12',
      icon: BookOpen,
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Lessons Completed',
      value: '148',
      icon: CheckCircle2,
      iconBg: 'bg-green-50 text-green-600',
    },
    {
      label: 'Certificates Earned',
      value: '04',
      icon: Award,
      iconBg: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Time Spent',
      value: '84h',
      icon: Clock,
      iconBg: 'bg-gray-100 text-gray-600',
    },
  ];

  const enrolledCourses = [
    {
      id: 1,
      title: 'Korean Foundations: Hangul & Phonics',
      subtitle: 'Master the alphabet and pronunciation',
      progress: 66,
      lessonsText: '8/12 lessons',
      theme: 'blue',
      image: (
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center border border-amber-200/60 shadow-inner flex-shrink-0">
          <span className="font-serif text-2xl font-bold text-gray-800 tracking-tighter">
            체험
          </span>
        </div>
      ),
    },
    {
      id: 2,
      title: 'Business Etiquette & Communication',
      subtitle: 'Navigate professional environments in Korea',
      progress: 20,
      lessonsText: '3/15 lessons',
      theme: 'purple',
      image: (
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center border border-slate-700 shadow-inner flex-shrink-0 overflow-hidden relative">
          <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-[1px]"></div>
          <div className="relative z-10 text-center">
            <span className="text-[10px] font-mono text-cyan-300 font-bold tracking-widest block">
              SEOUL
            </span>
            <span className="text-xs text-white font-bold">비즈니스</span>
          </div>
        </div>
      ),
    },
  ];

  const recentActivities = [
    {
      id: 1,
      title: 'Completed lesson: Introduction to Honorifics',
      subtitle: "2 hours ago • Part of 'Korean Foundations'",
      icon: CheckCircle2,
      iconColor: 'text-green-600 bg-green-50',
    },
    {
      id: 2,
      title: 'Passed Vocab Quiz: Family & Relatives',
      subtitle: 'Yesterday • Score: 95%',
      icon: FileCheck2,
      iconColor: 'text-blue-600 bg-blue-50',
    },
    {
      id: 3,
      title: 'Earned Badge: Early Bird',
      subtitle: '2 days ago • Completed 5 lessons before 8 AM',
      icon: Award,
      iconColor: 'text-purple-600 bg-purple-50',
    },
  ];

  const weekDays = [
    { day: 'M', active: true },
    { day: 'T', active: true },
    { day: 'W', active: true, current: true },
    { day: 'T', active: false },
    { day: 'F', active: false },
    { day: 'S', active: false },
  ];

  return (
    <div className="bg-[#f8fafc] min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1380px] mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Left Sidebar */}
        <aside className="w-full lg:w-64 flex-shrink-0 flex flex-col justify-between bg-white lg:bg-transparent p-4 lg:p-0 rounded-2xl shadow-sm lg:shadow-none border lg:border-none border-gray-100">
          <div>
            {/* User Profile Card */}
            <div className="flex flex-col items-center text-center pb-6 border-b border-gray-200/70 mb-6">
              <div className="relative mb-3">
                <div className="w-20 h-20 rounded-full bg-pink-100 p-1 border-2 border-pink-200 shadow-sm overflow-hidden">
                  <img
                    src={
                      user?.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Scholar'}`
                    }
                    alt="Student Avatar"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>
              <h3 className="font-bold text-gray-900 text-base">
                {user?.name || 'Student Name'}
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Level: Intermediate
              </p>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100/80 font-semibold'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon
                      size={18}
                      className={isSelected ? 'text-blue-600' : 'text-gray-400'}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Actions */}
          <div className="pt-6 border-t border-gray-200/70 mt-8 space-y-2">
            <Link
              to="/help"
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-gray-500 hover:text-blue-600 transition"
            >
              <HelpCircle size={18} />
              <span>Help Center</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-red-500 hover:text-red-600 hover:bg-red-50 transition"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Dashboard Area */}
        <main className="flex-1 space-y-6">
          
          {/* Header & Greeting Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white lg:bg-transparent p-6 lg:p-0 rounded-2xl lg:rounded-none shadow-sm lg:shadow-none border lg:border-none border-gray-100">
            <div>
              <span className="text-[11px] font-bold text-blue-600 tracking-wider uppercase">
                LEARNING DASHBOARD
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-0.5">
                Welcome back, {user?.name?.split(' ')[0] || 'Scholar'}.
              </h1>
              <p className="text-sm text-gray-500 mt-1 max-w-xl leading-relaxed">
                Your language journey is 68% complete. You're just a few steps away from your next certification.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Link
                to="/attendance"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition active:scale-[0.98]"
              >
                <Clock size={16} />
                <span>Attendance History</span>
              </Link>
              <Link
                to="/courses"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition active:scale-[0.98]"
              >
                <Play size={16} className="fill-white" />
                <span>Continue Last Lesson</span>
              </Link>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition"
                >
                  <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center mb-4`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      {stat.label}
                    </p>
                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                      {stat.value}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress & Streak Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Overall Progress Card (2 Columns wide) */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-gray-900">
                  Overall Progress
                </h3>
                <div className="relative">
                  <button
                    onClick={() => setTimeFilter(timeFilter === 'This Month' ? 'This Semester' : 'This Month')}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg transition"
                  >
                    <span>{timeFilter}</span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                
                {/* Circular Gauge */}
                <div className="sm:col-span-5 flex flex-col items-center justify-center">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      {/* Background circle */}
                      <circle
                        cx="60"
                        cy="60"
                        r="48"
                        stroke="#f1f5f9"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      {/* Progress circle (70%) */}
                      <circle
                        cx="60"
                        cy="60"
                        r="48"
                        stroke="#2563eb"
                        strokeWidth="10"
                        strokeDasharray={2 * Math.PI * 48}
                        strokeDashoffset={2 * Math.PI * 48 * (1 - 0.7)}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-3xl font-extrabold text-gray-900 leading-none">
                        70%
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1">
                        COMPLETION
                      </span>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-gray-500 mt-3 text-center">
                    Course Completion Rate
                  </p>
                </div>

                {/* Progress Bars & Analysis */}
                <div className="sm:col-span-7 space-y-4">
                  {/* Certificate Goal */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                      <span className="text-gray-700">Certificate Goal</span>
                      <span className="text-purple-600 font-bold">80%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-700"
                        style={{ width: '80%' }}
                      ></div>
                    </div>
                  </div>

                  {/* Daily Quiz Accuracy */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                      <span className="text-gray-700">Daily Quiz Accuracy</span>
                      <span className="text-green-600 font-bold">92%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-700"
                        style={{ width: '92%' }}
                      ></div>
                    </div>
                  </div>

                  {/* Cohort Comparative Note */}
                  <div className="pt-2">
                    <p className="text-xs text-gray-500 leading-relaxed">
                      You are performing{' '}
                      <span className="text-green-600 font-bold">12% better</span>{' '}
                      than the average student in your cohort. Keep it up!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Learning Streak Card */}
            <div className="bg-gradient-to-b from-blue-600 via-indigo-600 to-purple-700 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl pointer-events-none"></div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase text-blue-100 mb-3">
                  <Flame size={16} className="text-orange-400 fill-orange-400 animate-pulse" />
                  <span>LEARNING STREAK</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold text-white tracking-tight leading-none">
                    15
                  </span>
                </div>
                <p className="text-xs text-blue-100 font-medium mt-1 mb-6">
                  Days Running
                </p>

                {/* Day Dots Row */}
                <div className="flex justify-between items-center px-1">
                  {weekDays.map((item, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                          item.current
                            ? 'bg-white text-blue-600 shadow-sm ring-2 ring-white/60'
                            : 'text-white/80'
                        }`}
                      >
                        {item.day}
                      </div>
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.active ? 'bg-green-400' : 'bg-white/20'
                        }`}
                      ></div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => toast.success('Daily study reminder set for 7:00 PM!')}
                className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold py-2.5 rounded-xl transition text-center shadow-inner mt-6 active:scale-[0.98]"
              >
                Set Daily Reminder
              </button>
            </div>
          </div>

          {/* Enrolled Courses Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                Enrolled Courses
              </h2>
              <Link
                to="/courses"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                View All Courses
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrolledCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex gap-4 items-center hover:shadow-md transition"
                >
                  {course.image}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 truncate">
                      {course.title}
                    </h3>
                    <p className="text-xs text-gray-500 truncate mb-3">
                      {course.subtitle}
                    </p>

                    <div className="flex items-center justify-between text-[11px] mb-1 font-medium">
                      <span className="text-gray-500">{course.lessonsText}</span>
                      <span
                        className={
                          course.theme === 'blue'
                            ? 'text-blue-600 font-bold'
                            : 'text-purple-600 font-bold'
                        }
                      >
                        {course.progress}%
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          course.theme === 'blue' ? 'bg-blue-600' : 'bg-purple-600'
                        }`}
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Row: Recent Activity & Next Milestone */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Recent Activity (2 Columns wide) */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-base font-bold text-gray-900 mb-4">
                Recent Activity
              </h3>

              <div className="space-y-4">
                {recentActivities.map((act) => {
                  const Icon = act.icon;
                  return (
                    <div key={act.id} className="flex items-center gap-3.5">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${act.iconColor}`}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                          {act.title}
                        </p>
                        <p className="text-[11px] text-gray-400">{act.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Next Milestone Card */}
            <div className="bg-[#eef2f6] rounded-2xl p-6 shadow-sm border border-gray-200/60 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  Next Milestone
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  Reach the end of the 'Hangul Basics' track to unlock your first verifiable certificate.
                </p>

                {/* Inner Mock Exam Widget */}
                <div className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                      MOCK EXAM
                    </span>
                    <span className="text-xs font-bold text-gray-900">
                      This Friday at 3:00 PM
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => toast.success('Mock Exam added to your calendar!')}
                className="w-full bg-[#dbe4ee] hover:bg-[#ccd9e6] text-gray-700 text-xs font-semibold py-2.5 rounded-xl transition text-center mt-5 active:scale-[0.98]"
              >
                Add to Calendar
              </button>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

