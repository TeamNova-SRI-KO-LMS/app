import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#f8f9fa] py-8 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-gray-500 text-center md:text-left font-medium">
          © {new Date().getFullYear()} SRI-KO Korean Language Institute. All rights reserved.
        </p>
        
        <div className="flex flex-wrap justify-center gap-6 text-xs font-medium text-gray-500">
          <Link to="/terms" className="hover:text-blue-600 transition">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-blue-600 transition">Privacy Policy</Link>
          <Link to="/help" className="hover:text-blue-600 transition">Help Center</Link>
          <Link to="/about" className="hover:text-blue-600 transition">Contact Us</Link>
        </div>
      </div>
    </footer>
  );
}
