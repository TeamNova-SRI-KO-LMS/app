import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BarChart3, 
  CreditCard, 
  Bell, 
  Megaphone, 
  MessageSquare, 
  Settings, 
  LogOut,
  X
} from 'lucide-react';
import useAuth from '../context/useAuth';
import { useNavigate } from 'react-router-dom';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'courses', label: 'Course Management', icon: GraduationCap },
  { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
  { id: 'payments', label: 'Payment Management', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'forums', label: 'Discussion Forums', icon: MessageSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const AdminSidebar = ({ 
  activeTab = 'dashboard', 
  setActiveTab, 
  isOpen = true, 
  onClose 
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleNavClick = (id) => {
    if (setActiveTab) {
      setActiveTab(id);
    }
    navigate(id === 'dashboard' ? '/admin/dashboard' : `/admin/${id}`);
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-100 z-50 flex flex-col justify-between transition-transform duration-300 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header / Branding */}
        <div>
          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <img
                src="/sri-ko-logo.png"
                alt="SRI-KO Logo"
                className="h-9 w-auto object-contain"
              />
              <div>
                <h1 className="font-bold text-sm sm:text-base text-blue-600 leading-tight">
                  Admin Portal
                </h1>
                <p className="text-[11px] text-gray-400 font-medium">
                  Management System
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 lg:hidden cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Nav Items List */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-semibold shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon
                    size={18}
                    className={isActive ? 'text-blue-600' : 'text-gray-400'}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile / Logout Footer */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                {user?.name || 'Admin User'}
              </h4>
              <p className="text-[11px] text-gray-500 truncate capitalize">
                {user?.role === 'admin' ? 'Administrator' : (user?.role || 'Administrator')}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
