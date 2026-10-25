import { useState, useEffect, useCallback } from 'react';
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
  Play,
  Flame,
  Calendar,
  ChevronDown,
  FileCheck2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
} from 'lucide-react';
import useAuth from '../context/useAuth';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';
import StudentSidebar from '../components/StudentSidebar';
import { isVideoUrl } from '../utils/mediaUtils';

export default function DashboardPage() {
  const { user, logout, loading: authLoading, isAuthenticated } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('This Month');

  const fetchDashboardData = useCallback(async (showLoading = false) => {
    if (authLoading || !isAuthenticated || !user?.id) {
      return;
    }

    if (showLoading) {
      setLoading(true);
    }
    try {
      const requestConfig = {
        params: { _t: Date.now() },
        headers: { 'Cache-Control': 'no-cache' },
      };
      const [dashboardResponse, attendanceResponse] = await Promise.all([
        apiService.get('/users/dashboard', requestConfig),
        apiService.get('/attendance/my-attendance', requestConfig),
      ]);

      if (dashboardResponse.data?.success) {
        const dashboard = dashboardResponse.data.data;
        const attendance = attendanceResponse.data;

        // Attendance is also used by the profile page. Use that same
        // database-backed source here so both pages always show the same
        // records and summary.
        if (attendance?.success && dashboard?.statistics) {
          dashboard.statistics = {
            ...dashboard.statistics,
            attendanceRate: attendance.stats?.attendanceRate ?? dashboard.statistics.attendanceRate,
            attendanceSummary: {
              totalSessions: attendance.stats?.totalSessions || 0,
              presentCount: attendance.stats?.present || 0,
              absentCount: attendance.stats?.absent || 0,
              lateCount: attendance.stats?.late || 0,
              excusedCount: attendance.stats?.excused || 0,
            },
          };
          dashboard.attendance = {
            ...(dashboard.attendance || {}),
            rate: attendance.stats?.attendanceRate ?? dashboard.attendance?.rate,
            records: attendance.records || [],
          };
        }

        setDashboardData(dashboard);
      }
    } catch (error) {
      console.error('Failed to load user dashboard from database:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [authLoading, isAuthenticated, user?.id]);

  useEffect(() => {
    fetchDashboardData(true);

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchDashboardData();
      }
    };
    const refreshOnPageShow = () => fetchDashboardData();
    const refreshInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchDashboardData();
      }
    }, 15000);

    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('pageshow', refreshOnPageShow);

    return () => {
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('pageshow', refreshOnPageShow);
      window.clearInterval(refreshInterval);
    };
  }, [fetchDashboardData]);

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
  };

  // Derive active data from DB or fallback to auth user context
  const currentUser = dashboardData?.user || user;
  const statsData = dashboardData?.statistics || {
    totalEnrolledCourses: currentUser?.enrolledCourses?.length || 0,
    totalCompletedLessons: 0,
    timeSpentFormatted: '0h',
    overallProgress: 0,
    streakDays: 1,
    attendanceRate: 100,
  };

  const enrolledCourses = dashboardData?.enrolledCourses || [];
  const recentActivities = (dashboardData?.recentActivity || []).filter(
    (act) => !act.title?.toLowerCase().includes('certificate') && act.icon !== 'Award'
  );

  const stats = [
    {
      label: 'Courses Enrolled',
      value: statsData.totalEnrolledCourses.toString().padStart(2, '0'),
      icon: BookOpen,
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Lessons Completed',
      value: statsData.totalCompletedLessons.toString().padStart(2, '0'),
      icon: CheckCircle2,
      iconBg: 'bg-green-50 text-green-600',
    },
    {
      label: 'Attendance Rate',
      value: `${statsData.attendanceRate || 100}%`,
      icon: TrendingUp,
      iconBg: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Time Spent',
      value: statsData.timeSpentFormatted || '0h',
      icon: Clock,
      iconBg: 'bg-gray-100 text-gray-600',
    },
  ];

  const streakDays = statsData.streakDays || 1;
  const overallProgress = statsData.overallProgress || 0;

  const weekDays = [
    { day: 'M', active: streakDays >= 1 },
    { day: 'T', active: streakDays >= 2 },
    { day: 'W', active: streakDays >= 3, current: true },
    { day: 'T', active: streakDays >= 4 },
    { day: 'F', active: streakDays >= 5 },
    { day: 'S', active: streakDays >= 6 },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Sidebar */}
        <StudentSidebar activeTab="dashboard" user={currentUser} />

        {/* Main Dashboard Area */}
        <main className="flex-1 min-w-0 space-y-6">
          
          {/* Header & Greeting Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white lg:bg-transparent p-6 lg:p-0 rounded-2xl lg:rounded-none shadow-sm lg:shadow-none border lg:border-none border-gray-100">
            <div>
              <span className="text-[11px] font-bold text-blue-600 tracking-wider uppercase">
                LEARNING DASHBOARD
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-0.5">
                Welcome back, {currentUser?.name?.split(' ')[0] || 'Scholar'}.
              </h1>
              <p className="text-sm text-gray-500 mt-1 max-w-xl leading-relaxed">
                {statsData.totalEnrolledCourses > 0
                  ? `Your language journey is ${overallProgress}% complete across ${statsData.totalEnrolledCourses} course${statsData.totalEnrolledCourses === 1 ? '' : 's'}. Keep up the great consistency!`
                  : 'Welcome to your personal learning dashboard! Browse and enroll in Korean language courses to begin your learning journey.'}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Link
                to="/profile"
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs sm:text-sm font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-xs transition active:scale-[0.98]"
              >
                <Clock size={16} className="text-blue-600" />
                <span>Attendance Record</span>
              </Link>
              <Link
                to={enrolledCourses.length > 0 ? `/course-info/${enrolledCourses[0]._id}` : '/courses'}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition active:scale-[0.98]"
              >
                <Play size={16} className="fill-white" />
                <span>{enrolledCourses.length > 0 ? 'Continue Last Lesson' : 'Explore Courses'}</span>
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
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Overall Progress
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Calculated across all enrolled courses</p>
                </div>
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
                      {/* Progress circle */}
                      <circle
                        cx="60"
                        cy="60"
                        r="48"
                        stroke="#2563eb"
                        strokeWidth="10"
                        strokeDasharray={2 * Math.PI * 48}
                        strokeDashoffset={2 * Math.PI * 48 * (1 - (overallProgress / 100))}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-3xl font-extrabold text-gray-900 leading-none">
                        {overallProgress}%
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
                  {/* Curriculum Progress */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                      <span className="text-gray-700">Curriculum Progress</span>
                      <span className="text-blue-600 font-bold">{overallProgress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-700"
                        style={{ width: `${overallProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Attendance Rate */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                      <span className="text-gray-700">Attendance Rate</span>
                      <span className="text-green-600 font-bold">{statsData.attendanceRate}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-700"
                        style={{ width: `${statsData.attendanceRate}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Cohort Comparative Note */}
                  <div className="pt-2">
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {statsData.totalCompletedLessons > 0 ? (
                        <>
                          You have completed <span className="text-green-600 font-bold">{statsData.totalCompletedLessons} lessons</span> so far. Keep building your daily momentum!
                        </>
                      ) : (
                        <>
                          Begin your first lesson today to track your progress and master new vocabulary!
                        </>
                      )}
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
                    {streakDays}
                  </span>
                </div>
                <p className="text-xs text-blue-100 font-medium mt-1 mb-6">
                  {streakDays === 1 ? 'Day Active' : 'Days Running'}
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
                onClick={() => toast.success('Daily study reminder is active!')}
                className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold py-2.5 rounded-xl transition text-center shadow-inner mt-6 active:scale-[0.98]"
              >
                Study Reminder Active
              </button>
            </div>
          </div>

          {/* Enrolled Courses Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                  Enrolled Courses
                </h2>
                <p className="text-xs text-gray-500">Your personalized active curriculums</p>
              </div>
              <Link
                to="/my-courses"
                state={{ source: 'top-nav' }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                View All My Courses
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((n) => (
                  <div key={n} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex gap-4 items-center animate-pulse">
                    <div className="w-16 h-16 rounded-xl bg-gray-200 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded-md w-3/4" />
                      <div className="h-3 bg-gray-100 rounded-md w-1/2" />
                      <div className="h-2 bg-gray-100 rounded-full w-full mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : enrolledCourses.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-dashed border-gray-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <BookOpen size={24} />
                </div>
                <h3 className="font-bold text-gray-900 text-base">No Courses Enrolled Yet</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  You haven't enrolled in any Korean courses yet. Explore our course catalog to get started with Hangul, grammar, or TOPIK prep!
                </p>
                <div className="pt-2">
                  <Link
                    to="/courses"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition"
                  >
                    <span>Browse Course Catalog</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enrolledCourses.map((course) => (
                  <Link
                    key={course._id || course.id}
                    to={`/course-info/${course._id || course.id}`}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex gap-4 items-center hover:shadow-md hover:border-blue-100 transition group"
                  >
                    {course.thumbnail ? (
                      isVideoUrl(course.thumbnail) ? (
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-gray-100 flex-shrink-0">
                          <video
                            src={course.thumbnail}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                          />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                            <Play size={10} className="text-white fill-current translate-x-0.5" />
                          </div>
                        </div>
                      ) : (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-16 h-16 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                        />
                      )
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center border border-blue-200/60 shadow-inner flex-shrink-0">
                        <span className="font-serif text-xl font-bold text-blue-800 tracking-tighter">
                          한국
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition">
                          {course.title}
                        </h3>
                        <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex-shrink-0">
                          {course.level}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mb-3">
                        {course.subtitle}
                      </p>

                      <div className="flex items-center justify-between text-[11px] mb-1 font-medium">
                        <span className="text-gray-500">{course.lessonsText}</span>
                        <span className="text-blue-600 font-bold">
                          {course.progress}%
                        </span>
                      </div>

                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 bg-blue-600"
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Row: Recent Activity & Next Milestone */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Recent Activity (2 Columns wide) */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-base font-bold text-gray-900 mb-4">
                Recent Activity
              </h3>

              <div className="space-y-4">
                {recentActivities.length === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-400">
                    <CheckCircle2 size={24} className="mx-auto mb-2 text-gray-300" />
                    <span>No recent activity recorded yet. Start studying lessons to build your timeline!</span>
                  </div>
                ) : (
                  recentActivities.map((act) => {
                    const isLesson = act.icon === 'CheckCircle2' || act.title?.toLowerCase().includes('lesson');
                    const isCert = act.icon === 'Award' || act.title?.toLowerCase().includes('certificate');
                    const Icon = isCert ? Award : isLesson ? CheckCircle2 : BookOpen;
                    const iconColor = isCert
                      ? 'text-purple-600 bg-purple-50'
                      : isLesson
                      ? 'text-green-600 bg-green-50'
                      : 'text-blue-600 bg-blue-50';

                    return (
                      <div key={act.id} className="flex items-center gap-3.5">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${iconColor}`}
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
                  })
                )}
              </div>
            </div>

            {/* Next Milestone Card */}
            <div className="bg-[#eef2f6] rounded-2xl p-6 shadow-sm border border-gray-200/60 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  Next Milestone
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  Complete your current course track to advance to the next Korean proficiency level.
                </p>

                {/* Inner Mock Exam Widget */}
                <div className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                      UPCOMING EVALUATION
                    </span>
                    <span className="text-xs font-bold text-gray-900">
                      Korean Term Assessment
                    </span>
                  </div>
                </div>
              </div>

              <Link
                to="/profile"
                className="w-full bg-[#dbe4ee] hover:bg-[#ccd9e6] text-gray-700 text-xs font-semibold py-2.5 rounded-xl transition text-center mt-5 active:scale-[0.98] block"
              >
                View Attendance & Profile
              </Link>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
