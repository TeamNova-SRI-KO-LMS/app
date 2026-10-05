import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#f8f9fa] border-t border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Side: Brand Logo & Description */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <img
              src="/sri-ko-logo.png"
              alt="SRI-KO Logo"
              className="h-6 w-auto object-contain"
            />
            <span className="font-bold text-gray-900 text-base tracking-tight">SRI-KO</span>
          </div>
          <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
            © 2024 SRI-KO. The Editorial Scholar Experience. Elevated language learning for the modern professional.
          </p>
        </div>

        {/* Right Side: Navigation Links (with safe right margin to avoid floating widget overlap) */}
        <div className="flex flex-wrap items-center gap-5 sm:gap-7 text-xs font-medium text-gray-500 pr-28 sm:pr-36 md:pr-44 lg:pr-48">
          <Link to="/terms" className="hover:text-blue-600 transition-colors whitespace-nowrap">
            Terms of Service
          </Link>
          <Link to="/privacy" className="hover:text-blue-600 transition-colors whitespace-nowrap">
            Privacy Policy
          </Link>
          <Link to="/help" className="hover:text-blue-600 transition-colors whitespace-nowrap">
            Help Center
          </Link>
          <Link to="/contact" className="hover:text-blue-600 transition-colors whitespace-nowrap">
            Contact Us
          </Link>
        </div>
      </div>
    </footer>
  );
}
