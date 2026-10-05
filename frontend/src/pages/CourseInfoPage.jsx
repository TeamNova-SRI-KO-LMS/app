import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, CheckCircle2, PlayCircle, Circle, Lock, 
  Bookmark, Share2, Play, Pause, Volume2, VolumeX,
  Maximize, Minimize, Settings, Subtitles, Clock, 
  HelpCircle, Languages, FileText, Download, 
  Sparkles, MessageSquare, ChevronRight, Check,
  Send, Plus, Trash2
} from 'lucide-react';

export default function CourseInfoPage() {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [currentProgress] = useState(64);
  const [noteInput, setNoteInput] = useState('');
  const [notes, setNotes] = useState([
    {
      id: 1,
      time: '08:22',
      text: "Key difference between 'Seonsaengnim' and 'Sajangnim' in corporate hierarchies...",
    },
    {
      id: 2,
      time: '11:05',
      text: 'Hand position during business card exchange (use both hands always).',
    }
  ]);
  const [copied, setCopied] = useState(false);

  // Active module & lesson state
  const [activeLessonId, setActiveLessonId] = useState('m4-l2');

  const handleAddNote = (e) => {
    e?.preventDefault();
    if (!noteInput.trim()) return;
    const newNote = {
      id: Date.now(),
      time: '12:45',
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

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-800 font-sans">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-6">
        
        {/* Top Grid: Left Sidebar + Center Player/Content + Right Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= LEFT SIDEBAR (Syllabus & Modules) ================= */}
          <aside className="lg:col-span-3 bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 flex flex-col justify-between min-h-[780px]">
            <div>
              {/* Course Title Card */}
              <div className="flex items-center gap-3.5 mb-6 pb-5 border-b border-gray-100">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-base leading-snug">Advanced Korean</h2>
                  <p className="text-xs text-gray-400 font-medium">Editorial Scholar Path</p>
                </div>
              </div>

              {/* Progress Bar Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-2">
                  <span>Course Progress</span>
                  <span className="text-gray-900 font-bold">{currentProgress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                    style={{ width: `${currentProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Modules Accordion List */}
              <div className="space-y-6">
                
                {/* Module 4 */}
                <div>
                  <div className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-3">
                    Module 4: Business Professionalism
                  </div>
                  <div className="space-y-1.5">
                    {/* Lesson 1 (Completed) */}
                    <button 
                      onClick={() => setActiveLessonId('m4-l1')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-all ${
                        activeLessonId === 'm4-l1' 
                          ? 'bg-blue-50/80 text-blue-700 font-semibold shadow-xs' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="truncate">Honorifics in Boardrooms</span>
                    </button>

                    {/* Lesson 2 (Active) */}
                    <button 
                      onClick={() => setActiveLessonId('m4-l2')}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-all relative ${
                        activeLessonId === 'm4-l2' 
                          ? 'bg-blue-50 text-blue-700 font-bold shadow-xs border-r-4 border-blue-600' 
                          : 'text-gray-600 hover:bg-gray-50 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <PlayCircle className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="truncate">Business Etiquette</span>
                      </div>
                    </button>

                    {/* Lesson 3 (Upcoming) */}
                    <button 
                      onClick={() => setActiveLessonId('m4-l3')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-all ${
                        activeLessonId === 'm4-l3' 
                          ? 'bg-blue-50 text-blue-700 font-semibold' 
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <Circle className="w-4 h-4 text-gray-300 shrink-0" />
                      <span className="truncate">Networking Protocols</span>
                    </button>
                  </div>
                </div>

                {/* Module 5 */}
                <div>
                  <div className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-3">
                    Module 5: Literature Analysis
                  </div>
                  <div className="space-y-1.5">
                    {/* Lesson 4 (Locked) */}
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-gray-400 cursor-not-allowed">
                      <Lock className="w-4 h-4 text-gray-300 shrink-0" />
                      <span className="truncate">Modernist Poetry</span>
                    </div>

                    {/* Lesson 5 (Locked) */}
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-gray-400 cursor-not-allowed">
                      <Lock className="w-4 h-4 text-gray-300 shrink-0" />
                      <span className="truncate">Post-War Narratives</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Assignment CTA Button */}
            <div className="pt-6 mt-6 border-t border-gray-100">
              <button 
                onClick={() => alert('Assignment submission modal or workflow opened.')}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#2563eb] to-[#7c3aed] hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
              >
                Submit Assignment
              </button>
            </div>
          </aside>

          {/* ================= CENTER MAIN PLAYER & LESSON INFO ================= */}
          <main className="lg:col-span-6 space-y-6">
            
            {/* Video Player Container */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gradient-to-br from-gray-950 via-[#0d1117] to-gray-900 shadow-xl border border-gray-900 group">
              {/* Video Backdrop Mockup */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-70 transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: 'url("https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200")',
                  filter: isPlaying ? 'brightness(0.9)' : 'brightness(0.55) contrast(1.1)'
                }}
              ></div>

              {/* Big Center Play Button Overlay (when paused or hovered) */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                  className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:bg-white/30 active:scale-95"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 fill-white" />
                  ) : (
                    <Play className="w-8 h-8 fill-white translate-x-0.5" />
                  )}
                </button>
              </div>

              {/* Video Bottom Control Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-2">
                {/* Progress Bar / Scrubber */}
                <div className="relative w-full h-1.5 bg-white/30 rounded-full cursor-pointer group/scrub">
                  <div className="absolute top-0 left-0 h-full bg-blue-500 rounded-full" style={{ width: '28.3%' }}></div>
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md transition-transform group-hover/scrub:scale-125"
                    style={{ left: '28.3%', transform: 'translate(-50%, -50%)' }}
                  ></div>
                </div>

                {/* Control Action Buttons & Timestamp */}
                <div className="flex items-center justify-between text-white text-xs font-medium pt-1">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="hover:text-blue-400 transition"
                      aria-label="Play/Pause"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    
                    <button 
                      onClick={() => setIsMuted(!isMuted)}
                      className="hover:text-blue-400 transition"
                      aria-label="Volume"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>

                    <span className="text-gray-300 text-xs font-mono ml-1">
                      12:45 / 45:00
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="text-gray-300 hover:text-white transition" title="Subtitles">
                      <Subtitles className="w-4 h-4" />
                    </button>
                    <button className="text-gray-300 hover:text-white transition" title="Settings">
                      <Settings className="w-4 h-4" />
                    </button>
                    <button className="text-gray-300 hover:text-white transition" title="Fullscreen">
                      <Maximize className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Lesson Title & Header Details */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full tracking-wider uppercase">
                    ADVANCED
                  </span>
                  <span className="text-xs text-gray-500 font-semibold">
                    Module 4 • Lesson 2
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsSaved(!isSaved)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
                      isSaved 
                        ? 'bg-blue-50 border-blue-200 text-blue-600' 
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-blue-600' : ''}`} />
                    {isSaved ? 'Saved' : 'Save'}
                  </button>

                  <button 
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Share'}
                  </button>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                Advanced Korean Business Etiquette
              </h1>

              <p className="text-sm text-gray-600 leading-relaxed">
                Master the subtle nuances of professional interaction in high-stakes Korean corporate environments, focusing on the refined use of honorifics and non-verbal cues.
              </p>

              {/* Tabs Navigation */}
              <div className="flex space-x-6 border-b border-gray-200 mt-6 overflow-x-auto">
                {['Overview', 'Resources', 'Notes', 'Transcript'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-xs sm:text-sm font-bold transition-all relative ${
                      activeTab === tab
                        ? 'text-blue-600'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="pt-6">
                {activeTab === 'Overview' && (
                  <div className="space-y-6">
                    {/* About this lesson */}
                    <div className="bg-[#f8fafc] border border-gray-100 rounded-xl p-5">
                      <h3 className="font-bold text-gray-900 text-sm mb-2.5">About this lesson</h3>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        In this session, Professor Min-jun Kim explores the concept of 'Nunchi' in a business context—the art of sensing others' moods and responding appropriately. You'll learn how to navigate seating arrangements, business card exchanges, and the complex hierarchical structures of a 'Chaebol' boardroom.
                      </p>

                      {/* Stat 3-Card Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                        <div className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-xs flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">DURATION</div>
                            <div className="text-xs font-bold text-gray-900">45 Minutes</div>
                          </div>
                        </div>

                        <div className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-xs flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <HelpCircle className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ASSESSMENT</div>
                            <div className="text-xs font-bold text-gray-900">12 Questions</div>
                          </div>
                        </div>

                        <div className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-xs flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Languages className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">DIFFICULTY</div>
                            <div className="text-xs font-bold text-gray-900">C1 Academic</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Learning Resources */}
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm mb-3">Learning Resources</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        
                        {/* Resource 1 */}
                        <div className="flex items-center justify-between p-3.5 bg-white border border-gray-200/80 rounded-xl hover:shadow-sm transition">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
                              PDF
                            </div>
                            <div className="truncate">
                              <h4 className="text-xs font-bold text-gray-900 truncate">Business Honorifics Guide</h4>
                              <p className="text-[11px] text-gray-400">PDF • 4.2 MB</p>
                            </div>
                          </div>
                          <button 
                            className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 flex items-center justify-center transition shrink-0 ml-2"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Resource 2 */}
                        <div className="flex items-center justify-between p-3.5 bg-white border border-gray-200/80 rounded-xl hover:shadow-sm transition">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="truncate">
                              <h4 className="text-xs font-bold text-gray-900 truncate">Etiquette Worksheet</h4>
                              <p className="text-[11px] text-gray-400">DOCX • 1.8 MB</p>
                            </div>
                          </div>
                          <button 
                            className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 flex items-center justify-center transition shrink-0 ml-2"
                            title="Download DOCX"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'Resources' && (
                  <div className="space-y-4 text-xs text-gray-600">
                    <p>All downloadable lesson assets, supplementary reading, and practice files are listed below.</p>
                    <div className="space-y-2">
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                        <span>Lesson 2 Lecture Slides (SlideDeck.pptx)</span>
                        <button className="text-blue-600 font-semibold flex items-center gap-1 hover:underline"><Download className="w-3.5 h-3.5" /> Download</button>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                        <span>Audio Pronunciation Pack (Honorifics_MP3.zip)</span>
                        <button className="text-blue-600 font-semibold flex items-center gap-1 hover:underline"><Download className="w-3.5 h-3.5" /> Download</button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'Notes' && (
                  <div className="text-xs text-gray-600 space-y-3">
                    <p>Refer to your sync panel on the right sidebar for live interactive timestamped notes.</p>
                  </div>
                )}

                {activeTab === 'Transcript' && (
                  <div className="text-xs text-gray-700 space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200 max-h-60 overflow-y-auto font-mono leading-relaxed">
                    <p><span className="text-blue-600 font-bold">[00:15]</span> Annyeonghaseyo everyone. Welcome to Module 4, Lesson 2.</p>
                    <p><span className="text-blue-600 font-bold">[08:22]</span> When addressing senior leadership, always prioritize 'Sajangnim' or the exact departmental designation over general titles.</p>
                    <p><span className="text-blue-600 font-bold">[11:05]</span> Notice how two hands are used during the exchange of the myeongham (business card).</p>
                    <p><span className="text-blue-600 font-bold">[20:40]</span> Seating arrangements inside meeting rooms and elevators always follow seniority clockwise from the host.</p>
                  </div>
                )}
              </div>
            </div>

          </main>

          {/* ================= RIGHT SIDEBAR (Notes & Community Help) ================= */}
          <aside className="lg:col-span-3 space-y-6">
            
            {/* Lesson Notes Box */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-sm">Lesson Notes</h3>
                <span className="bg-blue-50 text-blue-600 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                  AUTO-SYNC
                </span>
              </div>

              {/* Note Input Box */}
              <form onSubmit={handleAddNote} className="mb-4">
                <div className="bg-[#f8fafc] border border-gray-200 rounded-xl p-3 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition">
                  <textarea 
                    rows={4}
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleAddNote(e);
                      }
                    }}
                    placeholder="Type a note... (Press Alt+T to timestamp)"
                    className="w-full bg-transparent border-0 text-xs text-gray-800 placeholder-gray-400 focus:outline-none resize-none leading-relaxed"
                  ></textarea>

                  <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-200/60 text-[10px] text-gray-400">
                    <span>Synced at 12:45</span>
                    <button 
                      type="submit" 
                      className="bg-blue-600 text-white font-bold px-2.5 py-1 rounded-md text-[10px] hover:bg-blue-700 transition flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Note
                    </button>
                  </div>
                </div>
              </form>

              {/* Saved Notes List */}
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="p-3 bg-[#f8fafc] rounded-xl border border-gray-100 flex items-start gap-2.5 group">
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded shrink-0 font-mono mt-0.5">
                      {note.time}
                    </span>
                    <p className="text-xs text-gray-700 leading-relaxed flex-1">
                      {note.text}
                    </p>
                    <button 
                      onClick={() => setNotes(notes.filter(n => n.id !== note.id))}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-1"
                      title="Delete note"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Need Help? Community Promo Card */}
            <div className="rounded-2xl bg-gradient-to-br from-[#2563eb] via-[#4338ca] to-[#7c3aed] text-white p-6 shadow-md relative overflow-hidden">
              {/* Background light glow */}
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <h4 className="font-bold text-base mb-1.5">Need help?</h4>
              <p className="text-xs text-blue-100 leading-relaxed mb-6">
                The SRI-KO community is here to support your learning journey.
              </p>

              <button 
                onClick={() => navigate('/events')}
                className="w-full py-2.5 px-4 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-xs font-bold text-white transition-all text-center"
              >
                Join Community
              </button>
            </div>

          </aside>

        </div>

      </div>
    </div>
  );
}
