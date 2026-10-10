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
  CheckCircle2, 
  BookOpen,
  ArrowRight
} from 'lucide-react';

import { useLocation, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import UserManagement from './UserManagement';
import CourseManagement from './CourseManagement';
import AnalyticsReports from './AnalyticsReports';
import PaymentDetails from './PaymentDetails';
import NotificationManager from './NotificationManager';
import AnnouncementsManager from './AnnouncementsManager';
import DiscussionForums from './DiscussionForums';
import SystemSettings from './SystemSettings';
import KoreanProgramApplications from './KoreanProgramApplications';
import apiService from '../services/apiService';

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    const path = window.location.pathname.replace('/admin', '').replace('/', '');
    const validTabs = ['dashboard', 'users', 'courses', 'analytics', 'payments', 'notifications', 'announcements', 'forums', 'settings', 'applications'];
    return validTabs.includes(path) ? path : 'dashboard';
  });

  React.useEffect(() => {
    const path = location.pathname.replace('/admin', '').replace('/', '');
    const validTabs = ['dashboard', 'users', 'courses', 'analytics', 'payments', 'notifications', 'announcements', 'forums', 'settings', 'applications'];
    if (validTabs.includes(path)) {
      setActiveTab(path);
    }
  }, [location.pathname]);

  const handleTabNavigation = (tab) => {
    setActiveTab(tab);
    navigate(tab === 'dashboard' ? '/admin/dashboard' : `/admin/${tab}`);
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);
  const [enrolledStudents, setEnrolledStudents] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoadingStats(true);
      
      // Fetch users from database
      const usersRes = await apiService.get('/users');
      if (usersRes.data?.data) {
        const usersList = usersRes.data.data;
        const total = usersRes.data.count !== undefined ? usersRes.data.count : usersList.length;
        setTotalUsers(total);
        setRecentUsers(usersList.slice(0, 4));
        const studentsCount = usersList.filter(u => (u.role || '').toLowerCase() === 'student').length;
        setEnrolledStudents(studentsCount);
      }

      // Fetch courses from database
      try {
        const coursesRes = await apiService.get('/courses');
        if (coursesRes.data) {
          setTotalCourses(coursesRes.data.total ?? coursesRes.data.count ?? (coursesRes.data.courses?.length || 0));
        }
      } catch (cErr) {
        console.warn('Courses fetch error in dashboard:', cErr);
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
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
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
      case 'analytics':
        return <AnalyticsReports />;
      case 'payments':
        return <PaymentDetails />;
      case 'notifications':
        return <NotificationManager />;
      case 'announcements':
        return <AnnouncementsManager />;
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
                  <span className="text-2xl font-bold text-gray-900 mt-0.5 block">3,102</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-4">
                Quick Actions
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
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

                {/* Join Us */}
                <button
                  onClick={() => handleTabNavigation('applications')}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/40 hover:shadow-xs transition-all cursor-pointer text-center group"
                >
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform mb-2.5">
                    <UserPlus size={20} />
                  </div>
                  <span className="text-xs font-bold text-gray-900 block leading-snug">Join Us</span>
                  <span className="text-[10px] text-gray-400 font-medium block mt-0.5">Program Applications</span>
                </button>
              </div>
            </div>

            {/* Secondary 3 KPI Cards (Korean Program) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
              {/* Korean Program Applications */}
              <div 
                onClick={() => handleTabNavigation('applications')}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center gap-4 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-600 shrink-0">
                  <Globe size={24} />
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 block leading-tight">
                    Korean Program Applications
                  </span>
                  <span className="text-2xl font-bold text-gray-900 mt-1 block">425</span>
                </div>
              </div>

              {/* Pending Applications */}
              <div 
                onClick={() => handleTabNavigation('applications')}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center gap-4 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="p-3.5 rounded-2xl bg-orange-50 text-orange-600 shrink-0">
                  <FileClock size={24} />
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 block leading-tight">
                    Pending Applications
                  </span>
                  <span className="text-2xl font-bold text-gray-900 mt-1 block">82</span>
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
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="w-10 h-10 rounded-full object-cover shrink-0 shadow-xs"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                                {initials}
                              </div>
                            )}
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

                <div className="p-3 rounded-xl hover:bg-gray-50/70 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
                      K
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-gray-900 leading-snug">
                        Korean Syntax Masterclass
                      </h4>
                      <p className="text-[11px] text-gray-400">Language</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 text-right">
                    <div>
                      <span className="text-xs font-semibold text-gray-700 block">850</span>
                      <span className="text-[10px] text-gray-400 block">students</span>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">Nov 10, 2023</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Korean Program Applications */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm sm:text-base text-gray-900">
                  Recent Korean Program Applications
                </h3>
                <button
                  onClick={() => handleTabNavigation('applications')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="space-y-3">
                {/* Application 1 */}
                <div className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                      AM
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-gray-900">Aruni Madushani</h4>
                      <p className="text-[11px] text-gray-500">aruni@example.com</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Level: Intermediate | Interests: 3
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <span className="px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider bg-amber-100 text-amber-800 uppercase">
                      PENDING
                    </span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">Nov 14, 2023</span>
                  </div>
                </div>

                {/* Application 2 */}
                <div className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                      KP
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-gray-900">Kasun Perera</h4>
                      <p className="text-[11px] text-gray-500">kasun.p@example.com</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Level: Beginner | Interests: 1
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <span className="px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider bg-emerald-100 text-emerald-800 uppercase">
                      ENROLLED
                    </span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">Nov 12, 2023</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
              <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-4">
                Recent Activities
              </h3>

              <div className="space-y-4">
                {/* Activity 1 */}
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-full bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                    <Bell size={16} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-800 leading-snug">
                      New student enrollment: Aruni Madushani joined Korean Level 1
                    </p>
                    <span className="text-[11px] text-gray-400 mt-0.5 block">2 hours ago</span>
                  </div>
                </div>

                {/* Activity 2 */}
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-full bg-emerald-50 text-emerald-600 shrink-0 mt-0.5">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-800 leading-snug">
                      Course updated: Business Korean Essentials by Prof. Park
                    </p>
                    <span className="text-[11px] text-gray-400 mt-0.5 block">5 hours ago</span>
                  </div>
                </div>
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
