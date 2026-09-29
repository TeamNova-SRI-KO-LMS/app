import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';
import useAuth from '../context/useAuth';

export default function Header() {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isActive = (path) => location.pathname === path;

  // Home destination depends on auth state, Announcements requires auth
  const allNavLinks = [
    { to: isAuthenticated ? '/home': '/', label: 'Home' },
    { to: '/courses',       label: 'Courses' },
    { to: '/announcements', label: 'Announcements', requiresAuth: true },
    { to: '/events',        label: 'Events' },
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
            /* Profile avatar — links to dashboard */
            <Link
              to="/dashboard"
              className="w-9 h-9 rounded-full bg-pink-200 border-2 border-white shadow-sm overflow-hidden cursor-pointer flex-shrink-0"
            >
              <img
                src={
                  user?.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`
                }
                alt="User Avatar"
                className="w-full h-full object-cover"
              />
            </Link>
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

            {/* Auth links on mobile — only when logged out */}
            {!isAuthenticated && (
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

