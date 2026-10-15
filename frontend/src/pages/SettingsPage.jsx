import { useState, useEffect, useRef } from 'react';
import useAuth from '../context/useAuth';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';
import StudentSidebar from '../components/StudentSidebar';
import {
  User,
  Shield,
  Bell,
  Globe,
  Link2,
  Eye,
  EyeOff,
  Key,
  Check,
  AlertTriangle,
  Camera,
  Trash2,
} from 'lucide-react';

const SettingsContent = ({ user, updateUser }) => {
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const fileInputRef = useRef(null);

  // Profile Form state with real user data from DB
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || '',
    website: user?.website || '',
    linkedin: user?.socialLinks?.linkedin || '',
  });

  // Keep formData in sync when user data updates
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        location: user.location || prev.location,
        bio: user.bio || prev.bio,
        website: user.website || prev.website,
        linkedin: user.socialLinks?.linkedin || prev.linkedin,
      }));
    }
  });

  // Data Privacy Toggle in Account tab
  const [dataPrivacy, setDataPrivacy] = useState(
    user?.privacy?.showEmail !== undefined ? !user.privacy.showEmail : true,
  );

  // Password state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notifications state
  const [notifications, setNotifications] = useState(() => ({
    emailNotifications: true,
    courseUpdates: true,
    assignmentReminders: true,
    systemAnnouncements: true,
    marketingEmails: false,
    ...(user?.notifications || {}),
  }));

  // Privacy state
  const [privacy, setPrivacy] = useState(() => ({
    profileVisibility: 'public',
    showEmail: false,
    showCourses: true,
    allowMessages: true,
    ...(user?.privacy || {}),
  }));

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = e => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNotificationToggle = key => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handlePrivacyToggle = key => {
    setPrivacy(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Avatar Upload Handler
  const handlePhotoUpload = async e => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, JPEG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Instant local preview
    const previewUrl = URL.createObjectURL(file);
    setPreviewPhoto(previewUrl);

    const uploadFormData = new FormData();
    uploadFormData.append('avatar', file);

    const toastId = toast.loading('Uploading profile photo...');
    try {
      const response = await apiService.post('/users/avatar', uploadFormData);
      if (response.data.success) {
        toast.success('Profile photo updated successfully!', { id: toastId });
        const newAvatar = response.data.avatar || response.data.user?.avatar;
        if (response.data.user) {
          updateUser(response.data.user);
        } else if (newAvatar) {
          updateUser({ ...user, avatar: newAvatar });
        }
        setPreviewPhoto(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload photo', {
        id: toastId,
      });
    }
  };

  // Remove Photo Handler
  const handleRemovePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) {
      return;
    }

    const toastId = toast.loading('Removing profile photo...');
    try {
      const response = await apiService.delete('/users/avatar');
      if (response.data.success) {
        toast.success('Profile photo removed successfully!', { id: toastId });
        if (response.data.user) {
          updateUser(response.data.user);
        } else {
          updateUser({ ...user, avatar: null });
        }
        setPreviewPhoto(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.warn('DELETE /users/avatar failed, trying fallback profile update:', error);
      try {
        const fallbackRes = await apiService.put('/users/profile', { avatar: '' });
        if (fallbackRes.data.success) {
          toast.success('Profile photo removed successfully!', { id: toastId });
          updateUser({ ...user, avatar: null });
          setPreviewPhoto(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }
      } catch {
        // ignore fallback error
      }
      toast.error(error.response?.data?.message || 'Failed to remove photo', {
        id: toastId,
      });
    }
  };

  // Save Account Profile
  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        bio: formData.bio,
        phone: formData.phone,
        location: formData.location,
        website: formData.website,
        socialLinks: {
          linkedin: formData.linkedin,
        },
        privacy: {
          ...privacy,
          showEmail: !dataPrivacy,
        },
      };

      const response = await apiService.put('/users/profile', payload);
      if (response.data.success) {
        toast.success('Profile changes saved successfully!');
        if (response.data.user) {
          updateUser(response.data.user);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Save Password
  const handlePasswordSubmit = async e => {
    if (e) e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.put('/users/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (response.data.success) {
        toast.success('Password updated successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  // Save Notifications
  const handleNotificationSave = async () => {
    setLoading(true);
    try {
      const response = await apiService.put('/users/notifications', {
        notifications,
      });
      if (response.data.success) {
        toast.success('Notification preferences saved!');
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to save notifications',
      );
    } finally {
      setLoading(false);
    }
  };

  // Save Privacy Settings
  const handlePrivacySave = async () => {
    setLoading(true);
    try {
      const response = await apiService.put('/users/privacy', { privacy });
      if (response.data.success) {
        toast.success('Privacy settings saved!');
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to save privacy settings',
      );
    } finally {
      setLoading(false);
    }
  };

  // Master Save Changes handler depending on active tab
  const handleSaveActiveTab = () => {
    if (activeTab === 'account') {
      handleSaveProfile();
    } else if (activeTab === 'security') {
      handlePasswordSubmit();
    } else if (activeTab === 'notifications') {
      handleNotificationSave();
    } else if (activeTab === 'privacy') {
      handlePrivacySave();
    }
  };

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        'Are you sure you want to delete your account? This action cannot be undone.',
      )
    ) {
      toast.error('Account deletion not implemented yet');
    }
  };

  const navTabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Globe },
  ];

  // User avatar - uses instant preview, user avatar from DB, or scholar seed
  const userAvatar =
    previewPhoto ||
    user?.avatar ||
    'https://api.dicebear.com/7.x/avataaars/svg?seed=JiHoonKim&accessories=prescription02&clothing=blazerAndTie&clothingColor=3c4f5e&hairColor=4a312c';

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Sidebar Menu */}
        <StudentSidebar activeTab="settings" />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Header Row */}
          <div className="mb-8">
            <div className="mb-2">
              <span className="inline-block px-3 py-1 bg-indigo-100/70 text-indigo-700 text-[11px] font-bold rounded-full uppercase tracking-wider">
                SCHOLAR CENTRAL
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight">
                  Edit Your Profile
                </h1>
                <p className="text-gray-500 text-sm mt-1 font-medium">
                  Manage your academic identity and learning statistics.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveActiveTab}
                disabled={loading}
                className="self-start sm:self-auto px-6 py-2.5 bg-[#4338CA] hover:bg-[#3730A3] active:scale-95 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-200 transition-all cursor-pointer disabled:opacity-60 flex items-center gap-2"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs & Form Card Container */}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Inner Sub Tabs Navigation */}
            <div className="w-full md:w-44 lg:w-48 flex-shrink-0 space-y-1">
              {navTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#EFF6FF] text-[#2563EB]'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon
                      size={18}
                      className={isActive ? 'text-[#2563EB]' : 'text-gray-400'}
                    />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Card Panel */}
            <div className="flex-1 w-full bg-white rounded-3xl p-6 sm:p-10 border border-gray-100/80 shadow-xs">
              {/* TAB 1: ACCOUNT (Matches Mockup) */}
              {activeTab === 'account' && (
                <div>
                  {/* Avatar Section */}
                  <div className="flex flex-col items-center justify-center pb-6">
                    <div
                      className="relative group cursor-pointer mb-3.5"
                      onClick={() => fileInputRef.current?.click()}
                      title="Click to change profile photo"
                    >
                      <div className="w-20 h-20 rounded-full bg-pink-100 p-1 border-2 border-pink-200 shadow-xs overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105">
                        <img
                          src={userAvatar}
                          alt="Scholar Avatar"
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={20} className="text-white drop-shadow-sm" />
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Camera size={14} className="text-gray-500" />
                        <span>Edit Profile Photo</span>
                      </button>

                      {Boolean(user?.avatar || previewPhoto) && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="px-3.5 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                          title="Remove custom profile photo"
                        >
                          <Trash2 size={14} className="text-red-500" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="mt-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 tracking-tight">
                      Personal Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                      {/* Full Name */}
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                          FULL NAME
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full bg-[#EAECEF] hover:bg-[#E2E6EA] focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 border-0 outline-none transition"
                        />
                      </div>

                      {/* Email Address */}
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                          EMAIL ADDRESS
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full bg-[#EAECEF] hover:bg-[#E2E6EA] focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 border-0 outline-none transition"
                        />
                      </div>

                      {/* Phone Number */}
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                          PHONE NUMBER
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full bg-[#EAECEF] hover:bg-[#E2E6EA] focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 border-0 outline-none transition"
                        />
                      </div>

                      {/* Location */}
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                          LOCATION
                        </label>
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          className="w-full bg-[#EAECEF] hover:bg-[#E2E6EA] focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 border-0 outline-none transition"
                        />
                      </div>
                    </div>

                    {/* Biography */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                        SCHOLAR BIOGRAPHY
                      </label>
                      <textarea
                        rows={4}
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        className="w-full bg-[#EAECEF] hover:bg-[#E2E6EA] focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl p-4 text-sm font-medium text-gray-800 leading-relaxed border-0 outline-none resize-none transition"
                      />
                    </div>
                  </div>

                  {/* Digital Presence */}
                  <div className="mt-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 tracking-tight">
                      Digital Presence
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Portfolio Website */}
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                          PORTFOLIO WEBSITE
                        </label>
                        <div className="flex items-center gap-3 bg-[#EAECEF] hover:bg-[#E2E6EA] focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 rounded-xl px-4 py-3 transition">
                          <Globe size={18} className="text-gray-500 flex-shrink-0" />
                          <input
                            type="text"
                            name="website"
                            value={formData.website}
                            onChange={handleInputChange}
                            placeholder="https://..."
                            className="w-full bg-transparent border-0 p-0 text-sm font-medium text-gray-800 outline-none"
                          />
                        </div>
                      </div>

                      {/* LinkedIn Profile */}
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                          LINKEDIN PROFILE
                        </label>
                        <div className="flex items-center gap-3 bg-[#EAECEF] hover:bg-[#E2E6EA] focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 rounded-xl px-4 py-3 transition">
                          <Link2 size={18} className="text-gray-500 flex-shrink-0" />
                          <input
                            type="text"
                            name="linkedin"
                            value={formData.linkedin}
                            onChange={handleInputChange}
                            placeholder="linkedin.com/in/..."
                            className="w-full bg-transparent border-0 p-0 text-sm font-medium text-gray-800 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Data Privacy Toggle Box */}
                  <div className="bg-[#EAECEF] rounded-2xl p-4 sm:p-5 flex items-center justify-between mt-8">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        Data Privacy
                      </h3>
                      <p className="text-xs text-gray-600 font-medium mt-0.5">
                        Your email and phone are only visible to instructors.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDataPrivacy(!dataPrivacy)}
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                        dataPrivacy ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
                      }`}
                    >
                      <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: SECURITY */}
              {activeTab === 'security' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">
                      Change Password
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">
                      Update your password to keep your academic account secure.
                    </p>

                    <form onSubmit={handlePasswordSubmit} className="space-y-5">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                          CURRENT PASSWORD
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            name="currentPassword"
                            value={passwordForm.currentPassword}
                            onChange={handlePasswordChange}
                            required
                            className="w-full bg-[#EAECEF] hover:bg-[#E2E6EA] focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl px-4 py-3 pr-11 text-sm font-medium text-gray-800 border-0 outline-none transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-700 cursor-pointer"
                          >
                            {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                            NEW PASSWORD
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPassword ? 'text' : 'password'}
                              name="newPassword"
                              value={passwordForm.newPassword}
                              onChange={handlePasswordChange}
                              required
                              className="w-full bg-[#EAECEF] hover:bg-[#E2E6EA] focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl px-4 py-3 pr-11 text-sm font-medium text-gray-800 border-0 outline-none transition"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-700 cursor-pointer"
                            >
                              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                            CONFIRM NEW PASSWORD
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              name="confirmPassword"
                              value={passwordForm.confirmPassword}
                              onChange={handlePasswordChange}
                              required
                              className="w-full bg-[#EAECEF] hover:bg-[#E2E6EA] focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl px-4 py-3 pr-11 text-sm font-medium text-gray-800 border-0 outline-none transition"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-700 cursor-pointer"
                            >
                              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition cursor-pointer flex items-center gap-2"
                        >
                          <Key size={16} />
                          <span>Update Password</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Danger Zone */}
                  <div className="pt-8 border-t border-gray-100">
                    <h3 className="text-base font-bold text-red-600 mb-2">
                      Danger Zone
                    </h3>
                    <div className="bg-red-50/70 border border-red-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
                        <div>
                          <h4 className="text-sm font-bold text-red-900">
                            Delete Account
                          </h4>
                          <p className="text-xs text-red-600 mt-0.5">
                            Permanently delete your profile and all course progress.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer self-start sm:self-auto"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: NOTIFICATIONS */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">
                    Notification Preferences
                  </h2>
                  <p className="text-sm text-gray-500 mb-6">
                    Choose how and when you receive alerts from SRI-KO.
                  </p>

                  <div className="space-y-4">
                    {[
                      {
                        key: 'emailNotifications',
                        title: 'Email Notifications',
                        desc: 'Receive alerts and updates directly to your email address.',
                      },
                      {
                        key: 'courseUpdates',
                        title: 'Course Updates',
                        desc: 'Get notified when new lessons, assignments, or lectures drop.',
                      },
                      {
                        key: 'assignmentReminders',
                        title: 'Assignment Reminders',
                        desc: 'Timely reminders for upcoming homework and quiz deadlines.',
                      },
                      {
                        key: 'systemAnnouncements',
                        title: 'System Announcements',
                        desc: 'Important news regarding the platform and maintenance.',
                      },
                      {
                        key: 'marketingEmails',
                        title: 'Promotions & Events',
                        desc: 'Receive invites to special Korean cultural workshops and events.',
                      },
                    ].map(item => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-4 bg-[#EAECEF]/70 rounded-2xl transition hover:bg-[#EAECEF]"
                      >
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">
                            {item.title}
                          </h4>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleNotificationToggle(item.key)}
                          className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 flex-shrink-0 ${
                            notifications[item.key]
                              ? 'bg-blue-600 justify-end'
                              : 'bg-gray-300 justify-start'
                          }`}
                        >
                          <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      type="button"
                      onClick={handleNotificationSave}
                      disabled={loading}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition cursor-pointer flex items-center gap-2"
                    >
                      <Check size={16} />
                      <span>Save Preferences</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: PRIVACY */}
              {activeTab === 'privacy' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">
                    Privacy Settings
                  </h2>
                  <p className="text-sm text-gray-500 mb-6">
                    Control your visibility and who can interact with you on SRI-KO.
                  </p>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                        PROFILE VISIBILITY
                      </label>
                      <select
                        name="profileVisibility"
                        value={privacy.profileVisibility}
                        onChange={e =>
                          setPrivacy(prev => ({
                            ...prev,
                            profileVisibility: e.target.value,
                          }))
                        }
                        className="w-full bg-[#EAECEF] hover:bg-[#E2E6EA] focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 border-0 outline-none transition"
                      >
                        <option value="public">Public - Visible to all students and instructors</option>
                        <option value="friends">Classmates Only - Visible only to enrolled peers</option>
                        <option value="private">Private - Only instructors can view</option>
                      </select>
                    </div>

                    {[
                      {
                        key: 'showEmail',
                        title: 'Show Email Address',
                        desc: 'Display your email on your public academic profile.',
                      },
                      {
                        key: 'showCourses',
                        title: 'Show Enrolled Courses',
                        desc: 'Show which courses and certificates you are pursuing.',
                      },
                      {
                        key: 'allowMessages',
                        title: 'Allow Direct Messages',
                        desc: 'Allow other students to message you regarding study groups.',
                      },
                    ].map(item => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-4 bg-[#EAECEF]/70 rounded-2xl transition hover:bg-[#EAECEF]"
                      >
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">
                            {item.title}
                          </h4>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePrivacyToggle(item.key)}
                          className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 flex-shrink-0 ${
                            privacy[item.key]
                              ? 'bg-blue-600 justify-end'
                              : 'bg-gray-300 justify-start'
                          }`}
                        >
                          <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      type="button"
                      onClick={handlePrivacySave}
                      disabled={loading}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition cursor-pointer flex items-center gap-2"
                    >
                      <Check size={16} />
                      <span>Save Privacy Settings</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const SettingsPage = () => {
  const { user, loading: authLoading, updateUser } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <SettingsContent
      key={user?._id || user?.id || 'guest'}
      user={user}
      updateUser={updateUser}
    />
  );
};

export default SettingsPage;
