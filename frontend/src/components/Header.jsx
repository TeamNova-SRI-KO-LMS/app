import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu, X, LayoutDashboard, BookOpen, User, Settings, Folder, LogOut, Bell } from 'lucide-react';
import useAuth from '../context/useAuth';
import UserAvatar from './UserAvatar';
import UserDropdown from './UserDropdown';
import NotificationBell from './NotificationBell';
import { useNotifications } from '../context/NotificationContext';
import toast from 'react-hot-toast';

// Keyboard focus ring shared by every interactive element in the header
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

const mobileAccountLink =
  `group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-blue-700 ${focusRing}`;

const mobileAccountIcon =
  'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition group-hover:bg-blue-100 group-hover:text-blue-700';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // The header is fixed to the top; once the page scrolls it gains a soft shadow
  const [scrolled, setScrolled] = useState(() => window.scrollY > 8);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close the mobile menu with Escape, or when the window grows to the desktop layout
  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = (event) => {
      if (event.matches) setMobileMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    desktop.addEventListener('change', closeOnDesktop);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      desktop.removeEventListener('change', closeOnDesktop);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileMenuOpen]);

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

  // Account shortcuts in the mobile menu (Notifications and Log out are rendered separately)
  const mobileAccountLinks = [
    { to: '/dashboard',  label: 'Dashboard',       icon: LayoutDashboard },
    { to: '/my-courses', label: 'My Courses',      icon: BookOpen, state: { source: 'top-nav' } },
    { to: '/profile',    label: 'Student Profile', icon: User },
    { to: '/settings',   label: 'Settings',        icon: Settings },
    { to: '/resources',  label: 'Resources',       icon: Folder },
  ];

  const elevated = scrolled || mobileMenuOpen;

  return (
    <header
      // While the mobile menu is open the header sits above the floating support button (z-[9999])
      className={`app-header fixed inset-x-0 top-0 w-full transition-[background-color,box-shadow] duration-300 ${
        mobileMenuOpen ? 'z-[10000]' : 'z-50'
      } ${
        elevated
          ? 'bg-white/85 shadow-[0_1px_0_rgba(226,232,240,0.9),0_12px_32px_-20px_rgba(15,23,42,0.35)] backdrop-blur-xl backdrop-saturate-150'
          : 'bg-white shadow-[0_1px_0_rgba(226,232,240,0.7)]'
      }`}
    >
      <nav aria-label="Main navigation" className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          to={isAuthenticated ? '/home' : '/'}
          className={`group flex-shrink-0 rounded-full ${focusRing}`}
        >
          <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white p-0.5 shadow-sm ring-1 ring-slate-200 transition duration-300 group-hover:shadow-md group-hover:ring-blue-200">
            <img src="/sri-ko-logo.png" alt="SRI-KO Logo" className="h-full w-full object-contain" />
          </span>
        </Link>

        {/* Navigation Links — Desktop */}
        <div className="hidden flex-1 justify-center lg:flex">
          <div className="flex items-center gap-1 rounded-full bg-slate-100/80 p-1 ring-1 ring-slate-200/70">
            {navLinks.map(({ to, label }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${focusRing} ${
                    active
                      ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200/80'
                      : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">

          {/* Search Bar — Desktop */}
          <label className="hidden h-10 w-52 items-center gap-2 rounded-full bg-slate-100/80 px-4 text-slate-400 ring-1 ring-slate-200/70 transition focus-within:bg-white focus-within:text-blue-600 focus-within:ring-2 focus-within:ring-blue-500/40 xl:flex">
            <Search size={16} className="flex-shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              aria-label="Search"
              className="w-full min-w-0 border-none bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
            />
          </label>

          <span aria-hidden="true" className="hidden h-6 w-px bg-slate-200 xl:block" />

          {/* Auth area */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5">
              {/* Notification Bell Icon */}
              <NotificationBell />
              {/* User Profile Dropdown Component */}
              <UserDropdown />
            </div>
          ) : (
            /* Sign In + Join Us Today — shown when logged out */
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                to="/login"
                className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 ${focusRing}`}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className={`inline-flex h-10 items-center whitespace-nowrap rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-600/30 active:scale-[0.98] ${focusRing}`}
              >
                Join Us Today
              </Link>
            </div>
          )}

          {/* Mobile Hamburger */}
          <button
            type="button"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100 hover:text-blue-700 lg:hidden ${focusRing}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="border-t border-slate-200/70 bg-white lg:hidden">
          {/* Scrolls on its own so every item stays reachable under the fixed header */}
          <div className="mx-auto max-h-[calc(100dvh-5rem)] max-w-7xl space-y-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">

            {/* Nav links */}
            {navLinks.map(({ to, label }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${focusRing} ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {label}
                  {active && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
                </Link>
              );
            })}

            {/* Mobile Search */}
            <label className="mt-3 flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-slate-400 ring-1 ring-slate-200/70 transition focus-within:bg-white focus-within:text-blue-600 focus-within:ring-2 focus-within:ring-blue-500/40">
              <Search size={16} className="flex-shrink-0" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search..."
                aria-label="Search"
                className="w-full min-w-0 border-none bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
              />
            </label>

            {/* Authenticated user mobile section */}
            {isAuthenticated ? (
              <div className="mt-3 space-y-1 border-t border-slate-100 pt-4">
                <div className="mb-2 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50/70 to-white p-3 ring-1 ring-blue-100">
                  <UserAvatar user={user} size="w-10 h-10" iconSize={18} className="border-2 border-white shadow-sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{user?.name || 'Student'}</p>
                    <p className="text-xs text-slate-500">Level: Intermediate</p>
                  </div>
                </div>

                <Link
                  to="/notifications"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${mobileAccountLink} justify-between`}
                >
                  <span className="flex items-center gap-3">
                    <span className={mobileAccountIcon}>
                      <Bell size={16} />
                    </span>
                    <span>Notifications</span>
                  </span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {mobileAccountLinks.map(({ to, label, icon: Icon, state }) => (
                  <Link
                    key={to}
                    to={to}
                    state={state}
                    onClick={() => setMobileMenuOpen(false)}
                    className={mobileAccountLink}
                  >
                    <span className={mobileAccountIcon}>
                      <Icon size={16} />
                    </span>
                    <span>{label}</span>
                  </Link>
                ))}

                <button
                  type="button"
                  onClick={handleMobileLogout}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 ${focusRing}`}
                >
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 transition group-hover:bg-red-100">
                    <LogOut size={16} />
                  </span>
                  <span>Log out</span>
                </button>
              </div>
            ) : (
              /* Auth links on mobile — only when logged out (the bar shows them from the sm breakpoint) */
              <div className="mt-3 flex flex-col gap-2 sm:hidden">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block rounded-xl px-4 py-3 text-center text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-blue-700 ${focusRing}`}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:from-blue-700 hover:to-indigo-700 ${focusRing}`}
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
