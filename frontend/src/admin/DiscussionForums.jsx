import React, { useState, useEffect, useCallback } from 'react';
import { 
  Pin, 
  Lock, 
  Unlock,
  SlidersHorizontal, 
  Plus, 
  Edit3, 
  Trash2, 
  Globe, 
  Utensils, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight,
  MessageSquare,
  Search,
  RotateCw,
  X,
  AlertCircle,
  Eye,
  CheckCircle,
  Hash,
  Sparkles,
  Send,
  CornerDownRight,
  User,
  ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import discussionForumService from '../services/discussionForumService';
import useAuth from '../context/useAuth';

// Category metadata helper
const CATEGORY_CONFIG = {
  'all': { label: 'All Categories' },
  'general': { label: 'General', bg: 'bg-gray-100 text-gray-700 border-gray-200', icon: MessageSquare },
  'korean-basics': { label: 'Korean Basics', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: Globe },
  'grammar': { label: 'Grammar', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: BookOpen },
  'vocabulary': { label: 'Vocabulary', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: Hash },
  'culture': { label: 'Culture', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Utensils },
  'linguistics': { label: 'Linguistics', bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: Globe },
  'literature': { label: 'Literature', bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: BookOpen },
  'study-tips': { label: 'Study Tips', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Sparkles },
  'other': { label: 'Other', bg: 'bg-gray-100 text-gray-700 border-gray-200', icon: MessageSquare }
};

const LEVEL_STYLES = {
  'beginner': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'intermediate': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'advanced': 'bg-purple-50 text-purple-700 border-purple-200',
  'all': 'bg-sky-50 text-sky-700 border-sky-200'
};

const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'general',
  level: 'all',
  isActive: true,
  isPinned: false,
  isLocked: false,
  tags: ''
};

const DiscussionForums = () => {
  const { user } = useAuth();

  // --- Data State ---
  const [forums, setForums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    pinned: 0,
    locked: 0
  });

  // --- Filter State ---
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedLevel, setSelectedLevel] = useState('All Levels');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');

  // --- Pagination State ---
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const LIMIT = 10;

  // --- Modal & Action State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [forumToDelete, setForumToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // --- Thread / Messages View Modal State ---
  const [selectedForumForThread, setSelectedForumForThread] = useState(null);
  const [threadPosts, setThreadPosts] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [adminMessageText, setAdminMessageText] = useState('');
  const [postingMessage, setPostingMessage] = useState(false);
  const [replyInputs, setReplyInputs] = useState({});
  const [replyingPostId, setReplyingPostId] = useState(null);
  const [submittingReplyId, setSubmittingReplyId] = useState(null);

  // --- Fetch Data ---
  const fetchForumStats = async () => {
    try {
      const res = await discussionForumService.getForumStats();
      if (res?.success && res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.warn('Failed to fetch forum stats:', err);
    }
  };

  const fetchForums = useCallback(async (currentPage = page) => {
    try {
      setLoading(true);

      const filterPayload = {};
      if (selectedCategory && selectedCategory !== 'All Categories') {
        filterPayload.category = selectedCategory;
      }
      if (selectedLevel && selectedLevel !== 'All Levels') {
        filterPayload.level = selectedLevel;
      }
      if (selectedStatus === 'Active') {
        filterPayload.isActive = true;
      } else if (selectedStatus === 'Inactive') {
        filterPayload.isActive = false;
      } else if (selectedStatus === 'Pinned') {
        filterPayload.isPinned = true;
      } else if (selectedStatus === 'Locked') {
        filterPayload.isLocked = true;
      }

      if (search.trim()) {
        filterPayload.search = search.trim();
      }

      const res = await discussionForumService.getAllForums(currentPage, LIMIT, filterPayload);

      if (res?.success) {
        setForums(res.forums || []);
        if (res.pagination) {
          setPage(res.pagination.current || currentPage);
          setTotalPages(res.pagination.pages || 1);
          setTotalItems(res.pagination.total || (res.forums || []).length);
        } else {
          setTotalItems((res.forums || []).length);
        }
      }
    } catch (err) {
      console.error('Error fetching forums:', err);
      toast.error('Failed to load discussion forums');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, selectedCategory, selectedLevel, selectedStatus, search]);

  // Initial load
  useEffect(() => {
    fetchForumStats();
    fetchForums(1);
  }, []);

  // Re-fetch when filter values change
  useEffect(() => {
    setPage(1);
    fetchForums(1);
  }, [selectedCategory, selectedLevel, selectedStatus]);

  // Handle Search submit or Enter
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchForums(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('All Categories');
    setSelectedLevel('All Levels');
    setSelectedStatus('All Statuses');
    setPage(1);
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchForumStats();
    fetchForums(page);
  };

  // --- CRUD Operations ---
  const openCreateModal = () => {
    setModalMode('create');
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (forum) => {
    setModalMode('edit');
    setEditingId(forum._id || forum.id);
    setFormData({
      title: forum.title || '',
      description: forum.description || '',
      category: forum.category || 'general',
      level: forum.level || 'all',
      isActive: forum.isActive !== undefined ? forum.isActive : true,
      isPinned: forum.isPinned || false,
      isLocked: forum.isLocked || false,
      tags: Array.isArray(forum.tags) ? forum.tags.join(', ') : (forum.tags || '')
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please enter both a topic title and description.');
      return;
    }

    try {
      setSubmitting(true);
      const parsedTags = formData.tags
        ? formData.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
        : [];

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        level: formData.level,
        isActive: formData.isActive,
        isPinned: formData.isPinned,
        isLocked: formData.isLocked,
        tags: parsedTags
      };

      if (modalMode === 'create') {
        const res = await discussionForumService.createForum(payload);
        if (res?.success) {
          toast.success(res.message || 'Discussion forum created successfully!');
          setIsModalOpen(false);
          setFormData(EMPTY_FORM);
          fetchForumStats();
          fetchForums(1);
        } else {
          toast.error(res?.message || 'Failed to create forum');
        }
      } else {
        const res = await discussionForumService.updateForum(editingId, payload);
        if (res?.success) {
          toast.success(res.message || 'Forum topic updated successfully!');
          setIsModalOpen(false);
          setFormData(EMPTY_FORM);
          fetchForumStats();
          fetchForums(page);
        } else {
          toast.error(res?.message || 'Failed to update forum');
        }
      }
    } catch (err) {
      console.error('Error saving forum:', err);
      toast.error(err.response?.data?.message || 'An error occurred while saving the forum topic.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Pin
  const handleTogglePin = async (forum) => {
    const id = forum._id || forum.id;
    try {
      const res = await discussionForumService.togglePinForum(id);
      if (res?.success) {
        toast.success(res.message || (forum.isPinned ? 'Topic unpinned' : 'Topic pinned to top'));
        fetchForumStats();
        fetchForums(page);
      } else {
        toast.error('Failed to update pin status');
      }
    } catch (err) {
      console.error('Error toggling pin:', err);
      toast.error('Could not toggle pin status');
    }
  };

  // Toggle Lock
  const handleToggleLock = async (forum) => {
    const id = forum._id || forum.id;
    try {
      const res = await discussionForumService.toggleLockForum(id);
      if (res?.success) {
        toast.success(res.message || (forum.isLocked ? 'Forum unlocked' : 'Forum locked to new replies'));
        fetchForumStats();
        fetchForums(page);
      } else {
        toast.error('Failed to update lock status');
      }
    } catch (err) {
      console.error('Error toggling lock:', err);
      toast.error('Could not toggle lock status');
    }
  };

  // Toggle Active/Inactive
  const handleToggleActive = async (forum) => {
    const id = forum._id || forum.id;
    try {
      const res = await discussionForumService.toggleActiveForum(id);
      if (res?.success) {
        toast.success(res.message || (forum.isActive ? 'Forum deactivated' : 'Forum activated'));
        fetchForumStats();
        fetchForums(page);
      } else {
        toast.error('Failed to update status');
      }
    } catch (err) {
      console.error('Error toggling active:', err);
      toast.error('Could not toggle active status');
    }
  };

  // Delete handlers
  const openDeleteDialog = (forum) => {
    setForumToDelete(forum);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!forumToDelete) return;
    const id = forumToDelete._id || forumToDelete.id;

    try {
      setDeleting(true);
      const res = await discussionForumService.deleteForum(id);
      if (res?.success) {
        toast.success(res.message || 'Discussion forum deleted successfully');
        setIsDeleteModalOpen(false);
        setForumToDelete(null);
        fetchForumStats();
        const targetPage = forums.length === 1 && page > 1 ? page - 1 : page;
        fetchForums(targetPage);
      } else {
        toast.error(res?.message || 'Failed to delete discussion forum');
      }
    } catch (err) {
      console.error('Error deleting forum:', err);
      toast.error('Could not delete forum topic.');
    } finally {
      setDeleting(false);
    }
  };

  // --- Thread / Messages Viewer & Admin Replies ---
  const openThreadModal = async (forum) => {
    setSelectedForumForThread(forum);
    setThreadLoading(true);
    setAdminMessageText('');
    setReplyInputs({});
    setReplyingPostId(null);
    try {
      const res = await discussionForumService.getPostsByForum(forum._id || forum.id);
      if (res?.success && Array.isArray(res.posts)) {
        setThreadPosts(res.posts);
      } else {
        setThreadPosts([]);
      }
    } catch (err) {
      console.error('Failed to load thread messages:', err);
      toast.error('Failed to load forum messages');
    } finally {
      setThreadLoading(false);
    }
  };

  const handlePostAdminMessage = async (e) => {
    e.preventDefault();
    if (!adminMessageText.trim() || !selectedForumForThread) return;
    try {
      setPostingMessage(true);
      const res = await discussionForumService.createPost(
        selectedForumForThread._id || selectedForumForThread.id,
        {
          title: `[Admin Message] ${adminMessageText.trim().substring(0, 30)}`,
          content: adminMessageText.trim()
        }
      );
      if (res?.success) {
        toast.success('Admin message posted to thread!');
        setAdminMessageText('');
        // Reload posts
        const updated = await discussionForumService.getPostsByForum(
          selectedForumForThread._id || selectedForumForThread.id
        );
        if (updated?.success && Array.isArray(updated.posts)) {
          setThreadPosts(updated.posts);
        }
        fetchForums(page);
        fetchForumStats();
      } else {
        toast.error(res?.message || 'Failed to post message');
      }
    } catch (err) {
      console.error('Error posting admin message:', err);
      toast.error('Failed to post message');
    } finally {
      setPostingMessage(false);
    }
  };

  const handleAdminReply = async (postId) => {
    const text = (replyInputs[postId] || '').trim();
    if (!text) {
      toast.error('Please enter reply text');
      return;
    }
    try {
      setSubmittingReplyId(postId);
      const res = await discussionForumService.replyToPost(postId, { content: text });
      if (res?.success) {
        toast.success('Reply added successfully!');
        setReplyInputs(prev => ({ ...prev, [postId]: '' }));
        setReplyingPostId(null);
        // Reload posts
        const updated = await discussionForumService.getPostsByForum(
          selectedForumForThread._id || selectedForumForThread.id
        );
        if (updated?.success && Array.isArray(updated.posts)) {
          setThreadPosts(updated.posts);
        }
      } else {
        toast.error(res?.message || 'Failed to post reply');
      }
    } catch (err) {
      console.error('Error posting reply:', err);
      toast.error('Failed to post reply');
    } finally {
      setSubmittingReplyId(null);
    }
  };

  // Helper for Category icon & badge
  const getCategoryDetails = (cat = 'general') => {
    const normalized = (cat || 'general').toLowerCase().replace(/\s+/g, '-');
    return CATEGORY_CONFIG[normalized] || {
      label: cat,
      bg: 'bg-gray-100 text-gray-700 border-gray-200',
      icon: MessageSquare
    };
  };

  return (
    <div className="space-y-6 relative pb-20">
      {/* ── Top Metric KPI Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Forums */}
        <div className="bg-white p-5 rounded-2xl border-l-4 border-l-blue-600 border border-gray-100 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-xs font-semibold text-gray-500 block">Total Forums</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">
              {stats.total}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <MessageSquare size={19} />
          </div>
        </div>

        {/* Active Now */}
        <div className="bg-white p-5 rounded-2xl border-l-4 border-l-emerald-500 border border-gray-100 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-xs font-semibold text-gray-500 block">Active Now</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">
              {stats.active}
            </span>
          </div>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>

        {/* Pinned Topics */}
        <div className="bg-white p-5 rounded-2xl border-l-4 border-l-purple-600 border border-gray-100 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-xs font-semibold text-gray-500 block">Pinned Topics</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">
              {stats.pinned}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Pin size={18} className="fill-purple-600" />
          </div>
        </div>

        {/* Locked Forums */}
        <div className="bg-white p-5 rounded-2xl border-l-4 border-l-red-500 border border-gray-100 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-xs font-semibold text-gray-500 block">Locked Forums</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">
              {stats.locked}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
            <Lock size={18} />
          </div>
        </div>
      </div>

      {/* ── Search, Filters and Action Bar ─────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search forum topics, keywords, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setPage(1); fetchForums(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </form>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            {/* Refresh */}
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh forum records"
            >
              <RotateCw size={15} className={refreshing ? 'animate-spin text-blue-600' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Create New Forum */}
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm hover:shadow transition-colors cursor-pointer"
            >
              <Plus size={16} />
              <span>New Forum</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filters Bar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">
            <SlidersHorizontal size={14} />
            <span>Filters:</span>
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option>All Categories</option>
            <option value="general">General</option>
            <option value="korean-basics">Korean Basics</option>
            <option value="grammar">Grammar</option>
            <option value="vocabulary">Vocabulary</option>
            <option value="culture">Culture</option>
            <option value="linguistics">Linguistics</option>
            <option value="literature">Literature</option>
            <option value="study-tips">Study Tips</option>
            <option value="other">Other</option>
          </select>

          {/* Level Dropdown */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option>All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="all">All Levels Only</option>
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option>All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Pinned">Pinned Only</option>
            <option value="Locked">Locked Only</option>
          </select>

          {/* Reset Filters */}
          {(search || selectedCategory !== 'All Categories' || selectedLevel !== 'All Levels' || selectedStatus !== 'All Statuses') && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-2 ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Table Section ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RotateCw size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-600">Loading discussion forums...</p>
          </div>
        ) : forums.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare size={44} className="text-gray-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-gray-800 mb-1">No discussion forums found</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
              {search || selectedCategory !== 'All Categories' || selectedLevel !== 'All Levels' || selectedStatus !== 'All Statuses'
                ? 'No forum topics match your search or filter options. Try adjusting filters or resetting.'
                : 'No forum threads exist yet. Click the button below to start your first community forum.'}
            </p>
            {search || selectedCategory !== 'All Categories' || selectedLevel !== 'All Levels' || selectedStatus !== 'All Statuses' ? (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Reset All Filters
              </button>
            ) : (
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Create First Forum
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50/80 text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">FORUM DETAIL</th>
                  <th className="px-6 py-4">CATEGORY</th>
                  <th className="px-6 py-4">LEVEL</th>
                  <th className="px-6 py-4">STATS</th>
                  <th className="px-6 py-4">STATUS</th>
                  <th className="px-6 py-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {forums.map((forum) => {
                  const catConfig = getCategoryDetails(forum.category);
                  const IconComp = catConfig.icon || MessageSquare;
                  const levelClass = LEVEL_STYLES[(forum.level || 'all').toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200';
                  const postCount = forum.postCount || 0;
                  const viewCount = forum.viewCount || 0;

                  return (
                    <tr key={forum._id || forum.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Forum Detail */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3.5">
                          <button
                            type="button"
                            onClick={() => openThreadModal(forum)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${catConfig.bg} hover:scale-105 transition-transform cursor-pointer`}
                            title="Click to view messages & discussion thread"
                          >
                            <IconComp size={18} />
                          </button>
                          <div className="min-w-0 max-w-sm">
                            <div className="flex items-center gap-2">
                              <h4 
                                onClick={() => openThreadModal(forum)}
                                className="font-bold text-gray-900 text-sm leading-snug truncate hover:text-blue-600 transition-colors cursor-pointer"
                                title="Click to view messages and replies"
                              >
                                {forum.title}
                              </h4>
                              {forum.isPinned && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                                  <Pin size={10} className="fill-purple-600" />
                                  PINNED
                                </span>
                              )}
                              {forum.isLocked && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                  <Lock size={10} />
                                  LOCKED
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                              {forum.description}
                            </p>
                            {Array.isArray(forum.tags) && forum.tags.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                {forum.tags.map((t, i) => (
                                  <span key={i} className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${catConfig.bg}`}>
                          {catConfig.label}
                        </span>
                      </td>

                      {/* Level */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize border ${levelClass}`}>
                          {forum.level === 'all' ? 'All Levels' : forum.level}
                        </span>
                      </td>

                      {/* Stats */}
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => openThreadModal(forum)}
                          className="space-y-0.5 text-xs text-left hover:text-blue-600 transition-colors cursor-pointer"
                          title="Click to view student messages"
                        >
                          <span className="font-bold text-gray-900 hover:text-blue-600 block">{postCount} posts</span>
                          <span className="text-gray-400 block">{viewCount} views</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(forum)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer transition-colors ${
                            forum.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                          }`}
                          title={`Click to ${forum.isActive ? 'deactivate' : 'activate'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${forum.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          <span>{forum.isActive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Messages & Replies */}
                          <button
                            onClick={() => openThreadModal(forum)}
                            className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                            title="View Student Messages & Reply"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Toggle Pin */}
                          <button
                            onClick={() => handleTogglePin(forum)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              forum.isPinned
                                ? 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100'
                                : 'bg-white text-gray-400 border-gray-200 hover:text-purple-600 hover:bg-gray-50'
                            }`}
                            title={forum.isPinned ? 'Unpin Topic' : 'Pin to Top'}
                          >
                            <Pin size={14} className={forum.isPinned ? 'fill-purple-600' : ''} />
                          </button>

                          {/* Toggle Lock */}
                          <button
                            onClick={() => handleToggleLock(forum)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              forum.isLocked
                                ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                                : 'bg-white text-gray-400 border-gray-200 hover:text-amber-600 hover:bg-gray-50'
                            }`}
                            title={forum.isLocked ? 'Unlock Forum' : 'Lock Forum'}
                          >
                            {forum.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => openEditModal(forum)}
                            className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-blue-600 hover:bg-gray-50 transition-colors cursor-pointer"
                            title="Edit Forum Topic"
                          >
                            <Edit3 size={14} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => openDeleteDialog(forum)}
                            className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Forum Topic"
                          >
                            <Trash2 size={14} />
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

        {/* ── Pagination Footer ──────────────────────────────────────── */}
        {!loading && forums.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium">
            <span>
              Showing {Math.min((page - 1) * LIMIT + 1, totalItems)} to {Math.min(page * LIMIT, totalItems)} of {totalItems} forums
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchForums(p); }}
                disabled={page <= 1}
                className="p-1.5 text-gray-500 hover:text-gray-800 disabled:opacity-30 rounded-md cursor-pointer disabled:cursor-not-allowed"
                title="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => { setPage(p); fetchForums(p); }}
                  className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center cursor-pointer transition-colors ${
                    p === page
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); fetchForums(p); }}
                disabled={page >= totalPages}
                className="p-1.5 text-gray-500 hover:text-gray-800 disabled:opacity-30 rounded-md cursor-pointer disabled:cursor-not-allowed"
                title="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Floating Action Quick Button ─────────────────────────────── */}
      <button
        onClick={openCreateModal}
        className="fixed bottom-6 right-6 z-40 px-5 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
      >
        <Plus size={16} />
        <span>New Topic</span>
      </button>

      {/* ── CREATE / EDIT FORUM MODAL ───────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-extrabold text-base text-gray-900">
                  {modalMode === 'create' ? 'Create New Forum Topic' : 'Edit Forum Topic'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {modalMode === 'create'
                    ? 'Start a new academic or cultural discussion channel for students.'
                    : 'Modify forum title, tags, category, and access status.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Topic Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Hangul Pronunciation & Batchim Rules"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Description / Guidelines <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide context, study tips, or prompt rules for the discussion..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Category & Level Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="korean-basics">Korean Basics</option>
                    <option value="grammar">Grammar</option>
                    <option value="vocabulary">Vocabulary</option>
                    <option value="culture">Culture</option>
                    <option value="linguistics">Linguistics</option>
                    <option value="literature">Literature</option>
                    <option value="study-tips">Study Tips</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Proficiency Level</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="all">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Tags <span className="text-gray-400 font-normal">(Comma separated)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. hangul, pronunciation, beginner"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Status Toggles */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-2.5">
                <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Forum Configuration
                </span>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Active (Visible to Students)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPinned}
                      onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>Pin to Top</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isLocked}
                      onChange={(e) => setFormData({ ...formData, isLocked: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>Lock Replies</span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <RotateCw size={14} className="animate-spin" />}
                  <span>{modalMode === 'create' ? 'Create Forum' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ──────────────────────────────── */}
      {isDeleteModalOpen && forumToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3.5">
              <AlertCircle size={24} />
            </div>
            <h3 className="font-extrabold text-base text-gray-900 mb-1">
              Delete Discussion Forum?
            </h3>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-gray-800">"{forumToDelete.title}"</span>? This will permanently delete this forum and all student replies.
            </p>

            <div className="flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => { setIsDeleteModalOpen(false); setForumToDelete(null); }}
                disabled={deleting}
                className="w-1/2 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="w-1/2 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting && <RotateCw size={14} className="animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── THREAD / MESSAGES VIEWER & REPLY MODAL ──────────────────── */}
      {selectedForumForThread && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div className="pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-extrabold text-base sm:text-lg text-gray-900 leading-snug">
                    {selectedForumForThread.title}
                  </h3>
                  {selectedForumForThread.isLocked && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                      <Lock size={10} />
                      LOCKED
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {selectedForumForThread.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {threadPosts.length} student {threadPosts.length === 1 ? 'message' : 'messages'}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    Category: <strong className="text-gray-700 capitalize">{selectedForumForThread.category}</strong>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedForumForThread(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Message List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {threadLoading ? (
                <div className="py-12 text-center">
                  <RotateCw size={28} className="animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-gray-500">Loading student messages...</p>
                </div>
              ) : threadPosts.length === 0 ? (
                <div className="py-12 text-center bg-gray-50/60 rounded-xl border border-dashed border-gray-200 p-6">
                  <MessageSquare size={36} className="text-gray-300 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-gray-800">No messages yet</h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
                    Students have not submitted any messages or questions to this forum topic yet. You can post an introductory announcement below!
                  </p>
                </div>
              ) : (
                threadPosts.map((post) => {
                  const author = post.author || {};
                  const isAuthorAdmin = author.role === 'admin' || author.role === 'instructor';
                  const replies = post.replies || [];
                  const isReplying = replyingPostId === post._id;

                  return (
                    <div 
                      key={post._id}
                      className="bg-white border border-gray-100 rounded-xl p-4 shadow-xs space-y-3 hover:border-gray-200 transition-colors"
                    >
                      {/* Post Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isAuthorAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {author.name ? author.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-gray-900">
                                {author.name || 'Student / Community Member'}
                              </span>
                              {isAuthorAdmin ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  <ShieldCheck size={10} />
                                  Admin
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-400 font-medium">Student</span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400">
                              {post.createdAt ? new Date(post.createdAt).toLocaleString() : 'Recently'}
                            </span>
                          </div>
                        </div>

                        {/* Reply trigger button */}
                        <button
                          type="button"
                          onClick={() => setReplyingPostId(isReplying ? null : post._id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <CornerDownRight size={13} />
                          <span>Reply</span>
                        </button>
                      </div>

                      {/* Post Content */}
                      <div className="pl-10 space-y-1">
                        {post.title && post.title !== post.content && (
                          <h5 className="font-bold text-xs text-gray-900">{post.title}</h5>
                        )}
                        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {post.content}
                        </p>
                      </div>

                      {/* Replies List */}
                      {replies.length > 0 && (
                        <div className="ml-10 pt-2 border-t border-gray-100 space-y-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            Replies ({replies.length})
                          </span>
                          {replies.map((reply, rIdx) => {
                            const replyAuthor = reply.author || {};
                            const isReplyAdmin = replyAuthor.role === 'admin' || replyAuthor.role === 'instructor';

                            return (
                              <div
                                key={reply._id || rIdx}
                                className={`p-2.5 rounded-lg text-xs space-y-1 border ${
                                  isReplyAdmin 
                                    ? 'bg-blue-50/60 border-blue-100 text-blue-900' 
                                    : 'bg-gray-50 border-gray-100 text-gray-800'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold flex items-center gap-1">
                                    {replyAuthor.name || 'Respondent'}
                                    {isReplyAdmin && (
                                      <span className="text-[10px] px-1 py-0.2 bg-blue-100 text-blue-700 font-extrabold rounded">
                                        Admin Reply
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    {reply.createdAt ? new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                  </span>
                                </div>
                                <p className="leading-snug">{reply.content}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Inline Reply Input */}
                      {isReplying && (
                        <div className="ml-10 pt-2 flex gap-2">
                          <input
                            type="text"
                            placeholder="Type an official response or reply to this student..."
                            value={replyInputs[post._id] || ''}
                            onChange={(e) => setReplyInputs({ ...replyInputs, [post._id]: e.target.value })}
                            className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAdminReply(post._id);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleAdminReply(post._id)}
                            disabled={submittingReplyId === post._id}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1 shrink-0"
                          >
                            {submittingReplyId === post._id ? (
                              <RotateCw size={12} className="animate-spin" />
                            ) : (
                              <Send size={12} />
                            )}
                            <span>Send</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Broadcast / Admin Message Input at Bottom */}
            <div className="pt-3 border-t border-gray-100">
              <form onSubmit={handlePostAdminMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Post an official announcement or message to this discussion thread..."
                  value={adminMessageText}
                  onChange={(e) => setAdminMessageText(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={postingMessage || !adminMessageText.trim()}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  {postingMessage ? (
                    <RotateCw size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  <span>Post Msg</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscussionForums;
