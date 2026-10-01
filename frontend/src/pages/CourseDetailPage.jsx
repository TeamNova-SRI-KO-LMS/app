import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { courseService } from '../services/courseService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  ClockIcon,
  UserIcon,
  StarIcon,
  BookOpenIcon,
  AcademicCapIcon,
  TagIcon,
  CheckCircleIcon,
  PlayIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UsersIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const CourseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    comment: '',
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [courseCompleted, setCourseCompleted] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCourseDetails();
      checkCourseCompletion();
    }
  }, [id, user?.id]);

  const checkCourseCompletion = async () => {
    if (!isAuthenticated || !user?.id || !id) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${window?.configs?.apiUrl || 'http://localhost:5001'}/api/users/dashboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const courseProgress = data.progressData?.find(p => p.courseId === id);
        setCourseCompleted(courseProgress?.isCompleted || false);
      }
    } catch (error) {
      console.error('Error checking course completion:', error);
    }
  };

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await courseService.getCourse(id);
      
      if (response.success) {
        setCourse(response.course);
      } else {
        toast.error('Course not found');
        navigate('/courses');
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course details');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to enroll in this course');
      navigate('/login');
      return;
    }

    try {
      setEnrolling(true);
      const response = await courseService.enrollInCourse(id);
      
      if (response.success) {
        toast.success('Successfully enrolled in the course!');
        fetchCourseDetails();
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast.error(error.message || 'Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please login to submit a review');
      navigate('/login');
      return;
    }

    if (reviewForm.rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      setSubmittingReview(true);
      const response = await courseService.addReview(id, {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      
      if (response.success) {
        toast.success('Review submitted successfully!');
        setReviewForm({ rating: 0, comment: '' });
        // Refresh course details to get updated reviews and rating
        fetchCourseDetails();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCompleteCourse = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to complete this course');
      navigate('/login');
      return;
    }

    if (!isEnrolled) {
      toast.error('You must be enrolled in this course to complete it');
      return;
    }

    try {
      setCompleting(true);
      const response = await courseService.completeCourse(id);
      
      if (response.success) {
        toast.success('Course marked as completed! You are now eligible for a certificate.');
        setCourseCompleted(true);
        checkCourseCompletion();
      }
    } catch (error) {
      console.error('Error completing course:', error);
      toast.error(error.message || 'Failed to complete course');
    } finally {
      setCompleting(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getLevelBadge = (level) => {
    const levelConfig = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${levelConfig[level] || levelConfig.beginner}`}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </span>
    );
  };

  const getCategoryIcon = (category) => {
    const categoryIcons = {
      programming: '💻',
      design: '🎨',
      business: '💼',
      marketing: '📈',
      lifestyle: '🌟',
      other: '📚',
    };
    return categoryIcons[category] || '📚';
  };

  const isEnrolled = course?.enrolledStudents?.some(student => student._id === user?.id);
  
  const hasReviewed = course?.reviews?.some(review => review.user?._id === user?.id || review.user?.toString() === user?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h2>
          <p className="text-gray-600 mb-4">The course you're looking for doesn't exist.</p>
          <Link to="/courses" className="btn-primary">
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-6">
            <Link
              to="/courses"
              className="inline-flex items-center text-white hover:text-blue-200 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Courses
            </Link>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center mb-4">
                <span className="text-4xl mr-4">{getCategoryIcon(course.category)}</span>
                <div>
                  {getLevelBadge(course.level)}
                  <span className="ml-3 text-white capitalize">{course.category}</span>
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {course.title}
              </h1>
              
              <p className="text-xl text-blue-100 mb-6">
                {course.description}
              </p>

              {/* Course Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center text-white">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  <span>{course.duration} weeks</span>
                </div>
                <div className="flex items-center text-white">
                  <UsersIcon className="h-5 w-5 mr-2" />
                  <span>{course.enrolledStudents?.length || 0} students</span>
                </div>
                <div className="flex items-center text-white">
                  <StarIcon className="h-5 w-5 mr-2" />
                  <span>{course.averageRating > 0 ? course.averageRating.toFixed(1) : 'No ratings'}</span>
                </div>
                <div className="flex items-center text-white">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  <span>{new Date(course.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Instructor */}
              <div className="flex items-center">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                  {course.instructor?.name?.charAt(0)?.toUpperCase() || 'I'}
                </div>
                <div className="ml-4">
                  <p className="text-white font-medium">{course.instructor?.name || 'Instructor'}</p>
                  <p className="text-blue-200 text-sm">Course Instructor</p>
                </div>
              </div>
            </div>

            {/* Course Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-xl p-6">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {formatPrice(course.price)}
                  </div>
                  <p className="text-gray-600">One-time payment</p>
                </div>

                {isEnrolled ? (
                  <div className="text-center">
                    <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">You're Enrolled!</h3>
                    <p className="text-gray-600 mb-4">Start learning now</p>
                    <Link
                      to="/dashboard"
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors inline-block text-center"
                    >
                      Go to Dashboard
                    </Link>
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
                    >
                      {enrolling ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Enrolling...
                        </div>
                      ) : (
                        <>
                          <CurrencyDollarIcon className="h-5 w-5 inline mr-2" />
                          Enroll Now
                        </>
                      )}
                    </button>
                    
                    <div className="text-center text-sm text-gray-600">
                      <p>✓ Lifetime access</p>
                      <p>✓ Certificate of completion</p>
                      <p>✓ 30-day money-back guarantee</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: BookOpenIcon },
                { id: 'curriculum', label: 'Curriculum', icon: AcademicCapIcon },
                { id: 'instructor', label: 'Instructor', icon: UserIcon },
                { id: 'reviews', label: 'Reviews', icon: StarIcon },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">What you'll learn</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {course.curriculum?.map((week, index) => (
                      <div key={index} className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{week.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {course.prerequisites && course.prerequisites.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Prerequisites</h3>
                    <ul className="space-y-2">
                      {course.prerequisites.map((prereq, index) => (
                        <li key={index} className="flex items-start">
                          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                          <span className="text-gray-700">{prereq}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {course.tags && course.tags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {course.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          <TagIcon className="h-4 w-4 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Curriculum Tab */}
            {activeTab === 'curriculum' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Curriculum</h3>
                {course.curriculum && course.curriculum.length > 0 ? (
                  <div className="space-y-4">
                    {course.curriculum.map((week, weekIndex) => (
                      <div key={weekIndex} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-medium text-gray-900">
                            Week {week.week}: {week.title}
                          </h4>
                          <span className="text-sm text-gray-500">
                            {week.lessons?.length || 0} lessons
                          </span>
                        </div>
                        <p className="text-gray-600 mb-4">{week.description}</p>
                        
                        {week.lessons && week.lessons.length > 0 && (
                          <div className="space-y-2">
                            {week.lessons.map((lesson, lessonIndex) => (
                              <div key={lessonIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center">
                                  <PlayIcon className="h-4 w-4 text-gray-400 mr-3" />
                                  <span className="text-sm font-medium text-gray-900">{lesson.title}</span>
                                  {lesson.isFreePreview && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      Free Preview
                                    </span>
                                  )}
                                </div>
                                <span className="text-sm text-gray-500">{lesson.duration} min</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Curriculum details will be available soon.</p>
                )}
                
                {/* Complete Course Button - Only show for enrolled users */}
                {isEnrolled && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    {courseCompleted ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <CheckCircleIcon className="h-8 w-8 text-green-600 mr-4" />
                          <div>
                            <h4 className="text-lg font-semibold text-green-900">Course Completed!</h4>
                            <p className="text-sm text-green-700">Congratulations! You have completed this course and are now eligible for a certificate.</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-blue-900">Ready to Complete?</h4>
                            <p className="text-sm text-blue-700 mt-1">Mark this course as completed to be eligible for a certificate.</p>
                          </div>
                          <button
                            onClick={handleCompleteCourse}
                            disabled={completing}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                          >
                            {completing ? (
                              <div className="flex items-center">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Completing...
                              </div>
                            ) : (
                              <>
                                <CheckCircleIcon className="h-5 w-5 inline mr-2" />
                                Complete Course
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Instructor Tab */}
            {activeTab === 'instructor' && (
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {course.instructor?.name?.charAt(0)?.toUpperCase() || 'I'}
                  </div>
                  <div className="ml-6">
                    <h3 className="text-xl font-semibold text-gray-900">{course.instructor?.name || 'Instructor'}</h3>
                    <p className="text-gray-600">Course Instructor</p>
                    {course.instructor?.bio && (
                      <p className="text-gray-700 mt-3">{course.instructor.bio}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Student Reviews</h3>
                  <div className="flex items-center">
                    <div className="flex items-center mr-2">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.floor(course.averageRating)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {course.averageRating > 0 ? course.averageRating.toFixed(1) : 'No ratings'} ({course.reviews?.length || 0} reviews)
                    </span>
                  </div>
                </div>

                {/* Review Submission Form */}
                {isAuthenticated && isEnrolled && !hasReviewed && (
                  <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Write a Review</h4>
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rating <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center space-x-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => setReviewForm({ ...reviewForm, rating })}
                              className="focus:outline-none"
                            >
                              <StarIcon
                                className={`h-8 w-8 transition-colors ${
                                  rating <= reviewForm.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            </button>
                          ))}
                          <span className="ml-2 text-sm text-gray-600">
                            {reviewForm.rating > 0 && `${reviewForm.rating} star${reviewForm.rating !== 1 ? 's' : ''}`}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Comment (optional)
                        </label>
                        <textarea
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                          rows={4}
                          maxLength={500}
                          placeholder="Share your thoughts about this course..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {reviewForm.comment.length}/500 characters
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingReview || reviewForm.rating === 0}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {submittingReview ? (
                          <div className="flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Submitting...
                          </div>
                        ) : (
                          'Submit Review'
                        )}
                      </button>
                    </form>
                  </div>
                )}

                {isAuthenticated && isEnrolled && hasReviewed && (
                  <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                      <p className="text-sm text-green-800">You have already reviewed this course.</p>
                    </div>
                  </div>
                )}

                {isAuthenticated && !isEnrolled && (
                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <p className="text-sm text-blue-800">
                      Enroll in this course to submit a review.
                    </p>
                  </div>
                )}

                {course.reviews && course.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {course.reviews.map((review, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {review.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{review.user?.name || 'Anonymous'}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-gray-700 text-sm">{review.comment}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <StarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No reviews yet. Be the first to review this course!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
