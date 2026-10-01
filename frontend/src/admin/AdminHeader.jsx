import React from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  HelpCircle, 
  Settings 
} from 'lucide-react';
import useAuth from '../context/useAuth';

const AdminHeader = ({ 
  onToggleSidebar, 
  searchQuery = '', 
  setSearchQuery 
}) => {
  const { user } = useAuth();

  return (
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
        {/* Notification Bell */}
        <button 
          className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        {/* Help Circle */}
        <button 
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer hidden sm:flex"
          title="Help & Support"
        >
          <HelpCircle size={18} />
        </button>

        {/* Settings Icon */}
        <button 
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer hidden sm:flex"
          title="Settings"
        >
          <Settings size={18} />
        </button>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-gray-200 hidden sm:block" />

        {/* User Profile Info */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="text-right hidden sm:block">
            <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
              {user?.name || 'Admin User'}
            </div>
            <div className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase">
              CHIEF EDITOR
            </div>
          </div>
          
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-gray-200 bg-amber-50 flex items-center justify-center shrink-0">
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <span className="text-sm font-bold text-amber-800">
                👨‍💼
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
