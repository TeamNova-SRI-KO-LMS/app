import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import toast from 'react-hot-toast';
import {
  AcademicCapIcon,
  ClockIcon,
  CheckCircleIcon,
  TrophyIcon,
  ChartBarIcon,
  CalendarIcon,
  UserGroupIcon,
  BookOpenIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const MyCoursesPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unenrollingCourse, setUnenrollingCourse] = useState(null);
  const [showUnenrollModal, setShowUnenrollModal] = useState(false);
  const [courseToUnenroll, setCourseToUnenroll] = useState(null);

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/users/dashboard');
      
      if (response.data.success) {
        setCourses(response.data.data.enrolledCourses || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch courses');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load your courses');
    } finally {
      setLoading(false);
    }
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleUnenrollClick = (course) => {
    setCourseToUnenroll(course);
    setShowUnenrollModal(true);
  };

  const handleUnenrollConfirm = async () => {
    if (!courseToUnenroll) return;

    try {
      setUnenrollingCourse(courseToUnenroll._id);
      await apiService.unenrollFromCourse(courseToUnenroll._id);
      
      // Remove course from local state
      setCourses(prevCourses => 
        prevCourses.filter(course => course._id !== courseToUnenroll._id)
      );
      
      toast.success(`Successfully unenrolled from "${courseToUnenroll.title}"`);
      setShowUnenrollModal(false);
      setCourseToUnenroll(null);
    } catch (error) {
      console.error('Error unenrolling from course:', error);
      toast.error('Failed to unenroll from course. Please try again.');
    } finally {
      setUnenrollingCourse(null);
    }
  };

  const handleUnenrollCancel = () => {
    setShowUnenrollModal(false);
    setCourseToUnenroll(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
          <p className="text-gray-600">
            Track your learning journey and progress across all enrolled courses
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AcademicCapIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {courses.filter(course => course.progress?.completedLessons === course.progress?.totalLessons).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {courses.filter(course => course.progress?.completedLessons > 0 && course.progress?.completedLessons < course.progress?.totalLessons).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrophyIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Certificates</p>
                <p className="text-2xl font-bold text-gray-900">
                  {courses.filter(course => course.progress?.completedLessons === course.progress?.totalLessons).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Course Thumbnail */}
                <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpenIcon className="w-16 h-16 text-white opacity-50" />
                  )}
                </div>

                {/* Course Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {course.title}
                    </h3>
                    <div className="flex space-x-2 ml-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(course.level)}`}>
                        {course.level}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(course.category)}`}>
                        {course.category}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {course.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>
                        {course.progress?.completedLessons || 0} / {course.progress?.totalLessons || 0} lessons
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${course.progress?.totalLessons > 0 
                            ? (course.progress.completedLessons / course.progress.totalLessons) * 100 
                            : 0}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Course Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatTime(course.duration || 0)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Last Accessed</p>
                      <p className="text-sm font-medium text-gray-900">
                        {course.progress?.lastAccessed ? formatDate(course.progress.lastAccessed) : 'Never'}
                      </p>
                    </div>
                  </div>

                  {/* Instructor */}
                  {course.instructor && (
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-gray-600">
                          {course.instructor.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {course.instructor.name}
                        </p>
                        <p className="text-xs text-gray-500">Instructor</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                      {course.progress?.completedLessons === course.progress?.totalLessons ? 'View Certificate' : 'Continue Learning'}
                    </button>
                    <button 
                      onClick={() => handleUnenrollClick(course)}
                      disabled={unenrollingCourse === course._id}
                      className="w-full bg-red-50 text-red-600 py-2 px-4 rounded-lg hover:bg-red-100 transition-colors border border-red-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {unenrollingCourse === course._id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                          Unenrolling...
                        </>
                      ) : (
                        <>
                          <XMarkIcon className="w-4 h-4 mr-2" />
                          Unenroll
                        </>
                      )}
                    </button>
                  </div>

                  {/* Certificate Badge */}
                  {course.progress?.completedLessons === course.progress?.totalLessons && (
                    <div className="mt-3 flex items-center justify-center">
                      <TrophyIcon className="w-5 h-5 text-yellow-500 mr-2" />
                      <span className="text-sm font-medium text-yellow-600">Certificate Earned!</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <AcademicCapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses enrolled</h3>
            <p className="text-gray-600 mb-6">
              Start your Korean language learning journey by enrolling in courses.
            </p>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Browse Courses
            </button>
          </div>
        )}
      </div>

      {/* Unenroll Confirmation Modal */}
      {showUnenrollModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-red-100 rounded-lg mr-3">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Confirm Unenrollment</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to unenroll from <strong>"{courseToUnenroll?.title}"</strong>? 
              This action will remove all your progress and you'll need to re-enroll to access the course again.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={handleUnenrollCancel}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUnenrollConfirm}
                disabled={unenrollingCourse}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {unenrollingCourse ? 'Unenrolling...' : 'Yes, Unenroll'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCoursesPage;

