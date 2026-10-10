import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  User,
  Settings,
  Folder,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import useAuth from '../context/useAuth';
import toast from 'react-hot-toast';

export default function StudentSidebar({ activeTab: propActiveTab }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
    navigate('/login');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'courses', label: 'My Courses', icon: BookOpen, path: '/my-courses' },
    { id: 'profile', label: 'Student Profile', icon: User, path: '/profile' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
    { id: 'resources', label: 'Resources', icon: Folder, path: '/resources' },
  ];

  const getIsActive = (item) => {
    if (propActiveTab) {
      return propActiveTab === item.id;
    }
    if (location.pathname === item.path) return true;
    if (item.id === 'profile' && location.pathname === '/student-profile') return true;
    if (item.id === 'resources' && location.pathname === '/docs') return true;
    return false;
  };

  const userAvatar =
    user?.avatar ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Scholar'}`;

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 flex flex-col justify-between bg-white lg:bg-transparent p-4 lg:p-0 rounded-2xl shadow-sm lg:shadow-none border lg:border-none border-gray-100">
      <div>
        {/* User Profile Card */}
        <div className="flex flex-col items-center text-center pb-6 border-b border-gray-200/70 mb-6">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full bg-pink-100 p-1 border-2 border-pink-200 shadow-sm overflow-hidden">
              <img
                src={userAvatar}
                alt="Student Avatar"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </div>
          <h3 className="font-bold text-gray-900 text-base">
            {user?.name || 'Student Name'}
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Level: Intermediate
          </p>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = getIsActive(item);
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100/80 font-semibold'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <Icon
                  size={18}
                  className={isSelected ? 'text-blue-600' : 'text-gray-400'}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="pt-6 border-t border-gray-200/70 mt-8 space-y-2">
        <Link
          to="/help"
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-gray-500 hover:text-blue-600 transition"
        >
          <HelpCircle size={18} />
          <span>Help Center</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-red-500 hover:text-red-600 hover:bg-red-50 transition"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
