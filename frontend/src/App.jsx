import './App.css'

import { BrowserRouter, Route, Routes } from 'react-router-dom';

import AuthProvider from './context/AuthProvider';
import AboutUs from './pages/AboutusPage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import RegisterPage from './pages/RegisterPage';
import ScrollToTop from './components/ScrollToTop';
import CoursesPage from './pages/CoursesPage';
import EventsPage from './pages/EventsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import CourseDetails from './pages/CourseDetailsPage';
import PaymentInfo from './pages/PaymentInfoPage';


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/course-details" element={<CourseDetails />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="/" element={<LandingPage />} />
           <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          <Route path="/payment-info" element={<PaymentInfo />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
