import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  User, ArrowLeft, Clock, Users, Star, Calendar,
  CheckCircle2, AlertTriangle, Tag, ChevronDown, PlayCircle,
  CreditCard, FileText, ChevronUp, GraduationCap, Loader2, AlertCircle, ShieldCheck,
  Video, ClipboardList, Image as ImageIcon, Play, Download
} from 'lucide-react';
import apiService from '../services/apiService';
import useAuth from '../context/useAuth';
import toast from 'react-hot-toast';
import lectureService from '../services/lectureService';
import assignmentService from '../services/assignmentService';

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [course,         setCourse]         = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [activeTab,      setActiveTab]      = useState('Overview');
  const [openModules,    setOpenModules]    = useState({ 0: true });
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating,    setHoverRating]    = useState(0);
  const [feedbackText,   setFeedbackText]   = useState('');
  const [enrolling,      setEnrolling]      = useState(false);
  const [enrollMsg,      setEnrollMsg]      = useState(null);
  const [materials,      setMaterials]      = useState([]);
  const [assignments,    setAssignments]    = useState([]);

  /* ── Fetch course & materials ─────────────────────────────────────────── */
  useEffect(() => {
    if (!id) {
      // If visited via /course-details without an :id, auto-redirect to first available course
      apiService.get('/courses', { params: { limit: 1 } })
        .then((res) => {
          const first = res.data?.courses?.[0];
          if (first?._id) {
            navigate(`/courses/${first._id}`, { replace: true });
          } else {
            setError('No courses available yet.');
            setLoading(false);
          }
        })
        .catch(() => {
          setError('No course specified. Please choose a course from the course catalog.');
          setLoading(false);
        });
      return;
    }

    const fetchCourseData = async () => {
      try {
        setLoading(true);
        const [courseRes, matsRes, assignRes] = await Promise.allSettled([
          apiService.get(`/courses/${id}`),
          lectureService.getCourseMaterials(id),
          assignmentService.getCourseAssignments(id),
        ]);

        if (courseRes.status === 'fulfilled') {
          setCourse(courseRes.value.data?.course ?? null);
        } else {
          setError('Course not found or failed to load.');
        }

        if (matsRes.status === 'fulfilled') {
          setMaterials(matsRes.value?.materials || []);
        }
        if (assignRes.status === 'fulfilled') {
          setAssignments(assignRes.value?.assignments || []);
        }
      } catch (err) {
        setError('Course not found or failed to load.');
        console.error('CourseDetails fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourseData();
  }, [id, navigate]);

  /* ── Toggle curriculum module ──────────────────────────────────────────── */
  const toggleModule = (idx) =>
    setOpenModules(prev => ({ ...prev, [idx]: !prev[idx] }));

  /* ── Submit review ─────────────────────────────────────────────────────── */
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please log in to leave a review.');
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }
    if (selectedRating === 0) { toast.error('Please select a star rating first.'); return; }
    if (!feedbackText.trim())  { toast.error('Please write your feedback before submitting.'); return; }

    try {
      const res = await apiService.post(`/courses/${id}/reviews`, {
        rating: selectedRating,
        comment: feedbackText.trim(),
      });
      setCourse(res.data?.course ?? course);
      setFeedbackText('');
      setSelectedRating(0);
      toast.success('Thank you for your review!');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to submit review. Please try again.');
    }
  };

  /* ── Enrolled status ─────────────────────────────────────────────────── */
  const isEnrolled = Boolean(
    course?.enrolledStudents?.some((student) => {
      const studentId = typeof student === 'object' ? (student?._id || student?.id) : student;
      const currentUserId = user?._id || user?.id;
      return studentId && currentUserId && String(studentId) === String(currentUserId);
    }) ||
    user?.enrolledCourses?.some((c) => {
      const cId = typeof c === 'object' ? (c?._id || c?.id) : c;
      return cId && id && String(cId) === String(id);
    })
  );

  /* ── Enroll or Buy ─────────────────────────────────────────────────────── */
  const handleEnrollOrBuy = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }
    if (isEnrolled) {
      navigate(`/course-info/${id}`);
      return;
    }

    // Paid course -> Stripe payment checkout
    if (course.price > 0) {
      navigate(`/payment-info?courseId=${id}`);
      return;
    }

    // Free course -> direct enrollment
    try {
      setEnrolling(true);
      await apiService.post(`/courses/${id}/enroll`);
      setCourse(prev => prev ? {
        ...prev,
        enrolledStudents: [...(prev.enrolledStudents || []), user?._id || user?.id]
      } : prev);
      setEnrollMsg('Successfully enrolled! Redirecting…');
      setTimeout(() => navigate(`/course-info/${id}`), 1200);
    } catch (err) {
      setEnrollMsg(err?.response?.data?.message ?? 'Enrollment failed. Please try again.');
      setEnrolling(false);
    }
  };

  /* ── Derived Curriculum Weeks & Lessons ───────────────────────────────── */
  const curriculumWeeks = (() => {
    const weekMap = new Map();

    // 1. Add curriculum weeks from course doc
    (course?.curriculum || []).forEach((w, idx) => {
      const wNum = w.week ?? (idx + 1);
      weekMap.set(wNum, {
        week: wNum,
        title: w.title || `Week ${wNum}`,
        description: w.description || '',
        lessons: w.lessons || [],
      });
    });

    // 2. Ensure weeks from uploaded materials exist
    materials.forEach((m) => {
      const wNum = m.weekNumber || 1;
      if (!weekMap.has(wNum)) {
        weekMap.set(wNum, {
          week: wNum,
          title: `Week ${wNum}: Course Materials`,
          description: 'Uploaded lecture resources & media',
          lessons: [],
        });
      }
    });

    // 3. Ensure weeks from assignments exist
    assignments.forEach((a) => {
      const wNum = a.weekNumber || 1;
      if (!weekMap.has(wNum)) {
        weekMap.set(wNum, {
          week: wNum,
          title: `Week ${wNum}: Assignments`,
          description: 'Practical exercises & evaluations',
          lessons: [],
        });
      }
    });

    return Array.from(weekMap.values()).sort((a, b) => a.week - b.week);
  })();

  const totalLessons = curriculumWeeks.reduce(
    (sum, w) => sum + (w.lessons?.length ?? 0) + materials.filter(m => (m.weekNumber || 1) === w.week).length, 0
  );

  /* ── Helpers ───────────────────────────────────────────────────────────── */
  const formatPrice   = (p) => p === 0 ? 'Free' : `LKR ${p?.toLocaleString()}`;
  const instructorName   = () => course?.instructor?.name ?? 'SRI-KO Instructor';
  const instructorAvatar = () =>
    course?.instructor?.avatar ??
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${instructorName()}`;

  const levelColor = {
    beginner:     { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    intermediate: { bg: 'bg-blue-100',    text: 'text-blue-700'    },
    advanced:     { bg: 'bg-orange-100',  text: 'text-orange-700'  },
  }[course?.level] ?? { bg: 'bg-gray-100', text: 'text-gray-700' };

  /* ── Loading ───────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-gray-500 font-medium">Loading course details…</p>
        </div>
      </div>
    );
  }

  /* ── Error ─────────────────────────────────────────────────────────────── */
  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4 text-center px-6">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-gray-700 font-semibold text-lg">{error ?? 'Course not found.'}</p>
          <Link to="/courses" className="text-blue-600 text-sm font-semibold hover:underline">
            ← Back to Explore Courses
          </Link>
        </div>
      </div>
    );
  }

  /* ── Main render ───────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-800 relative">

      {/* Hero gradient bg */}
      <div
        className="absolute top-0 left-0 w-full h-[470px] z-0"
        style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 25%, #6366f1 50%, #8b5cf6 75%, #4338ca 100%)' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 flex flex-col lg:flex-row gap-10">

        {/* ── Left column ─────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Hero text */}
          <div className="text-white pb-12">
            <Link
              to="/courses"
              className="inline-flex items-center text-white/90 hover:text-white text-sm font-semibold mb-6 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
              Back to Explore Courses
            </Link>

            {/* Level + category badges */}
            <div className="flex items-center gap-3 mb-5">
              {course.level && (
                <span className="bg-white text-orange-600 px-3 py-1 rounded-full text-xs font-black tracking-wide shadow-xs capitalize">
                  {course.level}
                </span>
              )}
              {course.category && (
                <span className="text-white text-xs font-semibold border border-white/40 bg-white/10 backdrop-blur-xs px-3.5 py-1 rounded-full">
                  {course.category}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 leading-[1.15] tracking-tight text-white drop-shadow-xs">
              {course.title}
            </h1>

            <p className="text-base sm:text-lg text-white/90 mb-8 max-w-3xl leading-relaxed font-normal">
              {course.description}
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm text-white/95 font-medium mb-8">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/80" /> {course.duration} weeks
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-white/80" /> {course.enrolledStudents?.length ?? 0} students
              </div>
              {course.averageRating > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                  {course.averageRating.toFixed(1)} Rating
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-white/80" />
                {new Date(course.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            {/* Instructor mini */}
            <div className="flex items-center gap-3">
              <img
                src={instructorAvatar()}
                alt={instructorName()}
                className="w-10 h-10 rounded-full object-cover bg-white/20 border border-white/40"
              />
              <div>
                <p className="text-sm font-bold text-white leading-tight">{instructorName()}</p>
                <p className="text-xs text-white/80">Lead Instructor</p>
              </div>
            </div>
          </div>

          {/* ── Tabs ──────────────────────────────────────────────────────── */}
          <div className="text-gray-800 mt-4">
            <div className="flex space-x-8 border-b border-gray-200 mb-10 overflow-x-auto bg-white/50 backdrop-blur-xs rounded-xl px-4">
              {['Overview', 'Curriculum', 'Instructor', 'Reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                  }`}
                >
                  {tab === 'Overview'   && <FileText className="w-4 h-4" />}
                  {tab === 'Curriculum' && <Clock    className="w-4 h-4" />}
                  {tab === 'Instructor' && <User     className="w-4 h-4" />}
                  {tab === 'Reviews'    && <Star     className="w-4 h-4" />}
                  {tab}
                </button>
              ))}
            </div>

            {/* ── Overview ────────────────────────────────────────────────── */}
            {activeTab === 'Overview' && (
              <section className="mb-14">
                {/* What you'll learn — derive from first lesson titles or materials */}
                {(course.curriculum?.length > 0 || materials.length > 0) && (
                  <>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">What you'll learn</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                      {[
                        ...(course.curriculum?.flatMap(w => w.lessons ?? []) ?? []),
                        ...materials.map(m => ({ title: m.title })),
                      ].slice(0, 8).map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-700 font-medium">{item.title}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Prerequisites */}
                {course.prerequisites?.length > 0 && (
                  <div className="bg-[#f8fafc] border border-gray-200/80 rounded-2xl p-6 mb-10 shadow-xs">
                    <h4 className="font-bold text-gray-900 text-sm mb-4">Prerequisites</h4>
                    <ul className="space-y-3">
                      {course.prerequisites.map((p, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="text-gray-700 text-sm">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tags */}
                {course.tags?.length > 0 && (
                  <>
                    <h4 className="font-bold text-gray-900 text-sm mb-4">Tags</h4>
                    <div className="flex flex-wrap gap-3">
                      {course.tags.map((tag, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                          <Tag className="w-3.5 h-3.5" /> {tag}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </section>
            )}

            {/* ── Curriculum ──────────────────────────────────────────────── */}
            {activeTab === 'Curriculum' && (
              <section className="mb-14 border-t border-gray-200 pt-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Course Curriculum</h3>
                  <span className="text-sm text-gray-500 font-medium">
                    {curriculumWeeks.length} weeks • {totalLessons} lessons &amp; resources
                  </span>
                </div>

                {curriculumWeeks.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
                    <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-700">Course curriculum is being prepared.</p>
                    <p className="text-xs text-gray-400 mt-1">Enroll today to receive updates as materials are uploaded.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {curriculumWeeks.map((week, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                      <div
                        onClick={() => toggleModule(idx)}
                        className="p-5 sm:p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${openModules[idx] ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                            W{week.week ?? idx + 1}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm sm:text-base">{week.title}</h4>
                            {week.description && (
                              <p className="text-xs text-gray-500 mt-0.5">{week.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs sm:text-sm text-gray-500 font-medium hidden sm:block">
                            {week.lessons?.length ?? 0} lesson{(week.lessons?.length ?? 0) !== 1 ? 's' : ''}
                          </span>
                          {openModules[idx]
                            ? <ChevronUp className="w-5 h-5 text-gray-400" />
                            : <ChevronDown className="w-5 h-5 text-gray-400" />
                          }
                        </div>
                      </div>

                      {openModules[idx] && (
                        <div className="border-t border-gray-100 bg-gray-50/50 divide-y divide-gray-100">
                          {(week.lessons ?? []).map((lesson, li) => (
                            <div
                              key={li}
                              onClick={() => navigate(`/course-info/${id}`)}
                              className="flex items-center justify-between p-4 px-6 hover:bg-blue-50/40 transition cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <PlayCircle className={`w-4 h-4 ${lesson.isFreePreview ? 'text-blue-600' : 'text-gray-400'}`} />
                                <span className="text-xs sm:text-sm font-medium text-gray-800">{lesson.title}</span>
                                {lesson.isFreePreview && (
                                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                                    Preview
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-400 font-mono">
                                {lesson.duration ? `${lesson.duration}m` : '—'}
                              </span>
                            </div>
                          ))}

                          {/* Live Google Drive Lecture Materials for this week */}
                          {materials.filter(m => m.weekNumber === (week.week ?? idx + 1)).map((mat) => (
                            <div
                              key={mat._id}
                              onClick={() => navigate(`/course-info/${id}`)}
                              className="flex items-center justify-between p-4 px-6 hover:bg-blue-50/40 transition cursor-pointer bg-blue-50/15"
                            >
                              <div className="flex items-center gap-3">
                                {mat.type === 'video' && <Video className="w-4 h-4 text-purple-600" />}
                                {mat.type === 'pdf' && <FileText className="w-4 h-4 text-red-600" />}
                                {mat.type === 'image' && <ImageIcon className="w-4 h-4 text-amber-600" />}
                                {mat.type === 'link' && <PlayCircle className="w-4 h-4 text-blue-600" />}
                                <span className="text-xs sm:text-sm font-medium text-gray-900">{mat.title}</span>
                                <span className="bg-blue-50 text-blue-700 border border-blue-200/60 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">
                                  {mat.type}
                                </span>
                              </div>
                              <span className="text-xs text-gray-400">
                                {mat.isPreview ? 'Free Preview' : 'Enrolled only'}
                              </span>
                            </div>
                          ))}

                          {/* Assignments for this week */}
                          {assignments.filter(a => a.weekNumber === (week.week ?? idx + 1)).map((assign) => (
                            <div
                              key={assign._id}
                              onClick={() => navigate(`/course-info/${id}`)}
                              className="flex items-center justify-between p-4 px-6 hover:bg-amber-50/40 transition cursor-pointer bg-amber-50/10"
                            >
                              <div className="flex items-center gap-3">
                                <ClipboardList className="w-4 h-4 text-amber-600" />
                                <span className="text-xs sm:text-sm font-medium text-gray-900">{assign.title}</span>
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                                  Assignment
                                </span>
                              </div>
                              <span className="text-xs text-amber-700 font-medium">
                                {assign.maxScore} pts
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

            {/* ── Instructor ──────────────────────────────────────────────── */}
            {activeTab === 'Instructor' && (
              <section className="mb-14 border-t border-gray-200 pt-10">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-8">Your Instructor</h3>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <img
                    src={instructorAvatar()}
                    alt={instructorName()}
                    className="w-24 h-24 rounded-2xl object-cover shrink-0 shadow-md"
                  />
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-1">{instructorName()}</h4>
                    <p className="text-blue-600 text-sm font-semibold mb-4">SRI-KO Certified Instructor</p>
                    {course.instructor?.bio && (
                      <p className="text-gray-600 text-sm italic mb-6 leading-relaxed max-w-2xl">
                        "{course.instructor.bio}"
                      </p>
                    )}
                    <div className="flex gap-8">
                      <div>
                        <div className="text-xl font-black text-gray-900">
                          {course.averageRating > 0 ? course.averageRating.toFixed(1) : 'N/A'}
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rating</div>
                      </div>
                      <div>
                        <div className="text-xl font-black text-gray-900">{course.enrolledStudents?.length ?? 0}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Students</div>
                      </div>
                      <div>
                        <div className="text-xl font-black text-gray-900">{course.curriculum?.length ?? 0}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Weeks</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ── Reviews ─────────────────────────────────────────────────── */}
            {activeTab === 'Reviews' && (
              <section className="border-t border-gray-200 pt-10">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Student Reviews</h3>
                  {course.averageRating > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-400">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-4 h-4 ${s <= Math.round(course.averageRating) ? 'fill-current' : ''}`} />
                        ))}
                      </div>
                      <span className="font-extrabold text-gray-900 text-sm">{course.averageRating.toFixed(1)}</span>
                      <span className="text-gray-400 text-xs">({course.reviews?.length ?? 0} reviews)</span>
                    </div>
                  )}
                </div>

                {/* Write a review */}
                <form onSubmit={handleReviewSubmit} className="bg-[#f8fafc] border border-gray-200 rounded-3xl p-6 sm:p-8 mb-8 shadow-xs">
                  <h4 className="font-bold text-gray-900 text-base mb-4">Write a Review</h4>

                  <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                      Rating <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1.5">
                        {[1,2,3,4,5].map(star => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setSelectedRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <Star className={`w-6 h-6 transition-colors ${(hoverRating || selectedRating) >= star ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                          </button>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {selectedRating ? `${selectedRating} of 5 Stars` : 'Select Rating'}
                      </span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Your Feedback</label>
                    <textarea
                      rows={4}
                      maxLength={500}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none shadow-xs"
                      placeholder="Share your experience with this course..."
                    />
                    <div className="text-right mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {feedbackText.length} / 500 characters
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="bg-[#0052cc] hover:bg-blue-700 text-white font-bold py-2.5 px-7 rounded-xl transition-all shadow-md shadow-blue-500/20 text-xs"
                  >
                    Submit Review
                  </button>
                </form>

                {/* Review list */}
                <div className="space-y-4">
                  {(course.reviews ?? []).length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">No reviews yet. Be the first!</p>
                  ) : (
                    (course.reviews ?? []).map((rev, i) => (
                      <div key={i} className="border border-gray-200/80 rounded-3xl p-6 sm:p-8 bg-white shadow-xs">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3.5">
                            <img
                              src={rev.user?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${rev.user?.name ?? 'User'}`}
                              alt={rev.user?.name ?? 'User'}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <h5 className="font-bold text-gray-900 text-sm">{rev.user?.name ?? 'Student'}</h5>
                              <p className="text-xs text-gray-400">
                                {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex text-amber-400 gap-0.5">
                            {Array.from({ length: rev.rating }).map((_, si) => (
                              <Star key={si} className="w-3.5 h-3.5 fill-current" />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-600 text-xs sm:text-sm italic leading-relaxed">{rev.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* ── Right column: Sticky pricing card ───────────────────────────── */}
        <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0">
          <div className="sticky top-24 bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            {/* Course Photo / Thumbnail from Google Drive */}
            <div className="relative aspect-video rounded-2xl overflow-hidden mb-6 shadow-md border border-gray-100 group">
              <img 
                src={course.thumbnail || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800'} 
                alt={course.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center transition">
                <button 
                  onClick={() => navigate(`/course-info/${id}`)}
                  className="w-12 h-12 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-xl hover:scale-110 transition active:scale-95 cursor-pointer"
                  title="Preview Course"
                >
                  <Play className="w-5 h-5 fill-blue-600 translate-x-0.5" />
                </button>
              </div>
              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-[10px] font-bold text-white bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg">
                <span>Course Preview</span>
                <span className="text-blue-300">Google Drive Powered</span>
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-4xl font-extrabold text-[#1d4ed8] mb-2 tracking-tight">
                {course.price === 0 ? 'Free' : `LKR ${course.price?.toLocaleString()}`}
              </h2>
              <div className="flex items-center justify-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-500">One-time payment</span>
              </div>
            </div>

            {enrollMsg && (
              <div className={`rounded-xl px-4 py-3 text-sm font-semibold text-center mb-4 ${enrollMsg.includes('Success') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                {enrollMsg}
              </div>
            )}

            {isEnrolled ? (
              <button
                onClick={() => navigate(`/course-info/${id}`)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20 text-sm mb-8 active:scale-[0.99] cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                Go to Course
              </button>
            ) : course.price > 0 ? (
              <div className="mb-8">
                <button
                  onClick={handleEnrollOrBuy}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/25 text-sm active:scale-[0.99] cursor-pointer"
                >
                  <CreditCard className="w-5 h-5" />
                  Buy Course ({formatPrice(course.price)})
                </button>
                <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 mt-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Secured by Stripe • Instant Access</span>
                </div>
              </div>
            ) : (
              <button
                onClick={handleEnrollOrBuy}
                disabled={enrolling}
                className="w-full bg-[#1d4ed8] hover:bg-blue-800 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 text-sm mb-8 active:scale-[0.99] cursor-pointer"
              >
                {enrolling
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <GraduationCap className="w-5 h-5" />
                }
                {enrolling ? 'Enrolling…' : 'Enroll for Free'}
              </button>
            )}

            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-xs uppercase tracking-wider">Includes:</h4>
              <ul className="space-y-3.5">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-600 font-medium">Lifetime access to materials</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-600 font-medium">{totalLessons} lessons across {course.curriculum?.length ?? 0} weeks</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-600 font-medium">Official SRI-KO Certificate</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-600 font-medium">Direct Q&amp;A with instructor</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}