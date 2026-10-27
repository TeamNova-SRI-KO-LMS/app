import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  FileText,
  Download,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  User,
  Calendar,
  Award,
  RefreshCw,
  Send,
  FileCode,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import assignmentService from '../../services/assignmentService';

const getFileIcon = (fileName = '') => {
  const ext = fileName.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
    return <FileImage size={16} className="text-blue-500" />;
  }
  if (['zip', 'rar', '7z', 'tar'].includes(ext)) {
    return <FileArchive size={16} className="text-amber-500" />;
  }
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return <FileSpreadsheet size={16} className="text-emerald-500" />;
  }
  if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json'].includes(ext)) {
    return <FileCode size={16} className="text-purple-500" />;
  }
  return <FileText size={16} className="text-rose-500" />;
};

const formatBytes = (bytes = 0) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export default function CourseSubmissionsModal({ isOpen, onClose, course }) {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'needs_grading' | 'graded' | 'late'

  // Grading form state: { [submissionId]: { grade: string|number, feedback: string, saving: boolean } }
  const [gradingState, setGradingState] = useState({});

  const fetchCourseSubmissions = async () => {
    if (!course?._id) return;
    try {
      setLoading(true);
      const res = await assignmentService.getCourseSubmissions(course._id);
      if (res.success) {
        setAssignments(res.assignments || []);
        setSubmissions(res.submissions || []);

        // Initialise grading forms with current grades and feedback
        const initialGrading = {};
        (res.submissions || []).forEach((sub) => {
          initialGrading[sub._id] = {
            grade: sub.grade !== undefined && sub.grade !== null ? sub.grade : '',
            feedback: sub.feedback || '',
            saving: false,
          };
        });
        setGradingState(initialGrading);
      }
    } catch (err) {
      console.error('Error fetching submissions for course:', err);
      toast.error(err?.response?.data?.message || 'Failed to load assignment submissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && course?._id) {
      fetchCourseSubmissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, course?._id]);

  // Handle grade change in state
  const handleGradeInputChange = (subId, field, value) => {
    setGradingState((prev) => ({
      ...prev,
      [subId]: {
        ...prev[subId],
        [field]: value,
      },
    }));
  };

  // Submit Grade & Feedback
  const handleSaveGrade = async (subId, maxScore = 100) => {
    const data = gradingState[subId];
    if (!data || data.grade === '' || data.grade === undefined) {
      toast.error('Please enter a grade score.');
      return;
    }

    const numGrade = Number(data.grade);
    if (isNaN(numGrade) || numGrade < 0 || numGrade > maxScore) {
      toast.error(`Grade must be a number between 0 and ${maxScore}.`);
      return;
    }

    try {
      setGradingState((prev) => ({
        ...prev,
        [subId]: { ...prev[subId], saving: true },
      }));

      const res = await assignmentService.gradeSubmission(subId, {
        grade: numGrade,
        feedback: data.feedback,
      });

      if (res.success && res.submission) {
        toast.success('Grade & feedback recorded successfully!');
        // Update local submissions list
        setSubmissions((prev) =>
          prev.map((s) => (s._id === subId ? { ...s, ...res.submission } : s))
        );
      }
    } catch (err) {
      console.error('Grade save error:', err);
      toast.error(err?.response?.data?.message || 'Failed to submit grade.');
    } finally {
      setGradingState((prev) => ({
        ...prev,
        [subId]: { ...prev[subId], saving: false },
      }));
    }
  };

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // Assignment filter
      if (selectedAssignmentId !== 'all') {
        const subAssignId = typeof sub.assignment === 'object' ? sub.assignment?._id : sub.assignment;
        if (String(subAssignId) !== String(selectedAssignmentId)) return false;
      }

      // Status filter
      if (statusFilter === 'needs_grading') {
        if (sub.status === 'graded') return false;
      } else if (statusFilter === 'graded') {
        if (sub.status !== 'graded') return false;
      } else if (statusFilter === 'late') {
        if (sub.status !== 'late') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const studentName = sub.student?.name?.toLowerCase() || '';
        const studentEmail = sub.student?.email?.toLowerCase() || '';
        const assignmentTitle = (typeof sub.assignment === 'object' ? sub.assignment?.title : '')?.toLowerCase() || '';
        if (!studentName.includes(query) && !studentEmail.includes(query) && !assignmentTitle.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [submissions, selectedAssignmentId, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = submissions.length;
    const graded = submissions.filter((s) => s.status === 'graded').length;
    const pending = total - graded;
    const late = submissions.filter((s) => s.status === 'late').length;

    const scores = submissions.filter((s) => typeof s.grade === 'number').map((s) => s.grade);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

    return { total, graded, pending, late, avgScore };
  }, [submissions]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-gray-900 leading-tight">
                  Assignment Submissions
                </h3>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  {course?.title || 'Course'}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                Review submitted student work, inspect Supabase files, and assign grades & feedback.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchCourseSubmissions}
              disabled={loading}
              title="Refresh submissions"
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-grow">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                <FileText size={18} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Submissions</span>
                <span className="text-xl font-extrabold text-gray-900 mt-0.5 block">{stats.total}</span>
              </div>
            </div>

            <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                <Clock size={18} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Needs Grading</span>
                <span className="text-xl font-extrabold text-gray-900 mt-0.5 block">{stats.pending}</span>
              </div>
            </div>

            <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle size={18} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Graded</span>
                <span className="text-xl font-extrabold text-gray-900 mt-0.5 block">{stats.graded}</span>
              </div>
            </div>

            <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700">
                <Award size={18} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Average Score</span>
                <span className="text-xl font-extrabold text-gray-900 mt-0.5 block">
                  {stats.avgScore !== null ? `${stats.avgScore}%` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Filters Bar: Assignment dropdown, Search, Status pill */}
          <div className="bg-gray-50/90 p-3 rounded-2xl border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Assignment Selector */}
            <div className="w-full md:w-72 relative">
              <select
                value={selectedAssignmentId}
                onChange={(e) => setSelectedAssignmentId(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-3.5 py-2 pr-8 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
              >
                <option value="all">All Assignments ({assignments.length})</option>
                {assignments.map((a) => (
                  <option key={a._id} value={a._id}>
                    Week {a.weekNumber || 1}: {a.title}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Search Input */}
            <div className="w-full md:w-64 relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search student or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                All ({submissions.length})
              </button>
              <button
                onClick={() => setStatusFilter('needs_grading')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'needs_grading'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Needs Grading ({stats.pending})
              </button>
              <button
                onClick={() => setStatusFilter('graded')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'graded'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Graded ({stats.graded})
              </button>
            </div>
          </div>

          {/* Submissions List Content */}
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <RefreshCw size={28} className="animate-spin text-blue-600" />
              <span className="text-xs font-bold text-gray-500">Loading submissions...</span>
            </div>
          ) : filteredSubmissions.length > 0 ? (
            <div className="space-y-4">
              {filteredSubmissions.map((sub) => {
                const studentName = sub.student?.name || 'Student';
                const studentEmail = sub.student?.email || 'No email';
                const studentInitial = (studentName[0] || 'S').toUpperCase();
                const assignmentTitle = typeof sub.assignment === 'object' ? sub.assignment?.title : 'Course Assignment';
                const maxScore = (typeof sub.assignment === 'object' ? sub.assignment?.maxScore : 100) || 100;
                const weekNum = typeof sub.assignment === 'object' ? sub.assignment?.weekNumber : null;
                const formState = gradingState[sub._id] || { grade: '', feedback: '', saving: false };

                const isGraded = sub.status === 'graded';
                const isLate = sub.status === 'late';

                return (
                  <div
                    key={sub._id}
                    className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs hover:border-blue-200 transition-all flex flex-col lg:flex-row gap-5"
                  >
                    {/* Left details: Student & Submission information */}
                    <div className="flex-1 space-y-3.5">
                      <div className="flex items-start justify-between gap-3">
                        {/* Student profile */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
                            {sub.student?.avatar ? (
                              <img src={sub.student.avatar} alt={studentName} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              studentInitial
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-gray-900 text-sm">{studentName}</h4>
                              <span className="text-[10px] text-gray-400">({studentEmail})</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                                {weekNum ? `Week ${weekNum}: ` : ''}{assignmentTitle}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status badge */}
                        <div>
                          {isGraded ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle size={12} />
                              <span>Graded ({sub.grade}/{maxScore})</span>
                            </span>
                          ) : isLate ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                              <Clock size={12} />
                              <span>Late Submission</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                              <Clock size={12} />
                              <span>Awaiting Grade</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Submitted date & note */}
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <Calendar size={13} className="text-gray-400" />
                        <span>Submitted on {new Date(sub.submittedAt).toLocaleString()}</span>
                      </div>

                      {sub.submissionNote && (
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-700">
                          <span className="font-bold text-gray-500 block mb-1">Student Note:</span>
                          <p className="italic">"{sub.submissionNote}"</p>
                        </div>
                      )}

                      {/* Submitted Files List */}
                      <div>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                          Submitted File(s) ({sub.files?.length || 0}):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {(sub.files || []).map((file, i) => (
                            <a
                              key={i}
                              href={file.fileUrl || file.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl text-xs font-semibold text-gray-800 hover:text-blue-700 transition group shadow-2xs"
                            >
                              {getFileIcon(file.fileName)}
                              <span className="truncate max-w-[180px]">{file.fileName}</span>
                              {file.fileSize > 0 && (
                                <span className="text-[10px] text-gray-400 font-normal">
                                  ({formatBytes(file.fileSize)})
                                </span>
                              )}
                              <Download size={13} className="text-gray-400 group-hover:text-blue-600 ml-1" />
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right side: Grading & Feedback Card */}
                    <div className="w-full lg:w-80 bg-gray-50/80 rounded-xl p-4 border border-gray-200/80 flex flex-col justify-between shrink-0">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Award size={15} className="text-amber-500" />
                            Evaluation & Grading
                          </span>
                          <span className="text-[11px] text-gray-500 font-semibold">Max: {maxScore} pts</span>
                        </div>

                        {/* Grade Score Input */}
                        <div className="mb-3">
                          <label className="block text-[11px] font-bold text-gray-600 mb-1">
                            Score / Grade:
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max={maxScore}
                              placeholder="0"
                              value={formState.grade}
                              onChange={(e) => handleGradeInputChange(sub._id, 'grade', e.target.value)}
                              className="w-24 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-extrabold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-xs font-bold text-gray-400">/ {maxScore}</span>
                          </div>
                        </div>

                        {/* Teacher Feedback Textarea */}
                        <div className="mb-3">
                          <label className="block text-[11px] font-bold text-gray-600 mb-1">
                            Instructor Feedback:
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Add constructive feedback, corrections, or praise..."
                            value={formState.feedback}
                            onChange={(e) => handleGradeInputChange(sub._id, 'feedback', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-normal"
                          />
                        </div>
                      </div>

                      {/* Save Button */}
                      <div>
                        <button
                          type="button"
                          onClick={() => handleSaveGrade(sub._id, maxScore)}
                          disabled={formState.saving}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                        >
                          {formState.saving ? (
                            <>
                              <RefreshCw size={14} className="animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Send size={13} />
                              <span>{isGraded ? 'Update Grade & Feedback' : 'Submit Grade & Feedback'}</span>
                            </>
                          )}
                        </button>
                        {isGraded && sub.gradedAt && (
                          <span className="text-[10px] text-gray-400 block text-center mt-1.5 font-medium">
                            Graded {new Date(sub.gradedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center bg-gray-50/60 rounded-3xl border border-gray-100 p-8">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                <FileText size={26} />
              </div>
              <h4 className="text-base font-bold text-gray-800 mb-1">No Submissions Found</h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                {searchQuery || selectedAssignmentId !== 'all' || statusFilter !== 'all'
                  ? 'No submissions match your active filter criteria. Try clearing filters.'
                  : assignments.length === 0
                  ? 'This course has no assignments yet. Add an assignment through the module resource builder to start receiving student submissions.'
                  : 'Students enrolled in this course have not submitted files for this assignment yet.'}
              </p>
            </div>
          )}
        </div>

        {/* Modal Bottom Close Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <span className="text-xs text-gray-400 font-medium">
            SRI-KO LMS Academic Assignment Grading System
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
