import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Users,
  Edit3,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
  Star,
  User,
  Clock,
  Calendar,
  CheckCircle,
  FileText,
  Video,
  Layers,
  Copy,
  Check,
  Plus,
  Loader2,
  Tag,
  DollarSign,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  FileDown,
  MessageSquare
} from 'lucide-react';
import courseService from '../../services/courseService';
import lectureService from '../../services/lectureService';
import CourseResourceModal from './CourseResourceModal';
import { isVideoUrl } from '../../utils/mediaUtils';
import toast from 'react-hot-toast';

const LEVEL_STYLES = {
  beginner:     'bg-emerald-100 text-emerald-700 border-emerald-200',
  intermediate: 'bg-indigo-100  text-indigo-700 border-indigo-200',
  advanced:     'bg-purple-100  text-purple-700 border-purple-200',
  'all levels': 'bg-blue-100    text-blue-700    border-blue-200',
  'all-levels': 'bg-blue-100    text-blue-700    border-blue-200',
};

const getLevelStyle = (level = '') =>
  LEVEL_STYLES[level.toLowerCase()] ?? 'bg-gray-100 text-gray-700 border-gray-200';

const formatPrice = (price) => {
  if (price === 0 || price === '0') return 'Free';
  return `LKR ${Number(price).toLocaleString('en-LK')}`;
};

export default function CourseDetailsView({
  course: initialCourse,
  courseId: propCourseId,
  onBack,
  onEdit,
  onTogglePublish,
  onDelete,
}) {
  const effectiveId = initialCourse?._id || propCourseId;
  const [course, setCourse] = useState(initialCourse || null);
  const [loading, setLoading] = useState(!initialCourse && !!effectiveId);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'curriculum' | 'instructor' | 'students' | 'reviews'
  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);

  // Fetch full course details
  const fetchCourseData = useCallback(async () => {
    if (!effectiveId) return;
    try {
      setLoading(true);
      const res = await courseService.getCourse(effectiveId);
      if (res?.course) {
        setCourse(res.course);
      }
    } catch (err) {
      console.error('Failed to load course details:', err);
      toast.error('Failed to load fresh course details.');
    } finally {
      setLoading(false);
    }
  }, [effectiveId]);

  // Fetch materials
  const fetchMaterials = useCallback(async () => {
    if (!effectiveId) return;
    try {
      setLoadingMaterials(true);
      const res = await lectureService.getCourseMaterials(effectiveId);
      if (res?.materials) {
        setMaterials(res.materials);
      }
    } catch (err) {
      console.warn('Failed to load materials:', err);
    } finally {
      setLoadingMaterials(false);
    }
  }, [effectiveId]);

  useEffect(() => {
    if (effectiveId) {
      fetchCourseData();
      fetchMaterials();
    }
  }, [effectiveId, fetchCourseData, fetchMaterials]);

  const handleCopyId = () => {
    if (course?._id) {
      navigator.clipboard.writeText(course._id);
      setCopiedId(true);
      toast.success('Course ID copied to clipboard!');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleToggle = async () => {
    if (!course) return;
    setIsTogglingPublish(true);
    try {
      if (onTogglePublish) {
        await onTogglePublish(course);
        setCourse(prev => prev ? { ...prev, isPublished: !prev.isPublished } : prev);
      } else {
        const res = await courseService.togglePublish(course._id);
        setCourse(prev => prev ? { ...prev, isPublished: res.isPublished } : prev);
        toast.success(`Course ${res.isPublished ? 'published' : 'unpublished'} successfully!`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to toggle status.');
    } finally {
      setIsTogglingPublish(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8">
        <Loader2 size={36} className="animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-semibold text-gray-500">Loading course details…</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center max-w-lg mx-auto border border-gray-100 shadow-sm mt-8">
        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BookOpen size={24} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Course Not Found</h3>
        <p className="text-xs text-gray-500 mb-6">The requested course could not be loaded or may have been deleted.</p>
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
          >
            <ArrowLeft size={14} /> Back to Courses
          </button>
        )}
      </div>
    );
  }

  const studentCount = Array.isArray(course.enrolledStudents)
    ? course.enrolledStudents.length
    : (typeof course.enrolledCount === 'number'
        ? course.enrolledCount
        : (typeof course.buyersCount === 'number' ? course.buyersCount : 0));

  const instructorName = course.instructorName || course.instructor?.name || 'SRI-KO Instructor';
  const instructorAvatar = course.instructorImage || course.instructor?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(instructorName)}`;
  const instructorRole = course.instructorRole || 'Lead Korean Language Instructor';
  const instructorBio = course.instructorBio || course.instructor?.bio || 'Certified native instructor with extensive Korean language teaching and cultural curriculum experience.';

  const isVideo = isVideoUrl(course.thumbnail);
  const totalWeeks = Array.isArray(course.curriculum) ? course.curriculum.length : 0;
  const totalLessons = Array.isArray(course.curriculum)
    ? course.curriculum.reduce((acc, w) => acc + (Array.isArray(w.lessons) ? w.lessons.length : 0), 0)
    : 0;

  const grossRevenue = (Number(course.price) || 0) * studentCount;

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          {onBack && (
            <button
              type="button"
              id="back-to-courses-btn"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-600 mb-2 transition cursor-pointer"
            >
              <ArrowLeft size={14} /> Back to Course Management
            </button>
          )}
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
            <span>Admin</span>
            <span>/</span>
            <span>Courses</span>
            <span>/</span>
            <span className="text-gray-700 truncate max-w-[200px] sm:max-w-xs">{course.title}</span>
          </div>
        </div>

        {/* Action Buttons Top Right */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Publish */}
          <button
            type="button"
            onClick={handleToggle}
            disabled={isTogglingPublish}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 ${
              course.isPublished
                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            {isTogglingPublish ? (
              <Loader2 size={14} className="animate-spin text-current" />
            ) : course.isPublished ? (
              <EyeOff size={14} />
            ) : (
              <Eye size={14} />
            )}
            <span>{course.isPublished ? 'Unpublish Course' : 'Publish Course'}</span>
          </button>

          {/* Edit Course */}
          <button
            type="button"
            onClick={() => onEdit && onEdit(course)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <Edit3 size={14} />
            <span>Edit Course</span>
          </button>

          {/* View Public Page */}
          <button
            type="button"
            onClick={() => window.open(`/courses/${course._id}`, '_blank')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            title="Open Public Course Page"
          >
            <ExternalLink size={14} />
            <span>Public Page</span>
          </button>

          {/* Delete Course */}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(course)}
              className="p-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl transition cursor-pointer"
              title="Delete Course"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── Hero Header Card ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Cover Media Preview (Left) */}
          <div className="lg:col-span-4 w-full">
            <div className="relative w-full aspect-video sm:h-52 rounded-2xl overflow-hidden bg-gray-900 border border-gray-100 shadow-md group">
              {course.thumbnail ? (
                isVideo ? (
                  <video
                    src={course.thumbnail}
                    className="w-full h-full object-cover"
                    controls
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex flex-col items-center justify-center text-white">
                  <BookOpen size={44} className="opacity-80 mb-2" />
                  <span className="text-xs font-bold text-white/70">No Cover Media</span>
                </div>
              )}

              {/* Status Badge Tag on Top of Media */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-xs ${
                  course.isPublished ? 'bg-emerald-500/90 text-white' : 'bg-amber-500/90 text-white'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {course.isPublished ? 'PUBLISHED' : 'DRAFT'}
                </span>
                {course.isFeatured && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-600/90 text-white backdrop-blur-md">
                    <Sparkles size={10} /> FEATURED
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Course Main Information (Right) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider border ${getLevelStyle(course.level)}`}>
                {course.level?.toUpperCase() || 'BEGINNER'}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100">
                {course.category || 'Language'}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono text-gray-500 bg-gray-100 hover:bg-gray-200 transition cursor-pointer border border-gray-200"
                title="Click to copy Course ID"
              >
                {copiedId ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                <span>ID: {course._id}</span>
              </button>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
              {course.title}
            </h1>

            {/* Pricing & Duration Banner */}
            <div className="flex flex-wrap items-center gap-4 py-2 border-y border-gray-100">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Course Price</span>
                <span className="text-xl sm:text-2xl font-black text-blue-600 leading-tight">
                  {formatPrice(course.price)}
                </span>
              </div>
              <div className="h-8 w-px bg-gray-200 hidden sm:block" />
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Duration</span>
                <span className="text-sm sm:text-base font-extrabold text-gray-900 flex items-center gap-1">
                  <Clock size={14} className="text-blue-500" />
                  {course.duration || 4} Weeks
                </span>
              </div>
              <div className="h-8 w-px bg-gray-200 hidden sm:block" />
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Learners Enrolled</span>
                <span className="text-sm sm:text-base font-extrabold text-gray-900 flex items-center gap-1">
                  <Users size={14} className="text-purple-500" />
                  {studentCount.toLocaleString()} {studentCount === 1 ? 'Student' : 'Students'}
                </span>
              </div>
              <div className="h-8 w-px bg-gray-200 hidden sm:block" />
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Rating Score</span>
                <span className="text-sm sm:text-base font-extrabold text-gray-900 flex items-center gap-1">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  {course.averageRating ? Number(course.averageRating).toFixed(1) : '5.0'}
                  <span className="text-xs font-normal text-gray-400">
                    ({course.reviews?.length || 0})
                  </span>
                </span>
              </div>
            </div>

            {/* Instructor Mini Badge */}
            <div className="flex items-center gap-3 pt-1">
              <img
                src={instructorAvatar}
                alt={instructorName}
                className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-200 shadow-2xs"
              />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Instructor</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 truncate">{instructorName}</span>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {instructorRole}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Metrics Cards Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Enrollments */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Users size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-500 block">Total Students</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">
              {studentCount.toLocaleString()}
            </span>
            <span className="text-[11px] text-gray-400 font-medium block mt-0.5">
              {studentCount > 0 ? 'Active registered learners' : 'No students enrolled yet'}
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold text-purple-700 bg-purple-50 self-start border border-purple-100">
            Learners
          </span>
        </div>

        {/* Gross Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <DollarSign size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-500 block">Gross Revenue</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">
              LKR {grossRevenue.toLocaleString('en-LK')}
            </span>
            <span className="text-[11px] text-gray-400 font-medium block mt-0.5">
              Based on {studentCount} enrollments
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 self-start border border-emerald-100">
            Sales
          </span>
        </div>

        {/* Curriculum Scope */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Layers size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-500 block">Curriculum Scope</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">
              {totalWeeks} Weeks
            </span>
            <span className="text-[11px] text-gray-400 font-medium block mt-0.5">
              {totalLessons} lessons • {materials.length} resources
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold text-blue-700 bg-blue-50 self-start border border-blue-100">
            Structure
          </span>
        </div>

        {/* Average Rating */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Star size={20} className="fill-amber-500" />
            </div>
            <span className="text-xs font-semibold text-gray-500 block">Student Satisfaction</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block flex items-center gap-1.5">
              {course.averageRating ? Number(course.averageRating).toFixed(1) : '5.0'}
              <span className="text-xs font-bold text-gray-400">/ 5.0</span>
            </span>
            <span className="text-[11px] text-gray-400 font-medium block mt-0.5">
              {course.reviews?.length || 0} reviews received
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold text-amber-700 bg-amber-50 self-start border border-amber-100">
            Rating
          </span>
        </div>
      </div>

      {/* ── Tabs Navigation ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto">
        {[
          { id: 'overview',   label: 'Overview & Details',     icon: BookOpen },
          { id: 'curriculum', label: `Curriculum (${totalWeeks}W)`, icon: Layers },
          { id: 'instructor', label: 'Instructor Profile',     icon: User },
          { id: 'students',   label: `Enrolled Students (${studentCount})`, icon: Users },
          { id: 'reviews',    label: `Reviews (${course.reviews?.length || 0})`, icon: Star },
        ].map(tab => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <IconComponent size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left main content panel (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Description Card */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-gray-900 font-bold text-base">
                  <FileText size={18} className="text-blue-600" />
                  <h3>About This Course</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50/70 p-5 rounded-2xl border border-gray-100">
                  {course.description || 'No detailed description provided for this course.'}
                </p>
              </div>

              {/* Course Features Checklist */}
              {Array.isArray(course.features) && course.features.length > 0 && (
                <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 text-gray-900 font-bold text-base">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    <h3>What Students Will Learn & Course Features</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {course.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                        <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-xs font-semibold text-gray-800">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prerequisites & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <GraduationCap size={15} className="text-indigo-600" /> Prerequisites
                  </h4>
                  {Array.isArray(course.prerequisites) && course.prerequisites.length > 0 ? (
                    <ul className="space-y-1.5 text-xs text-gray-600">
                      {course.prerequisites.map((p, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No formal prerequisites specified.</p>
                  )}
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Tag size={15} className="text-blue-600" /> Course Tags
                  </h4>
                  {Array.isArray(course.tags) && course.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {course.tags.map((t, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg">
                          #{t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No tags specified.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CURRICULUM */}
          {activeTab === 'curriculum' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Course Curriculum</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {totalWeeks} Weeks • {totalLessons} Lessons total
                    </p>
                  </div>
                  <button
                    onClick={() => setShowResourceModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition cursor-pointer border border-blue-200"
                  >
                    <Plus size={14} /> Add Resource
                  </button>
                </div>

                {Array.isArray(course.curriculum) && course.curriculum.length > 0 ? (
                  <div className="space-y-4">
                    {course.curriculum.map((week, wIdx) => (
                      <div key={week._id || wIdx} className="bg-gray-50/70 border border-gray-200/80 rounded-2xl p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                              W{week.week || wIdx + 1}
                            </span>
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm">{week.title || `Week ${week.week || wIdx + 1}`}</h4>
                              {week.description && (
                                <p className="text-xs text-gray-500 mt-0.5">{week.description}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-gray-400 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                            {week.lessons?.length || 0} Lessons
                          </span>
                        </div>

                        {/* Lesson Items */}
                        {Array.isArray(week.lessons) && week.lessons.length > 0 && (
                          <div className="space-y-2 mt-3 pt-3 border-t border-gray-200">
                            {week.lessons.map((lesson, lIdx) => (
                              <div
                                key={lesson._id || lIdx}
                                className="bg-white rounded-xl p-3 px-4 border border-gray-100 flex items-center justify-between shadow-2xs text-xs"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                                    {lesson.type === 'video' ? <Video size={12} /> : <FileText size={12} />}
                                  </div>
                                  <span className="font-semibold text-gray-800">{lesson.title}</span>
                                  {lesson.isFreePreview && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                                      Preview
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-gray-400 font-mono text-[11px]">
                                  {lesson.duration && <span>{lesson.duration}m</span>}
                                  <span className="capitalize">{lesson.type || 'lesson'}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
                    <Layers size={32} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-gray-600">No curriculum modules defined yet.</p>
                    <button
                      onClick={() => onEdit && onEdit(course)}
                      className="mt-3 text-xs font-bold text-blue-600 hover:underline"
                    >
                      Open Edit Mode to Add Curriculum
                    </button>
                  </div>
                )}
              </div>

              {/* Uploaded Materials & Lectures list */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-gray-900 font-bold text-base">
                    <FileDown size={18} className="text-blue-600" />
                    <h3>Attached Course Materials ({materials.length})</h3>
                  </div>
                  <button
                    onClick={() => setShowResourceModal(true)}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    + Add New Material
                  </button>
                </div>

                {loadingMaterials ? (
                  <div className="flex items-center justify-center py-8 text-gray-400">
                    <Loader2 size={20} className="animate-spin mr-2" /> Loading materials…
                  </div>
                ) : materials.length > 0 ? (
                  <div className="space-y-2">
                    {materials.map(mat => (
                      <div
                        key={mat._id}
                        className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-blue-100/60 text-blue-700 flex items-center justify-center shrink-0">
                            {mat.type === 'video' ? <Video size={14} /> : <FileText size={14} />}
                          </div>
                          <div className="truncate">
                            <h5 className="font-bold text-gray-800 truncate">{mat.title}</h5>
                            <span className="text-[10px] text-gray-400 capitalize">{mat.type} • {mat.targetModule || 'General'}</span>
                          </div>
                        </div>
                        {mat.fileUrl && (
                          <a
                            href={mat.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shrink-0"
                          >
                            <ExternalLink size={12} /> View File
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic py-4">No separate downloadable resources uploaded yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: INSTRUCTOR PROFILE */}
          {activeTab === 'instructor' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-base border-b border-gray-100 pb-4">
                <User size={18} className="text-indigo-600" />
                <h3>Assigned Course Instructor</h3>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="relative shrink-0">
                  <img
                    src={instructorAvatar}
                    alt={instructorName}
                    className="w-28 h-28 rounded-3xl object-cover border-2 border-indigo-100 shadow-md bg-gray-50"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-1.5 rounded-xl shadow">
                    <ShieldCheck size={14} />
                  </div>
                </div>

                <div className="space-y-3 flex-1 min-w-0">
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900">{instructorName}</h2>
                    <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100 mt-1">
                      {instructorRole}
                    </span>
                  </div>

                  <div>
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Instructor Biography</h5>
                    <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      {instructorBio}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      onClick={() => onEdit && onEdit(course)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition border border-indigo-200"
                    >
                      <Edit3 size={13} /> Update Instructor Info
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ENROLLED STUDENTS */}
          {activeTab === 'students' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2 text-gray-900 font-bold text-base">
                  <Users size={18} className="text-purple-600" />
                  <h3>Enrolled Learners ({studentCount})</h3>
                </div>
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-xl">
                  {studentCount} Total
                </span>
              </div>

              {Array.isArray(course.enrolledStudents) && course.enrolledStudents.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {course.enrolledStudents.map((st, i) => {
                    const stName = typeof st === 'object' ? st.name : `Student ${i + 1}`;
                    const stAvatar = typeof st === 'object' && st.avatar
                      ? st.avatar
                      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(stName)}`;
                    return (
                      <div key={st._id || i} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={stAvatar}
                            alt={stName}
                            className="w-9 h-9 rounded-xl object-cover border border-gray-100 shrink-0"
                          />
                          <div>
                            <h5 className="font-bold text-gray-900 text-xs">{stName}</h5>
                            <span className="text-[10px] text-gray-400 font-mono">
                              ID: {st._id || st}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                          Active Enrolled
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Users size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold">No students have enrolled in this course yet.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2 text-gray-900 font-bold text-base">
                  <MessageSquare size={18} className="text-amber-500" />
                  <h3>Student Reviews ({course.reviews?.length || 0})</h3>
                </div>
                <div className="flex items-center gap-1 text-sm font-extrabold text-gray-900">
                  <Star size={16} className="fill-amber-400 text-amber-400" />
                  <span>{course.averageRating ? Number(course.averageRating).toFixed(1) : '5.0'}</span>
                </div>
              </div>

              {Array.isArray(course.reviews) && course.reviews.length > 0 ? (
                <div className="space-y-3">
                  {course.reviews.map((rev, idx) => (
                    <div key={rev._id || idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                            {rev.user?.name?.[0] || 'S'}
                          </div>
                          <div>
                            <h5 className="font-bold text-gray-800 text-xs">{rev.user?.name || 'Anonymous Student'}</h5>
                            <span className="text-[10px] text-gray-400">
                              {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Recent'}
                            </span>
                          </div>
                        </div>
                        <div className="flex text-amber-400">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star
                              key={s}
                              size={12}
                              className={s <= (rev.rating || 5) ? 'fill-current' : 'text-gray-200'}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Star size={32} className="mx-auto mb-2 opacity-50 text-amber-300" />
                  <p className="text-xs font-semibold">No student reviews posted yet.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right sidebar panel (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Management Card */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-4">
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
              Quick Management
            </h4>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => onEdit && onEdit(course)}
                className="w-full flex items-center justify-between p-3.5 bg-gray-50 hover:bg-blue-50 text-gray-800 hover:text-blue-700 rounded-2xl border border-gray-200/80 transition cursor-pointer text-xs font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <Edit3 size={15} />
                  <span>Edit Curriculum & Details</span>
                </div>
                <span>→</span>
              </button>

              <button
                type="button"
                onClick={handleToggle}
                disabled={isTogglingPublish}
                className="w-full flex items-center justify-between p-3.5 bg-gray-50 hover:bg-gray-100 text-gray-800 rounded-2xl border border-gray-200/80 transition cursor-pointer text-xs font-bold"
              >
                <div className="flex items-center gap-2.5">
                  {course.isPublished ? <EyeOff size={15} className="text-amber-500" /> : <Eye size={15} className="text-emerald-500" />}
                  <span>{course.isPublished ? 'Unpublish (Move to Draft)' : 'Publish Course Live'}</span>
                </div>
                <span>{isTogglingPublish ? '…' : '→'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowResourceModal(true)}
                className="w-full flex items-center justify-between p-3.5 bg-gray-50 hover:bg-purple-50 text-gray-800 hover:text-purple-700 rounded-2xl border border-gray-200/80 transition cursor-pointer text-xs font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <Plus size={15} />
                  <span>Upload Materials & PDFs</span>
                </div>
                <span>→</span>
              </button>

              <button
                type="button"
                onClick={() => window.open(`/courses/${course._id}`, '_blank')}
                className="w-full flex items-center justify-between p-3.5 bg-gray-50 hover:bg-blue-50 text-gray-800 hover:text-blue-700 rounded-2xl border border-gray-200/80 transition cursor-pointer text-xs font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <ExternalLink size={15} />
                  <span>Open Public Course Page</span>
                </div>
                <span>↗</span>
              </button>

              <button
                type="button"
                onClick={() => window.open(`/courses/${course._id}/learn`, '_blank')}
                className="w-full flex items-center justify-between p-3.5 bg-gray-50 hover:bg-emerald-50 text-gray-800 hover:text-emerald-700 rounded-2xl border border-gray-200/80 transition cursor-pointer text-xs font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <GraduationCap size={15} />
                  <span>Preview Student Classroom</span>
                </div>
                <span>↗</span>
              </button>
            </div>
          </div>

          {/* Course Metadata Card */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-3 text-xs">
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-2">
              Course Information
            </h4>

            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Course ID:</span>
              <span className="font-mono text-gray-800 font-bold truncate max-w-[150px]">{course._id}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Category:</span>
              <span className="font-bold text-gray-800">{course.category || 'Language'}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Difficulty:</span>
              <span className="font-bold uppercase text-gray-800">{course.level || 'Beginner'}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Pricing:</span>
              <span className="font-bold text-gray-800">{formatPrice(course.price)}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Created:</span>
              <span className="font-bold text-gray-800">
                {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-gray-500">Last Updated:</span>
              <span className="font-bold text-gray-800">
                {course.updatedAt ? new Date(course.updatedAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Course Resource Modal for Materials Upload ─────────────────────── */}
      {showResourceModal && (
        <CourseResourceModal
          isOpen={showResourceModal}
          onClose={() => setShowResourceModal(false)}
          courseId={course._id}
          courseTitle={course.title}
          targetModule="Week 1"
          modules={Array.isArray(course.curriculum) ? course.curriculum.map((w, idx) => `Week ${w.week || idx + 1}: ${w.title || ''}`) : ['Week 1']}
          onUploadSuccess={() => {
            fetchMaterials();
            toast.success('Course material added successfully!');
          }}
        />
      )}
    </div>
  );
}
