import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Users,
  FileEdit,
  Plus,
  ArrowUpDown,
  FileText,
  Edit3,
  EyeOff,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ExternalLink,
  Star,
  User,
  Clock,
} from 'lucide-react';
import courseService from '../services/courseService';
import CreateCourseView from './components/CreateCourseView';
import EditCourseView from './components/EditCourseView';

/* ─────────────────────────── helpers ─────────────────────────── */
const LEVEL_STYLES = {
  beginner:     'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-indigo-100  text-indigo-700',
  advanced:     'bg-purple-100  text-purple-700',
};

const getLevelStyle = (level = '') => LEVEL_STYLES[level.toLowerCase()] ?? 'bg-gray-100 text-gray-600';

const formatPrice = (price) => {
  if (price === 0 || price === '0') return 'Free';
  return `LKR ${Number(price).toLocaleString('en-LK')}`;
};

const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'Language',
  level: 'beginner',
  duration: 4,
  price: '',
  isPublished: false,
  tags: '',
  thumbnail: '',
};

const CATEGORIES = ['All Categories', 'Literature', 'Business', 'Language', 'Culture', 'Grammar', 'Conversation', 'Other'];
const LEVELS     = ['All Levels', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const STATUSES   = ['Status', 'PUBLISHED', 'DRAFT'];

/* ─────────────────────────── Toast ─────────────────────────── */
const Toast = ({ toasts, remove }) => (
  <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
    {toasts.map(t => (
      <div
        key={t.id}
        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white pointer-events-auto transition-all
          ${t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-red-500' : 'bg-blue-600'}`}
      >
        {t.type === 'success' && <CheckCircle size={15} />}
        {t.type === 'error'   && <AlertCircle size={15} />}
        <span>{t.message}</span>
        <button onClick={() => remove(t.id)} className="ml-1 opacity-70 hover:opacity-100"><X size={13} /></button>
      </div>
    ))}
  </div>
);

/* ─────────────────────────── DeleteModal ─────────────────────────── */
const DeleteModal = ({ course, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
          <Trash2 size={18} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-base">Delete Course</h3>
          <p className="text-xs text-gray-500 mt-0.5">This action cannot be undone.</p>
        </div>
      </div>
      <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 mb-5 border border-gray-100">
        Are you sure you want to delete <span className="font-bold text-gray-900">"{course?.title}"</span>?
      </p>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-60 transition-colors"
        >
          {loading && <Loader2 size={13} className="animate-spin" />}
          Delete Course
        </button>
      </div>
    </div>
  </div>
);

/* ─────────────────────────── CourseDetailsModal ─────────────────────────── */
const CourseDetailsModal = ({ course, onClose, onEdit, onTogglePublish, isPublishing }) => {
  if (!course) return null;

  const studentCount = Array.isArray(course.enrolledStudents)
    ? course.enrolledStudents.length
    : (typeof course.enrolledCount === 'number'
        ? course.enrolledCount
        : (typeof course.buyersCount === 'number' ? course.buyersCount : 0));

  const instructorName = course.instructorName || course.instructor?.name || 'SRI-KO Instructor';
  const instructorAvatar = course.instructorImage || course.instructor?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(instructorName)}`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-lg leading-tight">Course Details</h3>
              <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {course._id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          {/* Top Banner & Info */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {course.thumbnail ? (
              <div className="w-full sm:w-44 h-28 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100 shadow-xs">
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-full sm:w-44 h-28 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <BookOpen size={36} className="opacity-80" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider ${getLevelStyle(course.level)}`}>
                  {course.level?.toUpperCase() || 'BEGINNER'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700">
                  {course.category || 'Language'}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  course.isPublished ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${course.isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {course.isPublished ? 'PUBLISHED' : 'DRAFT'}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 leading-snug">{course.title}</h2>
              <p className="text-lg font-black text-blue-600 mt-1">{formatPrice(course.price)}</p>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Duration</span>
              <span className="text-sm font-bold text-gray-900 mt-0.5 block">{course.duration || 4} Weeks</span>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Enrolled</span>
              <span className="text-sm font-bold text-gray-900 mt-0.5 block">{studentCount} Students</span>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Average Rating</span>
              <span className="text-sm font-bold text-gray-900 mt-0.5 block flex items-center gap-1">
                <Star size={13} className="fill-amber-400 text-amber-400" />
                {course.averageRating ? Number(course.averageRating).toFixed(1) : '5.0'}
              </span>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Curriculum</span>
              <span className="text-sm font-bold text-gray-900 mt-0.5 block">
                {Array.isArray(course.curriculum) ? course.curriculum.length : 0} Modules
              </span>
            </div>
          </div>

          {/* Instructor Profile Card */}
          <div className="bg-gradient-to-br from-indigo-50/50 to-blue-50/30 rounded-2xl p-4 border border-indigo-100/60 flex items-start gap-3.5">
            <img
              src={instructorAvatar}
              alt={instructorName}
              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white shadow-xs"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-gray-900 text-sm">{instructorName}</h4>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded-md">
                  {course.instructorRole || 'Lead Instructor'}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {course.instructorBio || course.instructor?.bio || 'Certified Korean language expert dedicated to student fluency and success.'}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Description</h4>
            <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/80 p-4 rounded-2xl border border-gray-100 whitespace-pre-line">
              {course.description || 'No description provided.'}
            </p>
          </div>

          {/* Tags */}
          {Array.isArray(course.tags) && course.tags.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Tags</h4>
              <div className="flex flex-wrap gap-1.5">
                {course.tags.map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3 mt-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTogglePublish(course)}
              disabled={isPublishing}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 ${
                course.isPublished
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
              }`}
            >
              {isPublishing ? (
                <Loader2 size={13} className="animate-spin" />
              ) : course.isPublished ? (
                <EyeOff size={13} />
              ) : (
                <Eye size={13} />
              )}
              <span>{course.isPublished ? 'Unpublish Course' : 'Publish Course'}</span>
            </button>
            <button
              onClick={() => window.open(`/courses/${course._id}`, '_blank')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <ExternalLink size={13} />
              <span>Public Page</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(course)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Edit3 size={13} />
              <span>Edit Course</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────── CourseModal ─────────────────────────── */
const CourseModal = ({ mode, course, onSubmit, onClose, loading }) => {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (mode === 'edit' && course) {
      setForm({
        title:       course.title       || '',
        description: course.description || '',
        category:    course.category    || 'Language',
        level:       course.level       || 'beginner',
        duration:    course.duration    || 4,
        price:       course.price       ?? '',
        isPublished: course.isPublished ?? false,
        tags:        Array.isArray(course.tags) ? course.tags.join(', ') : '',
        thumbnail:   course.thumbnail   || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [mode, course]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price:    Number(form.price),
      duration: Number(form.duration),
      tags:     form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    };
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen size={15} />
            </div>
            <h3 className="font-bold text-gray-900 text-base">
              {mode === 'add' ? 'Add New Course' : 'Edit Course'}
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              minLength={3}
              placeholder="e.g. Advanced Korean Poetry"
              value={form.title}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              required
              minLength={10}
              rows={3}
              placeholder="Describe what students will learn in this course..."
              value={form.description}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 resize-none"
            />
          </div>

          {/* Category + Level */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-500"
              >
                {['Literature', 'Business', 'Language', 'Culture', 'Grammar', 'Conversation', 'Other'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Level</label>
              <select
                name="level"
                value={form.level}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="beginner">BEGINNER</option>
                <option value="intermediate">INTERMEDIATE</option>
                <option value="advanced">ADVANCED</option>
              </select>
            </div>
          </div>

          {/* Price + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Price (LKR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                required
                min="0"
                step="0.01"
                placeholder="15000"
                value={form.price}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Duration (weeks)
              </label>
              <input
                type="number"
                name="duration"
                min="1"
                max="52"
                value={form.duration}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              placeholder="e.g. korean, beginner, language"
              value={form.tags}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
            />
          </div>

          {/* Published toggle */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isPublished"
                checked={form.isPublished}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-300 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 transition-colors" />
              <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full shadow peer-checked:translate-x-5 transition-transform" />
            </label>
            <div>
              <span className="text-xs font-bold text-gray-700">
                {form.isPublished ? 'Published' : 'Draft'}
              </span>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {form.isPublished ? 'Course is visible to students' : 'Course is hidden from students'}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-60 transition-colors"
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              {mode === 'add' ? 'Create Course' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─────────────────────────── Main Component ─────────────────────────── */
const CourseManagement = () => {
  // ── State ──────────────────────────────────────────────────────────
  const [viewMode, setViewMode]             = useState('list'); // 'list' | 'create' | 'edit'
  const [courses, setCourses]               = useState([]);
  const [stats, setStats]                   = useState({ total: 0, totalPublished: 0, totalDraft: 0, totalStudents: 0 });
  const [loading, setLoading]               = useState(true);
  const [actionLoading, setActionLoading]   = useState(false);
  const [error, setError]                   = useState(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedLevel,    setSelectedLevel]    = useState('All Levels');
  const [selectedStatus,   setSelectedStatus]   = useState('Status');
  const [search,           setSearch]           = useState('');
  const [sortOrder,        setSortOrder]        = useState('most-enrolled');

  // Pagination
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const LIMIT = 10;

  // Modals
  const [modal,               setModal]               = useState(null);
  const [editingCourse,       setEditingCourse]       = useState(null);
  const [deleteTarget,        setDeleteTarget]        = useState(null);
  const [viewingCourse,       setViewingCourse]       = useState(null);
  const [togglePublishingId,  setTogglePublishingId]  = useState(null);

  // Toasts
  const [toasts, setToasts] = useState([]);

  // ── Helpers ────────────────────────────────────────────────────────
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // ── Fetch ──────────────────────────────────────────────────────────
  const fetchCourses = useCallback(async (currentPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const data = await courseService.getAdminCourses({
        page:     currentPage,
        limit:    LIMIT,
        category: selectedCategory,
        level:    selectedLevel,
        status:   selectedStatus,
        search,
        sort:     sortOrder,
      });
      setCourses(data.courses || []);
      setTotal(data.total || 0);
      setTotalPages(data.pages || 1);
      setStats({
        total:                   data.total                  || 0,
        totalPublished:          data.totalPublished         || 0,
        totalDraft:              data.totalDraft             || 0,
        totalStudents:           data.totalStudents          || 0,
        uniqueEnrolledStudents:  data.uniqueEnrolledStudents || 0,
        totalRegisteredStudents: data.totalRegisteredStudents || 0,
      });
    } catch (err) {
      console.error('Fetch courses error:', err);
      setError(err?.response?.data?.message || 'Failed to load courses. Please check your connection and login status.');
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory, selectedLevel, selectedStatus, search, sortOrder]);

  useEffect(() => { setPage(1); }, [selectedCategory, selectedLevel, selectedStatus, search, sortOrder]);

  useEffect(() => {
    fetchCourses(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedCategory, selectedLevel, selectedStatus, search, sortOrder]);

  // ── CRUD Handlers ──────────────────────────────────────────────────
  const handleCreate = async (formData) => {
    setActionLoading(true);
    try {
      await courseService.createCourse(formData);
      addToast('Course created successfully!');
      setModal(null);
      setPage(1);
      fetchCourses(1);
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to create course.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (formData) => {
    setActionLoading(true);
    try {
      await courseService.updateCourse(editingCourse._id, formData);
      addToast('Course updated successfully!');
      setModal(null);
      setEditingCourse(null);
      fetchCourses(page);
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to update course.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await courseService.deleteCourse(deleteTarget._id);
      addToast('Course deleted successfully!');
      setDeleteTarget(null);
      const newPage = courses.length === 1 && page > 1 ? page - 1 : page;
      setPage(newPage);
      fetchCourses(newPage);
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to delete course.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePublish = async (course) => {
    setTogglePublishingId(course._id);
    try {
      const res = await courseService.togglePublish(course._id);
      const newPublished = res.isPublished;
      setCourses(prev => prev.map(c => c._id === course._id ? { ...c, isPublished: newPublished } : c));
      setViewingCourse(prev => prev && prev._id === course._id ? { ...prev, isPublished: newPublished } : prev);
      setStats(prev => ({
        ...prev,
        totalPublished: newPublished ? prev.totalPublished + 1 : Math.max(0, prev.totalPublished - 1),
        totalDraft:     newPublished ? Math.max(0, prev.totalDraft - 1) : prev.totalDraft + 1,
      }));
      addToast(`Course ${newPublished ? 'published' : 'unpublished (moved to draft)'} successfully!`);
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to toggle status.', 'error');
    } finally {
      setTogglePublishingId(null);
    }
  };

  const openEdit = (course) => { 
    setEditingCourse(course); 
    setViewMode('edit'); 
  };

  // ── Sorted courses ─────────────────────────────────────────────────
  const displayedCourses = [...courses].sort((a, b) => {
    if (sortOrder === 'most-enrolled') {
      const getCount = (c) => Array.isArray(c.enrolledStudents) ? c.enrolledStudents.length : (c.enrolledCount || c.buyersCount || 0);
      return getCount(b) - getCount(a);
    }
    if (sortOrder === 'newest')     return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortOrder === 'oldest')     return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortOrder === 'price-asc')  return a.price - b.price;
    if (sortOrder === 'price-desc') return b.price - a.price;
    return 0;
  });

  // ── Pagination pages helper ────────────────────────────────────────
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  // ── Sub-views for Create and Edit ────────────────────────────────────
  if (viewMode === 'create') {
    return (
      <div className="space-y-6">
        <Toast toasts={toasts} remove={removeToast} />
        <CreateCourseView 
          onBack={() => setViewMode('list')} 
          onSave={async (payload) => {
            await handleCreate(payload);
            setViewMode('list');
          }}
          loading={actionLoading} 
        />
      </div>
    );
  }

  if (viewMode === 'edit') {
    return (
      <div className="space-y-6">
        <Toast toasts={toasts} remove={removeToast} />
        <EditCourseView 
          course={editingCourse} 
          onBack={() => { setEditingCourse(null); setViewMode('list'); }} 
          onSave={async (payload) => {
            if (editingCourse?._id) {
              await handleUpdate(payload);
            } else {
              addToast('Course updated successfully!');
            }
            setViewMode('list');
          }}
          loading={actionLoading} 
        />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <Toast toasts={toasts} remove={removeToast} />

      {/* Modals */}
      {viewingCourse && (
        <CourseDetailsModal
          course={viewingCourse}
          onClose={() => setViewingCourse(null)}
          onEdit={(c) => { setViewingCourse(null); openEdit(c); }}
          onTogglePublish={handleTogglePublish}
          isPublishing={togglePublishingId === viewingCourse._id}
        />
      )}
      {(modal === 'add' || modal === 'edit') && (
        <CourseModal
          mode={modal}
          course={editingCourse}
          onSubmit={modal === 'add' ? handleCreate : handleUpdate}
          onClose={() => { setModal(null); setEditingCourse(null); }}
          loading={actionLoading}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          course={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={actionLoading}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Course Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Create, update, and manage your academic offerings. Monitor enrollment statuses and refine content for SRI-KO LMS students.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchCourses(page)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => { setEditingCourse(null); setViewMode('create'); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>Add New Course</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Interactive Filters) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <button
          type="button"
          onClick={() => setSelectedStatus('Status')}
          className={`bg-white p-5 rounded-2xl border text-left shadow-xs flex items-center justify-between transition-all cursor-pointer ${
            selectedStatus === 'Status' ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50/20' : 'border-gray-100 hover:border-gray-300'
          }`}
          title="Click to view all courses"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <BookOpen size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-500 block">Total Courses</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">
              {loading ? <span className="inline-block w-10 h-6 bg-gray-200 rounded animate-pulse" /> : stats.total}
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold text-blue-600 bg-blue-50 self-start">
            {loading ? '…' : `${stats.totalPublished} live`}
          </span>
        </button>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Users size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-500 block">Total Enrollments</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">
              {loading ? <span className="inline-block w-10 h-6 bg-gray-200 rounded animate-pulse" /> : stats.totalStudents.toLocaleString()}
            </span>
            <span className="text-[11px] text-gray-400 font-medium block mt-0.5">
              {stats.uniqueEnrolledStudents || 0} unique enrolled students
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold text-emerald-600 bg-emerald-50 self-start">Live</span>
        </div>

        <button
          type="button"
          onClick={() => setSelectedStatus('PUBLISHED')}
          className={`bg-white p-5 rounded-2xl border text-left shadow-xs flex items-center justify-between transition-all cursor-pointer ${
            selectedStatus === 'PUBLISHED' ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20' : 'border-gray-100 hover:border-gray-300'
          }`}
          title="Click to view published courses"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-500 block">Published</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">
              {loading ? <span className="inline-block w-10 h-6 bg-gray-200 rounded animate-pulse" /> : stats.totalPublished}
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold text-emerald-600 bg-emerald-50 self-start">Active</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('DRAFT')}
          className={`bg-white p-5 rounded-2xl border text-left shadow-xs flex items-center justify-between transition-all cursor-pointer ${
            selectedStatus === 'DRAFT' ? 'border-red-500 ring-2 ring-red-100 bg-red-50/20' : 'border-gray-100 hover:border-gray-300'
          }`}
          title="Click to view unpublished (draft) courses"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center mb-3">
              <FileEdit size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-500 block">Draft Courses</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">
              {loading ? <span className="inline-block w-10 h-6 bg-gray-200 rounded animate-pulse" /> : stats.totalDraft}
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold text-red-500 bg-red-50 self-start">Unpublished</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-100 border border-transparent rounded-xl text-xs font-medium text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-300"
          />
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-transparent rounded-xl text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select
            value={selectedLevel}
            onChange={e => setSelectedLevel(e.target.value)}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-transparent rounded-xl text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
          >
            {LEVELS.map(l => <option key={l}>{l}</option>)}
          </select>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-transparent rounded-xl text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
          >
            <option value="Status">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Unpublished (Draft)</option>
          </select>
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
            <ArrowUpDown size={12} />
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
              className="bg-transparent font-bold text-gray-900 focus:outline-none cursor-pointer text-xs"
            >
              <option value="most-enrolled">Most Enrolled</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-asc">Price ↑</option>
              <option value="price-desc">Price ↓</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {error && (
          <div className="flex items-center gap-3 px-6 py-4 bg-red-50 border-b border-red-100 text-red-700 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
            <button onClick={() => fetchCourses(page)} className="ml-auto text-xs font-bold underline">
              Retry
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50/80 text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Course Title</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Level</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Enrollment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-200" />
                        <div className="space-y-1.5">
                          <div className="h-3 w-40 bg-gray-200 rounded-full" />
                          <div className="h-2.5 w-24 bg-gray-100 rounded-full" />
                        </div>
                      </div>
                    </td>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-3 w-16 bg-gray-200 rounded-full" /></td>
                    ))}
                    <td className="px-6 py-4 text-right"><div className="h-3 w-20 bg-gray-200 rounded-full ml-auto" /></td>
                  </tr>
                ))
              ) : displayedCourses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <BookOpen size={24} className="text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-500">No courses found</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {search || selectedCategory !== 'All Categories' || selectedLevel !== 'All Levels' || selectedStatus !== 'Status'
                            ? 'Try clearing your filters.'
                            : 'Create your first course to get started.'}
                        </p>
                      </div>
                      <button
                        onClick={() => { setEditingCourse(null); setViewMode('create'); }}
                        className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
                      >
                        <Plus size={13} /> Add First Course
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedCourses.map((course) => (
                  <tr key={course._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        {course.thumbnail ? (
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                            <BookOpen size={17} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm leading-snug max-w-[200px] truncate" title={course.title}>
                            {course.title}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <img
                              src={course.instructorImage || course.instructor?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(course.instructorName || course.instructor?.name || 'Instructor')}`}
                              alt={course.instructorName || 'Instructor'}
                              className="w-3.5 h-3.5 rounded-full object-cover shrink-0 border border-gray-200"
                            />
                            <span className="text-[11px] text-gray-500 font-medium truncate max-w-[150px]">
                              {course.instructorName || course.instructor?.name || 'SRI-KO Instructor'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-700 text-xs">{course.category || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider ${getLevelStyle(course.level)}`}>
                        {course.level?.toUpperCase() || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-gray-900 text-sm">{formatPrice(course.price)}</td>
                    <td className="px-6 py-4">
                      {(() => {
                        const studentCount = Array.isArray(course.enrolledStudents)
                          ? course.enrolledStudents.length
                          : (typeof course.enrolledCount === 'number'
                              ? course.enrolledCount
                              : (typeof course.buyersCount === 'number' ? course.buyersCount : 0));

                        return (
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                studentCount > 0
                                  ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                  : 'bg-gray-100 text-gray-400'
                              }`}
                            >
                              <Users size={14} />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-gray-900 block leading-tight">
                                {studentCount.toLocaleString()}{' '}
                                <span className="font-medium text-gray-500">
                                  {studentCount === 1 ? 'student' : 'students'}
                                </span>
                              </span>
                              <span className="text-[10px] text-gray-400 block font-medium">
                                {studentCount > 0 ? 'Enrolled / Bought' : 'No buyers yet'}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(course)}
                        disabled={togglePublishingId === course._id}
                        title={course.isPublished ? 'Click to unpublish course (move to draft)' : 'Click to publish course'}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                          course.isPublished
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 shadow-2xs'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 shadow-2xs'
                        } ${togglePublishingId === course._id ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        {togglePublishingId === course._id ? (
                          <Loader2 size={12} className="animate-spin text-current" />
                        ) : (
                          <span className={`w-1.5 h-1.5 rounded-full ${course.isPublished ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                        )}
                        <span>{course.isPublished ? 'PUBLISHED' : 'DRAFT'}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingCourse(course)}
                          title="View Course Details"
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <FileText size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(course)}
                          title="Edit Course"
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(course)}
                          disabled={togglePublishingId === course._id}
                          title={course.isPublished ? 'Unpublish Course (move to draft)' : 'Publish Course'}
                          className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                            course.isPublished
                              ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                          } ${togglePublishingId === course._id ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                          {togglePublishingId === course._id ? (
                            <Loader2 size={15} className="animate-spin text-blue-600" />
                          ) : course.isPublished ? (
                            <EyeOff size={15} />
                          ) : (
                            <Eye size={15} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(course)}
                          title="Delete Course"
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium">
          <span>
            Showing {courses.length === 0 ? 0 : (page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} courses
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {getPageNumbers().map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-gray-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
                      page === p ? 'bg-blue-600 text-white font-bold' : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseManagement;
