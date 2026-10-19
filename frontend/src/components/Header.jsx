import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu, X, LayoutDashboard, BookOpen, User, Settings, Folder, LogOut, Bell } from 'lucide-react';
import useAuth from '../context/useAuth';
import UserAvatar from './UserAvatar';
import UserDropdown from './UserDropdown';
import NotificationBell from './NotificationBell';
import { useNotifications } from '../context/NotificationContext';
import toast from 'react-hot-toast';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isActive = (path) =>
    location.pathname === path ||
    (path === '/join' && (location.pathname === '/join-us' || location.pathname === '/contact'));

  const handleMobileLogout = () => {
    setMobileMenuOpen(false);
    logout();
    toast.success('Signed out successfully');
    navigate('/login');
  };

  // Home destination depends on auth state, Announcements requires auth
  const allNavLinks = [
    { to: isAuthenticated ? '/home': '/', label: 'Home' },
    { to: '/courses',       label: 'Courses' },
    { to: '/announcements', label: 'Announcements', requiresAuth: true },
    { to: '/events',        label: 'Events' },
    { to: '/join',          label: 'Join Us' },
    { to: '/about',         label: 'About Us' },
  ];

  const navLinks = allNavLinks.filter(
    (link) => !link.requiresAuth || isAuthenticated
  );

  return (
    <header className="app-header">
      <nav className="bg-white px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">

        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            to={isAuthenticated ? '/home' : '/'}
            className="w-12 h-12 bg-blue-100 flex items-center justify-center font-bold text-blue-800 text-xs overflow-hidden rounded-sm"
          >
            <img src="/sri-ko-logo.png" alt="SRI-KO Logo" className="w-full h-full object-cover" />
          </Link>
        </div>

        {/* Navigation Links — Desktop */}
        <div className="hidden md:flex space-x-8 text-sm font-medium text-gray-500">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={
                isActive(to)
                  ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                  : 'hover:text-blue-600 transition pb-1'
              }
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-3">

          {/* Search Bar — Desktop */}
          <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-2">
            <Search size={16} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-sm ml-2 w-32 text-gray-600 placeholder-gray-400"
            />
          </div>

          {/* Auth area */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              {/* Notification Bell Icon */}
              <NotificationBell />
              {/* User Profile Dropdown Component */}
              <UserDropdown />
            </div>
          ) : (
            /* Sign In + Join Us Today — shown when logged out */
            <div className="hidden md:flex items-center space-x-3">
              <Link
                to="/login"
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition whitespace-nowrap"
              >
                Join Us Today
              </Link>
            </div>
          )}

          {/* Mobile Hamburger */}
          <button
            className="md:hidden text-gray-600 hover:text-blue-600 transition"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-6 py-4 space-y-1">

            {/* Nav links */}
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-3 px-4 rounded-lg text-sm font-medium transition ${
                  isActive(to)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                {label}
              </Link>
            ))}

            {/* Mobile Search */}
            <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 mt-3">
              <Search size={16} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm ml-2 w-full text-gray-600 placeholder-gray-400"
              />
            </div>

            {/* Authenticated user mobile section */}
            {isAuthenticated ? (
              <div className="pt-4 mt-3 border-t border-gray-100 space-y-1">
                <div className="px-4 py-2 mb-2 bg-blue-50/60 rounded-xl flex items-center gap-3">
                  <UserAvatar user={user} size="w-9 h-9" iconSize={18} className="border border-white" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{user?.name || 'Student'}</p>
                    <p className="text-xs text-gray-500">Level: Intermediate</p>
                  </div>
                </div>

                <Link
                  to="/notifications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-2.5 px-4 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                >
                  <div className="flex items-center gap-3">
                    <Bell size={16} />
                    <span>Notifications</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-red-600 text-white rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-2.5 px-4 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/my-courses"
                  state={{ source: 'top-nav' }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-2.5 px-4 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                >
                  <BookOpen size={16} />
                  <span>My Courses</span>
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-2.5 px-4 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                >
                  <User size={16} />
                  <span>Student Profile</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-2.5 px-4 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </Link>
                <Link
                  to="/resources"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-2.5 px-4 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                >
                  <Folder size={16} />
                  <span>Resources</span>
                </Link>
                <button
                  onClick={handleMobileLogout}
                  className="w-full flex items-center gap-3 py-2.5 px-4 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition text-left"
                >
                  <LogOut size={16} />
                  <span>Log out</span>
                </button>
              </div>
            ) : (
              /* Auth links on mobile — only when logged out */
              <div className="flex flex-col gap-2 mt-3">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 px-4 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition text-center"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 px-4 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition text-center"
                >
                  Join Us Today
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
