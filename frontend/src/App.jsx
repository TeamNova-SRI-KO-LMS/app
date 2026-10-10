import "./App.css";

import { Route, Routes } from "react-router-dom";

import AboutUs from "./pages/AboutusPage";
import AdminDashboard from "./admin/AdminDashboard";
import AdminLogin from "./admin/adminLogin";
import AnnouncementsPage from "./pages/AnnouncementsPage"
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
import ScrollToTop from "./components/ScrollToTop";
import SettingsPage from "./pages/SettingsPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
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
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/adminLogin" element={<AdminLogin />} />
        <Route path="/forum" element={<DiscussionForums />} />
        <Route path="/admin/courses/create" element={<CreateCoursePage />} />
        <Route path="/admin/courses/edit/:id" element={<EditCoursePage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/payment-info"
          element={
            <ProtectedRoute>
              <PaymentInfo />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster position="top-right" />
      <FloatingAiSupport />
    </>
  );
}

export default App;
