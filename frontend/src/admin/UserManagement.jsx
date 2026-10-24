import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserPlus, 
  Trash2, 
  Edit2, 
  Shield, 
  Mail, 
  X, 
  ChevronDown, 
  Loader2,
  Eye,
  Phone,
  MapPin,
  Globe,
  ExternalLink,
  Link2,
  Calendar,
  BookOpen,
  Copy,
  Check,
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';
import UserAvatar from '../components/UserAvatar';

const LinkedinIcon = ({ size = 14, className = "text-blue-600 shrink-0" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
  </svg>
);

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Student' });

  const [loading, setLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [error, setError] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  // Close popup modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setViewingUser(null);
    };
    if (viewingUser) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [viewingUser]);

  const handleCopy = (text, keyName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    toast.success(`${keyName} copied to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.get('/users');
      if (response.data?.data) {
        const apiUsers = response.data.data.map(u => ({
          ...u,
          id: u._id || u.id,
          name: u.name || 'User',
          email: u.email,
          role: u.role === 'admin' ? 'Admin' : u.role === 'instructor' ? 'Instructor' : 'Student',
          rawRole: u.role,
          status: u.isActive !== false ? 'Active' : 'Inactive',
          joinedDate: new Date(u.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          coursesEnrolled: Array.isArray(u.enrolledCourses) ? u.enrolledCourses.length : 0,
          enrolledCoursesList: Array.isArray(u.enrolledCourses) ? u.enrolledCourses : [],
          avatar: u.avatar || null,
          phone: u.phone || '',
          location: u.location || '',
          bio: u.bio || '',
          website: u.website || '',
          linkedin: u.socialLinks?.linkedin || '',
          socialLinks: u.socialLinks || {},
          createdAt: u.createdAt,
          updatedAt: u.updatedAt
        }));
        setUsers(apiUsers);
      }
    } catch (err) {
      console.error('Error fetching users from database:', err);
      setError('Failed to fetch users from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || (user.role || '').toLowerCase() === filterRole.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (userId, newRole) => {
    const previousUsers = [...users];
    const userToUpdate = users.find(u => u.id === userId);
    const userName = userToUpdate ? userToUpdate.name : 'User';

    // Optimistically update the UI
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    if (viewingUser && viewingUser.id === userId) {
      setViewingUser(prev => ({ ...prev, role: newRole }));
    }
    setUpdatingUserId(userId);
    setError(null);

    try {
      await apiService.put(`/users/${userId}`, {
        role: newRole.toLowerCase()
      });
      toast.success(`Role for ${userName} changed to ${newRole} successfully`);
    } catch (err) {
      console.error('Error updating user role:', err);
      // Revert optimistic update on failure
      setUsers(previousUsers);
      setError(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    try {
      const response = await apiService.post('/users', {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role.toLowerCase()
      });

      if (response.data?.data) {
        const u = response.data.data;
        const createdUser = {
          ...u,
          id: u._id || u.id,
          name: u.name,
          email: u.email,
          role: u.role === 'admin' ? 'Admin' : u.role === 'instructor' ? 'Instructor' : 'Student',
          rawRole: u.role,
          status: 'Active',
          joinedDate: new Date(u.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          coursesEnrolled: 0,
          enrolledCoursesList: [],
          avatar: u.avatar || null,
          phone: '',
          location: '',
          bio: '',
          website: '',
          linkedin: '',
          socialLinks: {}
        };
        setUsers([createdUser, ...users]);
        toast.success(`User ${createdUser.name} created successfully`);
      } else {
        fetchUsers();
      }
      setNewUser({ name: '', email: '', role: 'Student' });
      setShowAddModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user on backend');
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await apiService.delete(`/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
      toast.success('User deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setUserToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">User Management</h2>
          <p className="text-xs sm:text-sm text-gray-500">Manage all registered students, instructors, and staff.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <UserPlus size={16} />
          <span>Add New User</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-gray-500 font-medium">Role:</span>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium text-gray-700 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="instructor">Instructors</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <span>{error}</span>
          <button 
            onClick={fetchUsers} 
            className="underline font-semibold hover:text-red-800 cursor-pointer ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-gray-600">
            <thead className="bg-gray-50/75 border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
              <tr>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Joined Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mb-2"></div>
                    <p className="text-xs">Loading users from database...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    <p className="text-sm font-medium text-gray-500">No users found in database</p>
                    <p className="text-xs mt-1">Click "Add New User" above to create your first user.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setViewingUser(user)}
                          className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                          title="Click to view full profile details"
                        >
                          <UserAvatar
                            user={user}
                            size="w-10 h-10"
                            iconSize={18}
                            showInitials={true}
                            className="shrink-0 ring-1 ring-gray-200/80 shadow-2xs hover:ring-blue-400 hover:scale-105 transition-all"
                          />
                        </button>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setViewingUser(user)}
                            className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left flex items-center gap-1.5 group cursor-pointer"
                            title="Click to view student profile details"
                          >
                            <span className="truncate">{user.name}</span>
                            <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              View Profile
                            </span>
                          </button>
                          <div className="text-[11px] text-gray-400 truncate flex items-center gap-1.5 mt-0.5">
                            <span className="truncate">{user.email}</span>
                            {user.phone && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-gray-500 font-medium truncate">{user.phone}</span>
                              </>
                            )}
                            {user.location && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-gray-500 truncate">{user.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative inline-flex items-center">
                        <select
                          value={user.role}
                          disabled={updatingUserId === user.id}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          title="Click to change role"
                          className={`appearance-none cursor-pointer pl-3 pr-7 py-1 rounded-full text-xs font-semibold border transition-all focus:outline-none focus:ring-2 ${
                            user.role === 'Admin'
                              ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100/80 focus:ring-purple-300'
                              : user.role === 'Instructor'
                              ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/80 focus:ring-blue-300'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80 focus:ring-emerald-300'
                          } ${updatingUserId === user.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          <option value="Student" className="bg-white text-gray-800">Student</option>
                          <option value="Instructor" className="bg-white text-gray-800">Instructor</option>
                          <option value="Admin" className="bg-white text-gray-800">Admin</option>
                        </select>
                        <div className="pointer-events-none absolute right-2 flex items-center">
                          {updatingUserId === user.id ? (
                            <Loader2 size={12} className="animate-spin text-gray-500" />
                          ) : (
                            <ChevronDown size={12} className="text-gray-500 opacity-75" />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        user.status === 'Active' ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {user.joinedDate}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => setViewingUser(user)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="View Full Profile Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => setUserToDelete(user.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Profile Details Popup Modal */}
      {viewingUser && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
          onClick={() => setViewingUser(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden my-auto flex flex-col max-h-[92vh] animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-blue-100/70 text-blue-700 rounded-lg">
                  <UserIcon size={16} />
                </span>
                <div>
                  <h3 className="font-bold text-base text-gray-900 leading-tight">
                    {viewingUser.role === 'Student' ? 'Student Profile Details' : `${viewingUser.role} Profile Details`}
                  </h3>
                  <p className="text-[11px] text-gray-400">View live profile information updated from user settings</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingUser(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-lg transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Profile Card Banner */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-purple-50/30 border border-blue-100/70 shadow-xs">
                <div className="relative shrink-0">
                  <UserAvatar
                    user={viewingUser}
                    size="w-20 h-20"
                    iconSize={28}
                    showInitials={true}
                    className="ring-4 ring-white shadow-md"
                  />
                  <span 
                    className={`absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-white ${
                      viewingUser.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    title={`Status: ${viewingUser.status}`}
                  />
                </div>

                <div className="flex-1 text-center sm:text-left min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                    <h4 className="text-lg font-bold text-gray-900 truncate">
                      {viewingUser.name}
                    </h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      viewingUser.role === 'Admin'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : viewingUser.role === 'Instructor'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {viewingUser.role}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      viewingUser.status === 'Active' 
                        ? 'bg-emerald-100/80 text-emerald-800' 
                        : 'bg-amber-100/80 text-amber-800'
                    }`}>
                      {viewingUser.status}
                    </span>
                  </div>

                  {/* Email & copy button */}
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-gray-600 mb-2.5">
                    <Mail size={13} className="text-gray-400 shrink-0" />
                    <span className="truncate">{viewingUser.email}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(viewingUser.email, 'Email')}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-white rounded transition-colors cursor-pointer"
                      title="Copy email"
                    >
                      {copiedKey === 'Email' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    </button>
                  </div>

                  {/* Joined Date & Enrolled count pills */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-[11px] text-gray-500">
                    <span className="inline-flex items-center gap-1 bg-white/80 px-2.5 py-1 rounded-lg border border-gray-100">
                      <Calendar size={12} className="text-gray-400" />
                      Joined {viewingUser.joinedDate}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-white/80 px-2.5 py-1 rounded-lg border border-gray-100">
                      <BookOpen size={12} className="text-blue-500" />
                      {viewingUser.coursesEnrolled} {viewingUser.coursesEnrolled === 1 ? 'course' : 'courses'} enrolled
                    </span>
                  </div>
                </div>
              </div>

              {/* Personal Information (Matches User Settings) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                    <UserIcon size={13} className="text-blue-600" />
                    Personal Information
                  </h5>
                  <span className="text-[11px] text-gray-400 font-medium">Student Settings Data</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Full Name */}
                  <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                      Full Name
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-800">
                      {viewingUser.name || 'Not provided'}
                    </span>
                  </div>

                  {/* Email Address */}
                  <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                      Email Address
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-800 truncate block" title={viewingUser.email}>
                      {viewingUser.email}
                    </span>
                  </div>

                  {/* Phone Number */}
                  <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                      Phone Number
                    </span>
                    {viewingUser.phone ? (
                      <a 
                        href={`tel:${viewingUser.phone}`} 
                        className="text-xs sm:text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1.5"
                      >
                        <Phone size={12} className="text-blue-500 shrink-0" />
                        <span>{viewingUser.phone}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Not provided</span>
                    )}
                  </div>

                  {/* Location */}
                  <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                      Location
                    </span>
                    {viewingUser.location ? (
                      <span className="text-xs sm:text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                        <MapPin size={12} className="text-rose-500 shrink-0" />
                        <span>{viewingUser.location}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Not specified</span>
                    )}
                  </div>
                </div>

                {/* Scholar Biography */}
                <div className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-100">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Scholar Biography
                  </span>
                  {viewingUser.bio ? (
                    <div className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-lg border border-gray-100 shadow-2xs">
                      {viewingUser.bio}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic py-1">
                      No biography provided by the user yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Digital Presence (Matches User Settings) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                    <Globe size={13} className="text-indigo-600" />
                    Digital Presence
                  </h5>
                  <span className="text-[11px] text-gray-400 font-medium">Links & Social Profiles</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Portfolio Website */}
                  <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Portfolio Website
                    </span>
                    {viewingUser.website ? (
                      <a
                        href={viewingUser.website.startsWith('http') ? viewingUser.website : `https://${viewingUser.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1.5 truncate group"
                      >
                        <Globe size={13} className="text-blue-500 shrink-0" />
                        <span className="truncate">{viewingUser.website}</span>
                        <ExternalLink size={11} className="opacity-60 group-hover:opacity-100 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Not provided</span>
                    )}
                  </div>

                  {/* LinkedIn Profile */}
                  <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      LinkedIn Profile
                    </span>
                    {viewingUser.linkedin || viewingUser.socialLinks?.linkedin ? (
                      <a
                        href={
                          (viewingUser.linkedin || viewingUser.socialLinks?.linkedin).startsWith('http')
                            ? viewingUser.linkedin || viewingUser.socialLinks?.linkedin
                            : `https://${viewingUser.linkedin || viewingUser.socialLinks?.linkedin}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm font-semibold text-blue-700 hover:underline flex items-center gap-1.5 truncate group"
                      >
                        <LinkedinIcon size={14} className="text-blue-600 shrink-0" />
                        <span className="truncate">View LinkedIn Profile</span>
                        <ExternalLink size={11} className="opacity-60 group-hover:opacity-100 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Not linked</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Enrolled Courses */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                    <BookOpen size={13} className="text-emerald-600" />
                    Enrolled Courses ({viewingUser.coursesEnrolled})
                  </h5>
                </div>

                {viewingUser.enrolledCoursesList && viewingUser.enrolledCoursesList.length > 0 ? (
                  <div className="space-y-2">
                    {viewingUser.enrolledCoursesList.map((course, idx) => (
                      <div 
                        key={course._id || course.id || idx}
                        className="flex items-center justify-between p-2.5 bg-gray-50/80 rounded-xl border border-gray-100 text-xs hover:bg-gray-100/70 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-gray-800 truncate">
                            {course.title || (typeof course === 'string' ? `Course #${course.slice(-6)}` : 'Course')}
                          </span>
                        </div>
                        {course.level && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white text-gray-600 border border-gray-200 shrink-0 ml-2">
                            {course.level}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-100 text-center">
                    <p className="text-xs text-gray-400 italic">No courses currently enrolled</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3.5 bg-gray-50/80 border-t border-gray-100 shrink-0">
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                Press <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono shadow-2xs">Esc</kbd> to close
              </span>
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-base text-gray-900">Add New User</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Min-ji Kim"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="Student">Student</option>
                  <option value="Instructor">Instructor</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {userToDelete && (
        <ConfirmDialog
          title="Delete user?"
          message="Are you sure you want to delete this user? This action cannot be undone."
          confirmLabel="Delete user"
          onConfirm={() => handleDeleteUser(userToDelete)}
          onCancel={() => setUserToDelete(null)}
        />
      )}
    </div>
  );
};

export default UserManagement;
