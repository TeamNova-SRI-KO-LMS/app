import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../context/useAuth';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Trophy,
  Play,
  XCircle,
  AlertTriangle,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Search,
} from 'lucide-react';
import StudentSidebar from '../components/StudentSidebar';

export default function MyCoursesPage() {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [courseToUnenroll, setCourseToUnenroll] = useState(null);
  const [unenrolling, setUnenrolling] = useState(false);

  useEffect(() => {
    fetchEnrolledCourses();
  }, [user]);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      const res = await apiService.get('/courses/my-courses');
      
      if (res.data?.success && Array.isArray(res.data.courses)) {
        setEnrolledCourses(res.data.courses);
      } else {
        setEnrolledCourses([]);
      }
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      // If API fails or user has local enrolledCourses ids in user object
      if (user?.enrolledCourses && user.enrolledCourses.length > 0) {
        try {
          const allRes = await apiService.get('/courses');
          const all = allRes.data?.courses || [];
          const userEnrolled = all.filter(c => 
            user.enrolledCourses.includes(c._id) || 
            c.enrolledStudents?.some(s => s._id === user._id || s === user._id)
          );
          setEnrolledCourses(userEnrolled);
        } catch (e) {
          toast.error('Failed to load your enrolled courses');
        }
      } else {
        setEnrolledCourses([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async () => {
    if (!courseToUnenroll) return;
    try {
      setUnenrolling(true);
      await apiService.delete(`/courses/${courseToUnenroll._id}/enroll`);
      
      setEnrolledCourses(prev =>
        prev.filter(c => c._id !== courseToUnenroll._id)
      );
      toast.success(`Unenrolled from "${courseToUnenroll.title}"`);
      setCourseToUnenroll(null);
    } catch (error) {
      console.error('Failed to unenroll:', error);
      toast.error('Failed to unenroll from course. Please try again.');
    } finally {
      setUnenrolling(false);
    }
  };

  const getLevelBadge = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            Beginner
          </span>
        );
      case 'intermediate':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            Intermediate
          </span>
        );
      case 'advanced':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
            Advanced
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {level || 'All Levels'}
          </span>
        );
    }
  };

  const filteredCourses = enrolledCourses.filter(course =>
    course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar */}
        <StudentSidebar activeTab="courses" />

        {/* Main Content Area */}
        <main className="flex-1 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-block bg-blue-100/80 text-blue-700 font-bold text-[11px] uppercase tracking-wider px-3 py-1 rounded-full mb-1.5">
                STUDENT PORTAL
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                My Enrolled Courses
              </h1>
              <p className="text-sm text-gray-500 font-medium mt-0.5">
                Manage and continue your active enrolled courses.
              </p>
            </div>

            <Link
              to="/courses"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-sm transition self-start sm:self-auto"
            >
              <BookOpen size={16} />
              <span>Explore More Courses</span>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <BookOpen size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Enrolled Courses
                </p>
                <h3 className="text-2xl font-extrabold text-gray-900">
                  {enrolledCourses.length}
                </h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Clock size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  In Progress
                </p>
                <h3 className="text-2xl font-extrabold text-gray-900">
                  {enrolledCourses.length}
                </h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Trophy size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Certificates
                </p>
                <h3 className="text-2xl font-extrabold text-gray-900">
                  {enrolledCourses.filter(c => c.progress === 100).length}
                </h3>
              </div>
            </div>
          </div>

          {/* Search Filter when student has courses */}
          {enrolledCourses.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your enrolled courses..."
                className="w-full text-sm outline-none placeholder-gray-400 text-gray-800"
              />
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm font-medium text-gray-600">
                Loading your enrolled courses...
              </p>
            </div>
          ) : enrolledCourses.length === 0 ? (
            /* Empty State: ONLY Enrolled Courses Shown (0 currently enrolled) */
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-5">
              <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-500 mx-auto flex items-center justify-center">
                <GraduationCap size={40} />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                  No Enrolled Courses Found
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  You haven't enrolled in any courses yet. Explore our Korean language catalog to begin your learning journey!
                </p>
              </div>
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-md transition active:scale-95"
              >
                <span>Browse All Courses</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            /* Enrolled Courses Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => {
                const progressPercentage = course.progress || 35;
                return (
                  <div
                    key={course._id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
                  >
                    <div>
                      {/* Course Thumbnail Banner */}
                      <div className="h-44 bg-gradient-to-br from-slate-900 to-indigo-950 relative overflow-hidden flex items-center justify-center">
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <span className="text-xs font-mono text-cyan-300 font-bold tracking-widest block uppercase mb-1">
                              {course.category || 'SRI-KO'}
                            </span>
                            <span className="text-lg font-extrabold text-white">
                              {course.title}
                            </span>
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          {getLevelBadge(course.level)}
                        </div>
                      </div>

                      {/* Course Info */}
                      <div className="p-5 space-y-4">
                        <div>
                          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                            {course.category || 'Korean Language'}
                          </span>
                          <h3 className="text-base font-bold text-gray-900 line-clamp-1 mt-0.5">
                            {course.title}
                          </h3>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1 font-normal">
                            {course.description}
                          </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between text-xs font-semibold text-gray-600">
                            <span>Course Progress</span>
                            <span className="text-blue-600 font-bold">
                              {progressPercentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Course Metadata (Duration & Instructor) */}
                        <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-gray-400" />
                            <span>{course.duration || '4'} Weeks</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-medium text-gray-700">
                            <span>{course.instructor?.name || 'SRI-KO Expert'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-5 pt-0 space-y-2">
                      <Link
                        to={`/courses/${course._id}/learn`}
                        className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold text-xs sm:text-sm py-2.5 rounded-xl shadow-xs transition"
                      >
                        <Play size={15} className="fill-white" />
                        <span>Continue Learning</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => setCourseToUnenroll(course)}
                        className="w-full py-2 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50/70 rounded-xl transition"
                      >
                        Unenroll from Course
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Unenroll Modal Confirmation */}
          {courseToUnenroll && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                    Confirm Unenrollment
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Are you sure you want to unenroll from{' '}
                    <strong className="text-gray-900 font-semibold">
                      "{courseToUnenroll.title}"
                    </strong>
                    ? Your lesson progress for this course will be reset.
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
                    {unenrolling ? 'Unenrolling...' : 'Yes, Unenroll'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
