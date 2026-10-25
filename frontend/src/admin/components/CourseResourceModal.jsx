import React, { useState, useEffect } from 'react';
import { 
  X, BookOpen, ChevronDown, ClipboardList, Video, 
  FileText, Calendar, UploadCloud, CheckCircle2, 
  Film, File, ArrowRight, Image as ImageIcon, Link as LinkIcon,
  Trash2, Loader2, ExternalLink, Lock, Globe, Sparkles
} from 'lucide-react';
import lectureService from '../../services/lectureService';
import assignmentService from '../../services/assignmentService';

export default function CourseResourceModal({ 
  isOpen, 
  onClose, 
  courseId,
  courseTitle = "Korean Language Course",
  targetModule = "Module 1",
  modules = [],
  onUploadSuccess 
}) {
  const [activeTab, setActiveTab] = useState('video'); // 'video' | 'pdf' | 'image' | 'assignment' | 'link'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedModule, setSelectedModule] = useState(targetModule || 'Module 1');
  const [weekNumber, setWeekNumber] = useState(1);
  const [isPreview, setIsPreview] = useState(false);
  
  // Assignment specific fields
  const [dueDate, setDueDate] = useState('');
  const [maxScore, setMaxScore] = useState(100);

  // Link specific field
  const [externalUrl, setExternalUrl] = useState('');

  // Selected file & upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState(null);

  // Recent materials for this course
  const [recentMaterials, setRecentMaterials] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  useEffect(() => {
    if (targetModule) {
      setSelectedModule(targetModule);
    }
  }, [targetModule]);

  // Load existing materials when modal opens
  useEffect(() => {
    if (isOpen && courseId) {
      loadCourseMaterials();
    }
  }, [isOpen, courseId]);

  const loadCourseMaterials = async () => {
    try {
      setLoadingRecent(true);
      const res = await lectureService.getCourseMaterials(courseId);
      if (res?.materials) {
        setRecentMaterials(res.materials);
      }
    } catch (err) {
      console.warn('Could not load course materials:', err);
    } finally {
      setLoadingRecent(false);
    }
  };

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!title) {
        // Auto-fill title from filename
        const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setTitle(cleanName.replace(/[-_]/g, ' '));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!courseId) {
      alert('Please save the course first before uploading resources.');
      return;
    }

    if (!title.trim()) {
      alert('Please provide a title for the resource.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setStatusMessage(null);

    try {
      if (activeTab === 'assignment') {
        // Create an Assignment
        const payload = {
          courseId,
          weekNumber: Number(weekNumber) || 1,
          lessonTitle: selectedModule,
          title: title.trim(),
          description: description.trim() || 'Complete the assignment and submit your files.',
          dueDate: dueDate || undefined,
          maxScore: Number(maxScore) || 100,
        };
        const res = await assignmentService.createAssignment(payload);
        setStatusMessage({ type: 'success', text: 'Assignment created successfully!' });
        if (onUploadSuccess) onUploadSuccess({ type: 'assignment', data: res.assignment });
      } else if (activeTab === 'link') {
        // Add External Link (YouTube, Vimeo)
        if (!externalUrl.trim()) {
          alert('Please enter a valid URL.');
          setIsUploading(false);
          return;
        }
        const payload = {
          courseId,
          weekNumber: Number(weekNumber) || 1,
          lessonTitle: selectedModule,
          title: title.trim(),
          description: description.trim(),
          externalUrl: externalUrl.trim(),
          isPreview,
        };
        const res = await lectureService.addExternalLink(payload);
        setStatusMessage({ type: 'success', text: 'External resource added successfully!' });
        if (onUploadSuccess) onUploadSuccess({ type: 'link', data: res.material });
      } else {
        // Upload file to Supabase Cloud Storage (Video, PDF, Image)
        if (!selectedFile) {
          alert('Please select a file to upload.');
          setIsUploading(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('courseId', courseId);
        formData.append('weekNumber', String(weekNumber || 1));
        formData.append('lessonTitle', selectedModule);
        formData.append('title', title.trim());
        formData.append('description', description.trim());
        formData.append('isPreview', String(isPreview));

        const res = await lectureService.uploadMaterial(formData, (progress) => {
          setUploadProgress(progress);
        });

        setStatusMessage({ type: 'success', text: 'Uploaded to Supabase Cloud Storage successfully!' });
        if (onUploadSuccess) onUploadSuccess({ type: activeTab, data: res.material });
      }

      // Refresh list & reset form
      await loadCourseMaterials();
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setExternalUrl('');
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1200);

    } catch (err) {
      console.error('Resource upload error:', err);
      setStatusMessage({
        type: 'error',
        text: err?.response?.data?.message || err.message || 'Upload failed. Check your connection or Supabase config.',
      });
      setIsUploading(false);
    }
  };

  const handleTogglePreview = async (materialId) => {
    try {
      const res = await lectureService.togglePreview(materialId);
      setRecentMaterials(prev => prev.map(m => m._id === materialId ? { ...m, isPreview: res.isPreview } : m));
      setStatusMessage({
        type: 'success',
        text: res.message || 'Updated material visibility.',
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to toggle preview status.',
      });
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this resource from Supabase Cloud Storage?')) return;
    try {
      await lectureService.deleteMaterial(materialId);
      setRecentMaterials(recentMaterials.filter(m => m._id !== materialId));
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete material.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-[#f8fafc] w-full max-w-5xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-auto max-h-[95vh] flex flex-col">
        
        {/* Modal Top Bar */}
        <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full">
                Supabase Cloud Storage
              </span>
              <span className="text-xs text-gray-400">• High-Speed CDN &amp; Streaming for SRI-KO</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mt-0.5">
              {courseTitle}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition cursor-pointer"
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
                  SELECTED MODULE
                </span>
                <span className="text-base font-bold text-gray-900 block mt-0.5">
                  {selectedModule}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-500">Week #:</label>
              <input 
                type="number"
                min="1"
                max="52"
                value={weekNumber}
                onChange={(e) => setWeekNumber(parseInt(e.target.value, 10) || 1)}
                className="w-16 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-center text-gray-800 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Type Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <button
              type="button"
              onClick={() => { setActiveTab('video'); setSelectedFile(null); }}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                activeTab === 'video'
                  ? 'bg-blue-600 text-white shadow-blue-500/25'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <Video size={16} />
              <span>Video</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('pdf'); setSelectedFile(null); }}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                activeTab === 'pdf'
                  ? 'bg-blue-600 text-white shadow-blue-500/25'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <FileText size={16} />
              <span>PDF / Notes</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('image'); setSelectedFile(null); }}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                activeTab === 'image'
                  ? 'bg-blue-600 text-white shadow-blue-500/25'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <ImageIcon size={16} />
              <span>Image</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('assignment'); setSelectedFile(null); }}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                activeTab === 'assignment'
                  ? 'bg-blue-600 text-white shadow-blue-500/25'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <ClipboardList size={16} />
              <span>Assignment</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('link'); setSelectedFile(null); }}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                activeTab === 'link'
                  ? 'bg-blue-600 text-white shadow-blue-500/25'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <LinkIcon size={16} />
              <span>YouTube / Link</span>
            </button>
          </div>

          {/* Feedback banner */}
          {statusMessage && (
            <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <X size={16} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Main Grid: Form + Right Uploads/Recents */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left 7 Cols: Details Form */}
            <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-gray-900 text-base">
                {activeTab === 'assignment' && 'Create Course Assignment'}
                {activeTab === 'video' && 'Upload Video Lesson to Supabase Cloud Storage'}
                {activeTab === 'pdf' && 'Upload PDF / Slides to Supabase Cloud Storage'}
                {activeTab === 'image' && 'Upload Study Image / Diagram'}
                {activeTab === 'link' && 'Embed YouTube / External Resource'}
              </h3>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Lesson 2: Hangul Vowels Pronunciation"
                  required
                  className="w-full bg-[#f1f5f9] border border-transparent rounded-xl px-4 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:outline-none transition"
                />
              </div>

              {/* Module selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Lesson / Module Name
                  </label>
                  <input
                    type="text"
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                    placeholder="e.g. Module 1: Basics"
                    className="w-full bg-[#f1f5f9] border border-transparent rounded-xl px-4 py-2.5 text-xs sm:text-sm text-gray-800 focus:bg-white focus:border-blue-500 focus:outline-none transition"
                  />
                </div>

                {activeTab === 'assignment' ? (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input 
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-[#f1f5f9] border border-transparent rounded-xl px-4 py-2.5 text-xs sm:text-sm text-gray-800 focus:bg-white focus:border-blue-500 focus:outline-none transition"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-6">
                    <input 
                      type="checkbox"
                      id="isPreviewCheckbox"
                      checked={isPreview}
                      onChange={(e) => setIsPreview(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="isPreviewCheckbox" className="text-xs font-semibold text-gray-700 cursor-pointer">
                      Free Preview (Public before enrollment)
                    </label>
                  </div>
                )}
              </div>

              {/* External URL if Link tab */}
              {activeTab === 'link' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    YouTube or Video URL <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                    className="w-full bg-[#f1f5f9] border border-transparent rounded-xl px-4 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:outline-none transition font-mono"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Description / Instructions
                </label>
                <textarea 
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide guidance or summary for students..."
                  className="w-full bg-[#f1f5f9] border border-transparent rounded-xl p-3 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:outline-none resize-none transition"
                ></textarea>
              </div>

              {/* File upload zone if file type */}
              {activeTab !== 'link' && activeTab !== 'assignment' && (
                <div className="border-2 border-dashed border-gray-200 hover:border-blue-500 rounded-2xl p-6 text-center bg-gray-50/50 hover:bg-blue-50/20 transition cursor-pointer flex flex-col items-center justify-center relative">
                  <input 
                    type="file"
                    accept={
                      activeTab === 'video' ? 'video/*' :
                      activeTab === 'pdf' ? '.pdf,.doc,.docx,.ppt,.pptx' :
                      activeTab === 'image' ? 'image/*' : '*/*'
                    }
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 shadow-xs">
                    <UploadCloud size={24} />
                  </div>
                  {selectedFile ? (
                    <div>
                      <p className="font-bold text-blue-600 text-sm truncate max-w-xs">{selectedFile.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="font-bold text-gray-900 text-sm">Choose {activeTab.toUpperCase()} File</p>
                      <p className="text-xs text-gray-400 mt-0.5">Click or drag &amp; drop (Direct to Supabase Cloud Storage)</p>
                      <p className="text-[10px] text-gray-400 mt-1">Up to 500MB</p>
                    </>
                  )}
                </div>
              )}

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-700">
                    <span className="flex items-center gap-1.5">
                      <Loader2 size={13} className="animate-spin" /> Uploading to Supabase Cloud Storage...
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-7 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploading && <Loader2 size={14} className="animate-spin" />}
                  <span>
                    {isUploading 
                      ? `Uploading (${uploadProgress}%)` 
                      : activeTab === 'assignment' ? 'Create Assignment' : 'Upload to Supabase Storage 🚀'}
                  </span>
                </button>
              </div>
            </form>

            {/* Right 5 Cols: Uploaded Materials in this Course */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-900 text-sm">Course Materials ({recentMaterials.length})</h4>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Live in Drive
                  </span>
                </div>

                {loadingRecent ? (
                  <div className="py-8 flex flex-col items-center justify-center text-gray-400 gap-2">
                    <Loader2 size={18} className="animate-spin text-blue-600" />
                    <span className="text-xs font-medium">Loading materials...</span>
                  </div>
                ) : recentMaterials.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-xs">
                    No lecture materials uploaded yet. Use the form on the left to upload your first video or PDF!
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {recentMaterials.map((mat) => (
                      <div 
                        key={mat._id}
                        className="p-3 bg-gray-50 hover:bg-blue-50/40 rounded-xl border border-gray-100 flex items-center justify-between gap-3 transition group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            mat.type === 'video' ? 'bg-purple-100 text-purple-700' :
                            mat.type === 'pdf' ? 'bg-red-100 text-red-700' :
                            mat.type === 'image' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {mat.type === 'video' && <Video size={14} />}
                            {mat.type === 'pdf' && <FileText size={14} />}
                            {mat.type === 'image' && <ImageIcon size={14} />}
                            {mat.type === 'link' && <LinkIcon size={14} />}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-gray-800 truncate">{mat.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-gray-400 truncate">
                                W{mat.weekNumber} • {mat.lessonTitle}
                              </span>
                              {mat.isPreview ? (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5">
                                  <Sparkles size={9} /> Free Preview
                                </span>
                              ) : (
                                <span className="bg-gray-200/80 text-gray-600 text-[9px] font-medium px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5">
                                  <Lock size={9} /> Enrolled Only
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleTogglePreview(mat._id)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                              mat.isPreview
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : 'bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-700 border border-gray-200 hover:border-blue-200'
                            }`}
                            title={mat.isPreview ? 'Currently published for everyone. Click to make enrolled-only.' : 'Currently enrolled-only. Click to publish for everyone.'}
                          >
                            {mat.isPreview ? (
                              <>
                                <Globe size={11} className="text-emerald-600" />
                                <span>Published</span>
                              </>
                            ) : (
                              <>
                                <Lock size={11} className="text-gray-400" />
                                <span>Publish</span>
                              </>
                            )}
                          </button>

                          {mat.embedUrl && (
                            <a 
                              href={mat.viewUrl || mat.embedUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-gray-400 hover:text-blue-600 transition"
                              title="Open in Supabase Storage"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteMaterial(mat._id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
