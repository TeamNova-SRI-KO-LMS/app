import React, { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
import StudentSidebar from '../components/StudentSidebar';

const initialCalendarDays = [
  { day: 1, type: 'normal' },
  { day: 2, type: 'present' },
  { day: 3, type: 'present' },
  { day: 4, type: 'present' },
  { day: 5, type: 'present' },
  { day: 6, type: 'normal' },
  { day: 7, type: 'normal' },
  { day: 8, type: 'present' },
  { day: 9, type: 'present' },
  { day: 10, type: 'present' },
  { day: 11, type: 'present' },
  { day: 12, type: 'present' },
  { day: 13, type: 'normal' },
  { day: 14, type: 'normal' },
  { day: 15, type: 'excused', isSelected: true },
  { day: 16, type: 'present' },
  { day: 17, type: 'present' },
  { day: 18, type: 'late' },
  { day: 19, type: 'present' },
  { day: 20, type: 'absent' },
  { day: 21, type: 'normal' },
  { day: 22, type: 'present' },
  { day: 23, type: 'present' },
  { day: 24, type: 'present', isSelected: true },
  { day: 25, type: 'normal' },
  { day: 26, type: 'normal' },
  { day: 27, type: 'normal' },
  { day: 28, type: 'normal' },
  { day: 29, type: 'normal' },
  { day: 30, type: 'normal' },
  { day: 31, type: 'normal' }
];

const initialAttendanceRecords = [
  {
    id: 1,
    dayNumber: 24,
    date: 'Oct 24, 2023',
    course: 'Advanced Korean',
    type: 'Lecture',
    time: '09:00 AM',
    status: 'Present'
  },
  {
    id: 2,
    dayNumber: 22,
    date: 'Oct 22, 2023',
    course: 'EPS TOPIK Prep',
    type: 'Workshop',
    time: '14:00 PM',
    status: 'Present'
  },
  {
    id: 3,
    dayNumber: 20,
    date: 'Oct 20, 2023',
    course: 'Advanced Korean',
    type: 'Lecture',
    time: '09:00 AM',
    status: 'Absent'
  },
  {
    id: 4,
    dayNumber: 18,
    date: 'Oct 18, 2023',
    course: 'Business Comm',
    type: 'Seminar',
    time: '11:00 AM',
    status: 'Late'
  },
  {
    id: 5,
    dayNumber: 15,
    date: 'Oct 15, 2023',
    course: 'Advanced Korean',
    type: 'Lecture',
    time: '09:00 AM',
    status: 'Excused'
  }
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState('All Courses');
  const [timeRange, setTimeRange] = useState('Last 30 Days');
  const [currentMonthIndex, setCurrentMonthIndex] = useState(1); // 1 = October 2023
  const months = ['September 2023', 'October 2023', 'November 2023'];

  // State for editable calendar days and records
  const [calendarDays, setCalendarDays] = useState(initialCalendarDays);
  const [records, setRecords] = useState(initialAttendanceRecords);

  // Modal edit state
  const [editingDay, setEditingDay] = useState(null);
  const [editForm, setEditForm] = useState({
    status: 'present',
    course: 'Advanced Korean',
    type: 'Lecture',
    time: '09:00 AM'
  });

  // Calculate dynamic metrics
  const totalMarked = calendarDays.filter(d => d.type !== 'normal').length;
  const presentCount = calendarDays.filter(d => d.type === 'present').length;
  const absentCount = calendarDays.filter(d => d.type === 'absent').length;
  const lateCount = calendarDays.filter(d => d.type === 'late').length;
  const excusedCount = calendarDays.filter(d => d.type === 'excused').length;

  const attendanceRate = totalMarked > 0
    ? Math.round((presentCount / totalMarked) * 100)
    : 100;

  // Open Edit Modal for a specific day
  const handleDayClick = (dObj) => {
    setEditingDay(dObj);
    const existingRec = records.find(r => r.dayNumber === dObj.day);
    setEditForm({
      status: dObj.type === 'normal' ? 'present' : dObj.type,
      course: existingRec ? existingRec.course : 'Advanced Korean',
      type: existingRec ? existingRec.type : 'Lecture',
      time: existingRec ? existingRec.time : '09:00 AM'
    });
  };

  // Save changes from Edit Modal
  const handleSaveAttendance = (e) => {
    e.preventDefault();
    if (!editingDay) return;

    const dayNum = editingDay.day;
    const newStatusType = editForm.status; // 'present', 'absent', 'late', 'excused', 'normal'

    // Update calendarDays
    setCalendarDays(prev =>
      prev.map(d => (d.day === dayNum ? { ...d, type: newStatusType } : d))
    );

    const formattedDate = `Oct ${dayNum < 10 ? '0' + dayNum : dayNum}, 2023`;
    const statusLabel =
      newStatusType === 'present' ? 'Present' :
      newStatusType === 'absent' ? 'Absent' :
      newStatusType === 'late' ? 'Late' :
      newStatusType === 'excused' ? 'Excused' : 'Normal';

    // Update or add in records if not normal
    setRecords(prev => {
      const existingIdx = prev.findIndex(r => r.dayNumber === dayNum);
      if (newStatusType === 'normal') {
        return prev.filter(r => r.dayNumber !== dayNum);
      }
      const updatedRec = {
        id: existingIdx !== -1 ? prev[existingIdx].id : Date.now(),
        dayNumber: dayNum,
        date: formattedDate,
        course: editForm.course,
        type: editForm.type,
        time: editForm.time,
        status: statusLabel
      };

      if (existingIdx !== -1) {
        const copy = [...prev];
        copy[existingIdx] = updatedRec;
        return copy;
      }
      return [updatedRec, ...prev].sort((a, b) => b.dayNumber - a.dayNumber);
    });

    toast.success(`Updated attendance for Oct ${dayNum} to ${statusLabel}`);
    setEditingDay(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Present
          </span>
        );
      case 'Absent':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Absent
          </span>
        );
      case 'Late':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Late
          </span>
        );
      case 'Excused':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            Excused
          </span>
        );
      default:
        return null;
    }
  };

  const getCalendarDayStyle = (dayObj) => {
    let base = "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-xs ";
    if (dayObj.isSelected) {
      base += "ring-2 ring-blue-500 ring-offset-2 ";
    }

    switch (dayObj.type) {
      case 'present':
        return base + "bg-emerald-400 text-white hover:bg-emerald-500";
      case 'absent':
        return base + "bg-rose-400 text-white hover:bg-rose-500";
      case 'late':
        return base + "bg-purple-300 text-purple-900 hover:bg-purple-400";
      case 'excused':
        return base + "bg-gray-200 text-gray-700 border-2 border-dashed border-gray-400 hover:bg-gray-300";
      default:
        return base + "text-gray-600 bg-gray-50 hover:bg-blue-100 hover:text-blue-700 border border-gray-200/60";
    }
  };

  // Filter records by selected course
  const filteredRecords = records.filter(r =>
    selectedCourse === 'All Courses' ? true : r.course === selectedCourse
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar */}
        <StudentSidebar activeTab="profile" />

        {/* Main Attendance & Profile Area */}
        <main className="flex-1 space-y-6">
          
          {/* Header Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Attendance Details
              </h1>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Your attendance summary for the current term. Click any date on the calendar to edit attendance.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold bg-blue-50 text-blue-700 px-3.5 py-2 rounded-xl border border-blue-200 self-start sm:self-auto">
              <Pencil size={14} />
              <span>EDITABLE CALENDAR ACTIVE</span>
            </div>
          </div>

          {/* Top 4 Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {/* Card 1: Attendance Rate */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-500">
                  Attendance Rate
                </span>
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div>
                <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
                  {attendanceRate}%
                </h3>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${attendanceRate}%` }} />
                </div>
              </div>
            </div>

            {/* Card 2: Total Sessions */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-500">
                  Total Sessions
                </span>
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText size={18} />
                </div>
              </div>
              <div>
                <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                  {40 + totalMarked}
                </h3>
              </div>
            </div>

            {/* Card 3: Present */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-500">
                  Present
                </span>
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div>
                <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                  {25 + presentCount}
                </h3>
              </div>
            </div>

            {/* Card 4: Absent & Late/Excused Stack */}
            <div className="space-y-3 flex flex-col justify-between">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                    <XCircle size={18} />
                  </div>
                  <span className="text-xs font-bold text-gray-600">Absent</span>
                </div>
                <span className="text-2xl font-extrabold text-gray-900">{absentCount}</span>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Clock size={18} />
                  </div>
                  <span className="text-xs font-bold text-gray-600">Late/Excused</span>
                </div>
                <span className="text-2xl font-extrabold text-gray-900">{lateCount + excusedCount}</span>
              </div>
            </div>

          </div>

          {/* Filters Bar */}
          <div className="bg-[#f1f5f9]/70 rounded-2xl p-3 border border-gray-200/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="bg-white border border-gray-200 text-gray-700 font-semibold text-xs sm:text-sm rounded-xl px-4 py-2 outline-none cursor-pointer shadow-xs"
              >
                <option value="All Courses">All Courses</option>
                <option value="Advanced Korean">Advanced Korean</option>
                <option value="EPS TOPIK Prep">EPS TOPIK Prep</option>
                <option value="Business Comm">Business Comm</option>
              </select>

              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-white border border-gray-200 text-gray-700 font-semibold text-xs sm:text-sm rounded-xl px-4 py-2 outline-none cursor-pointer shadow-xs"
              >
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="This Term">This Term</option>
                <option value="Full Semester">Full Semester</option>
              </select>
            </div>

            <button
              onClick={() => toast('Applied filter views', { icon: '🔍' })}
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-blue-600 font-bold text-xs sm:text-sm px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
            >
              <Filter size={15} />
              <span>More Filters</span>
            </button>
          </div>

          {/* Main Content Grid: Recent Attendance Table (Left) + Monthly Overview Calendar (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Recent Attendance Table */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-gray-900 tracking-tight">
                  Recent Attendance
                </h3>
                <button
                  onClick={() => toast('Showing full historical records', { icon: '📋' })}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="pb-3">DATE</th>
                      <th className="pb-3">COURSE</th>
                      <th className="pb-3">TYPE</th>
                      <th className="pb-3">TIME</th>
                      <th className="pb-3 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-medium">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-gray-400">
                          No attendance records found for this course filter. Click any date on the calendar to add one!
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((rec) => (
                        <tr key={rec.id} className="hover:bg-gray-50/60 transition">
                          <td className="py-4 text-gray-900 font-semibold whitespace-nowrap">
                            {rec.date}
                          </td>
                          <td className="py-4 text-gray-900 font-bold whitespace-nowrap">
                            {rec.course}
                          </td>
                          <td className="py-4 text-gray-500 whitespace-nowrap">
                            {rec.type}
                          </td>
                          <td className="py-4 text-gray-500 whitespace-nowrap">
                            {rec.time}
                          </td>
                          <td className="py-4 text-right whitespace-nowrap">
                            {getStatusBadge(rec.status)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Editable Monthly Calendar Overview & Motivation Box */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Monthly Overview Calendar (Editable) */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4 relative">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                    <span>Monthly Overview</span>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase">Editable</span>
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                    <button
                      onClick={() => setCurrentMonthIndex((prev) => (prev > 0 ? prev - 1 : months.length - 1))}
                      className="p-1 hover:bg-gray-100 rounded-md transition cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span>{months[currentMonthIndex]}</span>
                    <button
                      onClick={() => setCurrentMonthIndex((prev) => (prev < months.length - 1 ? prev + 1 : 0))}
                      className="p-1 hover:bg-gray-100 rounded-md transition cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 font-medium">
                  Click any date to modify or record attendance status.
                </p>

                {/* Day Names Header */}
                <div className="grid grid-cols-7 text-center text-xs font-bold text-gray-400">
                  <span>S</span>
                  <span>M</span>
                  <span>T</span>
                  <span>W</span>
                  <span>T</span>
                  <span>F</span>
                  <span>S</span>
                </div>

                {/* Days Grid (Clickable to Edit) */}
                <div className="grid grid-cols-7 gap-1.5 place-items-center">
                  {calendarDays.map((dObj, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleDayClick(dObj)}
                      title={`Click to edit attendance for Oct ${dObj.day}`}
                      className={getCalendarDayStyle(dObj)}
                    >
                      {dObj.day}
                    </button>
                  ))}
                </div>

                {/* Legend */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] font-semibold text-gray-500 flex-wrap gap-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                    Present
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />
                    Absent
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-purple-300" />
                    Late
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-gray-200 border border-gray-400 border-dashed" />
                    Excused
                  </span>
                </div>
              </div>

              {/* Motivation Card */}
              <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white rounded-3xl p-6 shadow-md relative overflow-hidden space-y-2">
                <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl pointer-events-none" />
                <h4 className="text-lg font-extrabold tracking-tight">
                  Keep it up!
                </h4>
                <p className="text-xs text-blue-100 leading-relaxed font-medium">
                  Your attendance rate is in the top 10% of scholars this term. Consistency is key to mastering the curriculum.
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
                  EDIT ATTENDANCE
                </span>
                <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">
                  October {editingDay.day}, 2023
                </h3>
              </div>
              <button
                onClick={() => setEditingDay(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAttendance} className="space-y-4">
              {/* Select Status */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Attendance Status *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, status: 'present' }))}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      editForm.status === 'present'
                        ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-500/40'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current" />
                    Present
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, status: 'absent' }))}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      editForm.status === 'absent'
                        ? 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-500/40'
                        : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current" />
                    Absent
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, status: 'late' }))}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      editForm.status === 'late'
                        ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-600/40'
                        : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current" />
                    Late
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, status: 'excused' }))}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      editForm.status === 'excused'
                        ? 'bg-gray-700 text-white shadow-sm ring-2 ring-gray-700/40'
                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current" />
                    Excused
                  </button>
                </div>

                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, status: 'normal' }))}
                    className={`w-full py-1.5 px-3 rounded-xl text-xs font-semibold transition border ${
                      editForm.status === 'normal'
                        ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    Clear Status (Unmarked Day)
                  </button>
                </div>
              </div>

              {/* Course Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Course *
                </label>
                <select
                  value={editForm.course}
                  onChange={(e) => setEditForm(prev => ({ ...prev, course: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Advanced Korean">Advanced Korean</option>
                  <option value="EPS TOPIK Prep">EPS TOPIK Prep</option>
                  <option value="Business Comm">Business Comm</option>
                  <option value="Korean Foundations">Korean Foundations</option>
                </select>
              </div>

              {/* Type & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Type
                  </label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Lecture">Lecture</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Exam">Exam</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Time
                  </label>
                  <input
                    type="text"
                    value={editForm.time}
                    onChange={(e) => setEditForm(prev => ({ ...prev, time: e.target.value }))}
                    placeholder="e.g. 09:00 AM"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save size={14} />
                  <span>Save Attendance</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
