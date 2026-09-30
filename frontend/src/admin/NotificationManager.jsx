import React, { useState } from 'react';
import { 
  BellRing, 
  Clock, 
  SlidersHorizontal, 
  MoreVertical, 
  RotateCw, 
  Send, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  Sliders
} from 'lucide-react';

const initialSentNotifications = [
  {
    id: 'SN-9042',
    title: 'Spring Enrollment Open',
    type: 'Course Alert',
    typeBg: 'bg-blue-100 text-blue-700',
    audience: 'All Users',
    expiry: '2023-12-15',
    isExpired: false
  },
  {
    id: 'SN-8821',
    title: 'Hangul Day Special',
    type: 'Event Reminder',
    typeBg: 'bg-purple-100 text-purple-700',
    audience: 'Scholars',
    expiry: '2023-10-10',
    isExpired: false
  },
  {
    id: 'SN-8750',
    title: 'v2.4 Patch Notes',
    type: 'System Update',
    typeBg: 'bg-gray-100 text-gray-700',
    audience: 'Editors',
    expiry: 'EXPIRED',
    isExpired: true
  },
  {
    id: 'SN-8612',
    title: 'Terms of Service Update',
    type: 'General',
    typeBg: 'bg-gray-100 text-gray-700',
    audience: 'All Users',
    expiry: '2024-01-01',
    isExpired: false
  }
];

const NotificationManager = () => {
  const [sentList, setSentList] = useState(initialSentNotifications);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('System Update');
  const [priority, setPriority] = useState('Normal');
  const [audience, setAudience] = useState('All Users');
  const [expiryDate, setExpiryDate] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  const handlePublish = (e) => {
    e.preventDefault();
    if (!title) return;

    const newNotification = {
      id: `SN-${Math.floor(1000 + Math.random() * 9000)}`,
      title,
      type,
      typeBg: type === 'Course Alert' ? 'bg-blue-100 text-blue-700' : type === 'Event Reminder' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700',
      audience,
      expiry: expiryDate || '2024-12-31',
      isExpired: false
    };

    setSentList([newNotification, ...sentList]);
    setIsPublished(true);
    setTimeout(() => {
      setTitle('');
      setBody('');
      setExpiryDate('');
      setIsPublished(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block">
            COMMUNICATION HUB
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Notification Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Broadcast critical updates, course alerts, and system status notifications to the SRI-KO educational community.
          </p>
        </div>

        {/* Top Right KPI Cards */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Active Alerts */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <BellRing size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 block uppercase">Active Alerts</span>
              <span className="text-xl font-extrabold text-gray-900 leading-tight">12</span>
            </div>
          </div>

          {/* Expired */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 block uppercase">Expired</span>
              <span className="text-xl font-extrabold text-gray-900 leading-tight">148</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Compose Notification Card */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 leading-tight">Compose Notification</h3>
              <p className="text-xs text-gray-400">Draft a new system-wide alert</p>
            </div>
          </div>

          <form onSubmit={handlePublish} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Notification Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Scheduled System Maintenance"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-100 border border-transparent rounded-xl text-xs sm:text-sm text-gray-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Message Body
              </label>
              <textarea
                rows={4}
                required
                placeholder="Detail the notification content here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-100 border border-transparent rounded-xl text-xs sm:text-sm text-gray-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
              />
            </div>

            {/* Type & Priority Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 border border-transparent rounded-xl text-xs font-semibold text-gray-800 focus:outline-none cursor-pointer"
                >
                  <option value="System Update">System Update</option>
                  <option value="Course Alert">Course Alert</option>
                  <option value="Event Reminder">Event Reminder</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Priority
                </label>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPriority('Normal')}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      priority === 'Normal' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-600'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('Urgent')}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      priority === 'Urgent' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-600'
                    }`}
                  >
                    Urgent
                  </button>
                </div>
              </div>
            </div>

            {/* Audience & Expiry Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Audience
                </label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 border border-transparent rounded-xl text-xs font-semibold text-gray-800 focus:outline-none cursor-pointer"
                >
                  <option value="All Users">All Users</option>
                  <option value="Scholars">Scholars</option>
                  <option value="Editors">Editors</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 border border-transparent rounded-xl text-xs text-gray-800 focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isPublished ? (
                <>
                  <Check size={16} />
                  <span>Published Notification!</span>
                </>
              ) : (
                'Publish Notification'
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Sent Notifications Table Card */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-base text-gray-900">Sent Notifications</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white uppercase tracking-wider">
                  LIVE HISTORY
                </span>
              </div>

              <button className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer">
                <Sliders size={14} />
                <span>Filter</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-gray-50/80 text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3.5">TITLE & STATUS</th>
                    <th className="px-5 py-3.5">TYPE</th>
                    <th className="px-5 py-3.5">AUDIENCE</th>
                    <th className="px-5 py-3.5">EXPIRY</th>
                    <th className="px-5 py-3.5 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sentList.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                            item.isExpired ? 'bg-gray-400' : 'bg-emerald-500'
                          }`} />
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm leading-snug">
                              {item.title}
                            </h4>
                            <span className="text-[10px] text-gray-400 block font-mono">
                              ID: {item.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${item.typeBg}`}>
                          {item.type}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-semibold text-gray-700">
                        {item.audience}
                      </td>

                      <td className="px-5 py-4">
                        <span className={`font-semibold ${
                          item.isExpired ? 'text-red-500 font-bold' : 'text-gray-600'
                        }`}>
                          {item.expiry}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        {item.isExpired ? (
                          <button className="text-gray-400 hover:text-gray-600 cursor-pointer" title="Resend">
                            <RotateCw size={15} />
                          </button>
                        ) : (
                          <button className="text-gray-400 hover:text-gray-600 cursor-pointer">
                            <MoreVertical size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Pagination */}
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Showing 4 of 160 notifications</span>

            <div className="flex items-center gap-2">
              <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold cursor-pointer">
                Previous
              </button>
              <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold cursor-pointer">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationManager;
