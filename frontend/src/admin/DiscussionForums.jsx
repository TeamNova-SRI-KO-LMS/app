import React, { useState } from 'react';
import { 
  Pin, 
  Lock, 
  SlidersHorizontal, 
  Plus, 
  Edit3, 
  Trash2, 
  Globe, 
  Utensils, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight,
  MessageSquare
} from 'lucide-react';

const initialForums = [
  {
    id: 1,
    title: 'Common Honorifics',
    description: 'Discussion on polite speech levels in...',
    category: 'Linguistics',
    level: 'Intermediate',
    levelBg: 'bg-indigo-100 text-indigo-700',
    posts: '1,242',
    status: 'Active',
    isPinned: true,
    icon: Globe,
    iconBg: 'bg-blue-100 text-blue-600'
  },
  {
    id: 2,
    title: 'Traditional Cuisine',
    description: 'Exploring the regional variations of...',
    category: 'Culture',
    level: 'Beginner',
    levelBg: 'bg-emerald-100 text-emerald-700',
    posts: '843',
    status: 'Locked',
    isPinned: false,
    icon: Utensils,
    iconBg: 'bg-purple-100 text-purple-600'
  },
  {
    id: 3,
    title: 'Joseon Dynasty Poetry',
    description: 'Advanced literary analysis of classic Sij...',
    category: 'Literature',
    level: 'Advanced',
    levelBg: 'bg-purple-100 text-purple-700',
    posts: '312',
    status: 'Active',
    isPinned: false,
    icon: BookOpen,
    iconBg: 'bg-emerald-100 text-emerald-600'
  }
];

const DiscussionForums = () => {
  const [forums, setForums] = useState(initialForums);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedLevel, setSelectedLevel] = useState('All Levels');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Linguistics');
  const [newLevel, setNewLevel] = useState('Beginner');

  const handleDelete = (id) => {
    setForums(forums.filter(f => f.id !== id));
  };

  const handleTogglePin = (id) => {
    setForums(forums.map(f => f.id === id ? { ...f, isPinned: !f.isPinned } : f));
  };

  const handleCreateForum = (e) => {
    e.preventDefault();
    if (!newTitle) return;
    const forumObj = {
      id: Date.now(),
      title: newTitle,
      description: 'Community discussion thread...',
      category: newCategory,
      level: newLevel,
      levelBg: newLevel === 'Beginner' ? 'bg-emerald-100 text-emerald-700' : newLevel === 'Intermediate' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700',
      posts: '0',
      status: 'Active',
      isPinned: false,
      icon: MessageSquare,
      iconBg: 'bg-blue-100 text-blue-600'
    };
    setForums([forumObj, ...forums]);
    setNewTitle('');
    setShowNewModal(false);
  };

  return (
    <div className="space-y-6 relative pb-16">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Forums */}
        <div className="bg-white p-5 rounded-2xl border-l-4 border-l-blue-600 border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 block">Total Forums</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">124</span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600">
            +12%
          </span>
        </div>

        {/* Active Now */}
        <div className="bg-white p-5 rounded-2xl border-l-4 border-l-emerald-500 border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 block">Active Now</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">86</span>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>

        {/* Pinned Topics */}
        <div className="bg-white p-5 rounded-2xl border-l-4 border-l-purple-600 border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 block">Pinned Topics</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">12</span>
          </div>
          <Pin size={18} className="text-purple-600 fill-purple-600" />
        </div>

        {/* Locked Forums */}
        <div className="bg-white p-5 rounded-2xl border-l-4 border-l-red-500 border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 block">Locked Forums</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">5</span>
          </div>
          <Lock size={18} className="text-red-500" />
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-transparent rounded-xl text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
          >
            <option>All Categories</option>
            <option>Linguistics</option>
            <option>Culture</option>
            <option>Literature</option>
          </select>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-transparent rounded-xl text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
          >
            <option>All Levels</option>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>

          <button className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl cursor-pointer">
            <SlidersHorizontal size={16} />
          </button>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-colors cursor-pointer"
        >
          <Plus size={16} />
          <span>New Forum</span>
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50/80 text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">FORUM DETAIL</th>
                <th className="px-6 py-4">CATEGORY</th>
                <th className="px-6 py-4">LEVEL</th>
                <th className="px-6 py-4">POSTS</th>
                <th className="px-6 py-4">STATUS</th>
                <th className="px-6 py-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {forums.map((forum) => {
                const IconComponent = forum.icon || MessageSquare;
                return (
                  <tr key={forum.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${forum.iconBg}`}>
                          <IconComponent size={18} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm leading-snug">
                            {forum.title}
                          </h4>
                          <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">
                            {forum.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {forum.category}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${forum.levelBg}`}>
                        {forum.level}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-bold text-gray-900">
                      {forum.posts}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                        forum.status === 'Active' ? 'text-emerald-600' : 'text-gray-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          forum.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'
                        }`} />
                        {forum.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button className="text-gray-400 hover:text-gray-600 cursor-pointer">
                          <Edit3 size={15} />
                        </button>
                        <button 
                          onClick={() => handleTogglePin(forum.id)}
                          className={`cursor-pointer ${forum.isPinned ? 'text-purple-600 fill-purple-600' : 'text-gray-400 hover:text-purple-600'}`}
                        >
                          <Pin size={15} />
                        </button>
                        <button 
                          onClick={() => handleDelete(forum.id)}
                          className="text-red-400 hover:text-red-600 cursor-pointer"
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

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium">
          <span>Showing 1 to 10 of 124 forums</span>

          <div className="flex items-center gap-1">
            <button className="p-1 text-gray-400 hover:text-gray-600 rounded-md cursor-pointer">
              <ChevronLeft size={16} />
            </button>
            <button className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              1
            </button>
            <button className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-700 font-semibold text-xs flex items-center justify-center cursor-pointer">
              2
            </button>
            <button className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-700 font-semibold text-xs flex items-center justify-center cursor-pointer">
              3
            </button>
            <span className="px-1 text-gray-400">...</span>
            <button className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-700 font-semibold text-xs flex items-center justify-center cursor-pointer">
              13
            </button>
            <button className="p-1 text-gray-400 hover:text-gray-600 rounded-md cursor-pointer">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowNewModal(true)}
        className="fixed bottom-6 right-6 z-40 px-5 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xs sm:text-sm shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
      >
        <MessageSquare size={16} />
        <span>Quick Forum</span>
      </button>

      {/* Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h3 className="font-bold text-base text-gray-900 mb-4">Create New Forum Topic</h3>
            <form onSubmit={handleCreateForum} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Topic Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hangul Pronunciation Rules"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
                >
                  <option value="Linguistics">Linguistics</option>
                  <option value="Culture">Culture</option>
                  <option value="Literature">Literature</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Level</label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Create Forum
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscussionForums;
