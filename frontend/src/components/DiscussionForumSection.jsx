import React, { useState, useEffect } from 'react';
import discussionForumService from '../services/discussionForumService';
import useAuth from '../context/useAuth';
import toast from 'react-hot-toast';
import {
  MessageSquare,
  Pin,
  Lock,
  Search,
  Plus,
  ThumbsUp,
  MessageCircle,
  Eye,
  Send,
  UserCheck,
  ShieldCheck,
  CheckCircle,
  Clock,
  Sparkles,
  X,
  ChevronRight,
  Filter,
  Tag,
  BookOpen
} from 'lucide-react';

export default function DiscussionForumSection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [forums, setForums] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedLevel, setSelectedLevel] = useState('All Levels');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Active selected forum for viewing full thread / posts
  const [activeForum, setActiveForum] = useState(null);
  const [activePosts, setActivePosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [replyText, setReplyText] = useState({});
  
  // Modal states for creating a new post / forum topic (Admin only)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTopicData, setNewTopicData] = useState({
    title: '',
    description: '',
    category: 'general',
    level: 'all',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchForums();
  }, [selectedCategory, selectedLevel, searchQuery]);

  const fetchForums = async () => {
    try {
      setLoading(true);
      const filters = {
        category: selectedCategory,
        level: selectedLevel,
        search: searchQuery
      };
      const res = await discussionForumService.getAllForums(1, 20, filters);
      if (res.success && Array.isArray(res.forums)) {
        setForums(res.forums);
      } else {
        setForums([]);
      }
    } catch (error) {
      console.error('Error loading discussion forums:', error);
      toast.error('Failed to load discussion forums');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenThread = async (forum) => {
    setActiveForum(forum);
    try {
      setPostsLoading(true);
      const res = await discussionForumService.getPostsByForum(forum._id);
      if (res.success && Array.isArray(res.posts)) {
        setActivePosts(res.posts);
      } else {
        setActivePosts([]);
      }
    } catch (error) {
      console.error('Error fetching forum posts:', error);
      toast.error('Failed to load thread posts');
    } finally {
      setPostsLoading(false);
    }
  };

  const handleCreateForumTopic = async (e) => {
    e.preventDefault();
    if (user?.role !== 'admin') {
      toast.error('Only administrators can create new discussion topics.');
      return;
    }

    if (!newTopicData.title.trim() || !newTopicData.description.trim()) {
      toast.error('Please enter both a topic title and description.');
      return;
    }

    try {
      setCreating(true);
      const res = await discussionForumService.createForum({
        ...newTopicData,
        isPinned: true
      });

      if (res.success) {
        toast.success('Official Admin Discussion Topic created successfully!');
        setShowCreateModal(false);
        setNewTopicData({ title: '', description: '', category: 'general', level: 'all' });
        fetchForums();
      } else {
        toast.error(res.message || 'Failed to post topic');
      }
    } catch (error) {
      console.error('Error creating forum topic:', error);
      toast.error('Error creating discussion topic');
    } finally {
      setCreating(false);
    }
  };

  const handleSendReply = async (postId) => {
    const text = replyText[postId];
    if (!text || !text.trim()) {
      toast.error('Reply content cannot be empty');
      return;
    }

    try {
      const res = await discussionForumService.replyToPost(postId, { content: text });
      if (res.success) {
        toast.success('Reply posted successfully');
        setReplyText(prev => ({ ...prev, [postId]: '' }));
        // Refresh posts for current forum
        if (activeForum) {
          const updated = await discussionForumService.getPostsByForum(activeForum._id);
          if (updated.success) setActivePosts(updated.posts);
        }
      }
    } catch (error) {
      console.error('Error replying to post:', error);
      toast.error('Failed to post reply');
    }
  };

  const handleToggleLike = async (postId) => {
    try {
      const res = await discussionForumService.toggleLikePost(postId);
      if (res.success) {
        setActivePosts(prev =>
          prev.map(p => {
            if (p._id === postId) {
              return {
                ...p,
                likeCount: res.likes
              };
            }
            return p;
          })
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const categories = [
    'All Categories',
    'General',
    'Korean Basics',
    'Grammar',
    'Vocabulary',
    'Culture',
    'Study Tips'
  ];

  const levels = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

  const getCategoryBadgeClass = (category) => {
    const cat = category?.toLowerCase();
    if (cat === 'korean-basics' || cat === 'korean basics') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (cat === 'grammar') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (cat === 'vocabulary') return 'bg-purple-50 text-purple-700 border-purple-200';
    if (cat === 'culture') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (cat === 'study-tips' || cat === 'study tips') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <section id="forums" className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100/80 text-blue-800 uppercase tracking-wider">
              <MessageSquare size={13} className="text-blue-600" />
              DISCUSSION FORUMS
            </span>
            {user?.role === 'admin' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                <ShieldCheck size={13} />
                ADMIN MODE
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Official Discussion Forums
          </h2>
          <p className="text-sm text-gray-500 font-medium max-w-2xl leading-relaxed">
            Read official announcements, grammar rules, and discussion threads created by SRI-KO administration and instructors. You can read discussions and join the conversation by posting replies.
          </p>
        </div>

        {/* Only Admin can create new forum topics */}
        {user?.role === 'admin' && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-md transition self-start md:self-auto"
          >
            <Plus size={18} />
            <span>Create Admin Forum Topic</span>
          </button>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search */}
        <div className="sm:col-span-6 bg-gray-50 rounded-2xl px-4 py-2.5 border border-gray-200/80 flex items-center gap-2.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 transition">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search discussion topics, rules, or questions..."
            className="w-full text-xs sm:text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
              <X size={15} />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="sm:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full h-full bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-gray-700 font-semibold text-xs sm:text-sm rounded-2xl px-4 py-2.5 outline-none cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Level Filter */}
        <div className="sm:col-span-3">
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="w-full h-full bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-gray-700 font-semibold text-xs sm:text-sm rounded-2xl px-4 py-2.5 outline-none cursor-pointer"
          >
            {levels.map((lvl) => (
              <option key={lvl} value={lvl}>{lvl}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Forum Cards Listing */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-gray-500">Loading discussion forums...</p>
        </div>
      ) : forums.length === 0 ? (
        <div className="p-10 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 space-y-3">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto" />
          <h4 className="font-bold text-gray-700 text-base">No discussion forums found</h4>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            No discussion topics match your search or filter criteria.
          </p>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
            >
              Create Admin Topic
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {forums.map((forum) => {
            const isAdminForum = forum.createdBy?.role === 'admin';
            return (
              <div
                key={forum._id}
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 group ${
                  forum.isPinned
                    ? 'bg-gradient-to-r from-blue-50/40 via-white to-indigo-50/30 border-blue-200 shadow-xs'
                    : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-md'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    {forum.isPinned && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                        <Pin size={11} className="fill-amber-700" />
                        PINNED TOPIC
                      </span>
                    )}

                    {isAdminForum && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                        <ShieldCheck size={11} />
                        ADMIN OFFICIAL ANNOUNCEMENT
                      </span>
                    )}

                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getCategoryBadgeClass(forum.category)}`}>
                      {forum.category ? forum.category.toUpperCase().replace('-', ' ') : 'GENERAL'}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                      {forum.level ? forum.level.toUpperCase() : 'ALL LEVELS'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {forum.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 font-normal leading-relaxed">
                    {forum.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-400 pt-1 font-medium">
                    <span className="flex items-center gap-1 text-gray-600">
                      <UserCheck size={13} className="text-blue-600" />
                      <strong>{forum.createdBy?.name || 'SRI-KO Faculty'}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={13} />
                      {forum.postCount || 0} Posts
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={13} />
                      {forum.viewCount || 0} Views
                    </span>
                    {forum.lastPost?.date && (
                      <span className="flex items-center gap-1 hidden sm:flex">
                        <Clock size={13} />
                        Active {new Date(forum.lastPost.date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleOpenThread(forum)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-700 font-bold text-xs transition active:scale-95 cursor-pointer"
                  >
                    <span>View Discussions</span>
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Forum Thread Modal / Drawer */}
      {activeForum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/30 text-blue-200 border border-blue-400/30 uppercase">
                    {activeForum.category}
                  </span>
                  {activeForum.createdBy?.role === 'admin' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/30 text-rose-200 border border-rose-400/30">
                      ADMIN THREAD
                    </span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  {activeForum.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                  {activeForum.description}
                </p>
              </div>

              <button
                onClick={() => setActiveForum(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body: Posts list */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6 bg-gray-50/50">
              {postsLoading ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs font-semibold text-gray-500">Fetching messages...</p>
                </div>
              ) : activePosts.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 text-gray-500 space-y-3">
                  <p className="text-xs font-semibold">No messages posted in this forum topic yet.</p>
                  <p className="text-xs text-gray-400">Join the discussion by posting a reply below!</p>
                </div>
              ) : (
                activePosts.map((post) => {
                  const isPostAdmin = post.author?.role === 'admin';
                  return (
                    <div
                      key={post._id}
                      className={`p-5 rounded-2xl border shadow-xs space-y-4 ${
                        isPostAdmin
                          ? 'bg-gradient-to-br from-rose-50/50 via-white to-amber-50/30 border-rose-200'
                          : 'bg-white border-gray-200/80'
                      }`}
                    >
                      {/* Post Author Info */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs overflow-hidden">
                            {post.author?.avatar ? (
                              <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
                            ) : (
                              post.author?.name?.charAt(0) || 'U'
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-gray-900 text-sm">{post.author?.name || 'SRI-KO Member'}</h4>
                              {isPostAdmin && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-600 text-white uppercase tracking-wider">
                                  ADMIN NOTICE
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-400">
                              {new Date(post.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleLike(post._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-xs font-bold text-gray-600 transition cursor-pointer"
                        >
                          <ThumbsUp size={14} />
                          <span>{post.likeCount || 0}</span>
                        </button>
                      </div>

                      {/* Post Title & Content */}
                      <div className="space-y-1">
                        <h5 className="font-bold text-gray-900 text-sm">{post.title}</h5>
                        <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {post.content}
                        </p>
                      </div>

                      {/* Replies List */}
                      {post.replies && post.replies.length > 0 && (
                        <div className="pl-4 border-l-2 border-blue-200 space-y-3 pt-2">
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                            REPLIES ({post.replies.length})
                          </span>
                          {post.replies.map((rep, idx) => (
                            <div key={idx} className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-800">
                                  {rep.author?.name || 'Student'}
                                  {rep.author?.role === 'admin' && (
                                    <span className="ml-1 text-[9px] text-rose-600 font-extrabold uppercase">
                                      (Admin)
                                    </span>
                                  )}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-gray-600 leading-normal">{rep.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Input for Users */}
                      <div className="flex gap-2 pt-2">
                        <input
                          type="text"
                          value={replyText[post._id] || ''}
                          onChange={(e) => setReplyText(prev => ({ ...prev, [post._id]: e.target.value }))}
                          placeholder="Write a reply..."
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSendReply(post._id);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSendReply(post._id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <Send size={13} />
                          <span>Reply</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Add Message to current forum thread */}
            <div className="p-4 border-t border-gray-100 bg-white">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target;
                  const content = form.messageContent.value.trim();
                  if (!content) return;
                  try {
                    const res = await discussionForumService.createPost(activeForum._id, {
                      content,
                      title: user?.role === 'admin' ? `[Admin Message] ${content.substring(0, 30)}` : content.substring(0, 30)
                    });
                    if (res.success) {
                      toast.success(user?.role === 'admin' ? 'Admin Message posted!' : 'Reply posted!');
                      form.reset();
                      const updated = await discussionForumService.getPostsByForum(activeForum._id);
                      if (updated.success) setActivePosts(updated.posts);
                    }
                  } catch (err) {
                    toast.error('Failed to post message');
                  }
                }}
                className="flex gap-2"
              >
                <input
                  name="messageContent"
                  type="text"
                  placeholder={user?.role === 'admin' ? "Post an Admin Message or announcement to this thread..." : "Post a response or reply to this discussion thread..."}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Send size={15} />
                  <span>{user?.role === 'admin' ? 'Post Admin Msg' : 'Reply'}</span>
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* Admin Only Modal: Create New Forum Topic */}
      {showCreateModal && user?.role === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">
                  Create Admin Discussion Topic
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateForumTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Topic Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Official Announcement: Course Q&A Thread"
                  value={newTopicData.title}
                  onChange={(e) => setNewTopicData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={newTopicData.category}
                    onChange={(e) => setNewTopicData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm bg-white outline-none cursor-pointer"
                  >
                    <option value="general">General</option>
                    <option value="korean-basics">Korean Basics</option>
                    <option value="grammar">Grammar</option>
                    <option value="vocabulary">Vocabulary</option>
                    <option value="culture">Culture</option>
                    <option value="study-tips">Study Tips</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Target Level
                  </label>
                  <select
                    value={newTopicData.level}
                    onChange={(e) => setNewTopicData(prev => ({ ...prev, level: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm bg-white outline-none cursor-pointer"
                  >
                    <option value="all">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Detailed Announcement / Message *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter official admin discussion topic instructions..."
                  value={newTopicData.description}
                  onChange={(e) => setNewTopicData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition disabled:opacity-60 cursor-pointer"
                >
                  {creating ? 'Publishing...' : 'Publish Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
}
