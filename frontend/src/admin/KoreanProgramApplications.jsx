import React, { useState } from 'react';
import { Globe, Clock, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';

const initialApplications = [
  { id: '1', name: 'Aruni Madushani', email: 'aruni@example.com', level: 'Intermediate', interests: 3, date: 'Nov 14, 2023', status: 'PENDING', phone: '+94 77 123 4567' },
  { id: '2', name: 'Kasun Perera', email: 'kasun.p@example.com', level: 'Beginner', interests: 1, date: 'Nov 12, 2023', status: 'ENROLLED', phone: '+94 71 987 6543' },
  { id: '3', name: 'Dilani Samarasinghe', email: 'dilani.s@gmail.com', level: 'Advanced', interests: 4, date: 'Nov 10, 2023', status: 'PENDING', phone: '+94 70 456 7890' },
  { id: '4', name: 'Chamara Wickramasinghe', email: 'chamara.w@outlook.com', level: 'Beginner', interests: 2, date: 'Nov 09, 2023', status: 'ENROLLED', phone: '+94 78 321 6549' },
  { id: '5', name: 'Nethmi Fernando', email: 'nethmi.f@yahoo.com', level: 'Intermediate', interests: 2, date: 'Nov 08, 2023', status: 'REJECTED', phone: '+94 76 555 1234' }
];

const KoreanProgramApplications = () => {
  const [applications, setApplications] = useState(initialApplications);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const handleStatusChange = (id, newStatus) => {
    setApplications(applications.map(app => 
      app.id === id ? { ...app, status: newStatus } : app
    ));
  };

  const filteredApps = applications.filter(app => {
    const matchesFilter = filterStatus === 'ALL' || app.status === filterStatus;
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Korean Program Applications</h2>
          <p className="text-xs sm:text-sm text-gray-500">Review student enrollment requests for language and exchange programs.</p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search applicant name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'PENDING', 'ENROLLED', 'REJECTED'].map((status) => (
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

      {/* Applications List */}
      <div className="space-y-3">
        {filteredApps.map((app) => {
          const initials = app.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
          return (
            <div
              key={app.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                  {initials}
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-gray-900 text-sm">{app.name}</h3>
                    <span className="text-xs text-gray-400">({app.phone})</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{app.email}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Level: <span className="font-medium text-gray-600">{app.level}</span> | Interests: <span className="font-medium text-gray-600">{app.interests}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0">
                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                      app.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : app.status === 'ENROLLED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {app.status}
                  </span>
                  <div className="text-[11px] text-gray-400 mt-1">{app.date}</div>
                </div>

                {app.status === 'PENDING' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStatusChange(app.id, 'ENROLLED')}
                      className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                      title="Approve / Enroll"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                    <button
                      onClick={() => handleStatusChange(app.id, 'REJECTED')}
                      className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
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
    </div>
  );
};

export default KoreanProgramApplications;
