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
    },
    {
      id: 'courses',
      label: 'My Courses',
      path: '/my-courses',
      icon: BookOpen,
    },
    {
      id: 'profile',
      label: 'Student Profile',
      path: '/profile',
      icon: User,
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/settings',
      icon: Settings,
    },
    {
      id: 'resources',
      label: 'Resources',
      path: '/resources',
      icon: Folder,
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
          className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 transform origin-top-right transition-all duration-150 animate-in fade-in slide-in-from-top-1"
          role="menu"
        >
          {/* User Info Header */}
          <div className="px-3.5 py-2.5 border-b border-gray-100 bg-gray-50/60 rounded-t-xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-pink-100 border border-white shadow-xs overflow-hidden flex-shrink-0">
                <img
                  src={userAvatar}
                  alt={user?.name || 'User'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {user?.name || 'Student'}
                  </p>
                  <Sparkles size={11} className="text-amber-500 fill-amber-400 flex-shrink-0" />
                </div>
                <p className="text-[11px] text-gray-500 truncate leading-tight mt-0.5">
                  {user?.email || 'student@sriko.com'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="py-1 px-1.5 space-y-0.5">
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
                  className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100/70 hover:text-blue-600'
                  }`}
                  role="menuitem"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      size={15}
                      className={isActive ? 'text-blue-600' : 'text-gray-500'}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <ChevronRight
                    size={13}
                    className={`transition-transform text-gray-300 ${
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
          <div className="px-1.5 pb-0.5">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
              role="menuitem"
            >
              <LogOut size={15} className="text-red-500" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
