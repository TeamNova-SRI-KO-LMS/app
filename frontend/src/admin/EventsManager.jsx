import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Users, 
  Pin, 
  Plus, 
  Search, 
  RotateCw, 
  Download, 
  Trash2, 
  Edit3, 
  Eye, 
  X, 
  CheckCircle, 
  AlertCircle, 
  UploadCloud, 
  ImagePlus, 
  FileImage, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Link as LinkIcon,
  Check,
  Maximize2
} from 'lucide-react';
import eventService from '../services/eventService';
import { uploadToSupabase } from '../services/uploadService';

const CATEGORY_OPTIONS = [
  { value: 'seminar', label: 'Seminar' },
  { value: 'ceremony', label: 'Ceremony' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'cultural', label: 'Cultural Immersion' },
  { value: 'exam', label: 'TOPIK Exam' },
  { value: 'webinar', label: 'Online Webinar' },
  { value: 'general', label: 'General Gathering' }
];

const STATUS_OPTIONS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const getCategoryBadgeClass = (category) => {
  const norm = (category || 'seminar').toLowerCase();
  switch (norm) {
    case 'ceremony':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'workshop':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'cultural':
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    case 'exam':
      return 'bg-red-50 text-red-700 border border-red-200';
    case 'webinar':
      return 'bg-cyan-50 text-cyan-700 border border-cyan-200';
    case 'general':
      return 'bg-gray-50 text-gray-700 border border-gray-200';
    case 'seminar':
    default:
      return 'bg-purple-50 text-purple-700 border border-purple-200';
  }
};

const getStatusBadgeClass = (status) => {
  const norm = (status || 'upcoming').toLowerCase();
  switch (norm) {
    case 'ongoing':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'completed':
      return 'bg-gray-100 text-gray-700 border-gray-300';
    case 'cancelled':
      return 'bg-rose-100 text-rose-800 border-rose-300';
    case 'upcoming':
    default:
      return 'bg-blue-100 text-blue-800 border-blue-300';
  }
};

const formatEventDate = (dateStr) => {
  if (!dateStr) return 'TBD';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatEventTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const EventsManager = () => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    ongoing: 0,
    completed: 0,
    cancelled: 0,
    active: 0,
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
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterActive, setFilterActive] = useState('all');

  // Modal & Form state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('seminar');
  const [status, setStatus] = useState('upcoming');
  const [eventDate, setEventDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState('60');
  const [location, setLocation] = useState('Online');
  const [meetingLink, setMeetingLink] = useState('');
  const [capacity, setCapacity] = useState('0');
  const [pinToTop, setPinToTop] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [tags, setTags] = useState('');

  // Multiple Photos state (Supabase Storage)
  const [photos, setPhotos] = useState([]);
  const [coverImage, setCoverImage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0 });
  const [directPhotoInput, setDirectPhotoInput] = useState('');
  const fileInputRef = useRef(null);

  // Preview, Delete & Lightbox Modals
  const [viewingEvent, setViewingEvent] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null);

  // Fetch event statistics
  const fetchStats = async () => {
    try {
      const res = await eventService.getEventStats();
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.warn('Failed to load event stats:', err.message);
    }
  };

  // Fetch events list with filters
  const fetchEvents = async (page = 1) => {
    try {
      setLoading(true);
      const filters = {};
      if (filterCategory !== 'all') filters.category = filterCategory;
      if (filterStatus !== 'all') filters.status = filterStatus;
      if (filterActive !== 'all') filters.isActive = filterActive;
      if (searchQuery.trim()) filters.search = searchQuery.trim();

      const res = await eventService.getAllEvents(page, pagination.limit, filters);
      if (res.success) {
        setEvents(res.events || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else {
        toast.error(res.message || 'Failed to fetch events');
      }
    } catch (err) {
      console.error('Fetch events error:', err);
      toast.error('Error connecting to database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchEvents(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory, filterStatus, filterActive]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEvents(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterCategory('all');
    setFilterStatus('all');
    setFilterActive('all');
  };

  // -------------------------------------------------------------
  // Multiple Photos Upload to Supabase Handler
  // -------------------------------------------------------------
  const handleMultiplePhotosSelect = async (files) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (validFiles.length === 0) {
      toast.error('Please select valid image files (JPG, PNG, WebP).');
      return;
    }

    try {
      setUploadingPhotos(true);
      setUploadProgress({ completed: 0, total: validFiles.length });

      const uploadedUrls = [];
      let completedCount = 0;

      for (const file of validFiles) {
        try {
          const publicUrl = await uploadToSupabase(file, undefined, 'events');
          uploadedUrls.push(publicUrl);
          completedCount += 1;
          setUploadProgress({ completed: completedCount, total: validFiles.length });
        } catch (uploadErr) {
          console.error(`Error uploading ${file.name}:`, uploadErr);
          toast.error(`Failed to upload ${file.name}: ${uploadErr.message || 'Error'}`);
        }
      }

      if (uploadedUrls.length > 0) {
        setPhotos(prev => {
          const updated = [...prev, ...uploadedUrls];
          // If no cover image set yet, make the first uploaded photo the cover
          if (!coverImage && updated.length > 0) {
            setCoverImage(updated[0]);
          }
          return updated;
        });
        toast.success(`Successfully uploaded ${uploadedUrls.length} photo(s) to Supabase Storage!`);
      }
    } catch (err) {
      console.error('Multiple photo upload error:', err);
      toast.error('Error during image upload');
    } finally {
      setUploadingPhotos(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleMultiplePhotosSelect(files);
    }
  };

  const handleRemovePhoto = (photoUrlToRemove) => {
    setPhotos(prev => {
      const remaining = prev.filter(url => url !== photoUrlToRemove);
      if (coverImage === photoUrlToRemove) {
        setCoverImage(remaining[0] || '');
      }
      return remaining;
    });
  };

  const handleSetCoverPhoto = (photoUrlToSet) => {
    setCoverImage(photoUrlToSet);
    toast.success('Cover photo updated');
  };

  const handleAddDirectPhotoUrl = () => {
    if (!directPhotoInput.trim()) return;
    const url = directPhotoInput.trim();
    if (photos.includes(url)) {
      toast.error('This photo link is already added');
      return;
    }
    setPhotos(prev => [...prev, url]);
    if (!coverImage) setCoverImage(url);
    setDirectPhotoInput('');
    toast.success('Photo link added');
  };

  // -------------------------------------------------------------
  // Form State Handlers
  // -------------------------------------------------------------
  const handleResetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setCategory('seminar');
    setStatus('upcoming');
    setEventDate('');
    setEndDate('');
    setDuration('60');
    setLocation('Online');
    setMeetingLink('');
    setCapacity('0');
    setPinToTop(false);
    setIsActive(true);
    setTags('');
    setPhotos([]);
    setCoverImage('');
    setUploadingPhotos(false);
    setDirectPhotoInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenCreateModal = () => {
    handleResetForm();
    setShowFormModal(true);
  };

  const handleStartEdit = (event) => {
    setEditingId(event._id);
    setTitle(event.title || '');
    setDescription(event.description || '');
    setCategory(event.category || 'seminar');
    setStatus(event.status || 'upcoming');
    setDuration(event.duration ? String(event.duration) : '60');
    setLocation(event.location || 'Online');
    setMeetingLink(event.meetingLink || '');
    setCapacity(event.capacity !== undefined ? String(event.capacity) : '0');
    setPinToTop(!!event.isPinned);
    setIsActive(event.isActive !== undefined ? event.isActive : true);
    setTags(Array.isArray(event.tags) ? event.tags.join(', ') : (event.tags || ''));

    // Format datetime-local string (YYYY-MM-DDTHH:mm)
    if (event.eventDate) {
      const d = new Date(event.eventDate);
      const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setEventDate(localIso);
    } else {
      setEventDate('');
    }

    if (event.endDate) {
      const d = new Date(event.endDate);
      const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setEndDate(localIso);
    } else {
      setEndDate('');
    }

    const eventPhotos = Array.isArray(event.photos) ? event.photos : [];
    setPhotos(eventPhotos);
    setCoverImage(event.coverImage || (eventPhotos.length > 0 ? eventPhotos[0] : ''));
    setUploadingPhotos(false);
    setShowFormModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter an event title');
      return;
    }
    if (!description.trim()) {
      toast.error('Please enter an event description');
      return;
    }
    if (!eventDate) {
      toast.error('Please select an event date and start time');
      return;
    }

    if (uploadingPhotos) {
      toast.error('Please wait for photos to finish uploading to Supabase');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        status,
        eventDate: new Date(eventDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        duration: Number(duration) || 60,
        location: location.trim() || 'Online',
        meetingLink: meetingLink.trim(),
        capacity: Number(capacity) || 0,
        isPinned: pinToTop,
        isActive,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        photos,
        coverImage: coverImage || (photos.length > 0 ? photos[0] : null)
      };

      if (editingId) {
        const res = await eventService.updateEvent(editingId, payload);
        if (res.success) {
          toast.success('Event updated successfully in database!');
          handleResetForm();
          setShowFormModal(false);
          fetchEvents(pagination.current);
          fetchStats();
        } else {
          toast.error(res.message || 'Failed to update event');
        }
      } else {
        const res = await eventService.createEvent(payload);
        if (res.success) {
          toast.success('Event scheduled successfully in database!');
          handleResetForm();
          setShowFormModal(false);
          fetchEvents(1);
          fetchStats();
        } else {
          toast.error(res.message || 'Failed to create event');
        }
      }
    } catch (err) {
      console.error('Submit event error:', err);
      toast.error(err.response?.data?.message || err.message || 'Error saving event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      const res = await eventService.deleteEvent(itemToDelete._id);
      if (res.success) {
        toast.success('Event deleted successfully');
        setItemToDelete(null);
        fetchEvents(pagination.current);
        fetchStats();
      } else {
        toast.error(res.message || 'Failed to delete event');
      }
    } catch (err) {
      console.error('Delete event error:', err);
      toast.error('Error deleting event');
    }
  };

  const handleTogglePin = async (id, e) => {
    e?.stopPropagation();
    try {
      const res = await eventService.togglePinEvent(id);
      if (res.success) {
        toast.success(res.message || 'Pin status updated');
        setEvents(prev => prev.map(ev => ev._id === id ? { ...ev, isPinned: res.isPinned } : ev));
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
      const res = await eventService.toggleActiveEvent(id);
      if (res.success) {
        toast.success(res.message || 'Status updated');
        setEvents(prev => prev.map(ev => ev._id === id ? { ...ev, isActive: res.isActive } : ev));
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
    if (!events.length) {
      toast.error('No events to export');
      return;
    }
    const headers = ['Title', 'Category', 'Status', 'Event Date', 'Location', 'Meeting Link', 'Capacity', 'Attendees', 'Photos Count', 'Active', 'Pinned'];
    const rows = events.map(e => [
      `"${(e.title || '').replace(/"/g, '""')}"`,
      e.category || 'seminar',
      e.status || 'upcoming',
      new Date(e.eventDate).toLocaleString(),
      `"${(e.location || '').replace(/"/g, '""')}"`,
      `"${e.meetingLink || ''}"`,
      e.capacity || 0,
      e.attendees?.length || 0,
      e.photos?.length || 0,
      e.isActive ? 'Active' : 'Inactive',
      e.isPinned ? 'Yes' : 'No'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sriko_events_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Events exported to CSV');
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Calendar size={22} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Event Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Schedule, coordinate, and broadcast seminars, ceremonies, and language workshops.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { fetchStats(); fetchEvents(pagination.current); }}
            className="p-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Refresh events"
          >
            <RotateCw size={16} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Schedule Event</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <Calendar size={22} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Total Events</span>
            <span className="text-xl font-bold text-gray-900 mt-0.5 block">{stats.total || 0}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <Sparkles size={22} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Upcoming</span>
            <span className="text-xl font-bold text-emerald-600 mt-0.5 block">{stats.upcoming || 0}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Ongoing</span>
            <span className="text-xl font-bold text-amber-600 mt-0.5 block">{stats.ongoing || 0}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
            <Pin size={22} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Pinned / Prio</span>
            <span className="text-xl font-bold text-purple-600 mt-0.5 block">{stats.pinned || 0}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search title, location, agenda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </form>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {CATEGORY_OPTIONS.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            {/* Active / Inactive */}
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Visibility</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>

            {(searchQuery || filterCategory !== 'all' || filterStatus !== 'all' || filterActive !== 'all') && (
              <button
                onClick={handleClearFilters}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Events Table / Card Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <RotateCw size={28} className="animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-xs sm:text-sm font-medium">Loading events from database...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar size={44} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-sm sm:text-base font-bold text-gray-800">No events found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Get started by scheduling your first seminar, cultural event, or workshop.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              <Plus size={15} />
              <span>Schedule Event Now</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="py-3.5 px-4">Event & Photos</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Attendees</th>
                  <th className="py-3.5 px-4 text-center">Active</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm text-gray-700">
                {events.map((event) => {
                  const displayCover = event.coverImage || (event.photos && event.photos[0]);
                  const photoCount = event.photos?.length || 0;

                  return (
                    <tr 
                      key={event._id}
                      className="hover:bg-gray-50/60 transition-colors group cursor-pointer"
                      onClick={() => setViewingEvent(event)}
                    >
                      {/* Event Title & Photo Preview */}
                      <td className="py-4 px-4 min-w-[260px]">
                        <div className="flex items-center gap-3">
                          {/* Image preview with count badge */}
                          <div className="relative w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                            {displayCover ? (
                              <img
                                src={displayCover}
                                alt={event.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                                <FileImage size={20} />
                              </div>
                            )}

                            {photoCount > 1 && (
                              <span className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                                +{photoCount}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {event.isPinned && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                                  <Pin size={10} className="fill-amber-600 text-amber-600" />
                                  PINNED
                                </span>
                              )}
                              <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate max-w-xs">
                                {event.title}
                              </h4>
                            </div>
                            <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                              {event.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${getCategoryBadgeClass(event.category)}`}>
                          {event.category || 'seminar'}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-gray-900 font-semibold text-xs">
                          {formatEventDate(event.eventDate)}
                        </div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock size={12} />
                          <span>{formatEventTime(event.eventDate)}</span>
                          {event.duration ? <span>({event.duration}m)</span> : null}
                        </div>
                      </td>

                      {/* Location / Meeting link */}
                      <td className="py-4 px-4 min-w-[160px]">
                        <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                          {event.location?.toLowerCase().includes('online') ? (
                            <Video size={13} className="text-blue-500 shrink-0" />
                          ) : (
                            <MapPin size={13} className="text-rose-500 shrink-0" />
                          )}
                          <span className="truncate max-w-[140px]">{event.location || 'Online'}</span>
                        </div>
                        {event.meetingLink && (
                          <a
                            href={event.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline mt-0.5"
                          >
                            <span>Meeting Link</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${getStatusBadgeClass(event.status)}`}>
                          {event.status || 'upcoming'}
                        </span>
                      </td>

                      {/* Attendees */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                          <Users size={12} className="text-gray-500" />
                          <span>{event.attendees?.length || 0}</span>
                          {event.capacity > 0 && (
                            <span className="text-gray-400">/{event.capacity}</span>
                          )}
                        </div>
                      </td>

                      {/* Active Toggle Switch */}
                      <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleToggleActive(event._id, e)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            event.isActive ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                              event.isActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Pin Toggle */}
                          <button
                            onClick={(e) => handleTogglePin(event._id, e)}
                            title={event.isPinned ? 'Unpin from top' : 'Pin to top'}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              event.isPinned
                                ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            <Pin size={15} className={event.isPinned ? 'fill-amber-600' : ''} />
                          </button>

                          {/* View details */}
                          <button
                            onClick={() => setViewingEvent(event)}
                            title="View event details"
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleStartEdit(event)}
                            title="Edit event"
                            className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 size={15} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setItemToDelete(event)}
                            title="Delete event"
                            className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 bg-white">
            <div>
              Showing <span className="font-semibold text-gray-800">{events.length}</span> of{' '}
              <span className="font-semibold text-gray-800">{pagination.total}</span> events
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => fetchEvents(pagination.current - 1)}
                disabled={pagination.current <= 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => fetchEvents(pg)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    pagination.current === pg
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {pg}
                </button>
              ))}

              <button
                onClick={() => fetchEvents(pagination.current + 1)}
                disabled={pagination.current >= pagination.pages}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* CREATE / EDIT EVENT MODAL                                 */}
      {/* ========================================================= */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div 
            className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-gray-100 my-8 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  {editingId ? <Edit3 size={18} /> : <Plus size={18} />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">
                    {editingId ? 'Edit Event' : 'Schedule New Event'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Fill in event agenda and upload multiple photos to Supabase Storage.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowFormModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
              {/* Event Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Event Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Foreigners Seminar: Bridging Cultures"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              {/* Category, Status, Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Max Capacity (0 = Unlimited)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Date, Time, Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Start Date & Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    End Date & Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Location & Meeting Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Location (Physical Venue or 'Online')
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Online, or Main Hall, Colombo Campus"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Online Meeting Link (Zoom / Meet)
                  </label>
                  <input
                    type="url"
                    placeholder="https://zoom.us/j/... or Google Meet URL"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Description / Agenda */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Event Description & Agenda <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail the agenda, speakers, requirements, and what attendees will learn..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="KoreanCulture, TopikPrep, FreeSeminar, NativeSpeaker"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* ========================================================= */}
              {/* MULTIPLE PHOTOS UPLOAD SECTION (SUPABASE STORAGE)        */}
              {/* ========================================================= */}
              <div className="border border-blue-100 rounded-2xl p-4 bg-blue-50/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                      <ImagePlus size={16} className="text-blue-600" />
                      Event Photos & Gallery ({photos.length})
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Upload multiple event photos directly to Supabase Storage. The primary photo serves as the cover banner.
                    </p>
                  </div>
                </div>

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${
                    isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleMultiplePhotosSelect(e.target.files)}
                    className="hidden"
                    id="event-multiple-photos-input"
                  />

                  {uploadingPhotos ? (
                    <div className="py-3 flex flex-col items-center">
                      <RotateCw size={24} className="animate-spin text-blue-600 mb-2" />
                      <p className="text-xs font-semibold text-gray-700">
                        Uploading {uploadProgress.completed}/{uploadProgress.total} photo(s) to Supabase Storage...
                      </p>
                      <div className="w-48 h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${(uploadProgress.completed / Math.max(uploadProgress.total, 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <label htmlFor="event-multiple-photos-input" className="cursor-pointer block">
                      <UploadCloud size={28} className="mx-auto text-blue-500 mb-1.5" />
                      <span className="text-xs font-bold text-gray-800 block">
                        Click to upload multiple photos or drag and drop here
                      </span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">
                        Supports PNG, JPG, WebP up to 10MB each
                      </span>
                    </label>
                  )}
                </div>

                {/* Direct Image URL Add */}
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="url"
                      placeholder="Or paste direct image URL (https://...)"
                      value={directPhotoInput}
                      onChange={(e) => setDirectPhotoInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDirectPhotoUrl}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    Add URL
                  </button>
                </div>

                {/* Gallery of Uploaded Photos */}
                {photos.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-2">
                      Uploaded Photos Preview:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                      {photos.map((photoUrl, idx) => {
                        const isCover = coverImage === photoUrl || (!coverImage && idx === 0);
                        return (
                          <div 
                            key={idx} 
                            className={`relative group rounded-xl overflow-hidden aspect-video border-2 bg-gray-100 shadow-xs transition-all ${
                              isCover ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200'
                            }`}
                          >
                            <img
                              src={photoUrl}
                              alt={`Event photo ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />

                            {/* Cover Badge */}
                            {isCover && (
                              <span className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                                <Check size={10} /> COVER
                              </span>
                            )}

                            {/* Hover Actions */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                              {!isCover && (
                                <button
                                  type="button"
                                  onClick={() => handleSetCoverPhoto(photoUrl)}
                                  title="Set as Cover Banner"
                                  className="p-1 bg-white/90 hover:bg-white text-gray-800 rounded-md text-[10px] font-bold shadow-xs cursor-pointer"
                                >
                                  Cover
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setSelectedPhotoModal(photoUrl)}
                                title="Zoom photo"
                                className="p-1 bg-white/90 hover:bg-white text-blue-600 rounded-md shadow-xs cursor-pointer"
                              >
                                <Maximize2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(photoUrl)}
                                title="Remove photo"
                                className="p-1 bg-white/90 hover:bg-white text-rose-600 rounded-md shadow-xs cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Pin & Active Checkboxes */}
              <div className="flex flex-wrap gap-6 pt-2 border-t border-gray-100">
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pinToTop}
                    onChange={(e) => setPinToTop(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Pin this event to the top of the schedule</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Publish event immediately (Active status)</span>
                </label>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingPhotos}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting && <RotateCw size={14} className="animate-spin" />}
                  <span>{editingId ? 'Save Changes' : 'Schedule Event'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DETAILED EVENT INSPECTION / PREVIEW MODAL                 */}
      {/* ========================================================= */}
      {viewingEvent && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
          onClick={() => setViewingEvent(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Banner Cover / Photo Carousel */}
            {viewingEvent.coverImage || (viewingEvent.photos && viewingEvent.photos[0]) ? (
              <div className="relative h-60 bg-gray-900 overflow-hidden">
                <img
                  src={viewingEvent.coverImage || viewingEvent.photos[0]}
                  alt={viewingEvent.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <button
                  onClick={() => setViewingEvent(null)}
                  className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition cursor-pointer"
                >
                  <X size={18} />
                </button>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${getCategoryBadgeClass(viewingEvent.category)}`}>
                      {viewingEvent.category || 'seminar'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${getStatusBadgeClass(viewingEvent.status)}`}>
                      {viewingEvent.status || 'upcoming'}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold leading-tight drop-shadow-sm">{viewingEvent.title}</h2>
                </div>
              </div>
            ) : (
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${getCategoryBadgeClass(viewingEvent.category)}`}>
                    {viewingEvent.category || 'seminar'}
                  </span>
                  <h2 className="text-lg font-bold text-gray-900 mt-2">{viewingEvent.title}</h2>
                </div>
                <button
                  onClick={() => setViewingEvent(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Modal Body Info */}
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-gray-50 rounded-xl text-xs">
                <div>
                  <span className="text-gray-400 font-medium block">Date & Time:</span>
                  <span className="font-semibold text-gray-800 mt-0.5 block">
                    {formatEventDate(viewingEvent.eventDate)} at {formatEventTime(viewingEvent.eventDate)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Duration:</span>
                  <span className="font-semibold text-gray-800 mt-0.5 block">{viewingEvent.duration || 60} mins</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Attendees:</span>
                  <span className="font-semibold text-gray-800 mt-0.5 block">
                    {viewingEvent.attendees?.length || 0} registered
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-gray-400 font-medium block">Location:</span>
                  <span className="font-semibold text-gray-800 mt-0.5 block">
                    {viewingEvent.location || 'Online'}
                  </span>
                </div>
              </div>

              {/* Meeting link */}
              {viewingEvent.meetingLink && (
                <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
                    <Video size={16} className="text-blue-600 shrink-0" />
                    <span className="truncate max-w-sm">{viewingEvent.meetingLink}</span>
                  </div>
                  <a
                    href={viewingEvent.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    <span>Join</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Agenda & Details</h4>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {viewingEvent.description}
                </p>
              </div>

              {/* Multiple Photos Gallery */}
              {viewingEvent.photos && viewingEvent.photos.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Event Gallery ({viewingEvent.photos.length} photos)
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {viewingEvent.photos.map((photo, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedPhotoModal(photo)}
                        className="relative rounded-xl overflow-hidden aspect-video bg-gray-100 border border-gray-200 hover:border-blue-400 transition cursor-pointer group"
                      >
                        <img src={photo} alt={`Event ${i}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-200" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                          <Maximize2 size={16} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
              <span className="text-[11px] text-gray-400">
                Created: {new Date(viewingEvent.createdAt).toLocaleDateString()}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const ev = viewingEvent;
                    setViewingEvent(null);
                    handleStartEdit(ev);
                  }}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Edit Event
                </button>
                <button
                  onClick={() => setViewingEvent(null)}
                  className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DELETE CONFIRMATION MODAL                                 */}
      {/* ========================================================= */}
      {itemToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          onClick={() => setItemToDelete(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3.5">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-900">Delete Event?</h3>
            <p className="text-xs text-gray-500 mt-1.5 max-w-xs mx-auto">
              Are you sure you want to remove <span className="font-semibold text-gray-800">"{itemToDelete.title}"</span>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FULL PHOTO LIGHTBOX MODAL                                 */}
      {/* ========================================================= */}
      {selectedPhotoModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedPhotoModal(null)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhotoModal(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white p-1 cursor-pointer"
            >
              <X size={26} />
            </button>
            <img
              src={selectedPhotoModal}
              alt="Full Preview"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsManager;
