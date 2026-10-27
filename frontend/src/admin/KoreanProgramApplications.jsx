import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Globe, Clock, CheckCircle2, XCircle, Search, RotateCw, Inbox,
  Phone, Mail, Calendar, BookOpen, AlarmClock, User, MessageSquare,
  ExternalLink, Eye, Trash2, Check, Copy, AlertCircle, Sparkles,
  Share2, Info, ChevronRight, X, PhoneCall, Award, Send
} from 'lucide-react';
import apiService from '../services/apiService';

const STATUS_STYLES = {
  new:         'bg-amber-100 text-amber-800 border-amber-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  resolved:    'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const STATUS_LABELS = {
  new:         'New',
  in_progress: 'In Progress',
  resolved:    'Resolved',
};

const AVATAR_COLORS = [
  'bg-purple-600', 'bg-indigo-600', 'bg-rose-600',
  'bg-teal-600',   'bg-sky-600',    'bg-orange-600',
];

const HEAR_ABOUT_LABELS = {
  'social-media': 'Social Media',
  'website': 'Website',
  'referral': 'Friend / Family Referral',
  'advertisement': 'Advertisement',
  'search-engine': 'Search Engine (Google, etc.)',
  'other': 'Other',
};

const LEVEL_BADGES = {
  'Complete Beginner': 'bg-blue-50 text-blue-700 border-blue-200',
  'Beginner':          'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Intermediate':      'bg-purple-50 text-purple-700 border-purple-200',
  'Advanced':          'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Native Level':      'bg-amber-50 text-amber-700 border-amber-200',
};

function getAvatarColor(name = '') {
  const code = (name || 'U').charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

const FILTERS = ['ALL', 'NEW', 'IN PROGRESS', 'RESOLVED'];

const KoreanProgramApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [counts, setCounts] = useState({ total: 0, new: 0, in_progress: 0, resolved: 0 });
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);

  // Popup Modal state
  const [selectedApp, setSelectedApp] = useState(null);
  const [modalStatus, setModalStatus] = useState('new');
  const [modalNotes, setModalNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (filterStatus !== 'ALL') params.set('status', filterStatus.toLowerCase().replace(/\s+/g, '_'));
      if (searchTerm.trim()) params.set('search', searchTerm.trim());

      const res = await apiService.get(`/join-us?${params.toString()}`);
      if (res.data?.success) {
        setApplications(res.data.data || []);
        if (res.data.counts) {
          setCounts({
            total: res.data.counts.total || 0,
            new: res.data.counts.new || 0,
            in_progress: res.data.counts.in_progress || 0,
            resolved: res.data.counts.resolved || 0,
          });
        } else {
          const apps = res.data.data || [];
          setCounts({
            total: res.data.total || apps.length,
            new: apps.filter(a => a.status === 'new').length,
            in_progress: apps.filter(a => a.status === 'in_progress').length,
            resolved: apps.filter(a => a.status === 'resolved').length,
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setError('Failed to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchTerm]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Open Details Modal
  const handleOpenDetails = (app) => {
    setSelectedApp(app);
    setModalStatus(app.status || 'new');
    setModalNotes(app.notes || '');
    setModalError(null);
  };

  // Close Details Modal
  const handleCloseDetails = () => {
    setSelectedApp(null);
    setModalStatus('new');
    setModalNotes('');
    setModalError(null);
    setCopiedField(null);
  };

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedApp) {
        handleCloseDetails();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedApp]);

  // Copy to clipboard helper
  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copied to clipboard!`);
    setTimeout(() => {
      setCopiedField((prev) => (prev === fieldName ? null : prev));
    }, 2000);
  };

  // Status & Notes Update Handler (unified for both quick clicks and Save button)
  const handleUpdateApplication = async (targetStatus = modalStatus, targetNotes = modalNotes) => {
    if (!selectedApp) return;
    setIsSaving(true);
    setUpdatingId(selectedApp._id);
    setModalError(null);

    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const res = await apiService.patch(
        `/join-us/${selectedApp._id}/status`,
        { status: targetStatus, notes: targetNotes },
        config
      );

      if (res.data?.success) {
        const updated = res.data.data;
        toast.success(`Application updated! Status: ${targetStatus.toUpperCase()}`);

        // Update modal state
        setSelectedApp(prev => ({
          ...prev,
          status: targetStatus,
          notes: targetNotes,
          contactedAt: targetStatus === 'contacted' ? (updated.contactedAt || new Date().toISOString()) : prev.contactedAt,
        }));
        setModalStatus(targetStatus);
        setModalNotes(targetNotes);

        // Update list state
        setApplications(prev =>
          prev.map(app =>
            app._id === selectedApp._id
              ? {
                  ...app,
                  status: targetStatus,
                  notes: targetNotes,
                  contactedAt: targetStatus === 'contacted' ? (updated.contactedAt || new Date().toISOString()) : app.contactedAt,
                }
              : app
          )
        );

        // Update stats counts
        setCounts(prev => {
          const oldStatus = selectedApp.status || 'new';
          if (oldStatus === targetStatus) return prev;
          return {
            ...prev,
            [oldStatus]: Math.max(0, (prev[oldStatus] || 1) - 1),
            [targetStatus]: (prev[targetStatus] || 0) + 1,
          };
        });
      } else {
        throw new Error(res.data?.message || 'Failed to update application');
      }
    } catch (err) {
      console.error('Status update failed:', err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to update status. Please ensure you are logged in with admin privileges.';
      setModalError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSaving(false);
      setUpdatingId(null);
    }
  };

  // Quick Status Change from List View
  const handleListStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const res = await apiService.patch(
        `/join-us/${id}/status`,
        { status: newStatus },
        config
      );

      if (res.data?.success) {
        toast.success(`Application marked as ${newStatus}`);
        setApplications(prev =>
          prev.map(app => app._id === id ? { ...app, status: newStatus } : app)
        );
        if (selectedApp && selectedApp._id === id) {
          setSelectedApp(prev => ({ ...prev, status: newStatus }));
          setModalStatus(newStatus);
        }
        setCounts(prev => {
          const oldApp = applications.find(a => a._id === id);
          const oldStatus = oldApp?.status || 'new';
          if (oldStatus === newStatus) return prev;
          return {
            ...prev,
            [oldStatus]: Math.max(0, (prev[oldStatus] || 1) - 1),
            [newStatus]: (prev[newStatus] || 0) + 1,
          };
        });
      }
    } catch (err) {
      console.error('Status update failed:', err);
      toast.error(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete Application Handler
  const handleDeleteApplication = async (id) => {
    if (!window.confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      return;
    }
    setUpdatingId(id);
    try {
      const res = await apiService.delete(`/join-us/${id}`);
      if (res.data?.success) {
        toast.success('Application deleted successfully');
        setApplications(prev => prev.filter(app => app._id !== id));
        if (selectedApp?._id === id) {
          handleCloseDetails();
        }
        fetchApplications();
      }
    } catch (err) {
      console.error('Failed to delete application:', err);
      toast.error('Failed to delete application.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Korean Program Applications
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
              Join Us Submissions
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Review and manage student enrollment requests submitted through the Join Us page. Click on any applicant name to inspect their full details.
          </p>
        </div>
        <button
          onClick={fetchApplications}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <RotateCw size={14} className={loading ? 'animate-spin text-blue-600' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Inquiries', value: counts.total, color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
          { label: 'New',             value: counts.new, color: 'text-amber-600', bg: 'bg-amber-50/50' },
          { label: 'In Progress',     value: counts.in_progress, color: 'text-blue-600', bg: 'bg-blue-50/50' },
          { label: 'Resolved',        value: counts.resolved, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`bg-white rounded-xl border border-gray-100 p-4 shadow-xs text-center ${bg}`}>
            <span className={`text-2xl font-bold ${color}`}>{loading ? '—' : value}</span>
            <p className="text-[11px] font-medium text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                filterStatus === status
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-200 flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Applications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-48" />
                  <div className="h-3 bg-gray-100 rounded w-36" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-xs">
          <Inbox size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">No applications found.</p>
          <p className="text-gray-400 text-xs mt-1">
            Applications submitted by prospective students on the Join Us page will appear here.
          </p>
          {(filterStatus !== 'ALL' || searchTerm) && (
            <button
              onClick={() => { setFilterStatus('ALL'); setSearchTerm(''); }}
              className="mt-3 text-xs text-blue-600 hover:underline cursor-pointer font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const initials = (app.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            const avatarColor = getAvatarColor(app.name);
            const status = (app.status || 'pending').toLowerCase();
            const isUpdating = updatingId === app._id;
            const levelStyle = LEVEL_BADGES[app.currentLevel] || 'bg-gray-50 text-gray-700 border-gray-200';
            const referralText = HEAR_ABOUT_LABELS[app.hearAboutUs] || app.hearAboutUs;

            return (
              <div
                key={app._id}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs hover:shadow-md hover:border-blue-100 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left: Avatar + Details */}
                <div className="flex items-start gap-4 flex-1">
                  {/* Clickable Avatar */}
                  <button
                    onClick={() => handleOpenDetails(app)}
                    title="Click to view application details"
                    className={`w-12 h-12 rounded-full ${avatarColor} text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-400 hover:scale-105 transition-all`}
                  >
                    {initials}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {/* Clickable Name to open popup modal */}
                      <button
                        onClick={() => handleOpenDetails(app)}
                        className="group flex items-center gap-1.5 text-left cursor-pointer"
                        title="Click to open full details popup"
                      >
                        <h3 className="font-bold text-gray-900 text-sm group-hover:text-blue-600 group-hover:underline transition-colors">
                          {app.name}
                        </h3>
                        <ExternalLink size={13} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </button>

                      {app.phone && (
                        <a
                          href={`tel:${app.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 bg-gray-50 hover:bg-blue-50 px-2 py-0.5 rounded-md transition"
                        >
                          <Phone size={11} className="text-gray-400" />
                          <span>{app.phone}</span>
                        </a>
                      )}

                      {app.age && (
                        <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                          Age: {app.age}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-gray-500">
                      <a
                        href={`mailto:${app.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-blue-600 flex items-center gap-1 text-gray-600 truncate"
                      >
                        <Mail size={11} className="shrink-0 text-gray-400" />
                        <span>{app.email}</span>
                      </a>

                      {referralText && (
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Share2 size={10} /> Via: {referralText}
                        </span>
                      )}
                    </div>

                    {/* Program Preferences Tags */}
                    <div className="text-[11px] text-gray-500 mt-2 flex flex-wrap items-center gap-2">
                      {app.currentLevel && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold border ${levelStyle}`}>
                          <BookOpen size={11} />
                          {app.currentLevel}
                        </span>
                      )}

                      {app.preferredTime && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                          <AlarmClock size={11} />
                          {app.preferredTime}
                        </span>
                      )}

                      {app.interests?.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                          <Sparkles size={11} />
                          {app.interests.length} {app.interests.length === 1 ? 'Interest' : 'Interests'}
                        </span>
                      )}

                      {app.message && (
                        <span className="inline-flex items-center gap-1 text-gray-400 text-[11px] italic max-w-xs truncate">
                          <MessageSquare size={10} className="shrink-0" />
                          "{app.message.slice(0, 45)}{app.message.length > 45 ? '...' : ''}"
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Status + Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 shrink-0">
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                      {STATUS_LABELS[status] || status}
                    </span>
                    <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1 justify-end">
                      <Calendar size={10} />
                      {formatDate(app.submittedAt)}
                    </div>
                  </div>

                  {/* Open Details Button */}
                  <button
                    onClick={() => handleOpenDetails(app)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    title="View details popup"
                  >
                    <Eye size={14} />
                    <span>View Details</span>
                  </button>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-1 border-l border-gray-100 pl-2">
                    <button
                      onClick={() => handleListStatusChange(app._id, 'in_progress')}
                      disabled={updatingId === app._id || status === 'in_progress'}
                      className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
                      title="Mark In Progress"
                    >
                      <Clock size={17} />
                    </button>
                    <button
                      onClick={() => handleListStatusChange(app._id, 'resolved')}
                      disabled={updatingId === app._id || status === 'resolved'}
                      className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
                      title="Mark Resolved"
                    >
                      <CheckCircle2 size={17} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* POPUP MODAL: Join Us Application Details                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedApp && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={handleCloseDetails}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-gray-100 overflow-hidden"
          >
            {/* Modal Top Bar */}
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Applicant Details</h3>
                  <p className="text-[11px] text-gray-400">Join Us Application</p>
                </div>
              </div>
              <button
                onClick={handleCloseDetails}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full ${getAvatarColor(selectedApp.name)} text-white font-extrabold flex items-center justify-center text-lg shadow-sm shrink-0`}>
                    {(selectedApp.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-lg font-bold text-gray-900">{selectedApp.name}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${STATUS_STYLES[selectedApp.status || 'pending']}`}>
                        {selectedApp.status || 'pending'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                      <Calendar size={12} className="text-gray-400" />
                      Submitted: {formatDateTime(selectedApp.submittedAt)}
                    </p>
                  </div>
                </div>

                {/* Direct Contact Links */}
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <a
                    href={`mailto:${selectedApp.email}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                  >
                    <Mail size={13} />
                    <span>Email</span>
                  </a>
                  {selectedApp.phone && (
                    <a
                      href={`tel:${selectedApp.phone}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                    >
                      <PhoneCall size={13} />
                      <span>Call</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Grid: Personal Info & Preferences */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Contact & Personal Details */}
                <div className="bg-white rounded-xl border border-gray-200/80 p-4 space-y-3.5 shadow-2xs">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <User size={13} className="text-blue-600" /> Personal Information
                  </h5>

                  <div>
                    <label className="text-[11px] text-gray-400 block font-medium">Full Name</label>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedApp.name || '—'}</p>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400 block font-medium">Email Address</label>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-sm font-medium text-gray-900 break-all">{selectedApp.email || '—'}</p>
                      {selectedApp.email && (
                        <button
                          onClick={() => handleCopy(selectedApp.email, 'Email')}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer shrink-0"
                          title="Copy email"
                        >
                          {copiedField === 'Email' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400 block font-medium">Phone Number</label>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-sm font-medium text-gray-900">{selectedApp.phone || 'Not provided'}</p>
                      {selectedApp.phone && (
                        <button
                          onClick={() => handleCopy(selectedApp.phone, 'Phone')}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer shrink-0"
                          title="Copy phone"
                        >
                          {copiedField === 'Phone' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400 block font-medium">Age</label>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">
                      {selectedApp.age ? `${selectedApp.age} years old` : 'Not specified'}
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400 block font-medium">How they heard about us</label>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">
                      {HEAR_ABOUT_LABELS[selectedApp.hearAboutUs] || selectedApp.hearAboutUs || 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* 2. Korean Program Preferences */}
                <div className="bg-white rounded-xl border border-gray-200/80 p-4 space-y-3.5 shadow-2xs">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <BookOpen size={13} className="text-purple-600" /> Program Preferences
                  </h5>

                  <div>
                    <label className="text-[11px] text-gray-400 block font-medium">Current Korean Level</label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${LEVEL_BADGES[selectedApp.currentLevel] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                        <Award size={13} />
                        {selectedApp.currentLevel || 'Not specified'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400 block font-medium">Preferred Class Time</label>
                    <p className="text-sm font-semibold text-gray-800 mt-1 flex items-center gap-1.5">
                      <AlarmClock size={14} className="text-blue-600" />
                      {selectedApp.preferredTime || 'Flexible / Not specified'}
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400 block font-medium">Contacted Date</label>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">
                      {selectedApp.contactedAt ? formatDateTime(selectedApp.contactedAt) : 'Not contacted yet'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Areas of Interest */}
              <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-2xs">
                <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-2.5">
                  <Sparkles size={13} className="text-amber-500" /> Areas of Interest
                </h5>
                {selectedApp.interests && selectedApp.interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedApp.interests.map((interest, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-lg border border-purple-200"
                      >
                        <Check size={11} className="text-purple-500" />
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No specific interests selected.</p>
                )}
              </div>

              {/* 4. Message / Learning Goals */}
              <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-2xs">
                <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-2">
                  <MessageSquare size={13} className="text-blue-500" /> Additional Message / Goals
                </h5>
                {selectedApp.message ? (
                  <div className="p-3.5 bg-blue-50/40 border border-blue-100 rounded-xl">
                    <p className="text-xs sm:text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {selectedApp.message}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No additional message provided.</p>
                )}
              </div>

              {/* 5. Update Status & Admin Notes */}
              <div className="bg-gray-50/80 rounded-2xl border border-gray-200 p-5 space-y-4">
                {modalError && (
                  <div className="bg-rose-50 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl border border-rose-200 flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0 text-rose-600" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                      <Sparkles size={13} className="text-blue-600" />
                      Update Application Status
                    </h5>
                    <span className="text-[11px] text-gray-500 font-medium">
                      Current:{' '}
                      <strong className="text-gray-800 uppercase tracking-wide">
                        {selectedApp.status || 'pending'}
                      </strong>
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mb-3">
                    Select a new status below, add internal notes if needed, and click <strong>"Save Changes"</strong>:
                  </p>

                  {/* Interactive Status Selector Cards */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      {
                        key: 'new',
                        label: 'New',
                        activeClass: 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-300 shadow-xs',
                        inactiveClass: 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50',
                      },
                      {
                        key: 'in_progress',
                        label: 'In Progress',
                        activeClass: 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300 shadow-xs',
                        inactiveClass: 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50',
                      },
                      {
                        key: 'resolved',
                        label: 'Resolved',
                        activeClass: 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-300 shadow-xs',
                        inactiveClass: 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50',
                      },
                    ].map(({ key, label, activeClass, inactiveClass }) => {
                      const isSelected = modalStatus === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setModalStatus(key)}
                          className={`px-3 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            isSelected ? activeClass : inactiveClass
                          }`}
                        >
                          {isSelected && <Check size={14} className="stroke-[3]" />}
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Internal Admin Notes */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700">
                      Internal Admin Notes
                    </label>
                    <span className="text-[11px] text-gray-400">Visible only to administrators</span>
                  </div>
                  <textarea
                    rows={3}
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    placeholder="Add internal notes about this applicant (e.g., student contacted via phone on Oct 24, preferred morning schedule confirmed)..."
                    className="w-full p-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                </div>

                {/* Prominent Save / Update Button */}
                <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200/80 mt-3">
                  <div className="text-xs text-gray-500">
                    {modalStatus !== (selectedApp.status || 'pending') ? (
                      <span className="text-blue-600 font-semibold flex items-center gap-1">
                        <Check size={13} />
                        Status will change from <span className="uppercase">{selectedApp.status || 'pending'}</span> to <span className="uppercase">{modalStatus}</span>
                      </span>
                    ) : (
                      <span>Current status: <strong className="uppercase">{selectedApp.status || 'pending'}</strong></span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpdateApplication(modalStatus, modalNotes)}
                    disabled={isSaving}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <RotateCw size={14} className="animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Check size={15} />
                        <span>Save Status & Notes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDeleteApplication(selectedApp._id)}
                disabled={updatingId === selectedApp._id}
                className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition font-medium cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Delete Application</span>
              </button>

              <button
                type="button"
                onClick={handleCloseDetails}
                className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KoreanProgramApplications;
