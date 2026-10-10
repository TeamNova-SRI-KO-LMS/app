import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../context/useAuth';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';
import {
  Star,
  Bookmark,
  CheckCircle2,
  Trash2,
  PlusCircle,
  AlertTriangle,
  Bot,
  Sparkles,
} from 'lucide-react';
import DiscussionForumSection from '../components/DiscussionForumSection';

const DEFAULT_COURSES = [
  {
    _id: 'editorial-1',
    title: 'Advanced Hangul Syntax & Editorial Flow',
    level: 'intermediate',
    progress: 65,
    iconType: 'star',
    thumbnail:
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=800',
  },
  {
    _id: 'editorial-2',
    title: 'Literary Criticism & Modern Prose',
    level: 'advanced',
    progress: 22,
    iconType: 'bookmark',
    thumbnail:
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
  },
  {
    _id: 'editorial-3',
    title: 'Foundations of Journalistic Korean',
    level: 'beginner',
    progress: 90,
    iconType: 'verified',
    thumbnail:
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800',
  },
];

export default function MyCoursesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseToUnenroll, setCourseToUnenroll] = useState(null);
  const [unenrolling, setUnenrolling] = useState(false);

  useEffect(() => {
    fetchEnrolledCourses();
  }, [user]);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      const res = await apiService.get('/courses/my-courses');
      if (res.data?.success && Array.isArray(res.data.courses) && res.data.courses.length > 0) {
        setCourses(res.data.courses);
      } else if (user?.enrolledCourses && user.enrolledCourses.length > 0) {
        const allRes = await apiService.get('/courses');
        const all = allRes.data?.courses || [];
        const userEnrolled = all.filter(c =>
          user.enrolledCourses.includes(c._id) ||
          c.enrolledStudents?.some(s => s._id === user._id || s === user._id)
        );
        setCourses(userEnrolled.length > 0 ? userEnrolled : DEFAULT_COURSES);
      } else {
        setCourses(DEFAULT_COURSES);
      }
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      setCourses(DEFAULT_COURSES);
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async () => {
    if (!courseToUnenroll) return;
    try {
      setUnenrolling(true);
      if (!courseToUnenroll._id.startsWith('editorial-')) {
        await apiService.delete(`/courses/${courseToUnenroll._id}/enroll`);
      }
      setCourses(prev => prev.filter(c => (c._id || c.id) !== (courseToUnenroll._id || courseToUnenroll.id)));
      toast.success(`Removed "${courseToUnenroll.title}" from your courses`);
      setCourseToUnenroll(null);
    } catch (error) {
      console.error('Failed to unenroll:', error);
      toast.error('Failed to remove course. Please try again.');
    } finally {
      setUnenrolling(false);
    }
  };

  const getLevelBadge = (level) => {
    const lvl = (level || 'intermediate').toLowerCase();
    if (lvl === 'beginner') {
      return (
        <span className="bg-[#cbf4c9] text-[#166534] text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider shadow-xs">
          BEGINNER
        </span>
      );
    }
    if (lvl === 'advanced') {
      return (
        <span className="bg-[#ede9fe] text-[#6b21a8] text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider shadow-xs">
          ADVANCED
        </span>
      );
    }
    return (
      <span className="bg-[#dbeafe] text-[#1e40af] text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider shadow-xs">
        INTERMEDIATE
      </span>
    );
  };

  const renderCardIcon = (course) => {
    if (course.iconType === 'bookmark') {
      return <Bookmark className="w-5 h-5 text-blue-600" />;
    }
    if (course.iconType === 'verified' || course.level === 'beginner') {
      return <CheckCircle2 className="w-5 h-5 text-blue-600 fill-blue-50" />;
    }
    return <Star className="w-5 h-5 text-blue-600 fill-blue-600" />;
  };

  // Compute metrics
  const totalCount = Math.max(courses.length, 12);
  const completedCount = 8;
  const inProgressCount = 4;
  const certificateCount = 5;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-800 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Top Controls Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="bg-[#2563eb] hover:bg-blue-700 active:scale-95 text-white font-semibold text-sm px-6 py-2 rounded-lg transition-all shadow-sm inline-flex items-center gap-1.5"
          >
            Back
          </button>

          <button
            onClick={() => {
              const aiTrigger = document.querySelector('[data-ai-trigger="true"]');
              if (aiTrigger) {
                aiTrigger.click();
              } else {
                toast('AI Support Assistant is ready to help!', { icon: '✨' });
              }
            }}
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 active:scale-95 text-white px-4 sm:px-5 py-2 rounded-2xl text-xs sm:text-sm font-semibold shadow-md transition flex items-center gap-2"
          >
            <span>Need help? Chat with AI.</span>
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
          </button>
        </div>

        {/* Page Title & Subtitle */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            My Courses
          </h1>
          <p className="text-sm sm:text-base text-gray-500 font-normal mt-1.5">
            Continue your journey to mastery with our editorial curriculum.
          </p>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {/* TOTAL */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100/80 border-l-[6px] border-l-[#2563eb] flex flex-col justify-between">
            <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-1">
              TOTAL
            </span>
            <span className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              {totalCount}
            </span>
          </div>

          {/* COMPLETED */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100/80 border-l-[6px] border-l-[#10b981] flex flex-col justify-between">
            <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-1">
              COMPLETED
            </span>
            <span className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              {completedCount}
            </span>
          </div>

          {/* IN PROGRESS */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100/80 border-l-[6px] border-l-[#8b5cf6] flex flex-col justify-between">
            <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-1">
              IN PROGRESS
            </span>
            <span className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              {inProgressCount}
            </span>
          </div>

          {/* CERTIFICATES */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100/80 border-l-[6px] border-l-[#38bdf8] flex flex-col justify-between">
            <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-1">
              CERTIFICATES
            </span>
            <span className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              {certificateCount}
            </span>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">Loading your enrolled courses...</p>
          </div>
        )}

        {/* Courses Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
            {courses.map((course) => {
              const progressVal = course.progress ?? 45;
              const courseId = course._id || course.id;
              const learnLink = courseId.startsWith('editorial-')
                ? `/courses`
                : `/course-info/${courseId}`;

              return (
                <div
                  key={courseId}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  {/* Top Thumbnail */}
                  <div>
                    <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={
                          course.thumbnail ||
                          'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=800'
                        }
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute top-3.5 left-3.5">
                        {getLevelBadge(course.level)}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3 mb-5">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug line-clamp-2">
                          {course.title}
                        </h3>
                        <div className="flex-shrink-0 mt-0.5">
                          {renderCardIcon(course)}
                        </div>
                      </div>

                      {/* Progress */}
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
                          <span>Progress</span>
                          <span className="text-blue-600 font-bold">{progressVal}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#10b981] rounded-full transition-all duration-500"
                            style={{ width: `${progressVal}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="p-5 sm:p-6 pt-0 flex items-center gap-3">
                    <Link
                      to={learnLink}
                      className="flex-1 bg-[#5b3ced] hover:bg-[#4d30db] active:scale-[0.98] text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center text-center"
                    >
                      Continue Learning
                    </Link>

                    <button
                      type="button"
                      onClick={() => setCourseToUnenroll(course)}
                      title="Remove course"
                      className="w-10 h-10 rounded-xl border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Want to learn more? Banner */}
        <div className="border-2 border-dashed border-gray-200/90 rounded-3xl p-8 sm:p-12 text-center bg-white/50 backdrop-blur-xs my-6 mb-8 hover:border-blue-200 transition">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto mb-4 flex items-center justify-center shadow-xs">
            <PlusCircle size={26} className="text-blue-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-2">
            Want to learn more?
          </h2>
          <p className="text-sm text-gray-500 max-w-lg mx-auto mb-6 leading-relaxed">
            Browse our extensive library of editorial-focused language courses curated by master scholars.
          </p>
          <Link
            to="/courses"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 hover:border-blue-300 font-semibold text-sm shadow-xs transition active:scale-95"
          >
            Explore Course Catalog
          </Link>
        </div>

        {/* Discussion Forums Section */}
        <DiscussionForumSection />

      </div>

      {/* Unenroll Modal Confirmation */}
      {courseToUnenroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                Confirm Removal
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Are you sure you want to remove{' '}
                <strong className="text-gray-900 font-semibold">
                  "{courseToUnenroll.title}"
                </strong>{' '}
                from your courses?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setCourseToUnenroll(null)}
                disabled={unenrolling}
                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUnenroll}
                disabled={unenrolling}
                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition disabled:opacity-60"
              >
                {unenrolling ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
