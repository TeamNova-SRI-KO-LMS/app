import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Check, 
  Copy, 
  Briefcase, 
  BookOpen, 
  Users, 
  Sparkles,
  Award,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../../components/UserAvatar';

const AdminProfileModal = ({ isOpen, onClose, user }) => {
  const [copiedKey, setCopiedKey] = useState('');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'January 2024';

  const defaultAdmin = {
    name: user?.name || 'Administrator',
    email: user?.email || 'admin@sriko-editorial.com',
    phone: user?.phone || '+94 11 234 5678',
    location: user?.location || 'SRI-KO Main Center, Colombo 03',
    staffId: 'ADM-2024-001',
    designation: 'Chief Academic Administrator & Senior Editor',
    department: 'Korean Language & Academic Affairs',
    role: 'Administrator',
    status: 'Active',
    bio: user?.bio || 'Overseeing curriculum development, instructor assignments, student enrollments, and educational resource distribution across SRI-KO language training programs.',
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-profile-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <Shield size={16} />
            </span>
            <div>
              <h3 id="admin-profile-title" className="font-bold text-sm sm:text-base text-gray-900 leading-tight">
                Administrator Profile
              </h3>
              <p className="text-[11px] text-gray-400">Default Staff Profile • SRI-KO LMS</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Top Banner Card */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-purple-50/40 border border-blue-100 shadow-2xs">
            <div className="relative shrink-0">
              <UserAvatar
                user={user}
                size="w-20 h-20"
                iconSize={28}
                showInitials={true}
                className="ring-4 ring-white shadow-md rounded-full bg-white"
              />
              <span 
                className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-white bg-emerald-500"
                title="Status: Active"
              />
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mb-1.5">
                <h4 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                  {defaultAdmin.name}
                </h4>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                  <Shield size={10} />
                  Administrator
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-gray-600 mb-2">
                <Mail size={12} className="text-gray-400 shrink-0" />
                <span className="truncate">{defaultAdmin.email}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(defaultAdmin.email, 'Email')}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-white rounded transition-colors cursor-pointer"
                  title="Copy email"
                >
                  {copiedKey === 'Email' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] text-gray-500">
                <span className="inline-flex items-center gap-1 bg-white/90 px-2 py-0.5 rounded-md border border-gray-100 shadow-2xs">
                  <Calendar size={11} className="text-gray-400" />
                  Joined {formattedDate}
                </span>
                <span className="inline-flex items-center gap-1 bg-white/90 px-2 py-0.5 rounded-md border border-gray-100 shadow-2xs font-mono font-medium text-gray-600">
                  ID: {defaultAdmin.staffId}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics / Stats Grid (Similar to student profile counters) */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Role Level
              </span>
              <span className="text-xs sm:text-sm font-bold text-gray-900 flex items-center justify-center gap-1">
                <Sparkles size={12} className="text-amber-500 fill-amber-400" />
                Super Admin
              </span>
            </div>
            <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Department
              </span>
              <span className="text-xs sm:text-sm font-bold text-gray-900 truncate block" title={defaultAdmin.department}>
                Academic
              </span>
            </div>
            <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Campus
              </span>
              <span className="text-xs sm:text-sm font-bold text-blue-600 truncate block">
                SRI-KO Main
              </span>
            </div>
          </div>

          {/* Detailed Information */}
          <div className="space-y-3.5">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 pb-1 border-b border-gray-100">
              Staff & Contact Information
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-gray-50/60 border border-gray-100">
                <span className="text-[10px] font-semibold text-gray-400 block mb-0.5">Designation</span>
                <span className="font-medium text-gray-800">{defaultAdmin.designation}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-gray-50/60 border border-gray-100">
                <span className="text-[10px] font-semibold text-gray-400 block mb-0.5">Contact Phone</span>
                <span className="font-medium text-gray-800">{defaultAdmin.phone}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-gray-50/60 border border-gray-100 sm:col-span-2">
                <span className="text-[10px] font-semibold text-gray-400 block mb-0.5">Office Location</span>
                <span className="font-medium text-gray-800 flex items-center gap-1.5">
                  <MapPin size={13} className="text-red-500 shrink-0" />
                  {defaultAdmin.location}
                </span>
              </div>
            </div>

            {/* About / Bio */}
            <div>
              <span className="text-[10px] font-semibold text-gray-400 block mb-1">About / Responsibilities</span>
              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/60 p-3 rounded-lg border border-gray-100">
                {defaultAdmin.bio}
              </p>
            </div>

            {/* Privileges & Modules */}
            <div>
              <span className="text-[10px] font-semibold text-gray-400 block mb-1.5">Assigned Admin Privileges</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'User Management',
                  'Course Publishing',
                  'Attendance Control',
                  'Payment Tracking',
                  'System Announcements',
                  'Discussion Moderation'
                ].map((privilege, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium bg-blue-50/80 text-blue-700 border border-blue-100"
                  >
                    <Check size={11} className="text-blue-500" />
                    {privilege}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/70">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/admin/settings');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors"
          >
            <Settings size={14} />
            <span>Admin Settings</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg shadow-2xs transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminProfileModal;
