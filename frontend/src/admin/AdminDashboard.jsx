import React, { useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  CreditCard, 
  Award, 
  RotateCw, 
  BarChart3, 
  PlaySquare, 
  Settings as SettingsIcon, 
  UserPlus, 
  Globe, 
  FileClock, 
  UserCheck, 
  Bell,
  BookOpen,
  CalendarCheck
} from 'lucide-react';

import { useLocation, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import UserManagement from './UserManagement';
import CourseManagement from './CourseManagement';
import AttendanceManagement from './AttendanceManagement';
import AnalyticsReports from './AnalyticsReports';
import PaymentDetails from './PaymentDetails';
import NotificationManager from './NotificationManager';
import AnnouncementsManager from './AnnouncementsManager';
import EventsManager from './EventsManager';
import DiscussionForums from './DiscussionForums';
import SystemSettings from './SystemSettings';
import KoreanProgramApplications from './KoreanProgramApplications';
import apiService from '../services/apiService';
import UserAvatar from '../components/UserAvatar';

const ADMIN_TABS = ['dashboard', 'users', 'courses', 'attendance', 'analytics', 'payments', 'notifications', 'announcements', 'events', 'forums', 'settings', 'applications'];

const formatShortDate = (value) => new Date(value).toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

// "5 minutes ago" etc. Computed when data loads, not during render.
const timeAgo = (value, now) => {
  const seconds = Math.max(0, Math.round((now - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'Just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return formatShortDate(value);
};

const ACTIVITY_STYLES = {
  user: { icon: UserPlus, className: 'bg-blue-50 text-blue-600' },
  application: { icon: Globe, className: 'bg-indigo-50 text-indigo-600' },
  payment: { icon: CreditCard, className: 'bg-amber-50 text-amber-600' },
  attendance: { icon: CalendarCheck, className: 'bg-emerald-50 text-emerald-600' },
};

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    const path = window.location.pathname.replace('/admin', '').replace('/', '');
    return ADMIN_TABS.includes(path) ? path : 'dashboard';
  });

  React.useEffect(() => {
    const path = location.pathname.replace('/admin', '').replace('/', '');
    if (ADMIN_TABS.includes(path)) {
      setActiveTab(path);
    }
  }, [location.pathname]);

  const handleTabNavigation = (tab) => {
    setActiveTab(tab);
    navigate(tab === 'dashboard' ? '/admin/dashboard' : `/admin/${tab}`);
  };
  // On desktop the sidebar is always shown; on phones it starts closed so it doesn't cover the page
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);
  const [enrolledStudents, setEnrolledStudents] = useState(0);
  const [registeredStudents, setRegisteredStudents] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [recentApplications, setRecentApplications] = useState([]);
  const [totalApplications, setTotalApplications] = useState(0);
  const [pendingApplications, setPendingApplications] = useState(0);
  const [completedCourses, setCompletedCourses] = useState(0);
  const [recentCourses, setRecentCourses] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  const fetchDashboardData = async () => {
    // Raw items for the "Recent Activities" feed, merged and sorted at the end
    const activityItems = [];

    try {
      setLoadingStats(true);

      // Fetch users from database
      const usersRes = await apiService.get('/users');
      if (usersRes.data?.data) {
        const usersList = usersRes.data.data;
        const total = usersRes.data.count !== undefined ? usersRes.data.count : usersList.length;
        setTotalUsers(total);
        setRecentUsers(usersList.slice(0, 4));
        const registeredCount = usersList.filter(u => (u.role || '').toLowerCase() === 'student').length;
        const activeEnrolledCount = usersList.filter(
          u => (u.role || '').toLowerCase() === 'student' && Array.isArray(u.enrolledCourses) && u.enrolledCourses.length > 0
        ).length;
        setRegisteredStudents(registeredCount);
        setEnrolledStudents(activeEnrolledCount);
        usersList.slice(0, 5).forEach((u) => {
          if (!u.createdAt) return;
          activityItems.push({
            id: `user-${u._id}`,
            type: 'user',
            text: `New ${(u.role || 'student').toLowerCase()} registered: ${u.name}`,
            at: u.createdAt,
          });
        });
      }

      // Fetch courses from database (showing top enrolled courses with real student counts)
      try {
        const coursesRes = await apiService.get('/courses/admin/all', { params: { limit: 4, sort: 'most-enrolled' } });
        if (coursesRes.data) {
          setTotalCourses(coursesRes.data.total ?? coursesRes.data.count ?? (coursesRes.data.courses?.length || 0));
          setRecentCourses(coursesRes.data.courses || []);
        }
      } catch (cErr) {
        console.warn('Courses fetch error in dashboard:', cErr);
      }

      // Completed courses (all time) from the analytics report
      try {
        const analyticsRes = await apiService.get('/admin/analytics', { params: { period: 3650 } });
        setCompletedCourses(analyticsRes.data?.analytics?.overview?.completedCourses || 0);
      } catch (anErr) {
        console.warn('Analytics fetch error in dashboard:', anErr);
      }

      // Latest payments and attendance for the activity feed
      try {
        const recentPaymentsRes = await apiService.get('/payments/recent', { params: { limit: 5 } });
        (recentPaymentsRes.data?.payments || []).forEach((p) => {
          const amount = `LKR ${Number(p.amount || 0).toLocaleString()}`;
          const who = p.user?.name || 'A student';
          const what = p.course?.title ? ` for ${p.course.title}` : '';
          activityItems.push({
            id: `payment-${p._id}`,
            type: 'payment',
            text: p.status === 'completed'
              ? `Payment received: ${amount} from ${who}${what}`
              : `Payment ${p.status || 'pending'}: ${amount} from ${who}${what}`,
            at: p.paidDate || p.paymentDate || p.createdAt,
          });
        });
      } catch (rpErr) {
        console.warn('Recent payments fetch error in dashboard:', rpErr);
      }

      try {
        const attendanceRes = await apiService.get('/attendance/admin/records', { params: { limit: 5, sort: 'updated_desc' } });
        (attendanceRes.data?.records || []).forEach((r) => {
          const day = new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
          activityItems.push({
            id: `attendance-${r._id}`,
            type: 'attendance',
            text: `${r.student?.name || 'A student'} marked ${r.status} for ${r.course?.title || 'a course'} (${day})`,
            at: r.updatedAt || r.createdAt,
          });
        });
      } catch (atErr) {
        console.warn('Attendance fetch error in dashboard:', atErr);
      }

      // Fetch payment statistics from database
      try {
        const paymentsRes = await apiService.get('/payments/stats');
        if (paymentsRes.data?.stats) {
          setTotalRevenue(paymentsRes.data.stats.totalRevenue || 0);
        }
      } catch (pErr) {
        console.warn('Payments fetch error in dashboard:', pErr);
      }

      // Fetch Korean Program applications for dashboard
      try {
        const appsRes = await apiService.get('/join-us/recent?limit=5');
        if (appsRes.data?.success) {
          setRecentApplications(appsRes.data.data || []);
          setTotalApplications(appsRes.data.total || 0);
          setPendingApplications(appsRes.data.pending || 0);
          (appsRes.data.data || []).forEach((app) => {
            activityItems.push({
              id: `application-${app._id}`,
              type: 'application',
              text: `New Korean program application: ${app.name}`,
              at: app.submittedAt || app.createdAt,
            });
          });
        }
      } catch (aErr) {
        console.warn('Applications fetch error in dashboard:', aErr);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      const now = Date.now();
      setRecentActivities(
        activityItems
          .filter((item) => item.at)
          .sort((a, b) => new Date(b.at) - new Date(a.at))
          .slice(0, 6)
          .map((item) => ({ ...item, when: timeAgo(item.at, now) })),
      );
      setLoadingStats(false);
      setIsRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'courses':
        return <CourseManagement />;
      case 'attendance':
        return <AttendanceManagement />;
      case 'analytics':
        return <AnalyticsReports />;
      case 'payments':
        return <PaymentDetails />;
      case 'notifications':
        return <NotificationManager />;
      case 'announcements':
        return <AnnouncementsManager />;
      case 'events':
        return <EventsManager />;
      case 'forums':
        return <DiscussionForums />;
      case 'settings':
        return <SystemSettings />;
      case 'applications':
        return <KoreanProgramApplications />;
      case 'dashboard':
      default:
        return (
          <div className="space-y-6">
            {/* Dashboard Title & Refresh Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/sri-ko-logo.png"
                  alt="SRI-KO Logo"
                  className="h-10 w-auto object-contain shrink-0"
                />
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-tight">
                    Admin Dashboard
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Welcome back! Here's what's happening with your LMS.
                  </p>
                </div>
              </div>

              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto"
              >
                <RotateCw size={14} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Top 4 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Total Users */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600 shrink-0">
                  <Users size={24} />
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 block">Total Users</span>
                  <span className="text-2xl font-bold text-gray-900 mt-0.5 block">
                    {loadingStats ? (
                      <span className="inline-block w-16 h-7 bg-gray-200 animate-pulse rounded"></span>
                    ) : (
                      totalUsers.toLocaleString()
                    )}
                  </span>
                </div>
              </div>

              {/* Total Courses */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 shrink-0">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 block">Total Courses</span>
                  <span className="text-2xl font-bold text-gray-900 mt-0.5 block">
                    {loadingStats ? (
                      <span className="inline-block w-16 h-7 bg-gray-200 animate-pulse rounded"></span>
                    ) : (
                      totalCourses.toLocaleString()
                    )}
                  </span>
                </div>
              </div>

              {/* Total Revenue */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 shrink-0">
                  <CreditCard size={24} />
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 block">Total Revenue</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xs font-bold text-gray-700">LKR</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {loadingStats ? (
                        <span className="inline-block w-16 h-7 bg-gray-200 animate-pulse rounded"></span>
                      ) : (
                        totalRevenue.toLocaleString()
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Completed Courses */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-3.5 rounded-2xl bg-purple-50 text-purple-600 shrink-0">
                  <Award size={24} />
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 block">Completed Courses</span>
                  <span className="text-2xl font-bold text-gray-900 mt-0.5 block">
                    {loadingStats ? (
                      <span className="inline-block w-16 h-7 bg-gray-200 animate-pulse rounded"></span>
                    ) : (
                      completedCourses.toLocaleString()
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-4">
                Quick Actions
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
                {/* Manage Users */}
                <button
                  onClick={() => handleTabNavigation('users')}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-xs transition-all cursor-pointer text-center group"
                >
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform mb-2.5">
                    <Users size={20} />
                  </div>
                  <span className="text-xs font-bold text-gray-900 block leading-snug">Manage Users</span>
                  <span className="text-[10px] text-gray-400 font-medium block mt-0.5">View/Edit Users</span>
                </button>

                {/* Manage Courses */}
                <button
                  onClick={() => handleTabNavigation('courses')}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/40 hover:shadow-xs transition-all cursor-pointer text-center group"
                >
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform mb-2.5">
                    <BookOpen size={20} />
                  </div>
                  <span className="text-xs font-bold text-gray-900 block leading-snug">Manage Courses</span>
                  <span className="text-[10px] text-gray-400 font-medium block mt-0.5">Create/Edit Content</span>
                </button>

                {/* Attendance */}
                <button
                  onClick={() => handleTabNavigation('attendance')}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-100 hover:border-teal-200 hover:bg-teal-50/40 hover:shadow-xs transition-all cursor-pointer text-center group"
                >
                  <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 group-hover:scale-110 transition-transform mb-2.5">
                    <CalendarCheck size={20} />
                  </div>
                  <span className="text-xs font-bold text-gray-900 block leading-snug">Attendance</span>
                  <span className="text-[10px] text-gray-400 font-medium block mt-0.5">Track & Export</span>
                </button>

                {/* Analytics */}
                <button
                  onClick={() => handleTabNavigation('analytics')}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/40 hover:shadow-xs transition-all cursor-pointer text-center group"
                >
                  <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform mb-2.5">
                    <BarChart3 size={20} />
                  </div>
                  <span className="text-xs font-bold text-gray-900 block leading-snug">Analytics</span>
                  <span className="text-[10px] text-gray-400 font-medium block mt-0.5">Reports & Insights</span>
                </button>

                {/* Subscriptions */}
                <button
                  onClick={() => handleTabNavigation('payments')}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/40 hover:shadow-xs transition-all cursor-pointer text-center group"
                >
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform mb-2.5">
                    <PlaySquare size={20} />
                  </div>
                  <span className="text-xs font-bold text-gray-900 block leading-snug">Subscriptions</span>
                  <span className="text-[10px] text-gray-400 font-medium block mt-0.5">Payments & Revenue</span>
                </button>

                {/* Settings */}
                <button
                  onClick={() => handleTabNavigation('settings')}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 hover:shadow-xs transition-all cursor-pointer text-center group"
                >
                  <div className="p-2.5 rounded-xl bg-gray-100 text-gray-600 group-hover:scale-110 transition-transform mb-2.5">
                    <SettingsIcon size={20} />
                  </div>
                  <span className="text-xs font-bold text-gray-900 block leading-snug">Settings</span>
                  <span className="text-[10px] text-gray-400 font-medium block mt-0.5">System Config</span>
                </button>

                {/* Contact Inquiries */}
                <button
                  onClick={() => handleTabNavigation('applications')}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/40 hover:shadow-xs transition-all cursor-pointer text-center group"
                >
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform mb-2.5">
                    <UserPlus size={20} />
                  </div>
                  <span className="text-xs font-bold text-gray-900 block leading-snug">Inquiries</span>
                  <span className="text-[10px] text-gray-400 font-medium block mt-0.5">Contact Messages</span>
                </button>
              </div>
            </div>

            {/* Secondary 3 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
              {/* Contact Inquiries */}
              <div 
                onClick={() => handleTabNavigation('applications')}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center gap-4 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-600 shrink-0">
                  <Globe size={24} />
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 block leading-tight">
                    Contact Inquiries
                  </span>
                  <span className="text-2xl font-bold text-gray-900 mt-1 block">
                    {loadingStats ? (
                      <span className="inline-block w-16 h-7 bg-gray-200 animate-pulse rounded" />
                    ) : totalApplications.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Pending Inquiries */}
              <div 
                onClick={() => handleTabNavigation('applications')}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center gap-4 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="p-3.5 rounded-2xl bg-orange-50 text-orange-600 shrink-0">
                  <FileClock size={24} />
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 block leading-tight">
                    Pending Inquiries
                  </span>
                  <span className="text-2xl font-bold text-gray-900 mt-1 block">
                    {loadingStats ? (
                      <span className="inline-block w-16 h-7 bg-gray-200 animate-pulse rounded" />
                    ) : pendingApplications.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Enrolled Students */}
              <div 
                onClick={() => handleTabNavigation('users')}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center gap-4 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 shrink-0">
                  <UserCheck size={24} />
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 block leading-tight">
                    Enrolled Students
                  </span>
                  <span className="text-2xl font-bold text-gray-900 mt-1 block">
                    {loadingStats ? (
                      <span className="inline-block w-16 h-7 bg-gray-200 animate-pulse rounded"></span>
                    ) : (
                      enrolledStudents.toLocaleString()
                    )}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                    {registeredStudents} registered students
                  </span>
                </div>
              </div>
            </div>

            {/* Two Column Grid: Recent Users & Recent Courses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Recent Users */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm sm:text-base text-gray-900">Recent Users</h3>
                  <button
                    onClick={() => handleTabNavigation('users')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-3">
                  {loadingStats ? (
                    <div className="space-y-3 py-2">
                      <div className="h-14 bg-gray-100 animate-pulse rounded-xl" />
                      <div className="h-14 bg-gray-100 animate-pulse rounded-xl" />
                    </div>
                  ) : recentUsers.length > 0 ? (
                    recentUsers.map((u) => {
                      const initials = (u.name || 'User')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase();
                      const role = (u.role || 'student').toLowerCase();
                      const roleBadgeClass =
                        role === 'admin'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : role === 'instructor'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                      return (
                        <div
                          key={u._id || u.id}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50/70 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              user={u}
                              size="w-10 h-10"
                              iconSize={18}
                              showInitials={true}
                              className="shrink-0 shadow-xs"
                            />
                            <div>
                              <h4 className="font-bold text-xs sm:text-sm text-gray-900">{u.name}</h4>
                              <p className="text-[11px] text-gray-400">{u.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize border ${roleBadgeClass}`}>
                              {role}
                            </span>
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {u.createdAt
                                ? new Date(u.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : 'Recent'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-gray-400 py-3 text-center">No users found.</p>
                  )}
                </div>
              </div>

              {/* Recent Courses */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm sm:text-base text-gray-900">Recent Courses</h3>
                  <button
                    onClick={() => handleTabNavigation('courses')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-3">
                  {loadingStats ? (
                    <div className="space-y-3 py-2">
                      <div className="h-14 bg-gray-100 animate-pulse rounded-xl" />
                      <div className="h-14 bg-gray-100 animate-pulse rounded-xl" />
                    </div>
                  ) : recentCourses.length > 0 ? (
                    recentCourses.map((course) => {
                      const studentCount = course.enrolledStudents?.length || 0;
                      return (
                        <div
                          key={course._id}
                          className="p-3 rounded-xl hover:bg-gray-50/70 transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
                              {(course.title || 'C').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-xs sm:text-sm text-gray-900 leading-snug truncate">
                                {course.title}
                              </h4>
                              <p className="text-[11px] text-gray-400">
                                {course.category || 'Language'}
                                {!course.isPublished && ' · Draft'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-5 text-right shrink-0">
                            <div>
                              <span className="text-xs font-semibold text-gray-700 block">{studentCount.toLocaleString()}</span>
                              <span className="text-[10px] text-gray-400 block">student{studentCount === 1 ? '' : 's'}</span>
                            </div>
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {course.createdAt ? formatShortDate(course.createdAt) : '—'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-gray-400 py-3 text-center">No courses yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Contact Inquiries */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm sm:text-base text-gray-900">
                  Recent Contact Inquiries
                </h3>
                <button
                  onClick={() => handleTabNavigation('applications')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="space-y-3">
                {loadingStats ? (
                  <div className="space-y-3 py-2">
                    <div className="h-16 bg-gray-100 animate-pulse rounded-xl" />
                    <div className="h-16 bg-gray-100 animate-pulse rounded-xl" />
                  </div>
                ) : recentApplications.length === 0 ? (
                  <p className="text-xs text-gray-400 py-3 text-center">No contact inquiries yet.</p>
                ) : (
                  recentApplications.map((app) => {
                    const initials = (app.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                    const status = (app.status || 'new').toLowerCase();
                    const statusClass =
                      status === 'resolved' || status === 'enrolled'
                        ? 'bg-emerald-100 text-emerald-800'
                        : status === 'in_progress' || status === 'contacted'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800';
                    return (
                      <div
                        key={app._id}
                        className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                            {initials}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs sm:text-sm text-gray-900">{app.name}</h4>
                            <p className="text-[11px] text-gray-500">{app.email}</p>
                            <p className="text-[10px] text-blue-600 font-medium mt-0.5">
                              {app.subject || app.category || (app.currentLevel ? `Level: ${app.currentLevel}` : 'General Inquiry')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase ${statusClass}`}>
                            {status === 'pending' || status === 'new' ? 'New' : status}
                          </span>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {app.submittedAt
                              ? new Date(app.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : '—'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
              <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-4">
                Recent Activities
              </h3>

              <div className="space-y-4">
                {loadingStats ? (
                  <div className="space-y-3 py-2">
                    <div className="h-10 bg-gray-100 animate-pulse rounded-xl" />
                    <div className="h-10 bg-gray-100 animate-pulse rounded-xl" />
                  </div>
                ) : recentActivities.length > 0 ? (
                  recentActivities.map((activity) => {
                    const style = ACTIVITY_STYLES[activity.type] || { icon: Bell, className: 'bg-gray-100 text-gray-600' };
                    const ActivityIcon = style.icon;
                    return (
                      <div key={activity.id} className="flex items-start gap-3.5">
                        <div className={`p-2 rounded-full shrink-0 mt-0.5 ${style.className}`}>
                          <ActivityIcon size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-800 leading-snug">
                            {activity.text}
                          </p>
                          <span className="text-[11px] text-gray-400 mt-0.5 block">{activity.when}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-400 py-3 text-center">No recent activity yet.</p>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans antialiased text-gray-800">
      {/* Sidebar Component */}
      <AdminSidebar
        className="admin-sidebar"
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Navbar */}
        <div className="admin-header">
          <AdminHeader
          onToggleSidebar={toggleSidebar}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          />
        </div>

        {/* Dynamic Main Body Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto admin-main">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
