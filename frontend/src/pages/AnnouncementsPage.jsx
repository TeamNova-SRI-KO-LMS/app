import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Pin,
  Search,
  X,
  RotateCw,
  Calendar,
  Megaphone,
  ArrowRight,
  ImageOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import announcementService from '../services/announcementService';
import { baseUrl } from '../config/apiConfig';

const TYPE_CONFIG = {
  events:      { bg: '#7c3aed', label: 'EVENTS' },
  event:       { bg: '#7c3aed', label: 'EVENT' },
  general:     { bg: '#2563eb', label: 'GENERAL' },
  course:      { bg: '#059669', label: 'COURSE' },
  system:      { bg: '#e11d48', label: 'SYSTEM' },
  maintenance: { bg: '#d97706', label: 'MAINTENANCE' },
  academic:    { bg: '#4f46e5', label: 'ACADEMIC' }
};

export default function AnnouncementsPage() {
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0, limit: 12 });
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const fetchAnnouncements = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 12 };
      if (selectedType !== 'all') params.type = selectedType;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await announcementService.getActiveAnnouncements(params);
      if (res.success) {
        setAnnouncements(res.announcements || []);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnnouncements(1); }, [selectedType]);

  const handleSearch = (e) => { e.preventDefault(); fetchAnnouncements(1); };

  const handleOpenAnnouncement = async (item) => {
    setSelectedAnnouncement(item);
    try { await announcementService.markAsRead(item._id); } catch (e) { /* ignore */ }
  };

  const getTypeConfig = (type) => TYPE_CONFIG[(type || 'general').toLowerCase()] || TYPE_CONFIG.general;

  const formatDate = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'Recent';

  const thumbnailSrc = (item) => {
    const src = item.photo || item.thumbnail;
    if (!src) return null;
    return src.startsWith('http') ? src : `${baseUrl}${src}`;
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] font-sans text-gray-800">
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-12 pb-20">

        {/* ── Header ── */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-3 border border-blue-100">
            <Megaphone size={14} />
            <span>Official Institutional Bulletins</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">
            Announcements &amp; Notices
          </h1>
          <p className="text-gray-500 text-base sm:text-lg max-w-2xl">
            Stay updated with the latest institutional news, course updates, exam schedules, and community events from SRI-KO LMS.
          </p>
        </div>

        {/* ── Filter / Search bar ── */}
        <div className="bg-white rounded-2xl px-5 py-4 border border-gray-200 shadow-sm mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900">
            <span>All Announcements</span>
            {pagination.total > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold ml-1">
                {pagination.total}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search notices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-7 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:bg-white w-full sm:w-48"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); fetchAnnouncements(1); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={12} />
                </button>
              )}
            </form>

            {/* Category filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="general">General</option>
              <option value="course">Course</option>
              <option value="event">Events</option>
              <option value="system">System</option>
              <option value="maintenance">Maintenance</option>
              <option value="academic">Academic</option>
            </select>

            <button
              onClick={() => fetchAnnouncements(pagination.current)}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              title="Refresh"
            >
              <RotateCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
            </button>
          </div>
        </div>

        {/* ── Card Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="w-full h-48 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 rounded w-full" />
                  <div className="h-4 bg-gray-100 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-200 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <Megaphone size={28} />
            </div>
            <h3 className="text-base font-bold text-gray-900">No Announcements Found</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
              {searchQuery || selectedType !== 'all'
                ? 'No announcements matched your current filters. Try resetting.'
                : 'Check back soon for new notices and updates from the editorial staff.'}
            </p>
            {(searchQuery || selectedType !== 'all') && (
              <button
                onClick={() => { setSearchQuery(''); setSelectedType('all'); }}
                className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {announcements.map((item) => {
              const cfg = getTypeConfig(item.type);
              const thumb = thumbnailSrc(item);
              const dateStr = formatDate(item.startDate || item.createdAt);

              return (
                <div
                  key={item._id}
                  onClick={() => handleOpenAnnouncement(item)}
                  className={`group bg-white rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer hover:shadow-xl hover:-translate-y-1 flex flex-col ${
                    item.isPinned ? 'border-purple-200 ring-2 ring-purple-100' : 'border-gray-100'
                  }`}
                >
                  {/* ── Thumbnail ── */}
                  <div className="relative w-full h-48 bg-gray-100 overflow-hidden flex-shrink-0">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    {/* Fallback placeholder shown when no image or image fails */}
                    <div
                      className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
                      style={{ display: thumb ? 'none' : 'flex' }}
                    >
                      <ImageOff size={36} className="text-gray-300" />
                    </div>

                    {/* Type badge overlay */}
                    <span
                      className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-white text-[10px] font-bold uppercase tracking-widest"
                      style={{ backgroundColor: cfg.bg }}
                    >
                      {cfg.label}
                    </span>

                    {/* Pin badge */}
                    {item.isPinned && (
                      <span className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/90 text-purple-600 shadow-sm">
                        <Pin size={13} className="fill-purple-600" />
                      </span>
                    )}
                  </div>

                  {/* ── Content ── */}
                  <div className="p-5 flex flex-col flex-grow">
                    {/* Date */}
                    <p className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium mb-2">
                      <Calendar size={12} />
                      {dateStr}
                    </p>

                    {/* Title */}
                    <h3 className="text-gray-900 font-bold text-base leading-snug mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-gray-500 text-sm line-clamp-2 flex-grow">
                      {item.content}
                    </p>

                    {/* Tags */}
                    {item.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {item.tags.slice(0, 3).map((tg, idx) => (
                          <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                            #{tg}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* CTA link */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <span className="inline-flex items-center gap-1.5 text-blue-600 text-xs font-bold hover:gap-2.5 transition-all">
                        Read More <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => fetchAnnouncements(pagination.current - 1)}
              disabled={pagination.current <= 1}
              className="p-2 text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex gap-1.5">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => fetchAnnouncements(pg)}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    pagination.current === pg
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {pg}
                </button>
              ))}
            </div>

            <button
              onClick={() => fetchAnnouncements(pagination.current + 1)}
              disabled={pagination.current >= pagination.pages}
              className="p-2 text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </main>

      {/* ── Detail Modal ── */}
      {selectedAnnouncement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedAnnouncement(null); }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden">
            {/* Thumbnail header */}
            {thumbnailSrc(selectedAnnouncement) && (
              <div className="w-full h-52 overflow-hidden">
                <img
                  src={thumbnailSrc(selectedAnnouncement)}
                  alt={selectedAnnouncement.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-6 sm:p-8 space-y-4 relative">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {selectedAnnouncement.isPinned && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 flex items-center gap-1.5">
                    <Pin size={12} className="fill-purple-700" /> Pinned
                  </span>
                )}
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold text-white uppercase"
                  style={{ backgroundColor: getTypeConfig(selectedAnnouncement.type).bg }}
                >
                  {getTypeConfig(selectedAnnouncement.type).label}
                </span>
                <span className="text-xs font-bold text-gray-400 capitalize">
                  Audience: {selectedAnnouncement.targetAudience || 'All Scholars'}
                </span>
              </div>

              {/* Title & date */}
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                  {selectedAnnouncement.title}
                </h2>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                  <Calendar size={12} />
                  <span>Published {formatDate(selectedAnnouncement.createdAt)}</span>
                  {selectedAnnouncement.createdBy?.name && (
                    <span>• By {selectedAnnouncement.createdBy.name}</span>
                  )}
                </p>
              </div>

              {/* Content */}
              <div className="p-5 bg-gray-50 rounded-2xl text-xs sm:text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                {selectedAnnouncement.content}
              </div>

              {/* Tags */}
              {selectedAnnouncement.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedAnnouncement.tags.map((t, idx) => (
                    <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg font-medium">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Close */}
              <div className="flex justify-end pt-3 border-t border-gray-100">
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}