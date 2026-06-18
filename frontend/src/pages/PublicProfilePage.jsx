import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import toast from 'react-hot-toast';
import {
  UserIcon,
  AcademicCapIcon,
  TrophyIcon,
  CalendarIcon,
  GlobeAltIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShareIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';

const PublicProfilePage = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/users/dashboard');
      
      if (response.data.success) {
        setProfileData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch profile data');
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'grammar':
        return 'bg-blue-100 text-blue-800';
      case 'vocabulary':
        return 'bg-purple-100 text-purple-800';
      case 'conversation':
        return 'bg-green-100 text-green-800';
      case 'culture':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `${user?.name}'s Korean Learning Profile`,
        text: `Check out ${user?.name}'s Korean language learning progress on SRI-KO LMS!`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Profile link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const userData = profileData?.user || {};
  const stats = profileData?.statistics || {};
  const enrolledCourses = profileData?.enrolledCourses || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
          
          {/* Profile Info */}
          <div className="px-6 pb-6 -mt-16 relative">
            <div className="flex items-end justify-between">
              <div className="flex items-end space-x-6">
                {/* Avatar */}
                <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                  {userData.avatar ? (
                    <img
                      src={userData.avatar.startsWith('http') ? userData.avatar : `${window?.configs?.apiUrl || 'http://localhost:5001'}${userData.avatar}`}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {userData.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                {/* Basic Info */}
                <div className="pb-4">
                  <h1 className="text-2xl font-bold text-gray-900">{userData.name}</h1>
                  <p className="text-gray-600 mb-2">Korean Language Learner</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      Joined {formatDate(userData.createdAt)}
                    </div>
                    {userData.location && (
                      <div className="flex items-center">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {userData.location}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Share Button */}
              <button
                onClick={handleShareProfile}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ShareIcon className="w-4 h-4" />
                <span>Share Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        {userData.bio && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
            <p className="text-gray-700 leading-relaxed">{userData.bio}</p>
          </div>
        )}

        {/* Learning Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-3">
              <AcademicCapIcon className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalEnrolledCourses || 0}</p>
            <p className="text-sm text-gray-600">Courses Enrolled</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-3">
              <BookOpenIcon className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalCompletedLessons || 0}</p>
            <p className="text-sm text-gray-600">Lessons Completed</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mb-3">
              <TrophyIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalCertificates || 0}</p>
            <p className="text-sm text-gray-600">Certificates</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-3">
              <UserIcon className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round((stats.totalCompletedLessons || 0) / Math.max(stats.totalLessons || 1, 1) * 100)}%
            </p>
            <p className="text-sm text-gray-600">Completion Rate</p>
          </div>
        </div>

        {/* Completed Courses */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Completed Courses</h3>
          </div>
          <div className="p-6">
            {enrolledCourses.filter(course => course.progress?.completedLessons === course.progress?.totalLessons).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enrolledCourses
                  .filter(course => course.progress?.completedLessons === course.progress?.totalLessons)
                  .map((course) => (
                    <div key={course._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{course.title}</h4>
                        <div className="flex space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(course.level)}`}>
                            {course.level}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(course.category)}`}>
                            {course.category}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{course.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500">
                          <TrophyIcon className="w-4 h-4 text-yellow-500 mr-1" />
                          Certificate Earned
                        </div>
                        <span className="text-sm text-gray-500">
                          {course.progress?.completedLessons} lessons
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrophyIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No completed courses yet</p>
                <p className="text-sm text-gray-500 mt-2">Complete your first course to see it here!</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userData.email && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <EnvelopeIcon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">{userData.email}</p>
                  </div>
                </div>
              )}

              {userData.phone && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <PhoneIcon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Phone</p>
                    <p className="text-sm text-gray-600">{userData.phone}</p>
                  </div>
                </div>
              )}

              {userData.website && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <GlobeAltIcon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Website</p>
                    <a
                      href={userData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {userData.website}
                    </a>
                  </div>
                </div>
              )}

              {userData.location && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <MapPinIcon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Location</p>
                    <p className="text-sm text-gray-600">{userData.location}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Social Links */}
            {userData.socialLinks && Object.values(userData.socialLinks).some(link => link) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Social Links</h4>
                <div className="flex space-x-4">
                  {userData.socialLinks.linkedin && (
                    <a
                      href={userData.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      LinkedIn
                    </a>
                  )}
                  {userData.socialLinks.twitter && (
                    <a
                      href={userData.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-600 text-sm"
                    >
                      Twitter
                    </a>
                  )}
                  {userData.socialLinks.github && (
                    <a
                      href={userData.socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                      GitHub
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfilePage;

