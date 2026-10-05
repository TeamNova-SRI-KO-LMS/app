import React, { useState } from 'react';
import { 
  ArrowLeft, Edit2, PlusCircle, CheckCircle2, 
  AlertCircle, ChevronDown, Check, Image as ImageIcon
} from 'lucide-react';
import CourseResourceModal from './CourseResourceModal';

export default function EditCourseView({ course, onBack, onSave, loading }) {
  const [title, setTitle] = useState(course?.title || 'Intermediate Korean: Business Etiquette');
  const [category, setCategory] = useState(course?.category || 'Business Korean');
  const [level, setLevel] = useState(course?.level || 'intermediate');
  const [isEditingLevel, setIsEditingLevel] = useState(false);
  const [description, setDescription] = useState(
    course?.description || 
    'Master the nuances of polite speech (Jondaemal) and professional correspondence in a Korean corporate environment. This course covers meeting etiquette, honorifics in emails, and networking protocols.'
  );

  // Quick settings toggles
  const [openEnrollment, setOpenEnrollment] = useState(true);
  const [certificatesEnabled, setCertificatesEnabled] = useState(true);
  const [featuredOnHome, setFeaturedOnHome] = useState(false);

  // Resource Upload Modal state
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [activeModuleTarget, setActiveModuleTarget] = useState('01: Introduction to Honorifics');

  const modules = [
    {
      num: '01',
      title: 'Introduction to Honorifics',
      subtitle: '4 Lessons • 45 Minutes',
    },
    {
      num: '02',
      title: 'Email & Written Communication',
      subtitle: '6 Lessons • 1h 20m',
    },
    {
      num: '03',
      title: 'The Business Meeting',
      subtitle: '3 Lessons • 35 Minutes',
    },
  ];

  const handleSave = () => {
    const payload = {
      ...course,
      title,
      category: category === 'Business Korean' ? 'Business' : category,
      level,
      description,
      openEnrollment,
      certificatesEnabled,
      featuredOnHome,
    };
    if (onSave) onSave(payload);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-800 pb-16 font-sans">
      
      {/* Top Back Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-600 mb-2 transition cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Courses
          </button>
        )}
      </div>

      {/* Main Grid: Left General Info & Module Builder + Right Thumbnail, Readiness, Quick Settings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-2">
        
        {/* ================= LEFT COLUMN ================= */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Section 1: General Information */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                General Information
              </h2>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-5">
              {/* Course Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Course Title
                </label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#f1f5f9] border border-transparent rounded-2xl px-4 py-3 text-sm text-gray-800 focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-2xs font-medium"
                />
              </div>

              {/* Category & Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full appearance-none bg-[#f1f5f9] border border-transparent rounded-2xl px-4 py-3 pr-9 text-sm text-gray-800 font-medium focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-2xs"
                    >
                      <option>Business Korean</option>
                      <option>Language & Culture</option>
                      <option>Literature</option>
                      <option>Grammar</option>
                      <option>Conversation</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Level
                  </label>
                  {isEditingLevel ? (
                    <div className="relative">
                      <select
                        value={level}
                        onChange={(e) => { setLevel(e.target.value); setIsEditingLevel(false); }}
                        className="w-full appearance-none bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 pr-9 text-sm text-blue-800 font-bold focus:outline-none"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-[#dbeafe] text-[#1e40af] px-4 py-3 rounded-2xl text-sm font-bold shadow-2xs">
                      <span className="capitalize">{level}</span>
                      <button 
                        type="button" 
                        onClick={() => setIsEditingLevel(true)}
                        className="text-blue-600 hover:text-blue-800 transition p-0.5"
                        title="Edit level"
                      >
                        <Edit2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea 
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#f1f5f9] border border-transparent rounded-2xl p-4 text-sm text-gray-800 leading-relaxed focus:bg-white focus:border-blue-500 focus:outline-none resize-none transition shadow-2xs font-normal"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Section 2: Module Builder */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-6 bg-[#7c3aed] rounded-full" />
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  Module Builder
                </h2>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setActiveModuleTarget('New Module');
                  setShowResourceModal(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 transition cursor-pointer"
              >
                <PlusCircle size={16} />
                <span>Add New Module</span>
              </button>
            </div>

            {/* Modules List Cards */}
            <div className="space-y-3.5">
              {modules.map((m) => (
                <div 
                  key={m.num}
                  onClick={() => {
                    setActiveModuleTarget(`${m.num}: ${m.title}`);
                    setShowResourceModal(true);
                  }}
                  className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 flex items-center justify-between shadow-xs hover:border-blue-200 hover:shadow-sm transition cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                      {m.num}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-base leading-snug group-hover:text-blue-600 transition">
                        {m.title}
                      </h4>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">
                        {m.subtitle}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition">
                    Edit Content →
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSave}
              className="px-7 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card 1: Course Thumbnail */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs">
            <h4 className="font-bold text-gray-700 text-xs uppercase tracking-wider mb-3">
              Course Thumbnail
            </h4>
            
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-gray-900 relative shadow-inner mb-3">
              <img 
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800" 
                alt="Course Safe Work Thumbnail" 
                className="w-full h-full object-cover opacity-85"
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white text-center p-4">
                <span className="text-[11px] font-mono tracking-widest uppercase text-amber-300 font-bold">COURSE</span>
                <span className="text-base font-black tracking-wider uppercase mt-0.5">SAFE WORK</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 text-center leading-relaxed">
              Recommended size: 1280×720px. JPG, PNG, or WebP.
            </p>
          </div>

          {/* Card 2: Course Readiness */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs">
            <h4 className="font-bold text-gray-700 text-xs uppercase tracking-wider mb-4">
              Course Readiness
            </h4>

            {/* Metric 1: Curriculum Completion */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1.5">
                <span>Curriculum Completion</span>
                <span className="font-bold text-gray-900">75%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>

            {/* Metric 2: Video Content */}
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1.5">
                <span>Video Content</span>
                <span className="font-bold text-gray-900">40%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>

            {/* Readiness checklist items */}
            <div className="space-y-3 pt-2 border-t border-gray-100 text-xs font-semibold">
              <div className="flex items-center gap-2.5 text-gray-800">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>SEO Titles Optimized</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-800">
                <AlertCircle size={16} className="text-red-500 shrink-0" />
                <span>3 lessons missing video</span>
              </div>
            </div>
          </div>

          {/* Card 3: Quick Settings */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs">
            <h4 className="font-bold text-gray-700 text-xs uppercase tracking-wider mb-4">
              Quick Settings
            </h4>

            <div className="space-y-4">
              {/* Toggle 1: Open Enrollment */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800">Open Enrollment</span>
                <button
                  type="button"
                  onClick={() => setOpenEnrollment(!openEnrollment)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    openEnrollment ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    openEnrollment ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Toggle 2: Certificates Enabled */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800">Certificates Enabled</span>
                <button
                  type="button"
                  onClick={() => setCertificatesEnabled(!certificatesEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    certificatesEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    certificatesEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Toggle 3: Featured on Home */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800">Featured on Home</span>
                <button
                  type="button"
                  onClick={() => setFeaturedOnHome(!featuredOnHome)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    featuredOnHome ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    featuredOnHome ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 border-t border-gray-200 mt-16 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
        <div>
          <span className="font-bold text-gray-700">SRI-KO Editorial Scholar</span>
          <span className="ml-2">© 2024 SRI-KO Editorial Scholar. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-gray-600">Privacy Policy</a>
          <a href="#" className="hover:text-gray-600">Terms of Service</a>
          <a href="#" className="hover:text-gray-600">Contact Support</a>
        </div>
      </footer>

      {/* Resource & Assignment Modal */}
      <CourseResourceModal 
        isOpen={showResourceModal}
        onClose={() => setShowResourceModal(false)}
        courseTitle={title}
        targetModule={activeModuleTarget}
      />

    </div>
  );
}
