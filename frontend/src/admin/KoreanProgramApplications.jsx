import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe, Clock, CheckCircle2, XCircle, Search, RotateCw, Inbox,
  Phone, Mail, Calendar, BookOpen, AlarmClock
} from 'lucide-react';
import apiService from '../services/apiService';

const STATUS_STYLES = {
  pending:   'bg-amber-100 text-amber-800',
  contacted: 'bg-blue-100 text-blue-800',
  enrolled:  'bg-emerald-100 text-emerald-800',
  rejected:  'bg-red-100 text-red-800',
};

const AVATAR_COLORS = [
  'bg-purple-600', 'bg-indigo-600', 'bg-rose-600',
  'bg-teal-600',   'bg-sky-600',    'bg-orange-600',
];

function getAvatarColor(name = '') {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

const FILTERS = ['ALL', 'PENDING', 'CONTACTED', 'ENROLLED', 'REJECTED'];

const KoreanProgramApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (filterStatus !== 'ALL') params.set('status', filterStatus.toLowerCase());
      if (searchTerm.trim()) params.set('search', searchTerm.trim());

      const res = await apiService.get(`/join-us?${params.toString()}`);
      if (res.data?.success) {
        setApplications(res.data.data || []);
        setTotal(res.data.total || 0);
      }

      // Fetch pending count
      const recentRes = await apiService.get('/join-us/recent?limit=1');
      if (recentRes.data?.success) {
        setPendingCount(recentRes.data.pending || 0);
        setTotal(recentRes.data.total || 0);
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

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const res = await apiService.patch(`/join-us/${id}/status`, { status: newStatus });
      if (res.data?.success) {
        setApplications(prev =>
          prev.map(app => app._id === id ? { ...app, status: newStatus } : app)
        );
        // Update pending count
        if (newStatus !== 'pending') {
          setPendingCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Korean Program Applications</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Review and manage student enrollment requests for language programs.
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
          { label: 'Total Applications', value: total, color: 'indigo' },
          { label: 'Pending',   value: applications.filter(a => a.status === 'pending').length,   color: 'amber' },
          { label: 'Enrolled',  value: applications.filter(a => a.status === 'enrolled').length,  color: 'emerald' },
          { label: 'Rejected',  value: applications.filter(a => a.status === 'rejected').length,  color: 'red' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-xs text-center">
            <span className={`text-xl font-bold text-${color}-600`}>{loading ? '—' : value}</span>
            <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
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

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-200">
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
          {(filterStatus !== 'ALL' || searchTerm) && (
            <button
              onClick={() => { setFilterStatus('ALL'); setSearchTerm(''); }}
              className="mt-3 text-xs text-blue-600 hover:underline cursor-pointer"
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

            return (
              <div
                key={app._id}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left: Avatar + Info */}
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full ${avatarColor} text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0`}>
                    {initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-sm">{app.name}</h3>
                      {app.phone && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Phone size={11} /> {app.phone}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Mail size={11} className="shrink-0" /> {app.email}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1 flex flex-wrap gap-3">
                      {app.currentLevel && (
                        <span className="flex items-center gap-1">
                          <BookOpen size={11} />
                          <span className="font-medium text-gray-600">{app.currentLevel}</span>
                        </span>
                      )}
                      {app.interests?.length > 0 && (
                        <span>Interests: <span className="font-medium text-gray-600">{app.interests.length}</span></span>
                      )}
                      {app.preferredTime && (
                        <span className="flex items-center gap-1">
                          <AlarmClock size={11} />
                          <span className="font-medium text-gray-600">{app.preferredTime}</span>
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right: Status + Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 shrink-0">
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-700'}`}>
                      {status}
                    </span>
                    <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1 justify-end">
                      <Calendar size={10} />
                      {formatDate(app.submittedAt)}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {status === 'pending' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleStatusChange(app._id, 'enrolled')}
                        disabled={isUpdating}
                        className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="Approve / Enroll"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                      <button
                        onClick={() => handleStatusChange(app._id, 'contacted')}
                        disabled={isUpdating}
                        className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="Mark as Contacted"
                      >
                        <Phone size={18} />
                      </button>
                      <button
                        onClick={() => handleStatusChange(app._id, 'rejected')}
                        disabled={isUpdating}
                        className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="Reject"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KoreanProgramApplications;
