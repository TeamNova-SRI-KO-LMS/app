import { Navigate, Route, Routes } from 'react-router-dom';

// Protected Pages
import DashboardPage from './pages/DashboardPage';
import DocumentationPage from './pages/DocumentationPage';
//import EditCoursePage from './pages/EditCoursePage';
import HelpCenterPage from './pages/HelpCenterPage';
// Pages
import HomePage from './pages/HomePage';
import JoinUsPage from './pages/JoinUsPage';
import Layout from './components/Layout';
//import LearningProgressPage from './pages/LearningProgressPage';
import LoadingSpinner from './components/LoadingSpinner';
import LoginPage from './pages/LoginPage';
//import MyCoursesPage from './pages/MyCoursesPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ProfilePage from './pages/ProfilePage';
// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute';
import PublicProfilePage from './pages/PublicProfilePage';
import RegisterPage from './pages/RegisterPage';
import ScrollToTop from './components/ScrollToTop';
import SettingsPage from './pages/SettingsPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import { useAdminAuth } from './context/AdminAuthContext';
import { useAuth } from './context/AuthContext';

//import CourseDetailPage from './pages/CourseDetailPage';
//import CoursesPage from './pages/CoursesPage';
//import CreateCoursePage from './pages/CreateCoursePage';


// // Admin Pages
// import AdminDashboardPage from './pages/AdminDashboardPage';
// import AdminUserManagementPage from './pages/AdminUserManagementPage';
// import AdminCourseManagementPage from './pages/AdminCourseManagementPage';
// import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
// import AdminLoginPage from './pages/AdminLoginPage';
// import AdminSubscriptionManagementPage from './pages/AdminSubscriptionManagementPage';
// import AdminCertificateManagementPage from './pages/AdminCertificateManagementPage';
// import AdminAnnouncementManagementPage from './pages/AdminAnnouncementManagementPage';
// import AdminDiscussionForumManagementPage from './pages/AdminDiscussionForumManagementPage';
// import AdminNotificationManagementPage from './pages/AdminNotificationManagementPage';
// import AdminSettingsPage from './pages/AdminSettingsPage';
// import AdminLayout from './components/AdminLayout';
// import AdminJoinUsPage from './pages/AdminJoinUsPage';


function App() {
  const { loading, isAuthenticated, user } = useAuth();
  const { loading: adminLoading } = useAdminAuth();

  // Debug logging
  console.log('🔍 App.jsx - Current state:', { loading, isAuthenticated, user: user?.name, adminLoading });

  if (loading || adminLoading) {
    console.log('🔄 App.jsx - Showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
        <div className="mt-4 text-center">
          <p className="text-gray-600">Loading SRI-KO LMS...</p>
          <p className="text-sm text-gray-500 mt-2">If this takes too long, try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="join-us" element={<JoinUsPage />} />
        <Route path="help-center" element={<HelpCenterPage />} />
        <Route path="documentation" element={<DocumentationPage />} />
        <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="terms-of-service" element={<TermsOfServicePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      {/*  <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/:id" element={<CourseDetailPage />} /> */}
      </Route>

    {/*Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
      </Route>

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ProfilePage />} />
      </Route>

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SettingsPage />} />
      </Route>
{/*}
      <Route
        path="/courses/create"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CreateCoursePage />} />
      </Route>

      <Route
        path="/courses/:id/edit"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<EditCoursePage />} />
      </Route>

      <Route
        path="/learning-progress"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<LearningProgressPage />} />
      </Route> 
      
      <Route
        path="/my-courses"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<MyCoursesPage />} />
      </Route>*/}


      <Route
        path="/public-profile"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PublicProfilePage />} />
      </Route>

      {/* Admin Routes 
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUserManagementPage />} />
        <Route path="courses" element={<AdminCourseManagementPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="subscriptions" element={<AdminSubscriptionManagementPage />} />
            <Route path="certificates" element={<AdminCertificateManagementPage />} />
            <Route path="announcements" element={<AdminAnnouncementManagementPage />} />
            <Route path="forums" element={<AdminDiscussionForumManagementPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="join-us" element={<AdminJoinUsPage />} />
        <Route path="notifications" element={<AdminNotificationManagementPage />} />
      </Route>*/}
    </Routes>
    </>
  );
}

export default App;
