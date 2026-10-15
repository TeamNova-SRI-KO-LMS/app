import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../context/useAuth';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  Pencil,
  AlertCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import StudentSidebar from '../components/StudentSidebar';
import {
  fetchMyAttendance,
  fetchMonthlyAttendance,
  fetchEnrolledCourses,
  saveAttendance,
  updateAttendance,
} from '../services/attendanceService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Build a "YYYY-MM-DD" string from a JS Date without timezone shift */
const toLocalDateStr = (d) => {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

/** Format date for display */
const formatDisplayDate = (isoStr) => {
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/** Number of days in a month */
const daysInMonth = (year, month) => new Date(year, month, 0).getDate();

/** Day of week (0=Sun) for the 1st of a month */
const firstDayOfWeek = (year, month) => new Date(year, month - 1, 1).getDay();

// ─── Status badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const s = (status || '').toLowerCase();
  const map = {
    present: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700',
    absent: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700',
    late: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700',
    excused: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700',
  };
  const dot = {
    present: 'bg-emerald-500',
    absent: 'bg-rose-500',
    late: 'bg-purple-500',
    excused: 'bg-gray-400',
  };
  if (!map[s]) return null;
  return (
    <span className={map[s]}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[s]}`} />
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
};

// ─── Calendar day style ────────────────────────────────────────────────────────

const calendarDayClass = (status, isSelected) => {
  const base = 'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-xs ';
  const ring = isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ' : '';
  const map = {
    present: 'bg-emerald-400 text-white hover:bg-emerald-500',
    absent: 'bg-rose-400 text-white hover:bg-rose-500',
    late: 'bg-purple-300 text-purple-900 hover:bg-purple-400',
    excused: 'bg-gray-200 text-gray-700 border-2 border-dashed border-gray-400 hover:bg-gray-300',
    normal: 'text-gray-600 bg-gray-50 hover:bg-blue-100 hover:text-blue-700 border border-gray-200/60',
  };
  return base + ring + (map[status] || map.normal);
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user } = useAuth();

  // ── View state ──────────────────────────────────────────────────────────────
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1); // 1-12

  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [timeRange, setTimeRange] = useState('Last 30 Days');

  // ── Data state ──────────────────────────────────────────────────────────────
  const [stats, setStats] = useState({ attendanceRate: 100, totalSessions: 0, present: 0, absent: 0, late: 0, excused: 0 });
  const [allRecords, setAllRecords] = useState([]); // full list for the table
  const [monthlyRecords, setMonthlyRecords] = useState([]); // calendar month
  const [enrolledCourses, setEnrolledCourses] = useState([]); // filter options

  // ── Loading / error ─────────────────────────────────────────────────────────
  const [loadingMain, setLoadingMain] = useState(true);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [savingDay, setSavingDay] = useState(false);
  const [error, setError] = useState(null);

  // ── Edit modal ──────────────────────────────────────────────────────────────
  const [editingDay, setEditingDay] = useState(null); // { day, existingRecord }
  const [editForm, setEditForm] = useState({ status: 'present', courseId: '', notes: '' });

  // ── Fetch main stats + records ───────────────────────────────────────────────
  const loadMainData = useCallback(async () => {
    setLoadingMain(true);
    setError(null);
    try {
      const [attendanceData, coursesData] = await Promise.all([
        fetchMyAttendance(),
        fetchEnrolledCourses(),
      ]);

      if (attendanceData.success) {
        setStats(attendanceData.stats);
        setAllRecords(attendanceData.records);
      }
      if (coursesData.success) {
        setEnrolledCourses(coursesData.courses);
      }
    } catch (err) {
      console.error('Error loading attendance data:', err);
      setError('Failed to load attendance data. Please try again.');
    } finally {
      setLoadingMain(false);
    }
  }, []);

  // ── Fetch monthly calendar data ──────────────────────────────────────────────
  const loadMonthlyData = useCallback(async () => {
    setLoadingCalendar(true);
    try {
      const data = await fetchMonthlyAttendance(calYear, calMonth, selectedCourseId);
      if (data.success) {
        setMonthlyRecords(data.records);
      }
    } catch (err) {
      console.error('Error loading monthly data:', err);
    } finally {
      setLoadingCalendar(false);
    }
  }, [calYear, calMonth, selectedCourseId]);

  useEffect(() => { loadMainData(); }, [loadMainData]);
  useEffect(() => { loadMonthlyData(); }, [loadMonthlyData]);

  // ── Calendar helpers ─────────────────────────────────────────────────────────

  /** Build a map: day → { status, record } for the current calendar month */
  const calendarDayMap = React.useMemo(() => {
    const map = {};
    monthlyRecords.forEach((rec) => {
      const d = new Date(rec.date);
      // Use UTC date to avoid timezone shifting since dates are stored as midnight UTC
      const day = d.getUTCDate();
      map[day] = { status: rec.status, record: rec };
    });
    return map;
  }, [monthlyRecords]);

  const totalDays = daysInMonth(calYear, calMonth);
  const startOffset = firstDayOfWeek(calYear, calMonth); // blank cells before day 1

  const prevMonth = () => {
    if (calMonth === 1) { setCalYear(y => y - 1); setCalMonth(12); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 12) { setCalYear(y => y + 1); setCalMonth(1); }
    else setCalMonth(m => m + 1);
  };

  // ── Open edit modal for a calendar day ───────────────────────────────────────
  const handleDayClick = (day) => {
    const existing = calendarDayMap[day];
    const defaultCourseId = enrolledCourses.length > 0 ? enrolledCourses[0]._id : '';
    setEditingDay({ day, existingRecord: existing?.record || null });
    setEditForm({
      status: existing?.status || 'present',
      courseId: existing?.record?.course?._id || defaultCourseId,
      notes: existing?.record?.notes || '',
    });
  };

  // ── Save attendance (create or update) ──────────────────────────────────────
  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    if (!editingDay) return;

    if (!editForm.courseId) {
      toast.error('Please select a course.');
      return;
    }

    setSavingDay(true);
    const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(editingDay.day).padStart(2, '0')}`;

    try {
      let savedRecord;

      if (editForm.status === 'normal') {
        // "Clear" — if there's an existing record, delete it
        if (editingDay.existingRecord?._id) {
          const { deleteAttendance } = await import('../services/attendanceService');
          await deleteAttendance(editingDay.existingRecord._id);
          toast.success(`Cleared attendance for ${MONTHS[calMonth - 1]} ${editingDay.day}`);
        } else {
          toast('No record to clear for that day.', { icon: 'ℹ️' });
        }
      } else if (editingDay.existingRecord?._id) {
        // Update existing
        const res = await updateAttendance(editingDay.existingRecord._id, {
          status: editForm.status,
          notes: editForm.notes,
        });
        if (res.success) {
          savedRecord = res.record;
          toast.success(`Updated attendance to ${editForm.status} for ${MONTHS[calMonth - 1]} ${editingDay.day}`);
        }
      } else {
        // Create new
        const res = await saveAttendance({
          courseId: editForm.courseId,
          date: dateStr,
          status: editForm.status,
          notes: editForm.notes,
        });
        if (res.success) {
          savedRecord = res.record;
          toast.success(`Recorded ${editForm.status} for ${MONTHS[calMonth - 1]} ${editingDay.day}`);
        }
      }

      setEditingDay(null);
      // Refresh both datasets
      await Promise.all([loadMainData(), loadMonthlyData()]);
    } catch (err) {
      console.error('Error saving attendance:', err);
      const msg = err?.response?.data?.message || 'Failed to save attendance. Please try again.';
      toast.error(msg);
    } finally {
      setSavingDay(false);
    }
  };

  // ── Filtered table records ────────────────────────────────────────────────────
  const filteredRecords = React.useMemo(() => {
    let recs = [...allRecords];

    if (selectedCourseId !== 'all') {
      recs = recs.filter(r => r.course?._id === selectedCourseId);
    }

    if (timeRange === 'Last 30 Days') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      recs = recs.filter(r => new Date(r.date) >= cutoff);
    } else if (timeRange === 'This Term') {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - 3);
      recs = recs.filter(r => new Date(r.date) >= cutoff);
    }

    return recs;
  }, [allRecords, selectedCourseId, timeRange]);

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loadingMain) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="animate-spin" size={36} />
          <p className="text-sm font-semibold">Loading attendance data…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
          <StudentSidebar activeTab="profile" />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4 py-16">
              <AlertCircle className="mx-auto text-rose-400" size={48} />
              <h2 className="text-xl font-bold text-gray-800">Unable to load attendance</h2>
              <p className="text-sm text-gray-500">{error}</p>
              <button
                onClick={loadMainData}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition"
              >
                <RefreshCw size={15} />
                Retry
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar */}
        <StudentSidebar activeTab="profile" />

        {/* Main Attendance Area */}
        <main className="flex-1 space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Attendance Details
              </h1>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Your live attendance summary. Click any date on the calendar to record or edit attendance.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold bg-blue-50 text-blue-700 px-3.5 py-2 rounded-xl border border-blue-200 self-start sm:self-auto">
                <Pencil size={14} />
                <span>LIVE DATABASE</span>
              </div>
              <button
                onClick={() => { loadMainData(); loadMonthlyData(); }}
                title="Refresh"
                className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 transition"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

            {/* Attendance Rate */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-500">Attendance Rate</span>
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div>
                <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
                  {stats.attendanceRate}%
                </h3>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${stats.attendanceRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Total Sessions */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-500">Total Sessions</span>
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText size={18} />
                </div>
              </div>
              <div>
                <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                  {stats.totalSessions}
                </h3>
              </div>
            </div>

            {/* Present */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-500">Present</span>
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div>
                <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                  {stats.present}
                </h3>
              </div>
            </div>

            {/* Absent + Late/Excused Stack */}
            <div className="space-y-3 flex flex-col justify-between">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                    <XCircle size={18} />
                  </div>
                  <span className="text-xs font-bold text-gray-600">Absent</span>
                </div>
                <span className="text-2xl font-extrabold text-gray-900">{stats.absent}</span>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Clock size={18} />
                  </div>
                  <span className="text-xs font-bold text-gray-600">Late / Excused</span>
                </div>
                <span className="text-2xl font-extrabold text-gray-900">{stats.late + stats.excused}</span>
              </div>
            </div>

          </div>

          {/* Filters Bar */}
          <div className="bg-[#f1f5f9]/70 rounded-2xl p-3 border border-gray-200/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Course filter */}
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="bg-white border border-gray-200 text-gray-700 font-semibold text-xs sm:text-sm rounded-xl px-4 py-2 outline-none cursor-pointer shadow-xs"
              >
                <option value="all">All Courses</option>
                {enrolledCourses.map((c) => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </select>

              {/* Time range filter */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-white border border-gray-200 text-gray-700 font-semibold text-xs sm:text-sm rounded-xl px-4 py-2 outline-none cursor-pointer shadow-xs"
              >
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="This Term">This Term (3 months)</option>
                <option value="All Time">All Time</option>
              </select>
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 px-3 py-2">
              <Filter size={13} />
              <span>{filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Main Content: Table + Calendar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Recent Attendance Table */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-gray-900 tracking-tight">
                  Recent Attendance
                </h3>
                <span className="text-xs font-semibold text-gray-400">
                  {filteredRecords.length} records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="pb-3">DATE</th>
                      <th className="pb-3">COURSE</th>
                      <th className="pb-3">NOTES</th>
                      <th className="pb-3 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-medium">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-10 text-center text-xs text-gray-400">
                          {allRecords.length === 0
                            ? 'No attendance records yet. Click any date on the calendar to record one!'
                            : 'No records match the current filter. Try changing the course or time range.'}
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((rec) => (
                        <tr key={rec._id} className="hover:bg-gray-50/60 transition">
                          <td className="py-4 text-gray-900 font-semibold whitespace-nowrap">
                            {formatDisplayDate(rec.date)}
                          </td>
                          <td className="py-4 text-gray-900 font-bold whitespace-nowrap max-w-[140px] truncate">
                            {rec.course?.title || '—'}
                          </td>
                          <td className="py-4 text-gray-500 whitespace-nowrap max-w-[120px] truncate">
                            {rec.notes || '—'}
                          </td>
                          <td className="py-4 text-right whitespace-nowrap">
                            <StatusBadge status={rec.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Calendar + Motivation */}
            <div className="lg:col-span-5 space-y-6">

              {/* Monthly Calendar */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4 relative">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                    <span>Monthly Overview</span>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase">Live</span>
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                    <button
                      onClick={prevMonth}
                      className="p-1 hover:bg-gray-100 rounded-md transition cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="whitespace-nowrap">{MONTHS[calMonth - 1]} {calYear}</span>
                    <button
                      onClick={nextMonth}
                      className="p-1 hover:bg-gray-100 rounded-md transition cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 font-medium">
                  Click any date to record or modify attendance.
                </p>

                {/* Day name headers */}
                <div className="grid grid-cols-7 text-center text-xs font-bold text-gray-400">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <span key={i}>{d}</span>
                  ))}
                </div>

                {/* Calendar grid */}
                {loadingCalendar ? (
                  <div className="flex items-center justify-center h-28">
                    <Loader2 className="animate-spin text-blue-400" size={24} />
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-1.5 place-items-center">
                    {/* Blank offset cells */}
                    {Array.from({ length: startOffset }).map((_, i) => (
                      <span key={`blank-${i}`} className="w-8 h-8" />
                    ))}
                    {/* Day cells */}
                    {Array.from({ length: totalDays }).map((_, i) => {
                      const day = i + 1;
                      const info = calendarDayMap[day];
                      const status = info?.status || 'normal';
                      const isToday =
                        day === today.getDate() &&
                        calMonth === today.getMonth() + 1 &&
                        calYear === today.getFullYear();
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayClick(day)}
                          title={`${MONTHS[calMonth - 1]} ${day}, ${calYear}${info ? ` — ${status}` : ' — Click to record'}`}
                          className={calendarDayClass(status, isToday)}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Legend */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] font-semibold text-gray-500 flex-wrap gap-2">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />Present</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />Absent</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-purple-300" />Late</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-gray-200 border border-gray-400 border-dashed" />Excused</span>
                </div>
              </div>

              {/* Motivation Card */}
              <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white rounded-3xl p-6 shadow-md relative overflow-hidden space-y-2">
                <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl pointer-events-none" />
                <h4 className="text-lg font-extrabold tracking-tight">
                  {stats.attendanceRate >= 90 ? 'Keep it up! 🎉' : stats.attendanceRate >= 70 ? 'Good progress! 💪' : 'Stay consistent! 📚'}
                </h4>
                <p className="text-xs text-blue-100 leading-relaxed font-medium">
                  {stats.attendanceRate >= 90
                    ? 'Your attendance rate is excellent! Consistency is key to mastering the curriculum.'
                    : stats.attendanceRate >= 70
                    ? 'You are doing well. Aim for above 90% to stay on track with your learning goals.'
                    : 'Try to attend more sessions — regular attendance greatly improves your progress.'}
                </p>
                <p className="text-xs text-blue-200 font-bold mt-1">
                  {stats.present} present out of {stats.totalSessions} total sessions
                </p>
              </div>

            </div>

          </div>

        </main>
      </div>

      {/* Edit Attendance Modal */}
      {editingDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">
                  {editingDay.existingRecord ? 'EDIT ATTENDANCE' : 'RECORD ATTENDANCE'}
                </span>
                <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">
                  {MONTHS[calMonth - 1]} {editingDay.day}, {calYear}
                </h3>
                {editingDay.existingRecord && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Currently: <span className="font-semibold capitalize">{editingDay.existingRecord.status}</span>
                    {editingDay.existingRecord.course?.title && ` · ${editingDay.existingRecord.course.title}`}
                  </p>
                )}
              </div>
              <button
                onClick={() => setEditingDay(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAttendance} className="space-y-4">

              {/* Status Buttons */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Attendance Status *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 'present', label: 'Present', active: 'bg-emerald-500 text-white ring-2 ring-emerald-500/40', inactive: 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' },
                    { val: 'absent', label: 'Absent', active: 'bg-rose-500 text-white ring-2 ring-rose-500/40', inactive: 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100' },
                    { val: 'late', label: 'Late', active: 'bg-purple-600 text-white ring-2 ring-purple-600/40', inactive: 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100' },
                    { val: 'excused', label: 'Excused', active: 'bg-gray-700 text-white ring-2 ring-gray-700/40', inactive: 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200' },
                  ].map(({ val, label, active, inactive }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setEditForm(p => ({ ...p, status: val }))}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${editForm.status === val ? active : inactive}`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current" />
                      {label}
                    </button>
                  ))}
                </div>

                {editingDay.existingRecord && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setEditForm(p => ({ ...p, status: 'normal' }))}
                      className={`w-full py-1.5 px-3 rounded-xl text-xs font-semibold transition border ${
                        editForm.status === 'normal'
                          ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      Clear / Remove Record
                    </button>
                  </div>
                )}
              </div>

              {/* Course select (only shown when creating a new record) */}
              {!editingDay.existingRecord && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Course *
                  </label>
                  {enrolledCourses.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No enrolled courses found. Please enroll in a course first.</p>
                  ) : (
                    <select
                      value={editForm.courseId}
                      onChange={(e) => setEditForm(p => ({ ...p, courseId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {enrolledCourses.map((c) => (
                        <option key={c._id} value={c._id}>{c.title}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={editForm.notes}
                  onChange={(e) => setEditForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g. Medical leave, assignment submitted late…"
                  maxLength={250}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingDay(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDay}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  {savingDay ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>{savingDay ? 'Saving…' : 'Save Attendance'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
