import React, { useState } from 'react';
import { 
  X, BookOpen, ChevronDown, ClipboardList, Video, 
  FileText, Calendar, UploadCloud, CheckCircle2, 
  Film, File, ArrowRight
} from 'lucide-react';

export default function CourseResourceModal({ 
  isOpen, 
  onClose, 
  courseTitle = "Advanced Level (A/L) Korean Syllabus - Focused Prep",
  targetModule = "LIT 101: Introduction to Modernism",
  onUploadSuccess 
}) {
  const [activeTab, setActiveTab] = useState('assignment'); // 'assignment' | 'video' | 'pdf'
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedModule, setSelectedModule] = useState('Module 1: Introduction');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  if (!isOpen) return null;

  const handleUpload = (e) => {
    e.preventDefault();
    setIsUploading(true);
    let progress = 10;
    const interval = setInterval(() => {
      progress += 25;
      if (progress >= 100) {
        clearInterval(interval);
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          if (onUploadSuccess) onUploadSuccess({ title, type: activeTab });
          onClose();
        }, 500);
      } else {
        setUploadProgress(progress);
      }
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-[#f8fafc] w-full max-w-5xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-auto max-h-[95vh] flex flex-col">
        
        {/* Modal Top Bar */}
        <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {courseTitle}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Add new assignments, videos, or reading materials to your curriculum.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Target Course Banner */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-blue-600">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <BookOpen size={20} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">
                  TARGET COURSE
                </span>
                <span className="text-base font-bold text-gray-900 block mt-0.5">
                  {targetModule}
                </span>
              </div>
            </div>
            <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-700 transition">
              <span>Change Module</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
          </div>

          {/* Type Tabs */}
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('assignment')}
              className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xs ${
                activeTab === 'assignment'
                  ? 'bg-blue-50 text-blue-700 border-2 border-blue-600'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <ClipboardList size={18} />
              <span>Assignment</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('video')}
              className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xs ${
                activeTab === 'video'
                  ? 'bg-blue-50 text-blue-700 border-2 border-blue-600'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <Video size={18} />
              <span>Video Lesson</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xs ${
                activeTab === 'pdf'
                  ? 'bg-blue-50 text-blue-700 border-2 border-blue-600'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <FileText size={18} />
              <span>PDF Document</span>
            </button>
          </div>

          {/* Main Grid: Form + Right Uploads/Recents */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left 8 Cols: Details Form */}
            <form onSubmit={handleUpload} className="lg:col-span-8 bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-5">
              <h3 className="font-bold text-gray-900 text-base">
                {activeTab === 'assignment' ? 'Assignment Details' : activeTab === 'video' ? 'Video Lesson Details' : 'Document Details'}
              </h3>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Title
                </label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Midterm Essay: Modernism"
                  required
                  className="w-full bg-[#f1f5f9] border border-transparent rounded-xl px-4 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:outline-none transition"
                />
              </div>

              {/* Due Date & Module */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Due Date
                  </label>
                  <div className="relative">
                    <input 
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-[#f1f5f9] border border-transparent rounded-xl px-4 py-2.5 text-xs sm:text-sm text-gray-800 focus:bg-white focus:border-blue-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Module
                  </label>
                  <div className="relative">
                    <select
                      value={selectedModule}
                      onChange={(e) => setSelectedModule(e.target.value)}
                      className="w-full appearance-none bg-[#f1f5f9] border border-transparent rounded-xl px-4 py-2.5 pr-8 text-xs sm:text-sm text-gray-800 focus:bg-white focus:border-blue-500 focus:outline-none transition"
                    >
                      <option>Module 1: Introduction</option>
                      <option>Module 2: Honorifics in Boardrooms</option>
                      <option>Module 3: Literature Analysis</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Description / Instructions
                </label>
                <textarea 
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide detailed instructions for this assignment..."
                  className="w-full bg-[#f1f5f9] border border-transparent rounded-xl p-4 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:outline-none resize-none transition"
                ></textarea>
              </div>

              {/* Drag & Drop Upload Zone */}
              <div className="border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-2xl p-7 text-center bg-gray-50/50 hover:bg-blue-50/20 transition cursor-pointer flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3 shadow-xs">
                  <UploadCloud size={24} />
                </div>
                <p className="font-bold text-gray-900 text-sm">Drag & Drop Files Here</p>
                <p className="text-xs text-gray-400 mt-0.5">or click to browse from your computer</p>
                
                <span className="inline-block mt-3 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold">
                  Uploading to: LIT 101
                </span>

                <p className="text-[10px] text-gray-400 mt-2">
                  Supported formats: PDF, DOCX, ZIP (Max 50MB)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                >
                  {isUploading ? `Uploading (${uploadProgress}%)` : 'Upload Resource'}
                </button>
              </div>
            </form>

            {/* Right 4 Cols: Active Uploads & Recent Additions */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Active Uploads */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-gray-900 text-sm">Active Uploads</h4>
                </div>
                <p className="text-[11px] text-gray-400 mb-4">Adding to LIT 101</p>

                <div className="space-y-4">
                  {/* Item 1 */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1.5">
                      <div className="flex items-center gap-2 truncate">
                        <Film size={14} className="text-gray-400 shrink-0" />
                        <span className="truncate">Lecture_04.mp4</span>
                      </div>
                      <span className="text-blue-600 font-bold ml-2">45%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1.5">
                      <div className="flex items-center gap-2 truncate">
                        <File size={14} className="text-gray-400 shrink-0" />
                        <span className="truncate">Reading_Material.pdf</span>
                      </div>
                      <span className="text-emerald-600 font-bold ml-2 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Done
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Additions */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
                <h4 className="font-bold text-gray-900 text-sm mb-4">Recent Additions</h4>
                
                <div className="space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <ClipboardList size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 leading-snug">Week 3 Essay Prompts</p>
                      <p className="text-[11px] text-gray-400">Assignment • Oct 24, 2023</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Video size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 leading-snug">Introduction to Typography</p>
                      <p className="text-[11px] text-gray-400">Video • Oct 22, 2023</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 leading-snug">Syllabus Fall 2023</p>
                      <p className="text-[11px] text-gray-400">PDF • Oct 20, 2023</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100 text-center">
                  <button type="button" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition">
                    View All Resources
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
