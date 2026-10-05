import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Megaphone, 
  Archive, 
  Pin, 
  SlidersHorizontal, 
  Download, 
  Lightbulb, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  Eye,
  X,
  CheckCircle,
  XCircle,
  RotateCw,
  Search,
  Filter,
  Calendar,
  AlertCircle
} from 'lucide-react';
import announcementService from '../services/announcementService';

const AUDIENCE_OPTIONS = [
  'All Scholars',
  'Staff Only',
  'Intermediate Students',
  'students',
  'instructors',
  'admins',
  'all'
];

const TYPE_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'course', label: 'Course' },
  { value: 'system', label: 'System' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'event', label: 'Event' },
  { value: 'academic', label: 'Academic' }
];

const getAudienceBadgeClass = (aud) => {
  const normalized = (aud || '').toLowerCase();
  if (normalized.includes('staff')) return 'bg-gray-100 text-gray-700 border-gray-200';
  if (normalized.includes('intermediate')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (normalized.includes('instructor')) return 'bg-amber-100 text-amber-700 border-amber-200';
  if (normalized.includes('admin')) return 'bg-rose-100 text-rose-700 border-rose-200';
  return 'bg-indigo-100 text-indigo-700 border-indigo-200';
};

const getTypeBadgeClass = (type) => {
  const norm = (type || 'general').toLowerCase();
  switch (norm) {
    case 'maintenance':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'system':
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    case 'course':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'event':
      return 'bg-purple-50 text-purple-700 border border-purple-200';
    case 'academic':
      return 'bg-cyan-50 text-cyan-700 border border-cyan-200';
    default:
      return 'bg-blue-50 text-blue-700 border border-blue-200';
  }
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'Recently';
  const now = new Date();
  const past = new Date(dateStr);
  const diffSecs = Math.floor((now - past) / 1000);

  if (diffSecs < 60) return 'Just now';
  if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
  if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
  if (diffSecs < 604800) return `${Math.floor(diffSecs / 86400)}d ago`;
  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const AnnouncementsManager = () => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    pinned: 0
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 10
  });

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAudience, setFilterAudience] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form state
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState('All Scholars');
  const [type, setType] = useState('general');
  const [priority, setPriority] = useState('medium');
  const [pinToTop, setPinToTop] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [tags, setTags] = useState('');

  // Modals
  const [viewingItem, setViewingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Load stats
  const fetchStats = async () => {
    try {
      const res = await announcementService.getAnnouncementStats();
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Load announcements
  const fetchAnnouncements = async (page = pagination.current) => {
    try {
      setLoading(true);
      const filters = {};
      if (searchQuery.trim()) filters.search = searchQuery.trim();
      if (filterAudience !== 'all') filters.targetAudience = filterAudience;
      if (filterType !== 'all') filters.type = filterType;
      if (filterStatus === 'active') filters.isActive = 'true';
      if (filterStatus === 'inactive') filters.isActive = 'false';

      const res = await announcementService.getAllAnnouncements(page, pagination.limit, filters);
      if (res.success) {
        setAnnouncements(res.announcements || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else {
        toast.error(res.message || 'Failed to fetch announcements');
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
      toast.error('Failed to load announcements from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchAnnouncements(1);
  }, [filterAudience, filterType, filterStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAnnouncements(1);
  };

  const handleResetForm = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setAudience('All Scholars');
    setType('general');
    setPriority('medium');
    setPinToTop(false);
    setIsActive(true);
    setTags('');
  };

  const handleStartEdit = (item) => {
    setEditingId(item._id);
    setTitle(item.title || '');
    setContent(item.content || '');
    setAudience(item.targetAudience || 'All Scholars');
    setType(item.type || 'general');
    setPriority((item.priority || 'medium').toLowerCase());
    setPinToTop(!!item.isPinned);
    setIsActive(item.isActive !== undefined ? item.isActive : true);
    setTags(Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''));

    // Smooth scroll to top of compose form on mobile
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter an announcement title');
      return;
    }
    if (!content.trim()) {
      toast.error('Please enter announcement content');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        content: content.trim(),
        targetAudience: audience.trim(),
        type: type.toLowerCase(),
        priority: priority.toLowerCase(),
        isPinned: pinToTop,
        isActive: isActive,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean)
      };

      if (editingId) {
        const res = await announcementService.updateAnnouncement(editingId, payload);
        if (res.success) {
          toast.success('Announcement updated successfully!');
          handleResetForm();
          fetchAnnouncements(pagination.current);
          fetchStats();
        } else {
          toast.error(res.message || 'Failed to update announcement');
        }
      } else {
        const res = await announcementService.createAnnouncement(payload);
        if (res.success) {
          toast.success('Announcement published successfully to database!');
          handleResetForm();
          fetchAnnouncements(1);
          fetchStats();
        } else {
          toast.error(res.message || 'Failed to create announcement');
        }
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(err.response?.data?.message || 'Error saving announcement to database');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      const res = await announcementService.deleteAnnouncement(itemToDelete._id);
      if (res.success) {
        toast.success('Announcement deleted successfully');
        setItemToDelete(null);
        fetchAnnouncements(pagination.current);
        fetchStats();
      } else {
        toast.error(res.message || 'Failed to delete announcement');
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Error deleting announcement');
    }
  };

  const handleTogglePin = async (id, e) => {
    e?.stopPropagation();
    try {
      const res = await announcementService.togglePinAnnouncement(id);
      if (res.success) {
        toast.success(res.message || 'Pin status updated');
        setAnnouncements(prev => prev.map(a => a._id === id ? { ...a, isPinned: res.isPinned } : a));
        fetchStats();
      } else {
        toast.error(res.message || 'Failed to toggle pin');
      }
    } catch (err) {
      console.error('Toggle pin error:', err);
      toast.error('Failed to toggle pin status');
    }
  };

  const handleToggleActive = async (id, e) => {
    e?.stopPropagation();
    try {
      const res = await announcementService.toggleActiveAnnouncement(id);
      if (res.success) {
        toast.success(res.message || 'Status updated');
        setAnnouncements(prev => prev.map(a => a._id === id ? { ...a, isActive: res.isActive } : a));
        fetchStats();
      } else {
        toast.error(res.message || 'Failed to toggle active status');
      }
    } catch (err) {
      console.error('Toggle active error:', err);
      toast.error('Failed to toggle active status');
    }
  };

  const handleExportCSV = () => {
    if (!announcements.length) {
      toast.error('No announcements to export');
      return;
    }
    const headers = ['Title', 'Type', 'Audience', 'Priority', 'Status', 'Pinned', 'Created Date'];
    const rows = announcements.map(a => [
      `"${(a.title || '').replace(/"/g, '""')}"`,
      a.type || 'general',
      `"${a.targetAudience || 'all'}"`,
      a.priority || 'medium',
      a.isActive ? 'Active' : 'Inactive',
      a.isPinned ? 'Yes' : 'No',
      new Date(a.createdAt).toLocaleString()
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `announcements_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Announcements exported to CSV');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Megaphone size={22} />
            </span>
            Announcement Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Broadcast updates, system alerts, and scholarly news stored directly in the database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => { fetchStats(); fetchAnnouncements(pagination.current); }}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Refresh database records"
          >
            <RotateCw size={14} className={loading ? 'animate-spin text-blue-600' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button 
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Export CSV"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export</span>
          </button>
          
          <button 
            onClick={() => { handleResetForm(); window.scrollTo({ top: 100, behavior: 'smooth' }); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Create New</span>
          </button>
        </div>
      </div>

      {/* Top Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Active Announcements */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-500 block">Active Announcements</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">
              {stats.active.toString().padStart(2, '0')}
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start">
            Live
          </span>
        </div>

        {/* Pinned Items */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Pin size={20} className="fill-purple-600/30" />
            </div>
            <span className="text-xs font-semibold text-gray-500 block">Pinned Items</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">
              {stats.pinned.toString().padStart(2, '0')}
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 self-start">
            Pinned
          </span>
        </div>

        {/* Total & Reach Analytics */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">Total In Database</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-semibold">
                MongoDB
              </span>
            </div>
            <div className="text-2xl font-black mt-1">
              {stats.total.toString().padStart(2, '0')} <span className="text-xs font-normal text-blue-100">Broadcasts</span>
            </div>
            <p className="text-xs text-blue-100 mt-1">
              Broadcasted across all scholar and instructor portals.
            </p>
          </div>

          <div className="mt-3">
            <div className="w-full bg-blue-900/50 h-2 rounded-full overflow-hidden mb-1.5">
              <div 
                className="bg-white h-full rounded-full transition-all duration-500" 
                style={{ width: stats.total ? `${Math.min(100, Math.round((stats.active / stats.total) * 100))}%` : '0%' }} 
              />
            </div>
            <div className="text-[11px] font-semibold text-right text-blue-100">
              {stats.total ? Math.round((stats.active / stats.total) * 100) : 0}% Active Rate
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Quick Compose / Edit Form */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs space-y-4 sticky top-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 font-bold text-sm text-gray-900">
              {editingId ? (
                <>
                  <Edit3 size={16} className="text-indigo-600" />
                  <span>Edit Announcement</span>
                </>
              ) : (
                <>
                  <SlidersHorizontal size={16} className="text-blue-600" />
                  <span>Quick Compose</span>
                </>
              )}
            </div>

            {editingId && (
              <button
                type="button"
                onClick={handleResetForm}
                className="text-xs text-gray-500 hover:text-gray-700 font-semibold px-2 py-1 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Announcement Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="E.g. Fall 2024 Enrollment Open"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50/60 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Category Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50/60 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
                >
                  {TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Audience
                </label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50/60 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
                >
                  {AUDIENCE_OPTIONS.map(aud => (
                    <option key={aud} value={aud}>{aud}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority & Pin Toggle Row */}
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Priority
                </label>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  {['low', 'medium', 'high'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-1 text-[11px] font-bold capitalize rounded-lg transition-all cursor-pointer ${
                        priority === p ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Pin To Top
                </label>
                <button
                  type="button"
                  onClick={() => setPinToTop(!pinToTop)}
                  className={`w-12 h-6.5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    pinToTop ? 'bg-purple-600 justify-end' : 'bg-gray-300 justify-start'
                  }`}
                >
                  <span className="w-4.5 h-4.5 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            </div>

            {editingId && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <span className="text-xs font-bold text-gray-800 block">Status: {isActive ? 'Active' : 'Inactive'}</span>
                  <span className="text-[11px] text-gray-400">Controls visibility for scholars</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`w-12 h-6.5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    isActive ? 'bg-emerald-600 justify-end' : 'bg-gray-300 justify-start'
                  }`}
                >
                  <span className="w-4.5 h-4.5 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Message Content <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Draft detailed announcement message here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50/60 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all resize-y"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Tags (Comma Separated)
              </label>
              <input
                type="text"
                placeholder="e.g. news, korean, admissions"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50/60 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RotateCw size={15} className="animate-spin" />
                  <span>Saving to Database...</span>
                </>
              ) : editingId ? (
                <>
                  <Edit3 size={15} />
                  <span>Update Announcement</span>
                </>
              ) : (
                <>
                  <Megaphone size={15} />
                  <span>Publish Announcement</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Recent Announcements Table & Search/Filter */}
        <div className="lg:col-span-8 space-y-6">
          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search announcements by title or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); fetchAnnouncements(1); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </form>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={filterAudience}
                onChange={(e) => setFilterAudience(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="all">All Audiences</option>
                {AUDIENCE_OPTIONS.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Announcements Table */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-gray-900">Database Announcements</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">
                  {pagination.total} Total
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchAnnouncements(pagination.current)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
                  title="Reload list"
                >
                  <RotateCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto min-h-[300px]">
              {loading ? (
                <div className="py-16 text-center">
                  <RotateCw size={28} className="animate-spin text-blue-600 mx-auto mb-3" />
                  <p className="text-xs text-gray-500 font-medium">Fetching announcements from database...</p>
                </div>
              ) : announcements.length === 0 ? (
                <div className="py-16 text-center px-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                    <Megaphone size={26} />
                  </div>
                  <h4 className="text-sm font-bold text-gray-800">No announcements found</h4>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    There are no announcements matching your current filters. Create a new broadcast on the left to get started!
                  </p>
                  {(searchQuery || filterAudience !== 'all' || filterStatus !== 'all') && (
                    <button
                      onClick={() => { setSearchQuery(''); setFilterAudience('all'); setFilterStatus('all'); }}
                      className="mt-3 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-gray-50/80 text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <tr>
                      <th className="px-5 py-3.5">Announcement</th>
                      <th className="px-4 py-3.5">Audience</th>
                      <th className="px-4 py-3.5">Type & Priority</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {announcements.map((item) => {
                      const isPin = !!item.isPinned;
                      const isAct = item.isActive !== undefined ? item.isActive : true;

                      return (
                        <tr key={item._id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-5 py-4 max-w-xs">
                            <div className="flex items-start gap-3">
                              <button
                                onClick={(e) => handleTogglePin(item._id, e)}
                                title={isPin ? 'Unpin from top' : 'Pin to top'}
                                className="shrink-0 mt-0.5 text-gray-300 hover:text-purple-600 transition-colors cursor-pointer"
                              >
                                <Pin 
                                  size={16} 
                                  className={isPin ? 'text-purple-600 fill-purple-600' : 'hover:scale-110'} 
                                />
                              </button>
                              <div className="min-w-0">
                                <h4 
                                  onClick={() => setViewingItem(item)}
                                  className="font-bold text-gray-900 text-xs sm:text-sm leading-snug truncate hover:text-blue-600 cursor-pointer"
                                  title={item.title}
                                >
                                  {item.title}
                                </h4>
                                <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                                  {item.content}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                                  <span>{formatTimeAgo(item.createdAt)}</span>
                                  {item.createdBy?.name && (
                                    <>
                                      <span>•</span>
                                      <span>By {item.createdBy.name}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold border ${getAudienceBadgeClass(item.targetAudience)}`}>
                              {item.targetAudience || 'All Scholars'}
                            </span>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1 items-start">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${getTypeBadgeClass(item.type)}`}>
                                {item.type || 'general'}
                              </span>
                              <span className={`text-[10px] font-semibold capitalize ${
                                item.priority === 'urgent' ? 'text-rose-600' :
                                item.priority === 'high' ? 'text-amber-600' :
                                'text-gray-500'
                              }`}>
                                {item.priority || 'medium'} priority
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">
                            <button
                              onClick={(e) => handleToggleActive(item._id, e)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer group"
                              title="Click to toggle status"
                            >
                              <span className={`w-2 h-2 rounded-full ${
                                isAct ? 'bg-emerald-500 shadow-xs' : 'bg-gray-400'
                              }`} />
                              <span className={isAct ? 'text-emerald-700' : 'text-gray-500'}>
                                {isAct ? 'Active' : 'Inactive'}
                              </span>
                            </button>
                          </td>

                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Preview Eye */}
                              <button
                                onClick={() => setViewingItem(item)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="View Details"
                              >
                                <Eye size={15} />
                              </button>

                              {/* Edit Button */}
                              <button
                                onClick={() => handleStartEdit(item)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                title="Edit Announcement"
                              >
                                <Edit3 size={15} />
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => setItemToDelete(item)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete Announcement"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Footer */}
            {pagination.total > 0 && (
              <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
                <span>
                  Showing {((pagination.current - 1) * pagination.limit) + 1} - {Math.min(pagination.current * pagination.limit, pagination.total)} of {pagination.total} announcements
                </span>

                <div className="flex items-center gap-1">
                  <button 
                    disabled={pagination.current <= 1}
                    onClick={() => fetchAnnouncements(pagination.current - 1)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((pg) => {
                    // Only show first, last, and around current
                    if (pg === 1 || pg === pagination.pages || Math.abs(pg - pagination.current) <= 1) {
                      return (
                        <button
                          key={pg}
                          onClick={() => fetchAnnouncements(pg)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            pagination.current === pg 
                              ? 'bg-blue-600 text-white shadow-xs' 
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          {pg}
                        </button>
                      );
                    }
                    if (pg === 2 && pagination.current > 3) return <span key={pg} className="px-1 text-gray-400">...</span>;
                    if (pg === pagination.pages - 1 && pagination.current < pagination.pages - 2) return <span key={pg} className="px-1 text-gray-400">...</span>;
                    return null;
                  })}

                  <button 
                    disabled={pagination.current >= pagination.pages}
                    onClick={() => fetchAnnouncements(pagination.current + 1)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pro Tip Card */}
          <div className="bg-white rounded-2xl p-6 border-2 border-blue-600/30 shadow-xs flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Lightbulb size={24} />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base text-gray-900">
                Pro Tip: Targeted Delivery
              </h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Pinning high-priority broadcasts ensures scholars see important schedule changes at the top of their feed. Use audience segments to prevent notification fatigue.
              </p>
              <div className="mt-2 text-xs font-bold text-blue-600 inline-flex items-center gap-1">
                <span>Database Sync: Real-time Mongoose Collections</span>
                <ArrowRight size={13} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details View Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 relative">
            <button
              onClick={() => setViewingItem(null)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getTypeBadgeClass(viewingItem.type)}`}>
                {viewingItem.type || 'general'}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getAudienceBadgeClass(viewingItem.targetAudience)}`}>
                {viewingItem.targetAudience || 'All Scholars'}
              </span>
              {viewingItem.isPinned && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 flex items-center gap-1">
                  <Pin size={11} className="fill-purple-700" />
                  Pinned
                </span>
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900">{viewingItem.title}</h3>
              <p className="text-xs text-gray-400 mt-1">
                Created: {new Date(viewingItem.createdAt).toLocaleString()}
                {viewingItem.createdBy?.name && ` • By ${viewingItem.createdBy.name}`}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl text-xs sm:text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
              {viewingItem.content}
            </div>

            {viewingItem.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {viewingItem.tags.map((t, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-[10px] font-medium">
                    #{t}
                  </span>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  const itm = viewingItem;
                  setViewingItem(null);
                  handleStartEdit(itm);
                }}
                className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl cursor-pointer"
              >
                Edit
              </button>
              <button
                onClick={() => setViewingItem(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle size={26} />
            </div>

            <h3 className="text-base font-bold text-gray-900">Delete Announcement?</h3>
            <p className="text-xs text-gray-500">
              Are you sure you want to permanently remove <span className="font-semibold text-gray-800">"{itemToDelete.title}"</span>? This action cannot be undone.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsManager;
