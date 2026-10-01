import React, { useState } from 'react';
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
  Plus
} from 'lucide-react';

const initialAnnouncements = [
  {
    id: 1,
    title: 'Fall 2024 Enrollment Open',
    meta: 'Published 2 hours ago • By Editor',
    audience: 'All Scholars',
    audienceBg: 'bg-indigo-100 text-indigo-700',
    status: 'Active',
    isPinned: true
  },
  {
    id: 2,
    title: 'Scheduled Server Downtime',
    meta: 'Published 1 day ago • By Admin',
    audience: 'Staff Only',
    audienceBg: 'bg-gray-100 text-gray-700',
    status: 'Scheduled',
    isPinned: false
  },
  {
    id: 3,
    title: 'New Course: Intermediate Hangul',
    meta: 'Published 3 days ago • By Chief Editor',
    audience: 'Intermediate Students',
    audienceBg: 'bg-emerald-100 text-emerald-700',
    status: 'Active',
    isPinned: false
  }
];

const AnnouncementsManager = () => {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState('All Scholars');
  const [priority, setPriority] = useState('High');
  const [pinToTop, setPinToTop] = useState(false);
  const [content, setContent] = useState('');

  const handlePublish = (e) => {
    e.preventDefault();
    if (!title) return;

    const newObj = {
      id: Date.now(),
      title,
      meta: 'Published just now • By Chief Editor',
      audience,
      audienceBg: audience === 'All Scholars' ? 'bg-indigo-100 text-indigo-700' : audience === 'Staff Only' ? 'bg-gray-100 text-gray-700' : 'bg-emerald-100 text-emerald-700',
      status: 'Active',
      isPinned: pinToTop
    };

    setAnnouncements([newObj, ...announcements]);
    setTitle('');
    setContent('');
    setPinToTop(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Announcement Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Broadcast updates, system alerts, and scholarly news to your audience.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer">
            <Archive size={15} />
            <span>View Archived</span>
          </button>
          
          <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer">
            <Megaphone size={16} />
            <span>Post New Broadcast</span>
          </button>
        </div>
      </div>

      {/* Top Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Active Announcements */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Megaphone size={18} />
            </div>
            <span className="text-xs font-semibold text-gray-500 block">Active Announcements</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">24</span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 self-start">
            +12%
          </span>
        </div>

        {/* Pinned Items */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Pin size={18} />
            </div>
            <span className="text-xs font-semibold text-gray-500 block">Pinned Items</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">08</span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 self-start">
            Pinned
          </span>
        </div>

        {/* Reach Analytics Blue Gradient Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-5 rounded-2xl shadow-md flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm">Reach Analytics</h3>
            <p className="text-xs text-blue-100 mt-1">
              Your announcements reached 4,289 active scholars in the last 7 days.
            </p>
          </div>

          <div className="mt-4">
            <div className="w-full bg-blue-900/50 h-2 rounded-full overflow-hidden mb-1.5">
              <div className="bg-white h-full rounded-full" style={{ width: '75%' }} />
            </div>
            <div className="text-[11px] font-bold text-right text-blue-100">
              75% Engagement
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Quick Compose Form */}
        <div className="lg:col-span-4 bg-gray-50/70 rounded-2xl p-5 border border-gray-100/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-gray-900">
            <SlidersHorizontal size={16} className="text-blue-600" />
            <span>Quick Compose</span>
          </div>

          <form onSubmit={handlePublish} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                ANNOUNCEMENT TITLE
              </label>
              <input
                type="text"
                placeholder="E.g. System Maintenance Update"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                AUDIENCE SEGMENT
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="All Scholars">All Scholars</option>
                <option value="Staff Only">Staff Only</option>
                <option value="Intermediate Students">Intermediate Students</option>
              </select>
            </div>

            {/* Priority & Pin Toggle Row */}
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  PRIORITY
                </label>
                <div className="flex bg-white p-1 rounded-xl border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setPriority('Low')}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      priority === 'Low' ? 'bg-blue-600 text-white' : 'text-gray-600'
                    }`}
                  >
                    Low
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('High')}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      priority === 'High' ? 'bg-blue-600 text-white' : 'text-gray-600'
                    }`}
                  >
                    High
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  PIN TO TOP
                </label>
                <button
                  type="button"
                  onClick={() => setPinToTop(!pinToTop)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    pinToTop ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                MESSAGE CONTENT
              </label>
              <textarea
                rows={4}
                placeholder="Draft your detailed announcement here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-blue-600"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Publish Announcement
            </button>
          </form>
        </div>

        {/* Right Column: Recent Announcements Table & Pro Tip */}
        <div className="lg:col-span-8 space-y-6">
          {/* Table Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base text-gray-900">Recent Announcements</h3>
              <div className="flex items-center gap-2">
                <button className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer">
                  <SlidersHorizontal size={16} />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer">
                  <Download size={16} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-gray-50/80 text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3.5">ANNOUNCEMENT</th>
                    <th className="px-5 py-3.5">AUDIENCE</th>
                    <th className="px-5 py-3.5">STATUS</th>
                    <th className="px-5 py-3.5 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {announcements.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          {item.isPinned ? (
                            <Pin size={16} className="text-purple-600 fill-purple-600 shrink-0 mt-0.5" />
                          ) : (
                            <Megaphone size={16} className="text-gray-400 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm leading-snug">
                              {item.title}
                            </h4>
                            <p className="text-[11px] text-gray-400 mt-0.5">{item.meta}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${item.audienceBg}`}>
                          {item.audience}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                          item.status === 'Active' ? 'text-emerald-600' : 'text-gray-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'
                          }`} />
                          {item.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button className="text-gray-400 hover:text-gray-600 text-xs font-bold">
                          ...
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
              <span>Showing 1-10 of 24 announcements</span>

              <div className="flex items-center gap-1">
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
                  <ChevronLeft size={16} />
                </button>
                <button className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  1
                </button>
                <button className="w-6 h-6 rounded-md hover:bg-gray-100 text-gray-700 font-semibold text-xs flex items-center justify-center">
                  2
                </button>
                <button className="w-6 h-6 rounded-md hover:bg-gray-100 text-gray-700 font-semibold text-xs flex items-center justify-center">
                  3
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Pro Tip Card */}
          <div className="bg-white rounded-2xl p-6 border-2 border-blue-600 shadow-xs flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Lightbulb size={24} />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base text-gray-900">
                Pro Tip: Frequency Matters
              </h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Engagement drops by 15% when users receive more than 3 announcements per week. Use the "Pinned" feature for long-term updates instead of reposting.
              </p>
              <a href="#best-practices" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline mt-2">
                <span>Read Publication Best Practices</span>
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsManager;
