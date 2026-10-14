import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import announcementService from '../services/announcementService';
import { uploadToSupabase } from '../services/uploadService';
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  BookmarkIcon,
  BookmarkSlashIcon
} from '@heroicons/react/24/outline';
import {
  ImagePlus,
  X,
  UploadCloud,
  Cloud,
  Check,
  Copy,
  Maximize2,
  ExternalLink,
  Trash2,
  RefreshCw,
  AlertCircle,
  Eye,
  FileImage,
  Sparkles,
  RotateCw
} from 'lucide-react';

const BACKEND_URL = 'http://localhost:5000';

const AdminAnnouncementManagementPage = () => {
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, pinned: 0 });
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    type: '', priority: '', targetAudience: '', isActive: '', isPinned: '', dateFrom: '', dateTo: ''
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'general',
    priority: 'medium',
    targetAudience: 'all',
    isActive: true,
    isPinned: false,
    startDate: '',
    endDate: '',
    tags: [],
    thumbnail: ''
  });

  // Photo state (Automatic Supabase upload like in Course Management)
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null);
  const thumbInputRef = useRef(null);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchAnnouncements(); }, [pagination.current, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const statsResponse = await announcementService.getAnnouncementStats();
      if (statsResponse.success) setStats(statsResponse.stats);
    } catch (error) {
      toast.error('Failed to load announcement data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await announcementService.getAllAnnouncements(pagination.current, 20, filters);
      if (response.success) {
        setAnnouncements(response.announcements);
        setPagination(response.pagination);
      } else {
        toast.error('Failed to load announcements');
      }
    } catch (error) {
      toast.error('Failed to load announcements');
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
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

    // Immediately show preview and start automatic upload to Supabase
    const localPreview = URL.createObjectURL(file);
    setPhotoPreview(localPreview);
    setUploadingPhoto(true);

    try {
      // Exclusively upload directly to Supabase Storage - never local
      const publicUrl = await uploadToSupabase(file, 'courses', 'announcements');
      setPhotoUrl(publicUrl);
      setPhotoPreview(publicUrl);
      setFormData(prev => ({ ...prev, thumbnail: publicUrl }));
      setUploadingPhoto(false);
      toast.success('Image automatically uploaded to Supabase Storage!');
    } catch (err) {
      setUploadingPhoto(false);
      setPhotoPreview('');
      setPhotoUrl('');
      setFormData(prev => ({ ...prev, thumbnail: '' }));
      if (thumbInputRef.current) thumbInputRef.current.value = '';
      console.error('Supabase upload error:', err);
      toast.error(`Supabase upload failed: ${err.message || 'Error uploading image'}`);
    }
  };

  const handleThumbnailChange = (e) => {
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

  const handleRemoveThumbnail = () => {
    setPhotoPreview('');
    setPhotoUrl('');
    setFormData(prev => ({ ...prev, thumbnail: '' }));
    if (thumbInputRef.current) thumbInputRef.current.value = '';
  };

  /* ── CRUD ── */
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content || !formData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (uploadingPhoto) {
      toast.error('Please wait for the image to finish uploading to Supabase');
      return;
    }

    try {
      setLoading(true);
      const announcementData = {
        title: formData.title,
        content: formData.content,
        type: formData.type,
        priority: formData.priority,
        targetAudience: formData.targetAudience,
        isActive: formData.isActive,
        isPinned: formData.isPinned,
        startDate: formData.startDate || new Date().toISOString(),
        endDate: formData.endDate,
        tags: formData.tags,
        thumbnail: photoUrl || '',
        photo: photoUrl || ''
      };
      const response = await announcementService.createAnnouncement(announcementData);
      if (response.success) {
        toast.success('Announcement created successfully');
        setShowCreateForm(false);
        resetForm();
        fetchAnnouncements();
        fetchData();
      } else {
        toast.error(response.message || 'Failed to create announcement');
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error(error.message || 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAnnouncement = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content || !formData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (uploadingPhoto) {
      toast.error('Please wait for the image to finish uploading to Supabase');
      return;
    }

    try {
      setLoading(true);
      const announcementData = {
        title: formData.title,
        content: formData.content,
        type: formData.type,
        priority: formData.priority,
        targetAudience: formData.targetAudience,
        isActive: formData.isActive,
        isPinned: formData.isPinned,
        startDate: formData.startDate || new Date().toISOString(),
        endDate: formData.endDate,
        tags: formData.tags,
        thumbnail: photoUrl || '',
        photo: photoUrl || ''
      };
      const response = await announcementService.updateAnnouncement(editingAnnouncement._id, announcementData);
      if (response.success) {
        toast.success('Announcement updated successfully');
        setEditingAnnouncement(null);
        resetForm();
        fetchAnnouncements();
        fetchData();
      } else {
        toast.error(response.message || 'Failed to update announcement');
      }
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast.error(error.message || 'Failed to update announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      setLoading(true);
      const response = await announcementService.deleteAnnouncement(announcementId);
      if (response.success) {
        toast.success('Announcement deleted successfully');
        fetchAnnouncements();
        fetchData();
      } else {
        toast.error(response.message || 'Failed to delete announcement');
      }
    } catch (error) {
      toast.error('Failed to delete announcement');
      console.error('Error deleting announcement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = async (announcementId) => {
    try {
      setLoading(true);
      const response = await announcementService.togglePinAnnouncement(announcementId);
      if (response.success) {
        toast.success(response.message);
        fetchAnnouncements();
        fetchData();
      } else {
        toast.error(response.message || 'Failed to toggle pin status');
      }
    } catch (error) {
      toast.error('Failed to toggle pin status');
      console.error('Error toggling pin:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (announcementId) => {
    try {
      setLoading(true);
      const response = await announcementService.toggleActiveAnnouncement(announcementId);
      if (response.success) {
        toast.success(response.message);
        fetchAnnouncements();
        fetchData();
      } else {
        toast.error(response.message || 'Failed to toggle active status');
      }
    } catch (error) {
      toast.error('Failed to toggle active status');
      console.error('Error toggling active:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '', content: '', type: 'general', priority: 'medium',
      targetAudience: 'all', isActive: true, isPinned: false,
      startDate: '', endDate: '', tags: [], thumbnail: ''
    });
    setPhotoPreview('');
    setPhotoUrl('');
    setUploadingPhoto(false);
    if (thumbInputRef.current) thumbInputRef.current.value = '';
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    const existingPhoto = announcement.photo || announcement.thumbnail || '';
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      targetAudience: announcement.targetAudience,
      isActive: announcement.isActive,
      isPinned: announcement.isPinned,
      startDate: announcement.startDate ? new Date(announcement.startDate).toISOString().split('T')[0] : '',
      endDate: announcement.endDate ? new Date(announcement.endDate).toISOString().split('T')[0] : '',
      tags: announcement.tags || [],
      thumbnail: existingPhoto
    });

    setPhotoUrl(existingPhoto);
    setPhotoPreview(existingPhoto);
    setUploadingPhoto(false);
    setShowCreateForm(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current: page }));
  };

  const getPriorityBadge = (priority) => {
    const priorityColors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${priorityColors[priority] || 'bg-gray-100 text-gray-800'}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeColors = {
      general: 'bg-gray-100 text-gray-800',
      course: 'bg-blue-100 text-blue-800',
      system: 'bg-purple-100 text-purple-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      event: 'bg-green-100 text-green-800',
      academic: 'bg-indigo-100 text-indigo-800'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${typeColors[type] || 'bg-gray-100 text-gray-800'}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const getPhotoUrl = (announcement) => {
    const url = announcement.photo || announcement.thumbnail;
    if (!url) return null;
    return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold mb-1">
            <Cloud className="w-4 h-4" />
            <span>Cloud-Powered LMS Communications</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Announcement Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            Create, publish, and schedule institutional bulletins with Supabase-hosted photos
          </p>
        </div>
        <div>
          <button
            onClick={() => {
              setShowCreateForm(true);
              setEditingAnnouncement(null);
              resetForm();
            }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-blue-500/20 hover:shadow-lg transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create New Announcement</span>
          </button>
        </div>
      </div>

      {/* ── Statistics Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Announcements', value: stats.total, color: 'blue', icon: 'M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-9 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2' },
          { label: 'Active Notices', value: stats.active, color: 'emerald', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Draft / Inactive', value: stats.inactive, color: 'slate', icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Pinned on Top', value: stats.pinned, color: 'amber', icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z' }
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-1">{value}</p>
              </div>
              <div className={`p-3 rounded-xl ${
                color === 'blue' ? 'bg-blue-50 text-blue-600' :
                color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-600'
              }`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Create / Edit Form ── */}
      {showCreateForm && (
        <div className="bg-white rounded-3xl shadow-xl border border-blue-100/80 overflow-hidden transition-all animate-in fade-in duration-300">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                {editingAnnouncement ? '✎' : '+'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingAnnouncement ? 'Edit Announcement' : 'Compose New Announcement'}
                </h3>
                <p className="text-xs text-gray-500">
                  Fill in the details below. Photos are automatically uploaded to Supabase Storage.
                </p>
              </div>
            </div>
            <button
              onClick={() => { setShowCreateForm(false); setEditingAnnouncement(null); resetForm(); }}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={editingAnnouncement ? handleUpdateAnnouncement : handleCreateAnnouncement} className="p-6 sm:p-8 space-y-6">
            {/* ─── AUTOMATIC SUPABASE PHOTO UPLOAD (LIKE COURSES MANAGEMENT THUMBNAIL) ─── */}
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
                ref={thumbInputRef}
                type="file"
                accept="image/*"
                id="announcement-photo-upload"
                className="hidden"
                onChange={handleThumbnailChange}
              />

              {!photoPreview ? (
                /* Dropzone like in courses management */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => thumbInputRef.current?.click()}
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
                    PNG, JPG, WebP, GIF (Max 5 MB) • Automatically uploaded to Supabase Storage
                  </p>
                </div>
              ) : (
                /* Preview Banner with upload progress indicator */
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

                      {/* Hover Controls */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-2xs">
                        <button
                          type="button"
                          onClick={() => setSelectedPhotoModal({ url: photoPreview, title: formData.title || 'Cover Preview' })}
                          className="px-3 py-1.5 bg-white/90 hover:bg-white text-gray-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <Maximize2 size={13} /> View
                        </button>
                        <button
                          type="button"
                          onClick={() => thumbInputRef.current?.click()}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <RefreshCw size={13} /> Change
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveThumbnail}
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

            {/* Standard Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Fall 2026 Korean Proficiency Exam Registration"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Category / Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="general">General</option>
                  <option value="course">Course</option>
                  <option value="system">System</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="event">Event</option>
                  <option value="academic">Academic</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Priority Level
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Target Audience
                </label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">All Users</option>
                  <option value="students">Students Only</option>
                  <option value="instructors">Instructors Only</option>
                  <option value="admins">Admins Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Display Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Expiration / End Date *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Announcement Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={5}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter detailed announcement message..."
                required
              />
            </div>

            <div className="flex items-center space-x-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Active (Visible to users)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPinned: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Pin on Top</span>
              </label>
            </div>

            <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => { setShowCreateForm(false); setEditingAnnouncement(null); resetForm(); }}
                className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || uploadingPhoto}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg transition-all disabled:opacity-60 cursor-pointer"
              >
                {uploadingPhoto ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Uploading Photo...</span>
                  </>
                ) : (
                  <>
                    <span>{editingAnnouncement ? 'Update Announcement' : 'Publish Announcement'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filters Card ── */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Search &amp; Filter Bulletins</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="general">General</option>
              <option value="course">Course</option>
              <option value="system">System</option>
              <option value="maintenance">Maintenance</option>
              <option value="event">Event</option>
              <option value="academic">Academic</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Audience</label>
            <select
              value={filters.targetAudience}
              onChange={(e) => handleFilterChange('targetAudience', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Audiences</option>
              <option value="all">All Users</option>
              <option value="students">Students</option>
              <option value="instructors">Instructors</option>
              <option value="admins">Admins</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Status</label>
            <select
              value={filters.isActive}
              onChange={(e) => handleFilterChange('isActive', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Date From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ type: '', priority: '', targetAudience: '', isActive: '', isPinned: '', dateFrom: '', dateTo: '' })}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* ── Announcements Table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900">All Published Announcements</h3>
            {pagination.total > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                {pagination.total} Total
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-20">Photo</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Title &amp; Excerpt</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Audience</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-5 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {announcements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 text-sm">
                    No announcements found. Click "Create New Announcement" to get started.
                  </td>
                </tr>
              ) : (
                announcements.map((announcement) => {
                  const photoSrc = getPhotoUrl(announcement);
                  const isSupabase = photoSrc && photoSrc.includes('supabase.co');

                  return (
                    <tr key={announcement._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Photo Thumbnail Cell */}
                      <td className="px-5 py-3">
                        {photoSrc ? (
                          <div
                            onClick={() => setSelectedPhotoModal({ url: photoSrc, title: announcement.title })}
                            className="relative w-14 h-10 rounded-lg overflow-hidden border border-slate-200 shadow-2xs group cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
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
                                title="Hosted on Supabase"
                              />
                            )}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-14 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-300">
                            <ImagePlus className="w-4 h-4" />
                          </div>
                        )}
                      </td>

                      {/* Title & Excerpt */}
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          <div className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                            <span>{announcement.title}</span>
                            {announcement.isPinned && (
                              <span className="p-0.5 bg-amber-50 text-amber-600 rounded-sm" title="Pinned Announcement">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {announcement.content}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">{getTypeBadge(announcement.type)}</td>
                      <td className="px-5 py-4 whitespace-nowrap">{getPriorityBadge(announcement.priority)}</td>

                      <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-600 font-medium">
                        {announcement.targetAudience.charAt(0).toUpperCase() + announcement.targetAudience.slice(1)}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          announcement.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {announcement.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-500">
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditAnnouncement(announcement)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Announcement"
                            disabled={loading}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleTogglePin(announcement._id)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              announcement.isPinned
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            }`}
                            title={announcement.isPinned ? 'Unpin' : 'Pin'}
                            disabled={loading}
                          >
                            {announcement.isPinned ? <BookmarkIcon className="h-4 w-4" /> : <BookmarkSlashIcon className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleToggleActive(announcement._id)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              announcement.isActive
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            }`}
                            title={announcement.isActive ? 'Deactivate' : 'Activate'}
                            disabled={loading}
                          >
                            {announcement.isActive ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteAnnouncement(announcement._id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                            disabled={loading}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Showing page <span className="font-bold text-gray-800">{pagination.current}</span> of <span className="font-bold text-gray-800">{pagination.pages}</span> ({pagination.total} announcements)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.current - 1)}
                disabled={pagination.current === 1}
                className="px-3.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.current + 1)}
                disabled={pagination.current === pagination.pages}
                className="px-3.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Photo Lightbox Modal ── */}
      {selectedPhotoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
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
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
              <div>
                <h4 className="font-bold text-gray-900 text-sm truncate max-w-md">
                  {selectedPhotoModal.title}
                </h4>
                <p className="text-xs text-gray-500 truncate max-w-md mt-0.5">
                  {selectedPhotoModal.url}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedPhotoModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Photo</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Global Loading Spinner ── */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-2xs flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-2xl shadow-xl flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            <span className="text-sm font-semibold text-gray-800">Processing Announcement...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncementManagementPage;
