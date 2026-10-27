import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  HelpCircle, 
  Settings,
  Shield,
  User,
  LogOut,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../context/useAuth';
import NotificationBell from '../components/NotificationBell';
import UserAvatar from '../components/UserAvatar';
import AdminProfileModal from './components/AdminProfileModal';

const AdminHeader = ({ 
  onToggleSidebar, 
  searchQuery = '', 
  setSearchQuery 
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
    navigate('/admin/login');
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left section: Hamburger button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
            title="Toggle Navigation"
            aria-label="Toggle Navigation"
          >
            <Menu size={22} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Middle section: Search bar */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
              placeholder="Search courses, instructors, or IDs..."
              className="w-full pl-9 pr-4 py-2 bg-[#F1F4F8] border border-transparent rounded-lg text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Right section: Icons & User Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Real-Time WebSocket Notification Bell */}
          <NotificationBell />

          {/* Help Circle */}
          <button 
            type="button"
            onClick={() => navigate('/admin/forums')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer hidden sm:flex"
            title="Help & Support"
          >
            <HelpCircle size={18} />
          </button>

          {/* Settings Icon */}
          <button 
            type="button"
            onClick={() => navigate('/admin/settings')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer hidden sm:flex"
            title="Settings"
          >
            <Settings size={18} />
          </button>

          {/* Vertical Divider */}
          <div className="h-6 w-px bg-gray-200 hidden sm:block" />

          {/* Admin User Profile Dropdown (Similar to student UserDropdown) */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
              aria-label="Admin account menu"
              className="flex items-center gap-2.5 pl-1.5 py-1 pr-2 rounded-xl hover:bg-gray-50 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <div className="text-right hidden sm:block">
                <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                  {user?.name || 'Admin User'}
                </div>
                <div className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase">
                  CHIEF EDITOR
                </div>
              </div>

              <div className="relative">
                <UserAvatar 
                  user={user} 
                  size="w-9 h-9" 
                  iconSize={18} 
                  showInitials={true}
                  className="ring-2 ring-gray-200 group-hover:ring-blue-400 transition-all shadow-2xs" 
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>

              <ChevronDown 
                size={14} 
                className={`text-gray-400 group-hover:text-gray-600 transition-transform duration-200 hidden sm:block ${
                  isDropdownOpen ? 'rotate-180 text-blue-600' : ''
                }`} 
              />
            </button>

            {/* Profile Dropdown Menu */}
            {isDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 transform origin-top-right transition-all animate-in fade-in slide-in-from-top-1"
                role="menu"
              >
                {/* Header Profile Snippet */}
                <div className="px-3.5 py-3 border-b border-gray-100 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 rounded-t-2xl">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserAvatar 
                      user={user} 
                      size="w-10 h-10" 
                      iconSize={18} 
                      showInitials={true} 
                      className="ring-2 ring-white shadow-xs shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {user?.name || 'Admin User'}
                        </p>
                        <Sparkles size={11} className="text-amber-500 fill-amber-400 shrink-0" />
                      </div>
                      <p className="text-[11px] text-gray-500 truncate leading-tight mt-0.5">
                        {user?.email || 'admin@sriko-editorial.com'}
                      </p>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wider">
                        Administrator
                      </span>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1 px-1.5 space-y-0.5 text-xs">
                  {/* View Admin Profile (Opens dummy/default student-style profile modal) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors cursor-pointer text-left"
                  >
                    <User size={15} className="text-gray-400" />
                    <span>Administrator Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate('/admin/settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors cursor-pointer text-left"
                  >
                    <Settings size={15} className="text-gray-400" />
                    <span>System Settings</span>
                  </button>
                </div>

                <div className="h-px bg-gray-100 my-1" />

                <div className="p-1.5">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-medium transition-colors cursor-pointer text-left text-xs"
                  >
                    <LogOut size={15} className="text-red-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Admin Profile Modal */}
      <AdminProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
      />
    </>
  );
};

export default AdminHeader;
