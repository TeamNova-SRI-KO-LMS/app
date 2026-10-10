import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  Users, 
  BookOpen, 
  CreditCard, 
  Zap, 
  Star,
  ChevronDown,
  BarChart2
} from 'lucide-react';
import apiService from '../services/apiService';

const AnalyticsReports = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedRange, setSelectedRange] = useState('Last 30 Days');
  const [chartToggle, setChartToggle] = useState('Users');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const period = selectedRange === 'Last 90 Days'
          ? 90
          : selectedRange === 'This Year'
            ? 365
            : 30;
        const response = await apiService.get('/admin/analytics', {
          params: { year: selectedYear, period },
        });
        if (!response.data?.success || !response.data.analytics) {
          throw new Error(response.data?.message || 'Analytics data was not returned');
        }
        setAnalytics(response.data.analytics);
      } catch (error) {
        console.error('Failed to load analytics cards:', error);
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [selectedRange, selectedYear]);

  const overview = analytics?.overview;
  const activity = analytics?.userActivity;
  const formatNumber = value => Number(value || 0).toLocaleString('en-US');
  const formatCurrency = value => `LKR ${Number(value || 0).toLocaleString('en-LK')}`;
  const formatGrowth = value => {
    const number = Number(value || 0);
    return `${number >= 0 ? '↑' : '↓'}${Math.abs(number).toFixed(1)}%`;
  };
  const growthData = analytics?.userGrowth || [];
  const revenueData = analytics?.revenueData || [];
  const chartValues = chartToggle === 'Users'
    ? growthData.map(item => Number(item.newUsers ?? item.users ?? 0))
    : growthData.map(item => Number(item.enrollments ?? item.courses ?? 0));
  const maxChartValue = Math.max(...chartValues, 1);
  const maxGrowthValue = Math.max(...growthData.map(row => Math.max(
    Number(row.newUsers ?? row.users ?? 0),
    Number(row.enrollments ?? row.courses ?? 0),
  )), 1);
  const chartPath = values => values
    .map((value, index) => {
      const x = values.length > 1 ? 10 + (index * 480) / (values.length - 1) : 250;
      const y = 140 - (value / maxChartValue) * 110;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  const maxRevenue = Math.max(...revenueData.map(item => Number(item.revenue || 0)), 1);
  const revenuePath = revenueData
    .map((item, index) => {
      const x = revenueData.length > 1 ? 10 + (index * 480) / (revenueData.length - 1) : 250;
      const y = 140 - (Number(item.revenue || 0) / maxRevenue) * 110;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  const chartLabels = growthData.length
    ? growthData.map(item => `${item.month} ${String(item.year).slice(-2)}`)
    : [];
  const revenueLabels = revenueData.length
    ? revenueData.map(item => item.month)
    : [];

  return (
    <div className="space-y-6">
      {/* Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Analytics & Reports
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Comprehensive insights into your educational ecosystem performance.
          </p>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 cursor-pointer shadow-xs"
          >
            <option value={String(currentYear)}>Year: {currentYear}</option>
            <option value={String(currentYear - 1)}>Year: {currentYear - 1}</option>
            <option value={String(currentYear - 2)}>Year: {currentYear - 2}</option>
          </select>

          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
            className="px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 cursor-pointer shadow-xs"
          >
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="Last 90 Days">Last 90 Days</option>
            <option value="This Year">This Year</option>
          </select>

          <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer">
            <FileText size={15} />
            <span>Export PDF</span>
          </button>

          <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer">
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Users */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Users size={18} />
            </div>
            <span className={`text-xs font-bold ${Number(overview?.usersGrowth) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {loading ? '—' : formatGrowth(overview?.usersGrowth)}
            </span>
          </div>
          <span className="text-xs font-semibold text-gray-500 block mt-3">Total Users</span>
          <span className="text-2xl font-extrabold text-gray-900 mt-0.5 block">
            {loading ? '—' : formatNumber(overview?.totalUsers)}
          </span>
        </div>

        {/* Total Courses */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <BookOpen size={18} />
            </div>
            <span className={`text-xs font-bold ${Number(overview?.coursesGrowth) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {loading ? '—' : formatGrowth(overview?.coursesGrowth)}
            </span>
          </div>
          <span className="text-xs font-semibold text-gray-500 block mt-3">Total Courses</span>
          <span className="text-2xl font-extrabold text-gray-900 mt-0.5 block">
            {loading ? '—' : formatNumber(overview?.totalCourses)}
          </span>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CreditCard size={18} />
            </div>
            <span className={`text-xs font-bold ${Number(overview?.revenueGrowth) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {loading ? '—' : formatGrowth(overview?.revenueGrowth)}
            </span>
          </div>
          <span className="text-xs font-semibold text-gray-500 block mt-3">Total Revenue</span>
          <span className="text-2xl font-extrabold text-gray-900 mt-0.5 block">
            {loading ? '—' : formatCurrency(overview?.totalRevenue)}
          </span>
        </div>

        {/* Active Users */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Zap size={18} />
            </div>
            <span className={`text-xs font-bold ${Number(overview?.activeUsersGrowth) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {loading ? '—' : formatGrowth(overview?.activeUsersGrowth)}
            </span>
          </div>
          <span className="text-xs font-semibold text-gray-500 block mt-3">Active Users</span>
          <span className="text-2xl font-extrabold text-gray-900 mt-0.5 block">
            {loading ? '—' : formatNumber(overview?.activeUsers)}
          </span>
        </div>
      </div>

      {/* Line Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-gray-900">User Growth</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                <span className="text-xs text-gray-500 font-medium">New Users</span>
              </div>
            </div>

            <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setChartToggle('Users')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  chartToggle === 'Users' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-600'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setChartToggle('Courses')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  chartToggle === 'Courses' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-600'
                }`}
              >
                Courses
              </button>
            </div>
          </div>

          {/* SVG Line Chart Graphic */}
          <div className="h-48 w-full pt-4 relative">
            <svg viewBox="0 0 500 150" className="w-full h-full overflow-visible">
              {/* Grid lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="70" x2="500" y2="70" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="110" x2="500" y2="110" stroke="#f1f5f9" strokeWidth="1" />

              {/* Smooth blue growth line path */}
              <path
                d={chartPath(chartValues)}
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {chartValues.length > 0 && (
                <circle
                  cx={chartValues.length > 1 ? 10 + ((chartValues.length - 1) * 480) / (chartValues.length - 1) : 250}
                  cy={140 - (chartValues[chartValues.length - 1] / maxChartValue) * 110}
                  r="4"
                  fill="#2563eb"
                />
              )}
            </svg>
            <div className="flex justify-between text-[10px] text-gray-400 font-semibold mt-2">
              {chartLabels.map(label => <span key={label}>{label}</span>)}
            </div>
          </div>
        </div>

        {/* Revenue Trends Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-gray-900">Revenue Trends</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span className="text-xs text-gray-500 font-medium">Revenue</span>
              </div>
            </div>

            <span className="text-xs font-semibold text-gray-400">{selectedRange}</span>
          </div>

          {/* SVG Revenue Chart */}
          <div className="h-48 w-full pt-4 relative">
            <svg viewBox="0 0 500 150" className="w-full h-full overflow-visible">
              <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="70" x2="500" y2="70" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="110" x2="500" y2="110" stroke="#f1f5f9" strokeWidth="1" />

              <path
                d={revenuePath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {revenueData.length > 0 && (
                <circle
                  cx={revenueData.length > 1 ? 490 : 250}
                  cy={140 - (Number(revenueData[revenueData.length - 1].revenue || 0) / maxRevenue) * 110}
                  r="4"
                  fill="#f59e0b"
                />
              )}
            </svg>
            <div className="flex justify-between text-[10px] text-gray-400 font-semibold mt-2">
              {revenueLabels.map(label => <span key={label}>{label}</span>)}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Card: Comparison Bar Chart */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-base text-gray-900">User & Course Growth Comparison</h3>
            <p className="text-xs text-gray-400">Side-by-side comparison of user registrations and course enrollments</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span className="text-gray-600">New Users</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-gray-600">New Courses</span>
            </div>
          </div>
        </div>

        {/* Bar Chart Representation */}
        <div className="h-44 w-full flex items-end justify-between px-4 pt-6 pb-2 border-b border-gray-100 gap-2">
          {growthData.map((item) => {
            const users = Number(item.newUsers ?? item.users ?? 0);
            const courses = Number(item.enrollments ?? item.courses ?? 0);
            return (
            <div key={`${item.month}-${item.year}`} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div className="w-full max-w-[20px] bg-blue-600 rounded-t-md transition-all duration-300" 
                   style={{ height: `${Math.max((users / maxGrowthValue) * 100, users ? 4 : 0)}%` }} />
              <div className="w-full max-w-[20px] bg-emerald-500 rounded-t-md transition-all duration-300" 
                   style={{ height: `${Math.max((courses / maxGrowthValue) * 100, courses ? 4 : 0)}%` }} />
              <span className="text-[10px] text-gray-400 font-semibold">{item.month} {String(item.year).slice(-2)}</span>
            </div>
            );
          })}
        </div>
      </div>

      {/* Bottom 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Top Performing Courses */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-gray-900">Top Performing Courses</h3>
            <button className="text-xs font-bold text-blue-600 hover:underline">View All</button>
          </div>

          <div className="space-y-3">
            {/* Course 1 */}
            <div className="p-4 rounded-xl border border-gray-50 bg-gray-50/50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-sm shrink-0">
                  文
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">Business Korean Mastery</h4>
                  <p className="text-xs text-gray-400">Level: Intermediate</p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-right">
                <div>
                  <span className="font-bold text-xs text-gray-900 block">1,240</span>
                  <span className="text-[10px] text-gray-400 block">Students</span>
                </div>
                <div>
                  <span className="font-bold text-xs text-gray-900 block">LKR 12,500</span>
                  <span className="text-[10px] text-gray-400 block">Avg. Price</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  ★ 4.9
                </span>
              </div>
            </div>

            {/* Course 2 */}
            <div className="p-4 rounded-xl border border-gray-50 bg-gray-50/50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center text-sm shrink-0">
                  三
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">TOPIK I Preparation</h4>
                  <p className="text-xs text-gray-400">Level: Beginner</p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-right">
                <div>
                  <span className="font-bold text-xs text-gray-900 block">980</span>
                  <span className="text-[10px] text-gray-400 block">Students</span>
                </div>
                <div>
                  <span className="font-bold text-xs text-gray-900 block">LKR 8,400</span>
                  <span className="text-[10px] text-gray-400 block">Avg. Price</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  ★ 4.8
                </span>
              </div>
            </div>

            {/* Course 3 */}
            <div className="p-4 rounded-xl border border-gray-50 bg-gray-50/50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 font-bold flex items-center justify-center text-sm shrink-0">
                  🎬
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">Korean through K-Dramas</h4>
                  <p className="text-xs text-gray-400">Level: Beginner</p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-right">
                <div>
                  <span className="font-bold text-xs text-gray-900 block">2,150</span>
                  <span className="text-[10px] text-gray-400 block">Students</span>
                </div>
                <div>
                  <span className="font-bold text-xs text-gray-900 block">LKR 5,200</span>
                  <span className="text-[10px] text-gray-400 block">Avg. Price</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  ★ 4.7
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: User Activity & Monthly Statistics */}
        <div className="lg:col-span-4 space-y-5">
          {/* User Activity Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-gray-900">User Activity</h3>

            <div className="space-y-3 border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">DAILY ACTIVE USERS</span>
                  <span className="text-lg font-bold text-gray-900">
                    {loading ? '—' : formatNumber(activity?.dailyActiveUsers)}
                  </span>
                </div>
                  <span className="text-xs font-bold text-emerald-600">
                    {loading ? '—' : formatGrowth(activity?.dailyActiveUsersGrowth)}
                  </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">COURSE COMPLETIONS</span>
                  <span className="text-lg font-bold text-gray-900">
                    {loading ? '—' : formatNumber(activity?.courseCompletionsThisMonth)}
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-600">
                  {loading ? '—' : formatGrowth(activity?.courseCompletionsGrowth)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">AVERAGE RATING</span>
                  <span className="text-lg font-bold text-gray-900">
                    {loading ? '—' : Number(activity?.averageRating || 0).toFixed(2)}
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-600">
                  {loading ? '—' : formatGrowth(activity?.averageRatingChange)}
                </span>
              </div>
            </div>

            {/* Monthly Statistics */}
            <div>
              <h4 className="font-bold text-sm text-gray-900 mb-3">Monthly Statistics</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between font-bold text-gray-400 uppercase text-[10px] pb-1">
                  <span>MONTH</span>
                  <span>USERS</span>
                  <span>REVENUE</span>
                </div>

                {(analytics?.monthlyStats || []).slice(-3).reverse().map(stat => (
                  <div key={`${stat.month}-${stat.year}`} className="flex justify-between text-gray-700 py-1 border-b border-gray-50 last:border-b-0">
                    <span className="font-semibold">{stat.month}</span>
                    <span>+{formatNumber(stat.users)}</span>
                    <span className="font-bold text-gray-900">{formatCurrency(stat.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReports;
