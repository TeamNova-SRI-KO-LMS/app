import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  BookOpen, CheckCircle2, PlayCircle, Circle, Lock, 
  Bookmark, Share2, Play, Pause, Volume2, VolumeX,
  Maximize, Minimize, Settings, Subtitles, Clock, 
  HelpCircle, Languages, FileText, Download, 
  Sparkles, MessageSquare, ChevronRight, Check,
  Send, Plus, Trash2, ArrowLeft, Loader2, Video,
  Image as ImageIcon, ClipboardList, ExternalLink,
  UploadCloud, AlertCircle, X, ChevronDown, ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiService from '../services/apiService';
import lectureService from '../services/lectureService';
import assignmentService from '../services/assignmentService';
import useAuth from '../context/useAuth';

export default function CourseInfoPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Course, materials & assignments state
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active item state (either a lecture material or a mock/curriculum lesson)
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [completedItemIds, setCompletedItemIds] = useState([]);

  // Tabs: 'Overview' | 'Resources' | 'Notes' | 'Assignments'
  const [activeTab, setActiveTab] = useState('Overview');
  
  // Student Notes
  const [noteInput, setNoteInput] = useState('');
  const [notes, setNotes] = useState([
    {
      id: 1,
      time: '04:15',
      text: "Remember: 'Jondaemal' uses honorific suffixes like -si- when referring to actions of superiors.",
    },
    {
      id: 2,
      time: '09:30',
      text: 'Business card exchange: Always receive with both hands, slightly bow, and never put it in back pocket.',
    }
  ]);
  const [copied, setCopied] = useState(false);

  // Assignment submission modal state
  const [activeAssignmentForSubmit, setActiveAssignmentForSubmit] = useState(null);
  const [submissionFiles, setSubmissionFiles] = useState([]);
  const [submissionNote, setSubmissionNote] = useState('');
  const [submittingAssignment, setSubmittingAssignment] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState(0);
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [submissionStatusMsg, setSubmissionStatusMsg] = useState(null);

  // Fetch Course, Google Drive Materials, and Assignments
  useEffect(() => {
    let courseId = id;
    if (!courseId) {
      // If no ID in route, try to find an enrolled course or redirect
      (async () => {
        try {
          const res = await apiService.get('/courses');
          if (res.data?.courses?.length > 0) {
            navigate(`/course-info/${res.data.courses[0]._id}`, { replace: true });
          } else {
            setError('No courses available yet.');
            setLoading(false);
          }
        } catch {
          setError('Failed to load courses.');
          setLoading(false);
        }
      })();
      return;
    }

    const loadClassroomData = async () => {
      try {
        setLoading(true);
        const [courseRes, matsRes, assignRes] = await Promise.allSettled([
          apiService.get(`/courses/${courseId}`),
          lectureService.getCourseMaterials(courseId),
          assignmentService.getCourseAssignments(courseId),
        ]);

        let courseData = null;
        if (courseRes.status === 'fulfilled') {
          courseData = courseRes.value.data?.course ?? null;
          setCourse(courseData);
        }

        let matsData = [];
        if (matsRes.status === 'fulfilled') {
          matsData = matsRes.value?.materials || [];
          setMaterials(matsData);
        }

        let assignData = [];
        if (assignRes.status === 'fulfilled') {
          assignData = assignRes.value?.assignments || [];
          setAssignments(assignData);
        }

        // Auto-select first available material or lesson
        if (matsData.length > 0) {
          setSelectedMaterial(matsData[0]);
        } else if (courseData?.curriculum?.[0]?.lessons?.[0]) {
          const firstLesson = courseData.curriculum[0].lessons[0];
          setSelectedMaterial({
            _id: 'lesson-0',
            title: firstLesson.title,
            type: firstLesson.type || 'video',
            description: courseData.description,
            lessonTitle: courseData.curriculum[0].title,
            weekNumber: 1,
            embedUrl: courseData.thumbnail,
          });
        }
      } catch (err) {
        console.error('Failed to load classroom data:', err);
        setError('Failed to load classroom content.');
      } finally {
        setLoading(false);
      }
    };

    loadClassroomData();
  }, [id, navigate]);

  // Handle lesson / material toggle completion
  const toggleComplete = (itemId) => {
    setCompletedItemIds(prev => 
      prev.includes(itemId) ? prev.filter(i => i !== itemId) : [...prev, itemId]
    );
  };

  const handleAddNote = (e) => {
    e?.preventDefault();
    if (!noteInput.trim()) return;
    const newNote = {
      id: Date.now(),
      time: 'Just now',
      text: noteInput.trim(),
    };
    setNotes([newNote, ...notes]);
    setNoteInput('');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Open submission modal for an assignment
  const handleOpenAssignmentModal = async (assignment) => {
    setActiveAssignmentForSubmit(assignment);
    setSubmissionFiles([]);
    setSubmissionNote('');
    setSubmissionStatusMsg(null);
    setCurrentSubmission(null);

    // Fetch existing submission if any
    try {
      const res = await assignmentService.getMySubmission(assignment._id);
      if (res?.submission) {
        setCurrentSubmission(res.submission);
        setSubmissionNote(res.submission.submissionNote || '');
      }
    } catch (err) {
      console.warn('Could not load submission:', err);
    }
  };

  // Submit files to Supabase Storage for an assignment
  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!activeAssignmentForSubmit) return;
    if (submissionFiles.length === 0 && !currentSubmission) {
      alert('Please select at least one file to submit.');
      return;
    }

    setSubmittingAssignment(true);
    setSubmissionProgress(0);
    setSubmissionStatusMsg(null);

    try {
      const formData = new FormData();
      submissionFiles.forEach((f) => formData.append('files', f));
      formData.append('submissionNote', submissionNote.trim());

      const res = await assignmentService.submitAssignment(
        activeAssignmentForSubmit._id,
        formData,
        (progress) => setSubmissionProgress(progress)
      );

      setCurrentSubmission(res.submission);
      setSubmissionStatusMsg({
        type: 'success',
        text: 'Assignment submitted to Supabase Cloud Storage successfully! 🎉',
      });
      setSubmissionFiles([]);
    } catch (err) {
      console.error('Assignment submission error:', err);
      setSubmissionStatusMsg({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to submit assignment. Please try again.',
      });
    } finally {
      setSubmittingAssignment(false);
      setSubmissionProgress(0);
    }
  };

  // Calculate dynamic course progress percentage
  const totalCount = (materials.length || 0) + (assignments.length || 0) || 1;
  const progressPercent = Math.min(100, Math.round((completedItemIds.length / totalCount) * 100));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-500 font-semibold text-sm">Entering SRI-KO Classroom...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="bg-white p-8 rounded-3xl border border-gray-200 text-center max-w-md shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-1">Classroom Unavailable</h2>
          <p className="text-xs text-gray-500 mb-6">{error || 'Course not found.'}</p>
          <Link 
            to="/courses" 
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
          >
            ← Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-800 font-sans">
      <div className="max-w-[1680px] mx-auto px-3 sm:px-6 py-5">
        
        {/* Top Breadcrumb Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-gray-200/80">
          <div className="flex items-center gap-3">
            <Link 
              to={`/courses/${id || course._id}`} 
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-600 transition"
            >
              <ArrowLeft size={14} /> Back to Course Overview
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-xs font-bold text-gray-900 truncate max-w-sm">
              {course.title}
            </span>
            <span className="bg-blue-50 text-blue-700 border border-blue-200/60 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {course.level || 'Intermediate'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
            >
              <Share2 size={13} />
              <span>{copied ? 'Link Copied!' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Classroom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= LEFT SIDEBAR (Syllabus & Materials) ================= */}
          <aside className="lg:col-span-3 bg-white rounded-3xl border border-gray-200/80 shadow-xs p-5 flex flex-col justify-between min-h-[780px]">
            <div>
              {/* Course Title Card */}
              <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-gray-900 text-sm sm:text-base leading-snug truncate">
                    {course.title}
                  </h2>
                  <p className="text-[11px] text-gray-400 font-medium">
                    SRI-KO Korean Institute
                  </p>
                </div>
              </div>

              {/* Progress Bar Section */}
              <div className="mb-6 p-4 rounded-2xl bg-[#f8fafc] border border-gray-100">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1.5">
                  <span>Learning Progress</span>
                  <span className="text-blue-600 font-black">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="text-[10px] text-gray-400 mt-1.5 flex justify-between">
                  <span>{completedItemIds.length} of {totalCount} completed</span>
                  <span>Keep going! 🔥</span>
                </div>
              </div>

              {/* Materials & Lessons List */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                
                {/* 1. Google Drive Lecture Materials */}
                {materials.length > 0 && (
                  <div>
                    <div className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-2">
                      Lecture Materials ({materials.length})
                    </div>
                    <div className="space-y-1.5">
                      {materials.map((mat) => {
                        const isSelected = selectedMaterial?._id === mat._id;
                        const isDone = completedItemIds.includes(mat._id);

                        return (
                          <div 
                            key={mat._id}
                            onClick={() => setSelectedMaterial(mat)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all cursor-pointer group ${
                              isSelected
                                ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-l-blue-600 shadow-2xs' 
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleComplete(mat._id); }}
                                className="shrink-0 text-gray-400 hover:text-emerald-600 transition"
                                title={isDone ? 'Mark Incomplete' : 'Mark Completed'}
                              >
                                {isDone ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <Circle className="w-4 h-4" />
                                )}
                              </button>

                              <div className="shrink-0">
                                {mat.type === 'video' && <Video className={`w-3.5 h-3.5 ${isSelected ? 'text-purple-600' : 'text-gray-400'}`} />}
                                {mat.type === 'pdf' && <FileText className={`w-3.5 h-3.5 ${isSelected ? 'text-red-600' : 'text-gray-400'}`} />}
                                {mat.type === 'image' && <ImageIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-600' : 'text-gray-400'}`} />}
                                {mat.type === 'link' && <PlayCircle className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />}
                              </div>

                              <span className="truncate">{mat.title}</span>
                            </div>

                            <span className="text-[10px] font-mono text-gray-400 shrink-0 uppercase">
                              {mat.type}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Assignments Section */}
                {assignments.length > 0 && (
                  <div className="pt-2">
                    <div className="text-[10px] font-black text-amber-600 tracking-wider uppercase mb-2">
                      Assignments ({assignments.length})
                    </div>
                    <div className="space-y-1.5">
                      {assignments.map((assign) => (
                        <div 
                          key={assign._id}
                          onClick={() => handleOpenAssignmentModal(assign)}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs bg-amber-50/40 hover:bg-amber-50 border border-amber-200/50 text-amber-900 transition-all cursor-pointer font-medium"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <ClipboardList className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="truncate">{assign.title}</span>
                          </div>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md shrink-0">
                            Submit 📤
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Default Curriculum Fallback if no Drive materials uploaded yet */}
                {materials.length === 0 && (course.curriculum || []).map((week, widx) => (
                  <div key={widx}>
                    <div className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-2">
                      {week.title || `Week ${widx + 1}`}
                    </div>
                    <div className="space-y-1.5">
                      {(week.lessons || []).map((lesson, lidx) => {
                        const lessonKey = `curriculum-${widx}-${lidx}`;
                        const isSelected = selectedMaterial?._id === lessonKey;
                        const isDone = completedItemIds.includes(lessonKey);

                        return (
                          <div 
                            key={lessonKey}
                            onClick={() => setSelectedMaterial({
                              _id: lessonKey,
                              title: lesson.title,
                              type: lesson.type || 'video',
                              lessonTitle: week.title,
                              weekNumber: widx + 1,
                              description: lesson.content || course.description,
                              embedUrl: course.thumbnail,
                            })}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-l-blue-600'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleComplete(lessonKey); }}
                                className="shrink-0 text-gray-400 hover:text-emerald-600"
                              >
                                {isDone ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <Circle className="w-4 h-4" />
                                )}
                              </button>
                              <PlayCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="truncate">{lesson.title}</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {lesson.duration ? `${lesson.duration}m` : '15m'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

              </div>
            </div>

            {/* Bottom Assignment Quick Launcher */}
            <div className="pt-4 mt-4 border-t border-gray-100">
              <button 
                onClick={() => {
                  if (assignments.length > 0) {
                    handleOpenAssignmentModal(assignments[0]);
                  } else {
                    alert('No assignments have been assigned for this course yet.');
                  }
                }}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <ClipboardList size={14} />
                <span>Submit Course Assignment</span>
              </button>
            </div>
          </aside>

          {/* ================= CENTER MAIN CONTENT / PLAYER ================= */}
          <main className="lg:col-span-6 space-y-6">
            
            {/* Main Media Player / Viewer */}
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
              
              {/* If Video: Native HTML5 Player for Supabase Videos or YouTube/Vimeo Embed */}
              {selectedMaterial?.type === 'video' || selectedMaterial?.type === 'link' ? (
                <div className="relative aspect-video w-full bg-black rounded-t-3xl overflow-hidden flex items-center justify-center">
                  {selectedMaterial?.embedUrl || selectedMaterial?.viewUrl ? (
                    (() => {
                      const videoUrl = selectedMaterial.embedUrl || selectedMaterial.viewUrl;
                      const isExternalEmbed = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') || videoUrl.includes('vimeo.com');

                      if (!isExternalEmbed && (selectedMaterial.type === 'video' || videoUrl.includes('supabase.co') || /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(videoUrl))) {
                        return (
                          <video
                            key={videoUrl}
                            controls
                            playsInline
                            controlsList="nodownload"
                            preload="metadata"
                            className="w-full h-full max-h-[600px] object-contain bg-black"
                            src={videoUrl}
                          >
                            Your browser does not support the video tag.
                          </video>
                        );
                      }

                      return (
                        <iframe
                          src={videoUrl}
                          title={selectedMaterial.title}
                          className="w-full h-full border-0"
                          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                          allowFullScreen
                        />
                      );
                    })()
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white p-6 text-center">
                      <PlayCircle className="w-16 h-16 text-blue-400 mb-3" />
                      <p className="text-sm font-bold">Video Lesson Preview</p>
                      <p className="text-xs text-gray-400 mt-1 max-w-sm">
                        {selectedMaterial?.title}
                      </p>
                    </div>
                  )}
                </div>
              ) : selectedMaterial?.type === 'pdf' ? (
                /* If PDF: Google Drive Embedded PDF Viewer */
                <div className="w-full flex flex-col bg-gray-900 rounded-t-3xl">
                  <div className="p-3 bg-gray-950 text-white flex items-center justify-between px-5 text-xs font-semibold">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-red-400" />
                      {selectedMaterial.title}
                    </span>
                    {selectedMaterial.downloadUrl && (
                      <a 
                        href={selectedMaterial.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-xs font-bold transition"
                      >
                        <Download size={13} /> Download PDF
                      </a>
                    )}
                  </div>
                  <iframe
                    src={selectedMaterial.embedUrl}
                    title={selectedMaterial.title}
                    className="w-full h-[600px] border-0 bg-white"
                  />
                </div>
              ) : selectedMaterial?.type === 'image' ? (
                /* If Image: Google Drive Direct Image */
                <div className="w-full p-4 bg-gray-950 flex flex-col items-center justify-center rounded-t-3xl min-h-[450px]">
                  <img 
                    src={selectedMaterial.embedUrl || selectedMaterial.viewUrl} 
                    alt={selectedMaterial.title}
                    className="max-h-[550px] w-auto object-contain rounded-xl shadow-lg"
                  />
                  {selectedMaterial.downloadUrl && (
                    <div className="mt-3">
                      <a 
                        href={selectedMaterial.downloadUrl}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-700 transition"
                      >
                        <Download size={13} /> Save Image
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                /* Default Course Thumbnail preview */
                <div className="relative aspect-video w-full bg-gray-950 flex items-center justify-center">
                  {course.thumbnail ? (
                    <img 
                      src={course.thumbnail} 
                      alt={course.title}
                      className="w-full h-full object-cover opacity-80" 
                    />
                  ) : (
                    <div className="text-center text-white p-6">
                      <BookOpen className="w-16 h-16 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm font-bold">{course.title}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Lesson Title & Controls Bar */}
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                      {selectedMaterial?.type ? `Material: ${selectedMaterial.type.toUpperCase()}` : 'Lesson Material'}
                    </span>
                    <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-snug">
                      {selectedMaterial?.title || course.title}
                    </h1>
                  </div>

                  {selectedMaterial?._id && (
                    <button
                      onClick={() => toggleComplete(selectedMaterial._id)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                        completedItemIds.includes(selectedMaterial._id)
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
                      }`}
                    >
                      <CheckCircle2 size={15} />
                      <span>{completedItemIds.includes(selectedMaterial._id) ? 'Completed' : 'Mark as Complete'}</span>
                    </button>
                  )}
                </div>

                {selectedMaterial?.description && (
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed pt-2 border-t border-gray-100">
                    {selectedMaterial.description}
                  </p>
                )}
              </div>
            </div>

            {/* Navigation Tabs (Overview, Resources, Notes, Assignments) */}
            <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm">
              <div className="flex space-x-6 border-b border-gray-100 pb-3 mb-5 overflow-x-auto">
                {['Overview', 'Resources', 'Notes', 'Assignments'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-xs sm:text-sm font-bold pb-2 transition-all cursor-pointer whitespace-nowrap relative ${
                      activeTab === tab
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    {tab}
                    {tab === 'Assignments' && assignments.length > 0 && (
                      <span className="ml-1.5 bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                        {assignments.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab: Overview */}
              {activeTab === 'Overview' && (
                <div className="space-y-4 text-xs sm:text-sm text-gray-600">
                  <h3 className="font-bold text-gray-900 text-sm">About this Course & Material</h3>
                  <p className="leading-relaxed">{course.description}</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                    <div className="bg-[#f8fafc] p-3 rounded-2xl border border-gray-100">
                      <div className="text-[10px] text-gray-400 uppercase font-bold">Category</div>
                      <div className="text-xs font-bold text-gray-900">{course.category}</div>
                    </div>
                    <div className="bg-[#f8fafc] p-3 rounded-2xl border border-gray-100">
                      <div className="text-[10px] text-gray-400 uppercase font-bold">Level</div>
                      <div className="text-xs font-bold text-gray-900 capitalize">{course.level}</div>
                    </div>
                    <div className="bg-[#f8fafc] p-3 rounded-2xl border border-gray-100">
                      <div className="text-[10px] text-gray-400 uppercase font-bold">Duration</div>
                      <div className="text-xs font-bold text-gray-900">{course.duration} weeks</div>
                    </div>
                    <div className="bg-[#f8fafc] p-3 rounded-2xl border border-gray-100">
                      <div className="text-[10px] text-gray-400 uppercase font-bold">Materials</div>
                      <div className="text-xs font-bold text-gray-900">{materials.length} uploaded</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Resources */}
              {activeTab === 'Resources' && (
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900 text-sm mb-2">Downloadable Materials & Files</h3>
                  {materials.length === 0 ? (
                    <p className="text-xs text-gray-400">No resources available for download yet.</p>
                  ) : (
                    materials.map((mat) => (
                      <div 
                        key={mat._id}
                        className="p-3.5 bg-[#f8fafc] rounded-2xl border border-gray-100 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {mat.type.toUpperCase()}
                          </div>
                          <div className="truncate">
                            <h4 className="text-xs font-bold text-gray-900 truncate">{mat.title}</h4>
                            <p className="text-[10px] text-gray-400">Week {mat.weekNumber} • {mat.lessonTitle}</p>
                          </div>
                        </div>

                        {mat.downloadUrl ? (
                          <a 
                            href={mat.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 transition"
                          >
                            <Download size={13} /> Download
                          </a>
                        ) : (
                          <a 
                            href={mat.viewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                          >
                            <ExternalLink size={13} /> Open
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab: Notes */}
              {activeTab === 'Notes' && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Add a timestamped learning note..."
                      className="flex-1 bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-2 text-xs focus:bg-white focus:outline-none"
                    />
                    <button 
                      onClick={handleAddNote}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Save Note
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {notes.map((n) => (
                      <div key={n.id} className="p-3 bg-[#f8fafc] rounded-xl border border-gray-100 flex items-start justify-between gap-3 text-xs">
                        <div>
                          <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mr-2">
                            {n.time}
                          </span>
                          <span className="text-gray-800">{n.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Assignments */}
              {activeTab === 'Assignments' && (
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900 text-sm mb-2">Course Assignments & Tasks</h3>
                  {assignments.length === 0 ? (
                    <p className="text-xs text-gray-400">No assignments posted for this course yet.</p>
                  ) : (
                    assignments.map((assign) => (
                      <div 
                        key={assign._id}
                        className="p-4 bg-[#f8fafc] rounded-2xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1">
                            {assign.maxScore} Max Points
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900">{assign.title}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{assign.description}</p>
                          {assign.dueDate && (
                            <p className="text-[10px] text-gray-400 mt-1">
                              Due Date: {new Date(assign.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleOpenAssignmentModal(assign)}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer shrink-0"
                        >
                          Submit Assignment 📤
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>
          </main>

          {/* ================= RIGHT SIDEBAR (Quick Notes & Study Tips) ================= */}
          <aside className="lg:col-span-3 space-y-6">
            
            {/* Quick Notes Widget */}
            <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-900 text-sm">Study Notepad</h4>
                <span className="text-[10px] text-gray-400 font-mono">Syncs live</span>
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {notes.slice(0, 3).map((n) => (
                  <div key={n.id} className="p-3 bg-[#f8fafc] rounded-2xl border border-gray-100 text-xs">
                    <span className="text-[10px] font-bold text-blue-600 block mb-1">{n.time}</span>
                    <p className="text-gray-700">{n.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddNote} className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                <input 
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Quick note..."
                  className="flex-1 bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:bg-white focus:outline-none"
                />
                <button 
                  type="submit" 
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
                >
                  Add
                </button>
              </form>
            </div>

            {/* Korean Scholar Study Tip */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-md shadow-blue-500/20">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </div>
              <h4 className="text-sm font-bold mb-1">Scholar Study Tip</h4>
              <p className="text-xs text-white/90 leading-relaxed font-normal">
                Watch lecture videos with Korean subtitles on your second playthrough to accelerate vocabulary retention and natural cadence.
              </p>
            </div>

          </aside>

        </div>

      </div>

      {/* ================= ASSIGNMENT SUBMISSION MODAL ================= */}
      {activeAssignmentForSubmit && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-[#f8fafc] w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full inline-block mb-1">
                  Assignment Submission
                </span>
                <h3 className="text-lg font-bold text-gray-900">{activeAssignmentForSubmit.title}</h3>
              </div>
              <button 
                onClick={() => setActiveAssignmentForSubmit(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              
              {/* Instructions Banner */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Instructions</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{activeAssignmentForSubmit.description}</p>
                <div className="flex items-center gap-4 text-[11px] text-gray-400 mt-3 pt-2 border-t border-gray-100 font-mono">
                  <span>Max Score: {activeAssignmentForSubmit.maxScore} pts</span>
                  {activeAssignmentForSubmit.dueDate && (
                    <span>Due: {new Date(activeAssignmentForSubmit.dueDate).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              {/* Status Banner */}
              {submissionStatusMsg && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                  submissionStatusMsg.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {submissionStatusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{submissionStatusMsg.text}</span>
                </div>
              )}

              {/* Current Past Submission Info (if exists) */}
              {currentSubmission && (
                <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      Status: {currentSubmission.status.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Submitted: {new Date(currentSubmission.submittedAt).toLocaleString()}
                    </span>
                  </div>

                  {currentSubmission.grade !== undefined && currentSubmission.grade !== null && (
                    <div className="mb-2 p-3 bg-emerald-100/60 rounded-xl text-xs">
                      <span className="font-bold text-emerald-900">
                        Score: {currentSubmission.grade} / {activeAssignmentForSubmit.maxScore}
                      </span>
                      {currentSubmission.feedback && (
                        <p className="text-emerald-800 mt-1 italic">
                          Feedback: "{currentSubmission.feedback}"
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5 mt-2">
                    <p className="text-[11px] font-bold text-gray-600">Submitted Files on Supabase Cloud Storage:</p>
                    {currentSubmission.files?.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 text-xs">
                        <span className="truncate text-gray-800 font-medium">{f.fileName}</span>
                        {f.fileUrl && (
                          <a 
                            href={f.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline text-[11px] font-bold ml-2 shrink-0 flex items-center gap-1"
                          >
                            <ExternalLink size={12} /> View File
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Form */}
              <form onSubmit={handleAssignmentSubmit} className="space-y-4">
                
                {/* File Dropzone */}
                <div className="border-2 border-dashed border-gray-200 hover:border-blue-500 rounded-2xl p-6 text-center bg-white transition relative">
                  <input 
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.zip,.jpg,.png"
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        setSubmissionFiles(Array.from(e.target.files));
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                    <UploadCloud size={24} />
                  </div>
                  <p className="text-xs font-bold text-gray-800">
                    {submissionFiles.length > 0 
                      ? `${submissionFiles.length} file(s) selected` 
                      : 'Choose files or drag & drop'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    PDF, DOCX, ZIP, JPG, PNG (Saved directly to Supabase Cloud Storage)
                  </p>
                </div>

                {/* Selected File list */}
                {submissionFiles.length > 0 && (
                  <div className="space-y-1">
                    {submissionFiles.map((f, i) => (
                      <div key={i} className="flex justify-between items-center text-xs p-2 bg-white rounded-lg border border-gray-100">
                        <span className="truncate text-gray-700 font-medium">{f.name}</span>
                        <span className="text-gray-400 font-mono text-[10px]">
                          {(f.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Optional Note */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Note for Instructor (Optional)
                  </label>
                  <textarea 
                    rows={2}
                    value={submissionNote}
                    onChange={(e) => setSubmissionNote(e.target.value)}
                    placeholder="Add comments or notes regarding your submission..."
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition resize-none"
                  />
                </div>

                {/* Progress bar */}
                {submittingAssignment && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-blue-600">
                      <span>Uploading to Supabase Cloud Storage...</span>
                      <span>{submissionProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${submissionProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex justify-end gap-2.5 pt-2">
                  <button 
                    type="button"
                    onClick={() => setActiveAssignmentForSubmit(null)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={submittingAssignment || (submissionFiles.length === 0 && !currentSubmission)}
                    className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-2"
                  >
                    {submittingAssignment && <Loader2 size={13} className="animate-spin" />}
                    <span>{submittingAssignment ? `Uploading (${submissionProgress}%)` : currentSubmission ? 'Resubmit Files 🚀' : 'Submit Assignment 🚀'}</span>
                  </button>
                </div>

              </form>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
