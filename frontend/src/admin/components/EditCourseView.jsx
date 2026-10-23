import React, { useState } from 'react';
import { 
  ArrowLeft, Edit2, PlusCircle, CheckCircle2, 
  AlertCircle, ChevronDown, Check, Image as ImageIcon, Loader2, Upload,
  User, Sparkles, Camera, Link as LinkIcon, X
} from 'lucide-react';
import CourseResourceModal from './CourseResourceModal';
import lectureService from '../../services/lectureService';

export default function EditCourseView({ course, onBack, onSave, loading }) {
  const [title, setTitle] = useState(course?.title || 'Intermediate Korean: Business Etiquette');
  const [category, setCategory] = useState(course?.category || 'Business Korean');
  const [level, setLevel] = useState(course?.level || 'intermediate');
  const [isEditingLevel, setIsEditingLevel] = useState(false);
  const [description, setDescription] = useState(
    course?.description || 
    'Master the nuances of polite speech (Jondaemal) and professional correspondence in a Korean corporate environment. This course covers meeting etiquette, honorifics in emails, and networking protocols.'
  );

  const [thumbnail, setThumbnail] = useState(course?.thumbnail || '');
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  // Instructor State
  const [instructorName, setInstructorName] = useState(
    course?.instructorName || course?.instructor?.name || ''
  );
  const [instructorRole, setInstructorRole] = useState(
    course?.instructorRole || 'Lead Korean Instructor'
  );
  const [instructorBio, setInstructorBio] = useState(
    course?.instructorBio || course?.instructor?.bio || ''
  );
  const [instructorImage, setInstructorImage] = useState(
    course?.instructorImage || course?.instructor?.avatar || ''
  );
  const [uploadingInstructorImg, setUploadingInstructorImg] = useState(false);

  const handleInstructorImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }
    setUploadingInstructorImg(true);
    const reader = new FileReader();
    reader.onload = () => {
      setInstructorImage(reader.result);
      setUploadingInstructorImg(false);
    };
    reader.onerror = () => {
      alert('Failed to read image file');
      setUploadingInstructorImg(false);
    };
    reader.readAsDataURL(file);
  };

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
      thumbnail: thumbnail || course?.thumbnail,
      instructorName: instructorName.trim(),
      instructorRole: instructorRole.trim(),
      instructorBio: instructorBio.trim(),
      instructorImage: instructorImage.trim(),
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

          {/* Section: Course Instructor */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Course Instructor
              </h2>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-5">
              {/* Instructor Photo Section */}
              <div className="bg-[#f8fafc] border border-gray-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5">
                {/* Avatar Preview */}
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-200 bg-white shadow-xs flex items-center justify-center">
                    {instructorImage ? (
                      <img 
                        src={instructorImage} 
                        alt="Instructor Avatar" 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-indigo-50/50">
                        <User size={30} className="text-indigo-300" />
                      </div>
                    )}
                  </div>
                  {uploadingInstructorImg && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <Loader2 size={18} className="animate-spin text-white" />
                    </div>
                  )}
                  {instructorImage && (
                    <button
                      type="button"
                      onClick={() => setInstructorImage('')}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-xs transition cursor-pointer"
                      title="Remove photo"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Upload & Preset Options */}
                <div className="flex-1 space-y-2.5 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs">
                      <Camera size={13} />
                      <span>{instructorImage ? 'Change Photo' : 'Upload Photo'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleInstructorImageUpload} 
                        className="hidden" 
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        const seed = instructorName.trim() || 'Korean-Instructor';
                        setInstructorImage(`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold cursor-pointer transition"
                    >
                      <Sparkles size={13} className="text-amber-500" />
                      <span>Generate Avatar</span>
                    </button>
                  </div>

                  {/* Or image URL input */}
                  <div className="relative">
                    <LinkIcon size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={instructorImage}
                      onChange={(e) => setInstructorImage(e.target.value)}
                      placeholder="Or paste instructor photo URL (https://...)"
                      className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:outline-none transition shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Name & Role Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Instructor Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={instructorName}
                    onChange={(e) => setInstructorName(e.target.value)}
                    placeholder="e.g. Prof. Min-Jun Park"
                    className="w-full bg-[#f1f5f9] border border-transparent rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-2xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Instructor Title / Role
                  </label>
                  <input
                    type="text"
                    value={instructorRole}
                    onChange={(e) => setInstructorRole(e.target.value)}
                    placeholder="e.g. Lead Korean Linguist & TOPIK Specialist"
                    className="w-full bg-[#f1f5f9] border border-transparent rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-2xs font-medium"
                  />
                </div>
              </div>

              {/* Bio Field */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Instructor Bio / Qualifications
                </label>
                <textarea
                  rows={3}
                  value={instructorBio}
                  onChange={(e) => setInstructorBio(e.target.value)}
                  placeholder="Provide credentials, teaching background, or a brief greeting from the instructor..."
                  className="w-full bg-[#f1f5f9] border border-transparent rounded-2xl p-4 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:outline-none resize-none transition shadow-2xs font-normal"
                />
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
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-gray-700 text-xs uppercase tracking-wider">
                Course Thumbnail
              </h4>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                Google Drive
              </span>
            </div>
            
            <div className="border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-2xl p-4 flex flex-col items-center justify-center text-center bg-[#f8fafc] hover:bg-blue-50/10 transition cursor-pointer relative overflow-hidden group">
              {thumbnail ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/10">
                  <img 
                    src={thumbnail} 
                    alt="Course Thumbnail" 
                    className="w-full h-full object-cover" 
                  />
                  {uploadingThumbnail && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 text-white text-xs font-bold">
                      <Loader2 size={16} className="animate-spin text-blue-400" />
                      <span>Uploading to Google Drive...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-blue-50 text-gray-400 group-hover:text-blue-600 flex items-center justify-center mb-2 transition">
                    <ImageIcon size={22} />
                  </div>
                  <p className="text-xs font-bold text-gray-600">
                    Click to upload thumbnail
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    1280×720px • Stored on Google Drive
                  </p>
                </div>
              )}

              <input 
                type="file" 
                accept="image/*"
                disabled={uploadingThumbnail}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadingThumbnail(true);
                    try {
                      const res = await lectureService.uploadThumbnail(file);
                      if (res?.url) {
                        setThumbnail(res.url);
                      }
                    } catch (err) {
                      console.error('Thumbnail upload error:', err);
                      alert('Failed to upload thumbnail to Google Drive.');
                    } finally {
                      setUploadingThumbnail(false);
                    }
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            <p className="text-[10px] text-gray-400 text-center mt-2.5">
              Click thumbnail area to replace image. Saved directly to your Google Drive.
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
        courseId={course?._id}
        courseTitle={title}
        targetModule={activeModuleTarget}
      />

    </div>
  );
}
