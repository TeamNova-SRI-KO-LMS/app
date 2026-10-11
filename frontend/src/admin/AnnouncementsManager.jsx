import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { 
  Megaphone, 
  Archive, 
  Pin, 
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
  RotateCw,
  Search,
  AlertCircle,
  UploadCloud,
  Cloud,
  Copy,
  Maximize2,
  ExternalLink,
  RefreshCw,
  ImagePlus,
  FileImage
} from 'lucide-react';
import announcementService from '../services/announcementService';
import { uploadToSupabase } from '../services/uploadService';

const BACKEND_URL = 'http://localhost:5000';

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

  // Modal & Form state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState('All Scholars');
  const [type, setType] = useState('general');
  const [priority, setPriority] = useState('medium');
  const [pinToTop, setPinToTop] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [tags, setTags] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Automatic Supabase photo upload state (Strictly Supabase, no local fallback)
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);

  // Preview & Delete Modals
  const [viewingItem, setViewingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null);

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

  /* ── Automatic Supabase Photo Upload (Like courses management thumbnail) ── */
  const handlePhotoSelect = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WebP, GIF)');
      return;
    }

    const maxMB = 5;
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(`Image size cannot exceed ${maxMB} MB. Current: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
      return;
    }

    // Set preview immediately and start automatic Supabase upload
    const localPreview = URL.createObjectURL(file);
    setPhotoPreview(localPreview);
    setUploadingPhoto(true);

    try {
      // Exclusively upload to Supabase Storage - never saved locally
      const publicUrl = await uploadToSupabase(file, 'courses', 'announcements');
      setPhotoUrl(publicUrl);
      setPhotoPreview(publicUrl);
      setUploadingPhoto(false);
      toast.success('Image automatically uploaded to Supabase Storage!');
    } catch (err) {
      setUploadingPhoto(false);
      setPhotoPreview('');
      setPhotoUrl('');
      if (photoInputRef.current) photoInputRef.current.value = '';
      console.error('Supabase upload error:', err);
      toast.error(`Supabase upload failed: ${err.message || 'Error uploading image'}`);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    handlePhotoSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    handlePhotoSelect(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview('');
    setPhotoUrl('');
    if (photoInputRef.current) photoInputRef.current.value = '';
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
    setStartDate('');
    setEndDate('');
    setPhotoPreview('');
    setPhotoUrl('');
    setUploadingPhoto(false);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleOpenCreateModal = () => {
    handleResetForm();
    setShowFormModal(true);
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
    setStartDate(item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '');
    setEndDate(item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '');

    const existingPhoto = item.photo || item.thumbnail || '';
    setPhotoUrl(existingPhoto);
    setPhotoPreview(existingPhoto);
    setUploadingPhoto(false);
    setShowFormModal(true);
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

    if (uploadingPhoto) {
      toast.error('Please wait for the image to finish uploading to Supabase');
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
        startDate: startDate || new Date().toISOString(),
        endDate: endDate || undefined,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        thumbnail: photoUrl || '',
        photo: photoUrl || ''
      };

      if (editingId) {
        const res = await announcementService.updateAnnouncement(editingId, payload);
        if (res.success) {
          toast.success('Announcement updated successfully!');
          handleResetForm();
          setShowFormModal(false);
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
          setShowFormModal(false);
          fetchAnnouncements(1);
          fetchStats();
        } else {
          toast.error(res.message || 'Failed to create announcement');
        }
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(err.response?.data?.message || err.message || 'Error saving announcement to database');
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
    const headers = ['Title', 'Type', 'Audience', 'Priority', 'Status', 'Pinned', 'Supabase Photo Link', 'Created Date'];
    const rows = announcements.map(a => [
      `"${(a.title || '').replace(/"/g, '""')}"`,
      a.type || 'general',
      `"${a.targetAudience || 'all'}"`,
      a.priority || 'medium',
      a.isActive ? 'Active' : 'Inactive',
      a.isPinned ? 'Yes' : 'No',
      `"${a.photo || a.thumbnail || ''}"`,
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

  const getPhotoDisplayUrl = (item) => {
    const src = item?.photo || item?.thumbnail;
    if (!src) return null;
    return src.startsWith('http') ? src : `${BACKEND_URL}${src}`;
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
            Broadcast updates, system alerts, and scholarly news with Supabase-hosted photos stored directly in MongoDB.
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
          
          {/* Main "+ Create New" Action Button */}
          <button 
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg transition-all cursor-pointer"
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

      {/* Main Full-Width Section (Quick Compose side panel removed) */}
      <div className="space-y-6">
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
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="all">All Types</option>
              {TYPE_OPTIONS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
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

        {/* Full-Width Announcements Table */}
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
                  There are no announcements matching your current filters. Click "Create New" on the top right to publish one!
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={handleOpenCreateModal}
                    className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    + Create First Announcement
                  </button>
                  {(searchQuery || filterAudience !== 'all' || filterStatus !== 'all') && (
                    <button
                      onClick={() => { setSearchQuery(''); setFilterAudience('all'); setFilterStatus('all'); }}
                      className="text-xs font-bold text-gray-600 hover:underline cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-gray-50/80 text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3.5 w-16">Photo</th>
                    <th className="px-5 py-3.5">Announcement</th>
                    <th className="px-4 py-3.5">Audience</th>
                    <th className="px-4 py-3.5">Type &amp; Priority</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {announcements.map((item) => {
                    const isPin = !!item.isPinned;
                    const isAct = item.isActive !== undefined ? item.isActive : true;
                    const photoSrc = getPhotoDisplayUrl(item);
                    const isSupabase = photoSrc && photoSrc.includes('supabase.co');

                    return (
                      <tr key={item._id} className="hover:bg-gray-50/60 transition-colors">
                        {/* Photo Thumbnail Column */}
                        <td className="px-5 py-4">
                          {photoSrc ? (
                            <div
                              onClick={() => setSelectedPhotoModal({ url: photoSrc, title: item.title })}
                              className="relative w-12 h-9 rounded-lg overflow-hidden border border-gray-200 shadow-2xs group cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all shrink-0"
                              title="Click to view full photo"
                            >
                              <img
                                src={photoSrc}
                                alt=""
                                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                              />
                              {isSupabase && (
                                <div
                                  className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white"
                                  title="Cloud Hosted (Supabase)"
                                />
                              )}
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Eye className="w-3.5 h-3.5 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-9 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-300">
                              <ImagePlus size={16} />
                            </div>
                          )}
                        </td>

                        {/* Announcement Title & Content */}
                        <td className="px-5 py-4 max-w-md">
                          <div className="flex items-start gap-2.5">
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

                        {/* Audience */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold border ${getAudienceBadgeClass(item.targetAudience)}`}>
                            {item.targetAudience || 'All Scholars'}
                          </span>
                        </td>

                        {/* Type & Priority */}
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

                        {/* Status */}
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

                        {/* Actions */}
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
              Pro Tip: Targeted Delivery &amp; Cloud Media
            </h4>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Upload photos with announcements to increase student engagement by over 60%. Photos are hosted on Supabase Storage CDN and linked directly to MongoDB. Pin high-priority broadcasts for immediate visibility.
            </p>
            <div className="mt-2 text-xs font-bold text-blue-600 inline-flex items-center gap-1">
              <span>Database Sync: MongoDB Atlas • Media: Supabase Storage</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </div>
      </div>

      {/* ── CREATE / EDIT ANNOUNCEMENT MODAL (Opened via "+ Create New" button) ── */}
      {showFormModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget && !submitting && !uploadingPhoto) setShowFormModal(false); }}
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full my-8 shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
                  {editingId ? <Edit3 size={18} /> : <Plus size={20} />}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    {editingId ? 'Edit Announcement' : 'Create New Announcement'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Publish updates with Supabase photo storage and MongoDB database sync
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                disabled={submitting || uploadingPhoto}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* ─── ANNOUNCEMENT COVER PHOTO (AUTOMATIC SUPABASE UPLOAD LIKE COURSES MANAGEMENT) ─── */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FileImage size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900">Announcement Cover Photo</h4>
                      <p className="text-[11px] text-gray-400">Automatically uploads to Supabase Storage</p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                    <Cloud size={13} />
                    <span>Supabase Cloud</span>
                  </span>
                </div>

                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  id="modal-photo-upload"
                  className="hidden"
                  onChange={handlePhotoChange}
                />

                {!photoPreview ? (
                  /* Dropzone like Course Cover in Course Management */
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => photoInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-7 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50/80 scale-[1.01]'
                        : 'border-gray-200 hover:border-blue-400 bg-[#f8fafc] hover:bg-blue-50/10'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-2.5 transition">
                      <ImagePlus size={22} />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-gray-700">
                      Click to upload image or drag &amp; drop
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      PNG, JPG, WebP, GIF (Max 5 MB) • Automatically stored on Supabase Storage
                    </p>
                  </div>
                ) : (
                  /* Live Preview Banner with instant uploading overlay */
                  <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-gray-200 bg-gray-900/5 group shadow-xs">
                    <img
                      src={photoPreview}
                      alt="Cover Preview"
                      className={`w-full h-full object-cover transition-transform duration-300 ${uploadingPhoto ? 'opacity-40 blur-2xs' : 'group-hover:scale-105'}`}
                    />

                    {uploadingPhoto ? (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 text-white">
                        <RotateCw size={24} className="animate-spin text-blue-400" />
                        <span className="text-xs font-bold">Uploading automatically to Supabase Storage...</span>
                      </div>
                    ) : (
                      <>
                        <div className="absolute top-2.5 left-2.5">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/60 text-white backdrop-blur-md flex items-center gap-1 shadow-xs">
                            <Cloud size={12} className="text-emerald-400" />
                            Supabase Hosted
                          </span>
                        </div>

                        {/* Hover Overlay Controls */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-2xs">
                          <button
                            type="button"
                            onClick={() => setSelectedPhotoModal({ url: photoPreview, title: title || 'Cover Preview' })}
                            className="px-3 py-1.5 bg-white/90 hover:bg-white text-gray-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                          >
                            <Maximize2 size={13} /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                          >
                            <RefreshCw size={13} /> Change
                          </button>
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Title Field */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Announcement Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="E.g. Fall 2026 Korean Proficiency Exam Registration"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>

              {/* Category & Audience Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Category Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
                  >
                    {TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Target Audience
                  </label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
                  >
                    {AUDIENCE_OPTIONS.map(aud => (
                      <option key={aud} value={aud}>{aud}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority & Pin Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Priority Level
                  </label>
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    {['low', 'medium', 'high', 'urgent'].map(p => (
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

                <div className="flex items-center justify-between sm:justify-start gap-4 pt-1 sm:pt-4">
                  <div>
                    <span className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider">Pin to Top</span>
                    <span className="text-[11px] text-gray-400">Keep on top of feed</span>
                  </div>
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

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    End / Expiry Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Message Content */}
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
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all resize-y"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Tags (Comma Separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. news, korean, admissions, schedule"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <span className="text-xs font-bold text-gray-800 block">Status: {isActive ? 'Active' : 'Inactive'}</span>
                  <span className="text-[11px] text-gray-400">Controls visibility on student and public portals</span>
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

              {/* Form Action Buttons */}
              <div className="flex justify-end items-center gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  disabled={submitting || uploadingPhoto}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingPhoto}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
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
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden relative">
            <button
              onClick={() => setViewingItem(null)}
              className="absolute top-4 right-4 z-10 p-1.5 bg-white/80 hover:bg-white text-gray-600 rounded-full shadow-sm cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Banner Photo if present */}
            {getPhotoDisplayUrl(viewingItem) && (
              <div className="w-full h-48 bg-slate-900/10 overflow-hidden relative">
                <img
                  src={getPhotoDisplayUrl(viewingItem)}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-md flex items-center gap-1">
                  <Cloud size={10} className="text-emerald-400" />
                  Supabase Hosted
                </span>
              </div>
            )}

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
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
                <div className="flex flex-wrap gap-1.5 pt-1">
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
        </div>
      )}

      {/* Fullscreen Photo Lightbox Modal */}
      {selectedPhotoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedPhotoModal(null); }}
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-white/20">
            <div className="relative w-full max-h-[70vh] bg-slate-950 flex items-center justify-center overflow-hidden">
              <img
                src={selectedPhotoModal.url}
                alt={selectedPhotoModal.title}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
              <button
                onClick={() => setSelectedPhotoModal(null)}
                className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
              <div className="min-w-0">
                <h4 className="font-bold text-gray-900 text-sm truncate max-w-md">
                  {selectedPhotoModal.title}
                </h4>
                <p className="text-xs text-gray-500 truncate max-w-md mt-0.5">
                  {selectedPhotoModal.url}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={selectedPhotoModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink size={13} />
                  <span>Open Full Photo</span>
                </a>
              </div>
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
