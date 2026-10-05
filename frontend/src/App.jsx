import './App.css'

import { Route, Routes } from 'react-router-dom';
import AboutUs from './pages/AboutusPage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import RegisterPage from './pages/RegisterPage';
import ScrollToTop from './components/ScrollToTop';
import AdminLogin from './admin/adminLogin';
import AdminDashboard from './admin/AdminDashboard';
import CoursesPage from './pages/CoursesPage';
import EventsPage from './pages/EventsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import CourseDetails from './pages/CourseDetailsPage';
import CourseInfoPage from './pages/CourseInfoPage';
import PaymentInfo from './pages/PaymentInfoPage';
import FloatingAiSupport from './components/FloatingAiSupport';
import CreateCoursePage from './pages/CreateCoursePage';
import EditCoursePage from './pages/EditCoursePage';


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
          <Route path="/courses" element={<CoursesPage />} />
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
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/adminLogin" element={<AdminLogin />} />
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
      <FloatingAiSupport />
    </>
  )
}

export default App
