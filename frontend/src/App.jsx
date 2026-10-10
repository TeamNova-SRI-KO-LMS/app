
import "./App.css";

import { Route, Routes } from "react-router-dom";

import AboutUs from "./pages/AboutusPage";
import AdminDashboard from "./admin/AdminDashboard";
import AdminLogin from "./admin/adminLogin";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import CourseDetails from "./pages/CourseDetailsPage";
import CourseInfoPage from "./pages/CourseInfoPage";
import CoursesPage from "./pages/CoursesPage";
import CreateCoursePage from "./admin/CreateCoursePage";
import DashboardPage from "./pages/DashboardPage";
import DiscussionForums from "./admin/DiscussionForums";
import DocumentationPage from "./pages/DocumentationPage";
import EditCoursePage from "./admin/EditCoursePage";
import EventsPage from "./pages/EventsPage";
import FloatingAiSupport from "./components/FloatingAiSupport";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import HelpCenterPage from "./pages/HelpCenterPage";
import HomePage from "./pages/HomePage";
import JoinUsPage from "./pages/JoinUsPage";
import LandingPage from "./pages/LandingPage";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import MyCoursesPage from "./pages/MyCoursesPage";
import PaymentInfo from "./pages/PaymentInfoPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ScrollToTop from "./components/ScrollToTop";
import SettingsPage from "./pages/SettingsPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        {/* Public pages and authenticated user pages */}
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />

          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<JoinUsPage />} />
          <Route path="/join" element={<JoinUsPage />} />
          <Route path="/join-us" element={<JoinUsPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route
            path="/terms-and-conditions"
            element={<TermsOfServicePage />}
          />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/help" element={<HelpCenterPage />} />
          <Route path="/help-center" element={<HelpCenterPage />} />

          {/* Course and learning routes */}
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/docs" element={<DocumentationPage />} />
          <Route path="/resources" element={<DocumentationPage />} />
          <Route path="/events" element={<EventsPage />} />

          <Route
            path="/announcements"
            element={
              <ProtectedRoute>
                <AnnouncementsPage />
              </ProtectedRoute>
            }
          />

          <Route path="/course-details" element={<CourseDetails />} />
          <Route path="/courses/:id" element={<CourseDetails />} />
          <Route path="/course-info" element={<CourseInfoPage />} />
          <Route path="/course-info/:id" element={<CourseInfoPage />} />
          <Route path="/courses/:id/learn" element={<CourseInfoPage />} />

          {/* Protected student routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-courses"
            element={
              <ProtectedRoute>
                <MyCoursesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student-profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Authentication routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Admin authentication routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/adminLogin" element={<AdminLogin />} />

        {/* Discussion forum */}
        <Route path="/forum" element={<DiscussionForums />} />

        {/* Protected admin course management */}
        <Route
          path="/admin/courses/create"
          element={
            <ProtectedRoute roles={["admin"]}>
              <CreateCoursePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/courses/edit/:id"
          element={
            <ProtectedRoute roles={["admin"]}>
              <EditCoursePage />
            </ProtectedRoute>
          }
        />

        {/* Protected admin dashboard */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Registration */}
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected payment route */}
        <Route
          path="/payment-info"
          element={
            <ProtectedRoute>
              <PaymentInfo />
            </ProtectedRoute>
          }
        />
      </Routes>

      {/* Global toast notifications */}
      <Toaster position="top-right" />

      {/* Floating AI support widget */}
      <FloatingAiSupport />
    </>
  );
}

export default App;
