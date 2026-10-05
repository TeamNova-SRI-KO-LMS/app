import React, { useState, useEffect } from 'react';
import { 
   History, 
   ChevronLeft, 
   ChevronRight, 
   Pin, 
   Search, 
   Filter, 
   X, 
   RotateCw,
   Calendar,
   Megaphone
} from 'lucide-react';
import toast from 'react-hot-toast';
import announcementService from '../services/announcementService';

const TYPE_CONFIG = {
  events: {
    typeColors: 'bg-purple-100 text-purple-800 border-purple-200',
    label: 'EVENTS'
  },
  event: {
    typeColors: 'bg-purple-100 text-purple-800 border-purple-200',
    label: 'EVENT'
  },
  general: {
    typeColors: 'bg-blue-100 text-blue-800 border-blue-200',
    label: 'GENERAL'
  },
  course: {
    typeColors: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    label: 'COURSE'
  },
  system: {
    typeColors: 'bg-rose-100 text-rose-800 border-rose-200',
    label: 'SYSTEM'
  },
  maintenance: {
    typeColors: 'bg-amber-100 text-amber-800 border-amber-200',
    label: 'MAINTENANCE'
  },
  academic: {
    typeColors: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    label: 'ACADEMIC'
  }
};

const getPriorityStyle = (priority) => {
  const p = (priority || 'medium').toLowerCase();
  switch (p) {
    case 'urgent':
      return { text: 'text-rose-600', dot: 'bg-rose-600' };
    case 'high':
      return { text: 'text-amber-600', dot: 'bg-amber-600' };
    case 'low':
      return { text: 'text-gray-500', dot: 'bg-gray-400' };
    default:
      return { text: 'text-blue-600', dot: 'bg-blue-600' };
  }
};

export default function Announcements() {
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 10
  });
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const fetchAnnouncements = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10
      };
      if (selectedType !== 'all') {
        params.type = selectedType;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await announcementService.getActiveAnnouncements(params);
      if (res.success) {
        setAnnouncements(res.announcements || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error('Error fetching student announcements:', err);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements(1);
  }, [selectedType]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAnnouncements(1);
  };

  const handleOpenAnnouncement = async (item) => {
    setSelectedAnnouncement(item);
    try {
      // Mark as read in backend
      await announcementService.markAsRead(item._id);
    } catch (e) {
      // Silently ignore if unauthenticated
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 flex flex-col">
      {/* Main Content Area */}
      <main className="flex-grow bg-[#f8f9fa] pt-12 sm:pt-16 px-4 sm:px-8 lg:px-16 pb-20">
        <div className="max-w-6xl mx-auto w-full">
            
          {/* Header */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-3 border border-blue-100">
              <Megaphone size={14} />
              <span>Official Institutional Bulletins</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">
              Announcements & Notices
            </h1>
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl">
              Stay updated with the latest institutional news, course updates, exam schedules, and community events from SRI-KO LMS.
            </p>
          </div>

          {/* List Controls / Filter Bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-xs mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-gray-900">
              <History className="w-5 h-5 text-blue-600" />
              <span>Recent Announcements</span>
              {pagination.total > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold ml-1">
                  {pagination.total}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search bar */}
              <form onSubmit={handleSearch} className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-7 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-blue-600 focus:bg-white w-full sm:w-48"
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

              {/* Type Filter Dropdown */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-600 cursor-pointer"
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
                  title="Refresh announcements"
                >
                  <RotateCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
                </button>
              </div>
            </div>
          </div>

          {/* Announcements List */}
          <div className="flex flex-col gap-4 mb-10">
            {loading ? (
              <div className="space-y-4 py-10">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs animate-pulse flex flex-col md:flex-row gap-6">
                    <div className="w-36 h-6 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="w-1/2 h-5 bg-gray-200 rounded" />
                      <div className="w-3/4 h-4 bg-gray-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : announcements.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-200/80 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                  <Megaphone size={28} />
                </div>
                <h3 className="text-base font-bold text-gray-900">No Announcements Found</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
                  {searchQuery || selectedType !== 'all'
                    ? 'No announcements matched your current filters. Try resetting the filters.'
                    : 'Check back soon for new notices and updates from the editorial staff.'}
                </p>
                {(searchQuery || selectedType !== 'all') && (
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedType('all'); }}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              announcements.map((item) => {
                const normType = (item.type || 'general').toLowerCase();
                const config = TYPE_CONFIG[normType] || TYPE_CONFIG.general;
                const priorityInfo = getPriorityStyle(item.priority);
                const formattedDate = item.createdAt 
                  ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Recent';

                return (
                  <div 
                    key={item._id} 
                    onClick={() => handleOpenAnnouncement(item)}
                    className={`bg-white rounded-2xl p-6 border transition-all cursor-pointer hover:shadow-md hover:border-blue-300 flex flex-col md:flex-row items-start md:items-center gap-5 sm:gap-6 ${
                      item.isPinned ? 'border-purple-300 bg-purple-50/20' : 'border-gray-200/80'
                    }`}
                  >
                    {/* Left: Tags & Priority */}
                    <div className="flex items-center gap-3 min-w-[200px] shrink-0">
                      {item.isPinned && (
                        <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700 shrink-0" title="Pinned Announcement">
                          <Pin size={14} className="fill-purple-700" />
                        </span>
                      )}
                      <span className={`${config.typeColors} text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border`}>
                        {config.label}
                      </span>
                      <span className={`flex items-center text-[10px] font-bold uppercase tracking-wider ${priorityInfo.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${priorityInfo.dot}`} />
                        {item.priority || 'MEDIUM'}
                      </span>
                    </div>

                    {/* Middle: Content */}
                    <div className="flex-grow min-w-0">
                      <h3 className="text-gray-900 font-bold text-sm sm:text-base mb-1 hover:text-blue-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">
                        {item.content}
                      </p>
                      {item.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {item.tags.map((tg, idx) => (
                            <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                              #{tg}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: Date */}
                    <div className="text-xs sm:text-sm font-semibold text-gray-400 min-w-[100px] md:text-right shrink-0">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={13} className="text-gray-400" />
                        {formattedDate}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <button 
                onClick={() => fetchAnnouncements(pagination.current - 1)}
                disabled={pagination.current <= 1}
                className="p-2 text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex space-x-1.5">
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

        </div>
      </main>

      {/* Reader Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setSelectedAnnouncement(null)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2">
              {selectedAnnouncement.isPinned && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 flex items-center gap-1.5">
                  <Pin size={12} className="fill-purple-700" />
                  Pinned
                </span>
              )}
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-100 text-blue-800">
                {selectedAnnouncement.type || 'GENERAL'}
              </span>
              <span className="text-xs font-bold text-gray-400 capitalize">
                Audience: {selectedAnnouncement.targetAudience || 'All Scholars'}
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                {selectedAnnouncement.title}
              </h2>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                <span>Published {new Date(selectedAnnouncement.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                {selectedAnnouncement.createdBy?.name && (
                  <span>• By {selectedAnnouncement.createdBy.name}</span>
                )}
              </p>
            </div>

            <div className="p-5 bg-gray-50 rounded-2xl text-xs sm:text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
              {selectedAnnouncement.content}
            </div>

            {selectedAnnouncement.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedAnnouncement.tags.map((t, idx) => (
                  <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg font-medium">
                    #{t}
                  </span>
                ))}
              </div>
            )}

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
      )}
    </div>
  );
}