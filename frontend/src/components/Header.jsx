import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Bell, Menu, X } from 'lucide-react';
import useAuth from '../context/useAuth';

export default function Header() {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: '/home', label: 'Home' },
    { to: '/courses', label: 'Courses' },
    { to: '/announcements', label: 'Announcements' },
    { to: '/events', label: 'Events' },
    { to: '/about', label: 'About Us' },
  ];

  return (
    <header className="app-header">
      <nav className="bg-white px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          {/* Logo */}
           <Link to="/" className="w-12 h-15 bg-blue-100  flex items-center justify-center font-bold text-blue-800  text-xs overflow-hidden">
            <img src="/sri-ko-logo.png" alt="SRI-KO Logo" className="w-full h-full object-cover" />
          </Link>
        </div>
        
        {/* Navigation Links — Desktop */}
        <div className="hidden md:flex space-x-8 text-sm font-medium text-gray-500">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={isActive(to)
                ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                : "hover:text-blue-600 transition pb-1"
              }
            >
              {label}
            </Link>
          ))}
        </div>
        
        {/* Right Nav Actions */}
        <div className="flex items-center space-x-4">
          {/* Search Bar — Desktop */}
          <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-2">
            <Search size={16} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-transparent border-none outline-none text-sm ml-2 w-32 text-gray-600 placeholder-gray-400"
            />
          </div>
          
          {/* Notifications */}
          <button className="text-gray-500 hover:text-blue-600 transition relative">
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
          
          {/* User Avatar / Auth Links */}
          {isAuthenticated ? (
            <Link to="/dashboard" className="w-8 h-8 rounded-full bg-pink-200 border-2 border-white shadow-sm overflow-hidden cursor-pointer">
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`}
                alt="User Avatar"
                className="w-full h-full object-cover"
              />
            </Link>
          ) : (
            <Link
              to="/login"
              className="hidden md:inline-flex text-sm font-medium text-blue-600 hover:text-blue-700 transition"
            >
              Sign In
            </Link>
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
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg animate-in slide-in-from-top">
          <div className="px-6 py-4 space-y-1">
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

            {/* Auth link on mobile */}
            {!isAuthenticated && (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 px-4 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition mt-2"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
