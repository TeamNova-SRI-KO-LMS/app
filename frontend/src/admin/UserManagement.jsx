import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Trash2, Edit2, Shield, Mail, Check, X, ChevronDown, Loader2 } from 'lucide-react';
import apiService from '../services/apiService';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Student' });

  const [loading, setLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.get('/users');
      if (response.data?.data) {
        const apiUsers = response.data.data.map(u => ({
          id: u._id || u.id,
          name: u.name || 'User',
          email: u.email,
          role: u.role === 'admin' ? 'Admin' : u.role === 'instructor' ? 'Instructor' : 'Student',
          status: u.isActive !== false ? 'Active' : 'Inactive',
          joinedDate: new Date(u.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          coursesEnrolled: u.enrolledCourses?.length || 0
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
    setUpdatingUserId(userId);
    setSuccessMessage('');
    setError(null);

    try {
      await apiService.put(`/users/${userId}`, {
        role: newRole.toLowerCase()
      });
      setSuccessMessage(`Role for ${userName} changed to ${newRole} successfully`);
      setTimeout(() => setSuccessMessage(''), 4000);
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
          id: u._id || u.id,
          name: u.name,
          email: u.email,
          role: u.role === 'admin' ? 'Admin' : u.role === 'instructor' ? 'Instructor' : 'Student',
          status: 'Active',
          joinedDate: new Date(u.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          coursesEnrolled: 0
        };
        setUsers([createdUser, ...users]);
        setSuccessMessage(`User ${createdUser.name} created successfully`);
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        fetchUsers();
      }
      setNewUser({ name: '', email: '', role: 'Student' });
      setShowAddModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create user on backend');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await apiService.delete(`/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
      setSuccessMessage('User deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
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

      {/* Success Alert */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <Check size={14} className="stroke-[2.5]" />
            </div>
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button 
            onClick={() => setSuccessMessage('')} 
            className="text-emerald-500 hover:text-emerald-700 p-1 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

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
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{user.name}</div>
                          <div className="text-[11px] text-gray-400">{user.email}</div>
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
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
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

      {/* Add User Modal */}
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
    </div>
  );
};

export default UserManagement;
