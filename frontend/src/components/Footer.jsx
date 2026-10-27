import { Link } from 'react-router-dom';
import { MapPinIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/solid';

export default function Footer() {
  return (
    <footer className="bg-[#07090e] border-t border-zinc-800/80 text-gray-300 py-10 sm:py-12 lg:py-16 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex flex-col lg:flex-row lg:items-stretch justify-between gap-8 sm:gap-10 lg:gap-8 xl:gap-12">
          
          {/* Column 1: Brand / Logo */}
          <div className="lg:w-[30%] xl:w-[28%] lg:shrink-0 flex flex-col justify-between">
            <div>
              <Link to="/" className="inline-flex items-center gap-3 group">
                <div className="w-11 h-11 rounded-full bg-white p-0.5 flex items-center justify-center shrink-0 shadow-sm">
                  <img
                    src="/sri-ko-logo.png"
                    alt="SRI-KO Logo"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
                <span className="font-bold text-white text-2xl tracking-tight">
                  SRI-KO
                </span>
              </Link>

              <div className="mt-4 sm:mt-6 text-sm text-gray-400 leading-relaxed space-y-1">
                <p>
                  © 2024 SRI-KO. The Editorial Scholar Experience.
                </p>
                <p>
                  Elevated language learning for the modern professional.
                </p>
              </div>
            </div>
          </div>

          {/* Divider 1 */}
          <div className="hidden lg:block w-px bg-zinc-800/80 self-stretch my-1 shrink-0" />

          {/* Column 2 & 3: Quick Links & Legal & Support */}
          <div className="flex flex-row gap-8 sm:gap-14 lg:gap-12 xl:gap-16 lg:shrink-0">
            {/* Quick Links */}
            <div className="min-w-[100px]">
              <h4 className="text-white font-bold text-base tracking-tight mb-4">
                Quick Links
              </h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <Link to="/" className="hover:text-white transition-colors duration-150 block">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-white transition-colors duration-150 block">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/courses" className="hover:text-white transition-colors duration-150 block">
                    Our Courses
                  </Link>
                </li>
                <li>
                  <Link to="/join" className="hover:text-white transition-colors duration-150 block">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal & Support */}
            <div className="min-w-[125px]">
              <h4 className="text-white font-bold text-base tracking-tight mb-4">
                Legal & Support
              </h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <Link to="/terms" className="hover:text-white transition-colors duration-150 block">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-white transition-colors duration-150 block">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/help" className="hover:text-white transition-colors duration-150 block">
                    Help Center
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider 2 */}
          <div className="hidden lg:block w-px bg-zinc-800/80 self-stretch my-1 shrink-0" />

          {/* Column 4: Contact Us */}
          <div className="lg:w-[35%] xl:w-[33%] lg:shrink-0 space-y-5 sm:space-y-6">
            {/* Visit Us */}
            <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0d223a] flex items-center justify-center shrink-0 shadow-inner mt-0.5 sm:mt-0">
                <MapPinIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#1d8cf8]" />
              </div>
              <div className="text-sm min-w-0">
                <h5 className="font-bold text-white text-sm sm:text-base tracking-tight mb-0.5">
                  Visit Us
                </h5>
                <p className="text-gray-400 leading-relaxed">
                  SRI-KO Korean Language Institute
                </p>
                <p className="text-gray-400 leading-relaxed">
                  123 Education Street, Colombo 07, Sri Lanka
                </p>
              </div>
            </div>

            {/* Call Us */}
            <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0d223a] flex items-center justify-center shrink-0 shadow-inner mt-0.5 sm:mt-0">
                <PhoneIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#1d8cf8]" />
              </div>
              <div className="text-sm min-w-0">
                <h5 className="font-bold text-white text-sm sm:text-base tracking-tight mb-0.5">
                  Call Us
                </h5>
                <a
                  href="tel:+94112345678"
                  className="text-gray-400 leading-relaxed block hover:text-white transition-colors"
                >
                  +94 11 234 5678
                </a>
                <a
                  href="tel:+94771234567"
                  className="text-gray-400 leading-relaxed block hover:text-white transition-colors"
                >
                  +94 77 123 4567
                </a>
                <p className="text-gray-400 leading-relaxed text-xs sm:text-sm">
                  Mon - Fri: 9:00 AM - 6:00 PM
                </p>
              </div>
            </div>

            {/* Email Us */}
            <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0d223a] flex items-center justify-center shrink-0 shadow-inner mt-0.5 sm:mt-0">
                <EnvelopeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#1d8cf8]" />
              </div>
              <div className="text-sm min-w-0">
                <h5 className="font-bold text-white text-sm sm:text-base tracking-tight mb-0.5">
                  Email Us
                </h5>
                <a
                  href="mailto:info@sriko-korean.com"
                  className="text-gray-400 leading-relaxed block hover:text-white transition-colors break-all"
                >
                  info@sriko-korean.com
                </a>
                <a
                  href="mailto:admissions@sriko-korean.com"
                  className="text-gray-400 leading-relaxed block hover:text-white transition-colors break-all"
                >
                  admissions@sriko-korean.com
                </a>
                <p className="text-gray-400 leading-relaxed text-xs sm:text-sm">
                  We respond within 24 hours.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}

