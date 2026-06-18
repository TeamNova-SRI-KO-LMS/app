import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import toast from 'react-hot-toast';
import apiUrl from '../config/apiConfig';
import {
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  AcademicCapIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon,
  GlobeAltIcon,
  PhoneIcon,
  MapPinIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: '',
    avatar: '',
    role: '',
    createdAt: '',
    enrolledCourses: [],
    phone: '',
    location: '',
    website: '',
    socialLinks: {
      linkedin: '',
      twitter: '',
      github: '',
    },
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
        role: user.role || '',
        createdAt: user.createdAt || '',
        enrolledCourses: user.enrolledCourses || [],
        phone: user.phone || '',
        location: user.location || '',
        website: user.website || '',
        socialLinks: user.socialLinks || {
          linkedin: '',
          twitter: '',
          github: '',
        },
      });
    }
  }, [user]);

  const handleInputChange = e => {
    const { name, value } = e.target;

    if (name.startsWith('socialLinks.')) {
      const socialKey = name.split('.')[1];
      setProfileData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialKey]: value,
        },
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/users/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setProfileData(prev => ({
          ...prev,
          avatar: data.avatar,
        }));
        updateUser(data.user);
        toast.success('Profile picture updated successfully!');
      } else {
        throw new Error(data.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      console.log('🔄 Updating profile with data:', profileData);
      
      const response = await apiService.put('/users/profile', {
        name: profileData.name,
        bio: profileData.bio,
        avatar: profileData.avatar,
        phone: profileData.phone,
        location: profileData.location,
        website: profileData.website,
        socialLinks: profileData.socialLinks,
      });

      console.log('✅ Profile update response:', response);

      if (response.data.success) {
        console.log('🔄 Updating user context with:', response.data.user);
        updateUser(response.data.user);
        console.log('✅ User context updated');
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      } else {
        throw new Error(response.data.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('❌ Profile update error:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error data:', error.response?.data);
      
      if (error.response?.data?.errors) {
        // Handle validation errors
        const errorMessages = error.response.data.errors.map(err => err.msg).join(', ');
        toast.error(`Validation error: ${errorMessages}`);
      } else {
        toast.error(error.response?.data?.message || error.message || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setProfileData({
      name: user.name || '',
      email: user.email || '',
      bio: user.bio || '',
      avatar: user.avatar || '',
      role: user.role || '',
      createdAt: user.createdAt || '',
      enrolledCourses: user.enrolledCourses || [],
      phone: user.phone || '',
      location: user.location || '',
      website: user.website || '',
      socialLinks: user.socialLinks || {
        linkedin: '',
        twitter: '',
        github: '',
      },
    });
    setIsEditing(false);
  };

  const getRoleBadgeColor = role => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'instructor':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                    {profileData.avatar ? (
                      <img
                        src={profileData.avatar.startsWith('http') ? profileData.avatar : `${window?.configs?.apiUrl || 'http://localhost:5001'}${profileData.avatar}`}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold ${profileData.avatar ? 'hidden' : 'flex'}`}>
                      {profileData.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  </div>
                  {isEditing && (
                    <label className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full hover:bg-blue-700 transition-colors cursor-pointer">
                      <CameraIcon className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                  )}
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profileData.name || 'User Name'}
                  </h1>
                  <p className="text-gray-600">{profileData.email}</p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getRoleBadgeColor(profileData.role)}`}
                  >
                    {profileData.role?.charAt(0).toUpperCase() +
                      profileData.role?.slice(1)}
                  </span>
                </div>
              </div>
              <div className="flex space-x-3">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PencilIcon className="w-4 h-4 mr-2" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <CheckIcon className="w-4 h-4 mr-2" />
                      )}
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancel}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      <XMarkIcon className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Personal Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Personal Information
                </h2>
              </div>
              <div className="px-6 py-6 space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {profileData.name || 'Not provided'}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center space-x-2">
                    <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                    <p className="text-gray-900">{profileData.email}</p>
                    <span className="text-xs text-gray-500">
                      (Cannot be changed)
                    </span>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  {isEditing ? (
                    <textarea
                      name="bio"
                      value={profileData.bio}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {profileData.bio || 'No bio provided'}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <PhoneIcon className="w-5 h-5 text-gray-400" />
                      <p className="text-gray-900">
                        {profileData.phone || 'Not provided'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="location"
                      value={profileData.location}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your location"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <MapPinIcon className="w-5 h-5 text-gray-400" />
                      <p className="text-gray-900">
                        {profileData.location || 'Not provided'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      name="website"
                      value={profileData.website}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://your-website.com"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <GlobeAltIcon className="w-5 h-5 text-gray-400" />
                      {profileData.website ? (
                        <a
                          href={profileData.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {profileData.website}
                        </a>
                      ) : (
                        <p className="text-gray-900">Not provided</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Social Links */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Social Links
                  </label>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            LinkedIn
                          </label>
                          <input
                            type="url"
                            name="socialLinks.linkedin"
                            value={profileData.socialLinks.linkedin}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="https://linkedin.com/in/username"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            Twitter
                          </label>
                          <input
                            type="url"
                            name="socialLinks.twitter"
                            value={profileData.socialLinks.twitter}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="https://twitter.com/username"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            GitHub
                          </label>
                          <input
                            type="url"
                            name="socialLinks.github"
                            value={profileData.socialLinks.github}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="https://github.com/username"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-4">
                      {profileData.socialLinks.linkedin && (
                        <a
                          href={profileData.socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          LinkedIn
                        </a>
                      )}
                      {profileData.socialLinks.twitter && (
                        <a
                          href={profileData.socialLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-400 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                          </svg>
                          Twitter
                        </a>
                      )}
                      {profileData.socialLinks.github && (
                        <a
                          href={profileData.socialLinks.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          GitHub
                        </a>
                      )}
                      {!profileData.socialLinks.linkedin &&
                        !profileData.socialLinks.twitter &&
                        !profileData.socialLinks.github && (
                          <p className="text-gray-500 text-sm">
                            No social links provided
                          </p>
                        )}
                    </div>
                  )}
                </div>

                {/* Avatar URL */}
                {isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Picture URL
                    </label>
                    <input
                      type="url"
                      name="avatar"
                      value={profileData.avatar}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com/your-image.jpg"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Account Statistics */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Account Statistics
                </h2>
              </div>
              <div className="px-6 py-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3">
                      <AcademicCapIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {profileData.enrolledCourses?.length || 0}
                    </p>
                    <p className="text-sm text-gray-600">Enrolled Courses</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
                      <CalendarIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatDate(profileData.createdAt)}
                    </p>
                    <p className="text-sm text-gray-600">Member Since</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3">
                      <UserIcon className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {profileData.role?.charAt(0).toUpperCase() +
                        profileData.role?.slice(1)}
                    </p>
                    <p className="text-sm text-gray-600">Account Type</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Quick Actions
                </h3>
              </div>
              <div className="px-6 py-6 space-y-3">
                <button 
                  onClick={() => navigate('/my-courses')}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <AcademicCapIcon className="w-5 h-5 inline mr-3" />
                  View My Courses
                </button>
                <button 
                  onClick={() => navigate('/learning-progress')}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <BriefcaseIcon className="w-5 h-5 inline mr-3" />
                  Learning Progress
                </button>
                <button 
                  onClick={() => navigate('/public-profile')}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <GlobeAltIcon className="w-5 h-5 inline mr-3" />
                  Public Profile
                </button>
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Account Status
                </h3>
              </div>
              <div className="px-6 py-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email Verified</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Verified
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Account Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Login</span>
                  <span className="text-sm text-gray-900">Recently</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
