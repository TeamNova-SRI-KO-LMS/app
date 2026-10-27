import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  User, ArrowLeft, Clock, Users, Star, Calendar,
  CheckCircle2, AlertTriangle, Tag, ChevronDown, PlayCircle,
  CreditCard, FileText, ChevronUp, GraduationCap, Loader2, AlertCircle, ShieldCheck,
  Video, ClipboardList, Image as ImageIcon, Play, Download, Sparkles, ChevronRight, ExternalLink,
  Lock, X
} from 'lucide-react';
import apiService from '../services/apiService';
import useAuth from '../context/useAuth';
import toast from 'react-hot-toast';
import lectureService from '../services/lectureService';
import assignmentService from '../services/assignmentService';
import { isVideoUrl } from '../utils/mediaUtils';

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [course,            setCourse]            = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState(null);
  const [activeTab,         setActiveTab]         = useState('Overview');
  const [openModules,       setOpenModules]       = useState({ 0: true });
  const [selectedRating,    setSelectedRating]    = useState(0);
  const [hoverRating,       setHoverRating]       = useState(0);
  const [feedbackText,      setFeedbackText]      = useState('');
  const [enrolling,         setEnrolling]         = useState(false);
  const [enrollMsg,         setEnrollMsg]         = useState(null);
  const [materials,         setMaterials]         = useState([]);
  const [assignments,       setAssignments]       = useState([]);
  const [previewVideoModal, setPreviewVideoModal] = useState({ isOpen: false, video: null });

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
    user?.role === 'admin' ||
    (course?.instructor && (String(course.instructor._id || course.instructor) === String(user?._id || user?.id))) ||
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

  /* ── Public Preview Videos (admin explicitly marked as isPreview: true) ── */
  const publicPreviewVideos = materials.filter(m => m.isPreview && (m.type === 'video' || m.type === 'link'));
  const firstPreviewVideo = publicPreviewVideos[0] || null;

  const handlePlayFirstPreview = () => {
    if (firstPreviewVideo) {
      setPreviewVideoModal({
        isOpen: true,
        video: {
          title: firstPreviewVideo.title,
          url: firstPreviewVideo.embedUrl || firstPreviewVideo.viewUrl || firstPreviewVideo.externalUrl,
          lessonTitle: firstPreviewVideo.lessonTitle,
        },
      });
      return;
    }

    const freeLesson = course?.curriculum
      ?.flatMap(w => w.lessons || [])
      ?.find(l => l.isFreePreview && l.content);

    if (freeLesson) {
      setPreviewVideoModal({
        isOpen: true,
        video: {
          title: freeLesson.title,
          url: freeLesson.content,
          lessonTitle: freeLesson.title,
        },
      });
      return;
    }

    toast.error('No public preview video is available for this course. Please enroll to watch full lectures.');
  };

  const handleMaterialClick = (mat) => {
    if (isEnrolled) {
      navigate(`/course-info/${id}`);
      return;
    }

    if (mat.isPreview) {
      const previewUrl = mat.embedUrl || mat.viewUrl || mat.externalUrl;
      if (previewUrl && (mat.type === 'video' || mat.type === 'link')) {
        setPreviewVideoModal({
          isOpen: true,
          video: {
            title: mat.title,
            url: previewUrl,
            lessonTitle: mat.lessonTitle,
          },
        });
      } else if (mat.viewUrl) {
        window.open(mat.viewUrl, '_blank', 'noopener,noreferrer');
      } else {
        toast.success(`Previewing: ${mat.title}`);
      }
      return;
    }

    toast.error('This video is restricted to enrolled students. Please purchase or enroll in this course to watch.');
  };

  const handleLessonClick = (lesson) => {
    if (isEnrolled) {
      navigate(`/course-info/${id}`);
      return;
    }

    if (lesson.isFreePreview) {
      if (lesson.content) {
        setPreviewVideoModal({
          isOpen: true,
          video: {
            title: lesson.title,
            url: lesson.content,
            lessonTitle: lesson.title,
          },
        });
        return;
      }

      const matchMat = materials.find(m => m.isPreview && (m.title === lesson.title || m.lessonTitle === lesson.title));
      if (matchMat && (matchMat.embedUrl || matchMat.viewUrl || matchMat.externalUrl)) {
        setPreviewVideoModal({
          isOpen: true,
          video: {
            title: matchMat.title,
            url: matchMat.embedUrl || matchMat.viewUrl || matchMat.externalUrl,
            lessonTitle: matchMat.lessonTitle,
          },
        });
        return;
      }

      toast.success(`Lesson "${lesson.title}" is in the free preview curriculum.`);
      return;
    }

    toast.error('This lesson is locked. Enroll in the course to unlock full access.');
  };

  const handleAssignmentClick = () => {
    if (isEnrolled) {
      navigate(`/course-info/${id}`);
      return;
    }
    toast.error('Course assignments are restricted to enrolled students. Please enroll to access.');
  };

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
                  <span>{tab}</span>
                  {tab === 'Curriculum' && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ml-1 ${
                      activeTab === tab ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      ({materials.length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Overview ────────────────────────────────────────────────── */}
            {activeTab === 'Overview' && (
              <section className="mb-14">
                {/* Included Lecture Materials Preview Card */}
                <div className="bg-white border border-blue-100 rounded-3xl p-6 sm:p-8 mb-10 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-blue-100/50 via-indigo-50/30 to-transparent rounded-full blur-2xl -z-10 pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
                          <Sparkles className="w-3 h-3 text-blue-600" /> Supabase Storage
                        </span>
                        <span className="text-xs font-semibold text-gray-400">
                          • Instant CDN Streaming &amp; Downloads
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Included Lecture Materials</h3>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        {materials.length > 0 
                          ? `${materials.length} verified video lessons, slides, and study resources ready to access.`
                          : 'High-definition video lessons, downloadable PDF notes, and assignments.'}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        if (isEnrolled) {
                          navigate(`/course-info/${id}`);
                        } else if (firstPreviewVideo) {
                          handlePlayFirstPreview();
                        } else {
                          handleEnrollOrBuy();
                        }
                      }}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer self-start sm:self-center shrink-0 active:scale-95"
                    >
                      {isEnrolled ? (
                        <>
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Go to Classroom</span>
                        </>
                      ) : firstPreviewVideo ? (
                        <>
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Watch Free Preview</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-white" />
                          <span>Enroll to Access</span>
                        </>
                      )}
                    </button>
                  </div>

                  {materials.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50/70 rounded-2xl border border-dashed border-gray-200">
                      <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-gray-700">Course materials are currently being prepared.</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Enrolled students will receive instant updates as new resources are published.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {materials.slice(0, 6).map((mat) => (
                        <div
                          key={mat._id}
                          onClick={() => handleMaterialClick(mat)}
                          className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-200/80 bg-[#f8fafc] hover:bg-blue-50/50 hover:border-blue-300 transition cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                              mat.type === 'video' ? 'bg-purple-100 text-purple-700' :
                              mat.type === 'pdf' ? 'bg-red-100 text-red-700' :
                              mat.type === 'image' ? 'bg-amber-100 text-amber-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {mat.type === 'video' && <Video className="w-4 h-4" />}
                              {mat.type === 'pdf' && <FileText className="w-4 h-4" />}
                              {mat.type === 'image' && <ImageIcon className="w-4 h-4" />}
                              {mat.type === 'link' && <PlayCircle className="w-4 h-4" />}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-gray-900 group-hover:text-blue-700 truncate transition">
                                {mat.title}
                              </p>
                              <p className="text-[10px] text-gray-400 capitalize">
                                {mat.type} • {mat.lessonTitle || `Week ${mat.weekNumber || 1}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {mat.isPreview ? (
                              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide flex items-center gap-1">
                                <PlayCircle className="w-3 h-3" /> Preview
                              </span>
                            ) : (
                              <span className="bg-gray-100 text-gray-500 text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Lock className="w-3 h-3 text-gray-400" /> {isEnrolled ? 'Enrolled' : 'Locked'}
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {materials.length > 6 && (
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <span>+ {materials.length - 6} more lecture items available</span>
                      <button 
                        onClick={() => setActiveTab('Curriculum')} 
                        className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                      >
                        <span>View all in Curriculum</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

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
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Course Curriculum</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      {course.curriculum?.length > 0
                        ? `${course.curriculum.length} structured weeks • ${totalLessons} total learning resources`
                        : `${materials.length} uploaded lecture materials & resources`}
                    </p>
                  </div>
                  <span className="text-xs sm:text-sm text-blue-700 bg-blue-50 border border-blue-200/60 px-3 py-1 rounded-full font-bold">
                    {materials.length} Materials
                  </span>
                </div>

                {/* CASE 1: When course has 0 curriculum weeks (course.curriculum is empty) */}
                {(!course.curriculum || course.curriculum.length === 0) ? (
                  materials.length === 0 && assignments.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
                      <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-gray-700">Course curriculum is being prepared.</p>
                      <p className="text-xs text-gray-400 mt-1">Enroll today to receive updates as materials are uploaded.</p>
                    </div>
                  ) : (
                    /* Dedicated "Course Lecture Materials & Content" section */
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white rounded-2xl border border-blue-100 p-5 sm:p-6 mb-6">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-blue-600 text-white px-2.5 py-0.5 rounded-full">
                            Live Content
                          </span>
                          <span className="text-xs font-semibold text-gray-500">
                            Supabase Cloud Storage CDN
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-gray-900">Course Lecture Materials &amp; Content</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          All video lectures, PDF notes, slides, and learning resources uploaded for this course. Click any item to begin learning.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {materials.map((mat, mi) => (
                          <div
                            key={mat._id || mi}
                            onClick={() => handleMaterialClick(mat)}
                            className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 hover:border-blue-300 hover:shadow-md transition cursor-pointer group"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                                mat.type === 'video' ? 'bg-purple-100 text-purple-700' :
                                mat.type === 'pdf' ? 'bg-red-100 text-red-700' :
                                mat.type === 'image' ? 'bg-amber-100 text-amber-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {mat.type === 'video' && <Video className="w-5 h-5" />}
                                {mat.type === 'pdf' && <FileText className="w-5 h-5" />}
                                {mat.type === 'image' && <ImageIcon className="w-5 h-5" />}
                                {mat.type === 'link' && <PlayCircle className="w-5 h-5" />}
                              </div>
                              <div className="truncate">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                                    {mat.type}
                                  </span>
                                  {mat.lessonTitle && (
                                    <span className="text-xs text-gray-400 font-medium truncate">
                                      {mat.lessonTitle}
                                    </span>
                                  )}
                                </div>
                                <h5 className="font-bold text-gray-900 text-sm sm:text-base group-hover:text-blue-600 transition truncate">
                                  {mat.title}
                                </h5>
                                {mat.description && (
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                    {mat.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              {mat.isPreview ? (
                                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
                                  <PlayCircle className="w-3 h-3" /> Free Preview
                                </span>
                              ) : isEnrolled ? (
                                <span className="text-xs text-blue-600 font-medium hidden sm:inline">
                                  Enrolled
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 font-medium hidden sm:flex items-center gap-1">
                                  <Lock className="w-3.5 h-3.5" /> Enrolled Only
                                </span>
                              )}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMaterialClick(mat);
                                }}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition shadow-xs ${
                                  mat.isPreview || isEnrolled 
                                    ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' 
                                    : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                                }`}
                                title={mat.isPreview ? 'Play preview' : isEnrolled ? 'Access lecture' : 'Locked - Enrolled only'}
                              >
                                {mat.isPreview || isEnrolled ? (
                                  <Play className="w-4 h-4 fill-current translate-x-0.5" />
                                ) : (
                                  <Lock className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Assignments if any */}
                        {assignments.map((assign) => (
                          <div
                            key={assign._id}
                            onClick={() => handleAssignmentClick(assign)}
                            className="bg-white border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 hover:border-amber-400 hover:shadow-md transition cursor-pointer group"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
                                <ClipboardList className="w-5 h-5" />
                              </div>
                              <div className="truncate">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 inline-block mb-0.5">
                                  Course Assignment
                                </span>
                                <h5 className="font-bold text-gray-900 text-sm sm:text-base group-hover:text-amber-700 transition truncate">
                                  {assign.title}
                                </h5>
                                {assign.description && (
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{assign.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                                {assign.maxScore} pts
                              </span>
                              {isEnrolled ? (
                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-amber-600 transition" />
                              ) : (
                                <Lock className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ) : (
                  /* CASE 2: Course HAS structured curriculum weeks */
                  <div className="space-y-4">
                    {course.curriculum.map((week, idx) => {
                      const wNum = week.week ?? (idx + 1);
                      const weekMaterials = materials.filter(m => (m.weekNumber || 1) === wNum);
                      const weekAssignments = assignments.filter(a => (a.weekNumber || 1) === wNum);

                      return (
                        <div key={idx} className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                          <div
                            onClick={() => toggleModule(idx)}
                            className="p-5 sm:p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${openModules[idx] ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                W{wNum}
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
                                {(week.lessons?.length ?? 0) + weekMaterials.length} item{((week.lessons?.length ?? 0) + weekMaterials.length) !== 1 ? 's' : ''}
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
                                  onClick={() => handleLessonClick(lesson)}
                                  className="flex items-center justify-between p-4 px-6 hover:bg-blue-50/40 transition cursor-pointer"
                                >
                                  <div className="flex items-center gap-3">
                                    {lesson.isFreePreview || isEnrolled ? (
                                      <PlayCircle className={`w-4 h-4 ${lesson.isFreePreview ? 'text-emerald-600' : 'text-blue-600'}`} />
                                    ) : (
                                      <Lock className="w-4 h-4 text-gray-400" />
                                    )}
                                    <span className="text-xs sm:text-sm font-medium text-gray-800">{lesson.title}</span>
                                    {lesson.isFreePreview && (
                                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                                        Preview
                                      </span>
                                    )}
                                    {!lesson.isFreePreview && !isEnrolled && (
                                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                                        Enrolled only
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-400 font-mono">
                                    {lesson.duration ? `${lesson.duration}m` : '—'}
                                  </span>
                                </div>
                              ))}

                              {/* Live Supabase Storage Lecture Materials for this week */}
                              {weekMaterials.map((mat) => (
                                <div
                                  key={mat._id}
                                  onClick={() => handleMaterialClick(mat)}
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
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">
                                      {mat.isPreview ? (
                                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                                          <PlayCircle className="w-3.5 h-3.5" /> Free Preview
                                        </span>
                                      ) : isEnrolled ? (
                                        'Enrolled'
                                      ) : (
                                        <span className="flex items-center gap-1 text-gray-400">
                                          <Lock className="w-3.5 h-3.5" /> Enrolled only
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              ))}

                              {/* Assignments for this week */}
                              {weekAssignments.map((assign) => (
                                <div
                                  key={assign._id}
                                  onClick={() => handleAssignmentClick(assign)}
                                  className="flex items-center justify-between p-4 px-6 hover:bg-amber-50/40 transition cursor-pointer bg-amber-50/10"
                                >
                                  <div className="flex items-center gap-3">
                                    {isEnrolled ? (
                                      <ClipboardList className="w-4 h-4 text-amber-600" />
                                    ) : (
                                      <Lock className="w-4 h-4 text-amber-700/60" />
                                    )}
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
                      );
                    })}

                    {/* Additional Course Materials block for extra materials that don't match numbered weeks */}
                    {(() => {
                      const matchedWeekNumbers = new Set((course.curriculum || []).map((w, idx) => w.week ?? (idx + 1)));
                      const additionalMaterials = materials.filter(m => !matchedWeekNumbers.has(m.weekNumber));
                      const additionalAssignments = assignments.filter(a => !matchedWeekNumbers.has(a.weekNumber));

                      if (additionalMaterials.length === 0 && additionalAssignments.length === 0) return null;

                      return (
                        <div className="mt-8 pt-6 border-t border-gray-200">
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
                              Additional Course Materials &amp; Resources
                            </span>
                            <span className="text-xs text-gray-400">
                              ({additionalMaterials.length + additionalAssignments.length} extra items)
                            </span>
                          </div>

                          <div className="space-y-2.5">
                            {additionalMaterials.map((mat) => (
                              <div
                                key={mat._id}
                                onClick={() => handleMaterialClick(mat)}
                                className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between hover:border-blue-300 hover:shadow-xs transition cursor-pointer"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                    mat.type === 'video' ? 'bg-purple-100 text-purple-700' :
                                    mat.type === 'pdf' ? 'bg-red-100 text-red-700' :
                                    mat.type === 'image' ? 'bg-amber-100 text-amber-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {mat.type === 'video' && <Video className="w-4 h-4" />}
                                    {mat.type === 'pdf' && <FileText className="w-4 h-4" />}
                                    {mat.type === 'image' && <ImageIcon className="w-4 h-4" />}
                                    {mat.type === 'link' && <PlayCircle className="w-4 h-4" />}
                                  </div>
                                  <div>
                                    <p className="text-xs sm:text-sm font-bold text-gray-900">{mat.title}</p>
                                    <p className="text-[10px] text-gray-400">
                                      {mat.lessonTitle || 'Supplementary Resource'} • {mat.type.toUpperCase()}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
                                  {mat.isPreview || isEnrolled ? 'Open →' : (
                                    <span className="flex items-center gap-1 text-gray-400 font-normal">
                                      <Lock className="w-3 h-3" /> Locked
                                    </span>
                                  )}
                                </span>
                              </div>
                            ))}

                            {additionalAssignments.map((assign) => (
                              <div
                                key={assign._id}
                                onClick={() => handleAssignmentClick(assign)}
                                className="bg-white border border-amber-200 rounded-2xl p-4 flex items-center justify-between hover:border-amber-300 transition cursor-pointer"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                    <ClipboardList className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="text-xs sm:text-sm font-bold text-gray-900">{assign.title}</p>
                                    <p className="text-[10px] text-amber-600">Assignment • {assign.maxScore} pts</p>
                                  </div>
                                </div>
                                <span className="text-xs text-amber-700 font-bold hover:underline flex items-center gap-1">
                                  {isEnrolled ? 'View Assignment →' : (
                                    <span className="flex items-center gap-1 text-gray-400 font-normal">
                                      <Lock className="w-3 h-3" /> Locked
                                    </span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
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
            {/* Course Photo / Video Thumbnail */}
            <div className="relative aspect-video rounded-2xl overflow-hidden mb-6 shadow-md border border-gray-100 group bg-slate-900">
              {isVideoUrl(course.thumbnail) ? (
                <>
                  <video 
                    src={course.thumbnail} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    muted 
                    playsInline 
                    preload="metadata" 
                  />
                  {/* Play button overlay: strictly for thumbnail videos */}
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewVideoModal({
                        isOpen: true,
                        video: {
                          title: `${course.title} - Video Preview`,
                          url: course.thumbnail,
                          lessonTitle: 'Course Overview Video',
                        },
                      });
                    }}
                    aria-label="Play course thumbnail video"
                    className="absolute inset-0 bg-black/25 hover:bg-black/40 transition-colors flex items-center justify-center cursor-pointer group/btn"
                  >
                    <div className="w-16 h-16 rounded-full bg-blue-600/95 hover:bg-blue-600 text-white flex items-center justify-center shadow-xl transition-all duration-300 group-hover/btn:scale-110 active:scale-95">
                      <Play className="w-7 h-7 fill-current translate-x-0.5" />
                    </div>
                    <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white flex items-center gap-1.5 pointer-events-none">
                      <Video className="w-3.5 h-3.5 text-blue-400" />
                      <span>Video Preview</span>
                    </div>
                  </button>
                </>
              ) : (
                <img 
                  src={course.thumbnail || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800'} 
                  alt={course.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
              )}
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

      {/* ── Preview Video Modal for Public Previews ───────────────────────── */}
      {previewVideoModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-4xl bg-[#0f172a] rounded-3xl overflow-hidden shadow-2xl border border-white/10 text-white flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3 min-w-0">
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shrink-0">
                  Public Free Preview
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white truncate">
                  {previewVideoModal.video?.title || 'Course Preview Video'}
                </h3>
              </div>
              <button
                onClick={() => setPreviewVideoModal({ isOpen: false, video: null })}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition cursor-pointer shrink-0 ml-4"
                title="Close Preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Content */}
            <div className="p-4 sm:p-6 bg-black flex items-center justify-center">
              {previewVideoModal.video?.url ? (
                (previewVideoModal.video.url.includes('youtube.com') || previewVideoModal.video.url.includes('youtu.be') || previewVideoModal.video.url.includes('/embed/')) ? (
                  <iframe
                    src={previewVideoModal.video.url}
                    title={previewVideoModal.video.title}
                    className="w-full aspect-video rounded-2xl shadow-lg border border-white/10"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    controls
                    autoPlay
                    controlsList="nodownload"
                    src={previewVideoModal.video.url}
                    className="w-full aspect-video rounded-2xl shadow-lg bg-black object-contain"
                  />
                )
              ) : (
                <div className="py-16 text-center text-gray-400">
                  <AlertCircle className="w-10 h-10 mx-auto mb-2 text-amber-400" />
                  <p className="text-sm font-medium">Video preview stream is currently unavailable.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs text-gray-300">
                  Enjoying this preview? Enroll now to unlock all {totalLessons} lectures, assignments, and certificates.
                </p>
              </div>
              <button
                onClick={() => {
                  setPreviewVideoModal({ isOpen: false, video: null });
                  handleEnrollOrBuy();
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition cursor-pointer active:scale-95 shrink-0"
              >
                {course.price === 0 ? 'Enroll for Free' : `Buy Course (${formatPrice(course.price)})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}