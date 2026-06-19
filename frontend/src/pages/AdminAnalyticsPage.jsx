import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import toast from 'react-hot-toast';
import apiUrl, { getWorkingApiUrl } from '../config/apiConfig';
import {
  ChartBarIcon,
  UsersIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  StarIcon,
  // AdjustmentsHorizontalIcon,
  ArrowUpIcon,
  // ArrowDownIcon,
} from '@heroicons/react/24/outline';
import UserGrowthChart from '../components/charts/UserGrowthChart';
import RevenueChart from '../components/charts/RevenueChart';
import UserCourseComparisonChart from '../components/charts/UserCourseComparisonChart';

const AdminAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    overview: {
      totalUsers: 0,
      totalCourses: 0,
      totalRevenue: 0,
      activeUsers: 0,
      completedCourses: 0,
      averageRating: 0,
      usersGrowth: 0,
      coursesGrowth: 0,
      revenueGrowth: 0,
      activeUsersGrowth: 0,
    },
    userActivity: {
      dailyActiveUsers: 0,
      dailyActiveUsersGrowth: 0,
      courseCompletionsThisMonth: 0,
      courseCompletionsGrowth: 0,
      averageRating: 0,
      averageRatingChange: 0,
    },
    userGrowth: [],
    revenueData: [],
    courseStats: [],
    topCourses: [],
    userEngagement: [],
    monthlyStats: [],
  });
  const [dateRange, setDateRange] = useState('30');
  const [selectedMetric, setSelectedMetric] = useState('users');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Generate year options (current year and 2 years back)
  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let i = 0; i < 3; i++) {
    yearOptions.push(currentYear - i);
  }

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, selectedYear]); // Auto-refresh when year or date range changes

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const workingApiUrl = await getWorkingApiUrl();

      // Build query parameters with cache buster
      let queryParams = `period=${dateRange}&_t=${Date.now()}`;  // Add timestamp to prevent caching
      if (selectedYear !== 'all') {
        queryParams += `&year=${selectedYear}`;
      }

      const apiEndpoint = `${workingApiUrl}/admin/analytics?${queryParams}`;
      console.log('Fetching analytics from:', apiEndpoint);

      const response = await fetch(apiEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        cache: 'no-cache',  // Disable caching
      });

      console.log('Analytics response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Analytics response data:', data);
        console.log('🔍 GROWTH VALUES RECEIVED FROM BACKEND:');
        console.log('   usersGrowth:', data.analytics?.overview?.usersGrowth);
        console.log('   coursesGrowth:', data.analytics?.overview?.coursesGrowth);
        console.log('   revenueGrowth:', data.analytics?.overview?.revenueGrowth);
        console.log('   activeUsersGrowth:', data.analytics?.overview?.activeUsersGrowth);

        if (data.success) {
          const analyticsData = data.analytics || {
            overview: {
              totalUsers: 0,
              totalCourses: 0,
              totalRevenue: 0,
              activeUsers: 0,
              completedCourses: 0,
              averageRating: 0,
              usersGrowth: 0,
              coursesGrowth: 0,
              revenueGrowth: 0,
              activeUsersGrowth: 0,
            },
            userActivity: {
              dailyActiveUsers: 0,
              dailyActiveUsersGrowth: 0,
              courseCompletionsThisMonth: 0,
              courseCompletionsGrowth: 0,
              averageRating: 0,
              averageRatingChange: 0,
            },
            userGrowth: [],
            revenueData: [],
            courseStats: [],
            topCourses: [],
            userEngagement: [],
            monthlyStats: [],
          };

          console.log('✅ Setting analytics state with:', analyticsData);
          console.log('   overview.usersGrowth:', analyticsData.overview.usersGrowth);
          console.log('   overview.coursesGrowth:', analyticsData.overview.coursesGrowth);
          console.log('   overview.revenueGrowth:', analyticsData.overview.revenueGrowth);
          console.log('   overview.activeUsersGrowth:', analyticsData.overview.activeUsersGrowth);
          console.log('   userActivity:', analyticsData.userActivity);

          setAnalytics(analyticsData);
          console.log('Analytics loaded successfully');
        } else {
          console.error('Analytics API returned error:', data.message);
          toast.error(data.message || 'Failed to fetch analytics data');
        }
      } else {
        const errorData = await response.json();
        console.error('Analytics API error:', errorData);
        toast.error(errorData.message || 'Failed to fetch analytics data');
      }
    } catch (error) {
      toast.error('Failed to fetch analytics data');
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async format => {
    try {
      const response = await apiService.get(
        `/admin/analytics/export?format=${format}&period=${dateRange}`,
        {
          responseType: 'blob',
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `analytics-report-${new Date().toISOString().split('T')[0]}.${format}`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = num => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // const getPercentageChange = (current, previous) => {
  //   if (previous === 0) return 0;
  //   return ((current - previous) / previous) * 100;
  // };

  const getTrendIcon = change => {
    if (change > 0)
      return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />;
    if (change < 0)
      return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />;
    return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
  };

  const formatGrowth = growth => {
    const value = Number(growth) || 0;
    const sign = value >= 0 ? '+' : '';
    const colorClass = value >= 0 ? 'text-green-600' : 'text-red-600';
    console.log(`📊 formatGrowth called with: ${growth} -> formatted: ${sign}${value.toFixed(1)}%`);
    return { text: `${sign}${value.toFixed(1)}%`, colorClass };
  };

  // const getTrendColor = (change) => {
  //   if (change > 0) return 'text-green-600';
  //   if (change < 0) return 'text-red-600';
  //   return 'text-gray-600';
  // };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Analytics & Reports
              </h1>
              <p className="mt-2 text-gray-600">
                Comprehensive insights into your LMS performance
              </p>
            </div>
            <div className="flex space-x-3">
              <select
                value={selectedYear}
                onChange={e => {
                  const value = e.target.value;
                  setSelectedYear(value === 'all' ? 'all' : Number(value));
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
                <option value="all">All Time</option>
              </select>
              <select
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
              <button
                onClick={() => exportReport('pdf')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                Export PDF
              </button>
              <button
                onClick={() => exportReport('csv')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(analytics.overview.totalUsers)}
                </p>
                <div className="flex items-center mt-1">
                  {getTrendIcon(analytics.overview.usersGrowth)}
                  <span className={`text-sm ml-1 ${formatGrowth(analytics.overview.usersGrowth).colorClass}`}>
                    {formatGrowth(analytics.overview.usersGrowth).text}
                  </span>
                </div>
              </div>
              <UsersIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Courses
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(analytics.overview.totalCourses)}
                </p>
                <div className="flex items-center mt-1">
                  {getTrendIcon(analytics.overview.coursesGrowth)}
                  <span className={`text-sm ml-1 ${formatGrowth(analytics.overview.coursesGrowth).colorClass}`}>
                    {formatGrowth(analytics.overview.coursesGrowth).text}
                  </span>
                </div>
              </div>
              <AcademicCapIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.overview.totalRevenue)}
                </p>
                <div className="flex items-center mt-1">
                  {getTrendIcon(analytics.overview.revenueGrowth)}
                  <span className={`text-sm ml-1 ${formatGrowth(analytics.overview.revenueGrowth).colorClass}`}>
                    {formatGrowth(analytics.overview.revenueGrowth).text}
                  </span>
                </div>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Active Users
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(analytics.overview.activeUsers)}
                </p>
                <div className="flex items-center mt-1">
                  {getTrendIcon(analytics.overview.activeUsersGrowth)}
                  <span className={`text-sm ml-1 ${formatGrowth(analytics.overview.activeUsersGrowth).colorClass}`}>
                    {formatGrowth(analytics.overview.activeUsersGrowth).text}
                  </span>
                </div>
              </div>
              <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* User Growth Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                User Growth
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedMetric('users')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    selectedMetric === 'users'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Users
                </button>
                <button
                  onClick={() => setSelectedMetric('courses')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    selectedMetric === 'courses'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Courses
                </button>
              </div>
            </div>
            <div className="h-64">
              <UserGrowthChart
                data={analytics.userGrowth}
                selectedMetric={selectedMetric}
              />
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Revenue Trends
              </h3>
              <div className="flex items-center text-sm text-gray-500">
                <CalendarIcon className="w-4 h-4 mr-1" />
                Last {dateRange} days
              </div>
            </div>
            <div className="h-64">
              <RevenueChart
                data={analytics.revenueData}
                formatCurrency={formatCurrency}
              />
            </div>
          </div>
        </div>

        {/* User & Course Comparison Chart - New Addition */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                User & Course Growth Comparison
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Side-by-side comparison of user registrations and course enrollments
              </p>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <ChartBarIcon className="w-4 h-4 mr-1" />
              Comparative Analysis
            </div>
          </div>
          <div className="h-80">
            <UserCourseComparisonChart data={analytics.monthlyStats} />
          </div>
        </div>

        {/* Top Courses */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Top Performing Courses
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analytics.topCourses.length > 0 ? (
                analytics.topCourses.map((course, index) => (
                  <div
                    key={course._id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {course.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {course.instructor?.name || 'No instructor'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {course.enrolledStudents?.length || 0} students
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(course.price)}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="text-sm text-gray-900">
                          {course.averageRating?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <AcademicCapIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No course data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Engagement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                User Activity
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <UsersIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Daily Active Users
                      </p>
                      <p className="text-sm text-gray-500">
                        Users who logged in today
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {formatNumber(analytics.userActivity?.dailyActiveUsers || 0)}
                    </p>
                    <div className="flex items-center">
                      {getTrendIcon(analytics.userActivity?.dailyActiveUsersGrowth || 0)}
                      <span className={`text-sm ml-1 ${formatGrowth(analytics.userActivity?.dailyActiveUsersGrowth || 0).colorClass}`}>
                        {formatGrowth(analytics.userActivity?.dailyActiveUsersGrowth || 0).text}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <AcademicCapIcon className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Course Completions
                      </p>
                      <p className="text-sm text-gray-500">
                        Courses completed this month
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {formatNumber(analytics.userActivity?.courseCompletionsThisMonth || 0)}
                    </p>
                    <div className="flex items-center">
                      {getTrendIcon(analytics.userActivity?.courseCompletionsGrowth || 0)}
                      <span className={`text-sm ml-1 ${formatGrowth(analytics.userActivity?.courseCompletionsGrowth || 0).colorClass}`}>
                        {formatGrowth(analytics.userActivity?.courseCompletionsGrowth || 0).text}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <EyeIcon className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Average Rating
                      </p>
                      <p className="text-sm text-gray-500">
                        Overall course satisfaction
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {analytics.userActivity?.averageRating?.toFixed(1) || 'N/A'}
                    </p>
                    <div className="flex items-center">
                      {getTrendIcon(analytics.userActivity?.averageRatingChange || 0)}
                      <span className={`text-sm ml-1 ${
                        (analytics.userActivity?.averageRatingChange || 0) >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {(analytics.userActivity?.averageRatingChange || 0) >= 0 ? '+' : ''}{(analytics.userActivity?.averageRatingChange || 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Statistics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Monthly Statistics
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {analytics.monthlyStats.length > 0 ? (
                  analytics.monthlyStats.map((stat, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {stat.month}
                        </p>
                        <p className="text-sm text-gray-500">{stat.year}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatNumber(stat.users)} users
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(stat.revenue)} revenue
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No monthly data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
