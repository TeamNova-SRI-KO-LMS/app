import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  User,
  Settings,
  Folder,
  LogOut,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import useAuth from '../context/useAuth';
import toast from 'react-hot-toast';

export default function UserDropdown() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    toast.success('Signed out successfully');
    navigate('/login');
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      description: 'Overview & learning stats',
    },
    {
      id: 'courses',
      label: 'My Courses',
      path: '/my-courses',
      icon: BookOpen,
      description: 'Active lessons & enrolled courses',
    },
    {
      id: 'profile',
      label: 'Student Profile',
      path: '/profile',
      icon: User,
      description: 'Account info & credentials',
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/settings',
      icon: Settings,
      description: 'Preferences & security',
    },
    {
      id: 'resources',
      label: 'Resources',
      path: '/resources',
      icon: Folder,
      description: 'Guides, docs & materials',
    },
  ];

  const userAvatar =
    user?.avatar ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button: Profile Avatar */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User account menu"
        className="w-10 h-10 rounded-full bg-pink-100 border-2 border-white shadow-sm overflow-hidden cursor-pointer flex items-center justify-center transition-all hover:scale-105 hover:ring-2 hover:ring-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <img
          src={userAvatar}
          alt={user?.name || 'User Avatar'}
          className="w-full h-full object-cover"
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2.5 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 transform origin-top-right transition-all duration-200 animate-in fade-in slide-in-from-top-2"
          role="menu"
        >
          {/* User Info Header Card */}
          <div className="px-4 py-3.5 border-b border-gray-100 bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-transparent rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-pink-100 border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                <img
                  src={userAvatar}
                  alt={user?.name || 'User'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {user?.name || 'Student'}
                  </p>
                  <Sparkles size={13} className="text-amber-500 fill-amber-400 flex-shrink-0" />
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {user?.email || 'student@sriko.com'}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                    Level: Intermediate
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="py-2 px-2 space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.id === 'profile' && location.pathname === '/student-profile') ||
                (item.id === 'resources' && location.pathname === '/docs');

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                  role="menuitem"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs sm:text-sm font-semibold leading-none">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1 font-normal hidden sm:block">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={14}
                    className={`transition-transform text-gray-300 group-hover:text-blue-600 group-hover:translate-x-0.5 ${
                      isActive ? 'text-blue-600' : ''
                    }`}
                  />
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-1 border-t border-gray-100" />

          {/* Log Out Button */}
          <div className="px-2 py-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors group"
              role="menuitem"
            >
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <LogOut size={16} />
              </div>
              <span className="font-semibold text-xs sm:text-sm">Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
