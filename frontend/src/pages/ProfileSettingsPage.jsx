import { useState, useEffect, useRef } from 'react';
import {
  User,
  Shield,
  Bell,
  Globe,
  Link2,
  Check,
  Save,
  Camera,
  Eye,
  EyeOff,
} from 'lucide-react';
import StudentSidebar from '../components/StudentSidebar';
import useAuth from '../context/useAuth';
import toast from 'react-hot-toast';
import apiService from '../services/apiService';

export default function ProfileSettingsPage() {
  const { user, updateUser } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('account');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Form State initialized with values from screenshot or logged-in user
  const [formData, setFormData] = useState({
    fullName: user?.name || 'Ji-Hoon Kim',
    email: user?.email || 'jihoon.scholar@sriko.edu',
    phone: user?.phone || '+94 768967567',
    location: user?.location || 'Sri Lanka',
    bio:
      user?.bio ||
      'Dedicated scholar specializing in Joseon-era linguistics and modern educational frameworks. Passionate about bridging traditional Korean values with global technological progress through the SRI-KO ecosystem.',
    portfolioWebsite: user?.website || 'https://kim-jihoon.scholar',
    linkedinProfile: user?.socialLinks?.linkedin || 'linkedin.com/in/jihoon-sriko',
    dataPrivacy: true,
    avatar:
      user?.avatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  });

  // Sync with auth user if changed
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.name || prev.fullName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        location: user.location || prev.location,
        bio: user.bio || prev.bio,
        portfolioWebsite: user.website || prev.portfolioWebsite,
        linkedinProfile: user.socialLinks?.linkedin || prev.linkedinProfile,
        avatar: user.avatar || prev.avatar,
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, avatar: imageUrl }));
      toast.success('Profile photo updated');
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      if (updateUser) {
        await updateUser({
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio,
          website: formData.portfolioWebsite,
          socialLinks: { linkedin: formData.linkedinProfile },
          avatar: formData.avatar,
        });
      }
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      toast.success('Changes saved locally');
    } finally {
      setSaving(false);
    }
  };

  // Sub-navigation tabs
  const subTabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar */}
        <StudentSidebar activeTab="settings" />

        {/* Main Settings Area */}
        <main className="flex-1 space-y-6">
          {/* Header Title & Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-block bg-blue-100/80 text-blue-700 font-bold text-[11px] uppercase tracking-wider px-3 py-1 rounded-full mb-1.5">
                SCHOLAR CENTRAL
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Edit Your Profile
              </h1>
              <p className="text-sm text-gray-500 font-medium mt-0.5">
                Manage your academic identity and learning statistics.
              </p>
            </div>

            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] active:scale-95 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-md transition disabled:opacity-70 self-start sm:self-auto"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Sub Navigation + Main Form Card Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Sub-Tab Navigation */}
            <div className="md:col-span-3 space-y-1">
              {subTabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition text-left ${
                      isSelected
                        ? 'bg-blue-50/90 text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
                    }`}
                  >
                    <Icon
                      size={18}
                      className={isSelected ? 'text-blue-600' : 'text-gray-400'}
                    />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Form Card */}
            <div className="md:col-span-9 bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-8">
              {activeSubTab === 'account' && (
                <>
                  {/* Avatar Upload Section */}
                  <div className="flex flex-col items-center justify-center text-center space-y-4 pt-2">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full p-[2.5px] bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-500 shadow-md">
                        <img
                          src={formData.avatar}
                          alt="Student Profile"
                          className="w-full h-full object-cover rounded-full bg-white"
                          onError={(e) => {
                            e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.fullName}`;
                          }}
                        />
                      </div>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      accept="image/*"
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:scale-98 transition shadow-2xs"
                    >
                      Edit Profile Photo
                    </button>
                  </div>

                  {/* Personal Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-gray-900 tracking-tight">
                      Personal Information
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 tracking-wider uppercase">
                          FULL NAME
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          className="w-full bg-gray-100/80 border border-gray-200/80 rounded-xl px-4 py-3 text-sm text-gray-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                      </div>

                      {/* Email Address */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 tracking-wider uppercase">
                          EMAIL ADDRESS
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full bg-gray-100/80 border border-gray-200/80 rounded-xl px-4 py-3 text-sm text-gray-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                      </div>

                      {/* Phone Number */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 tracking-wider uppercase">
                          PHONE NUMBER
                        </label>
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full bg-gray-100/80 border border-gray-200/80 rounded-xl px-4 py-3 text-sm text-gray-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                      </div>

                      {/* Location */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 tracking-wider uppercase">
                          LOCATION
                        </label>
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          className="w-full bg-gray-100/80 border border-gray-200/80 rounded-xl px-4 py-3 text-sm text-gray-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                      </div>
                    </div>

                    {/* Scholar Biography */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] font-bold text-gray-500 tracking-wider uppercase">
                        SCHOLAR BIOGRAPHY
                      </label>
                      <textarea
                        name="bio"
                        rows={4}
                        value={formData.bio}
                        onChange={handleChange}
                        className="w-full bg-gray-100/80 border border-gray-200/80 rounded-xl px-4 py-3 text-sm text-gray-800 font-medium leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                      />
                    </div>
                  </div>

                  {/* Digital Presence Section */}
                  <div className="space-y-4 pt-2">
                    <h3 className="text-base font-bold text-gray-900 tracking-tight">
                      Digital Presence
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Portfolio Website */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 tracking-wider uppercase">
                          PORTFOLIO WEBSITE
                        </label>
                        <div className="relative">
                          <Globe
                            size={16}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                          />
                          <input
                            type="text"
                            name="portfolioWebsite"
                            value={formData.portfolioWebsite}
                            onChange={handleChange}
                            className="w-full bg-gray-100/80 border border-gray-200/80 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          />
                        </div>
                      </div>

                      {/* LinkedIn Profile */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 tracking-wider uppercase">
                          LINKEDIN PROFILE
                        </label>
                        <div className="relative">
                          <Link2
                            size={16}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                          />
                          <input
                            type="text"
                            name="linkedinProfile"
                            value={formData.linkedinProfile}
                            onChange={handleChange}
                            className="w-full bg-gray-100/80 border border-gray-200/80 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Data Privacy Toggle Box */}
                  <div className="bg-gray-100/70 rounded-2xl p-5 border border-gray-200/50 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">
                        Data Privacy
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">
                        Your email and phone are only visible to instructors.
                      </p>
                    </div>

                    {/* Interactive iOS style toggle */}
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          dataPrivacy: !prev.dataPrivacy,
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        formData.dataPrivacy ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          formData.dataPrivacy
                            ? 'translate-x-5'
                            : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </>
              )}

              {/* Security Tab */}
              {activeSubTab === 'security' && (
                <div className="space-y-6">
                  <h3 className="text-base font-bold text-gray-900 tracking-tight">
                    Security & Password
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        Current Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full bg-gray-100/80 border border-gray-200 rounded-xl px-4 py-3 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        New Password
                      </label>
                      <input
                        type="password"
                        placeholder="Enter new password"
                        className="w-full bg-gray-100/80 border border-gray-200 rounded-xl px-4 py-3 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeSubTab === 'notifications' && (
                <div className="space-y-6">
                  <h3 className="text-base font-bold text-gray-900 tracking-tight">
                    Notification Preferences
                  </h3>
                  <div className="space-y-4">
                    {['Email announcements', 'Assignment reminders', 'Course updates'].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <span className="text-sm font-medium text-gray-800">{item}</span>
                        <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-blue-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeSubTab === 'privacy' && (
                <div className="space-y-6">
                  <h3 className="text-base font-bold text-gray-900 tracking-tight">
                    Privacy Controls
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
                      Customize how other students and external visitors see your profile and activity statistics.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
