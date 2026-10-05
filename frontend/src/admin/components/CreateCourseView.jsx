import React, { useState } from 'react';
import { 
  Info, BookOpen, Clock, Edit2, Trash2, Plus, 
  Upload, CheckCircle, ChevronDown, ArrowLeft, 
  Globe, HelpCircle, X, Image as ImageIcon
} from 'lucide-react';

export default function CreateCourseView({ onBack, onSave, loading }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Language & Culture');
  const [price, setPrice] = useState('49.99');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('intermediate');
  const [prerequisites, setPrerequisites] = useState('');
  const [tags, setTags] = useState(['Business', 'Culture']);
  const [tagInput, setTagInput] = useState('');
  const [thumbnailPreview, setThumbnailPreview] = useState('');

  // Curriculum weeks state
  const [weeks, setWeeks] = useState([
    {
      id: 1,
      title: 'Week 1: Foundations of Honorifics',
      lessons: [
        { id: 101, title: 'Lesson 1.1: Basic Polite Form (A-yo)', duration: '15m' },
        { id: 102, title: 'Lesson 1.2: Subject Honorific Particle (-si-)', duration: '22m' },
      ]
    }
  ]);

  const handleAddWeek = () => {
    const newWeekNum = weeks.length + 1;
    setWeeks([
      ...weeks,
      {
        id: Date.now(),
        title: `Week ${newWeekNum}: Advanced Structures & Vocabulary`,
        lessons: [
          { id: Date.now() + 1, title: `Lesson ${newWeekNum}.1: Introductory Concepts`, duration: '20m' }
        ]
      }
    ]);
  };

  const handleAddLesson = (weekId) => {
    setWeeks(weeks.map(w => {
      if (w.id === weekId) {
        const nextNum = w.lessons.length + 1;
        return {
          ...w,
          lessons: [
            ...w.lessons,
            { id: Date.now(), title: `Lesson ${nextNum}: Business Application`, duration: '18m' }
          ]
        };
      }
      return w;
    }));
  };

  const handleDeleteWeek = (weekId) => {
    if (weeks.length === 1) return;
    setWeeks(weeks.filter(w => w.id !== weekId));
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim() && !tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = (isPublished = true) => {
    if (!title.trim()) {
      alert('Please enter a course title.');
      return;
    }
    const payload = {
      title,
      description: description || 'Master the nuances of polite speech and professional correspondence.',
      category: category === 'Language & Culture' ? 'Language' : category,
      level,
      duration: weeks.length * 2 || 4,
      price: Number(price) || 0,
      isPublished,
      tags,
      thumbnail: thumbnailPreview || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800',
    };
    if (onSave) onSave(payload);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-800 pb-16 font-sans">
      
      {/* Top Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-600 mb-4 transition cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Courses
          </button>
        )}
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Create New Course
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Design a high-impact learning journey for your students.
        </p>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-4">
        
        {/* ================= LEFT COLUMN: Basic Info & Curriculum ================= */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Card 1: Basic Information */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Info size={16} />
              </div>
              <h3 className="font-bold text-gray-900 text-base">Basic Information</h3>
            </div>

            <div className="space-y-5">
              {/* Course Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Course Title
                </label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Advanced Korean Business Etiquette"
                  className="w-full bg-[#f1f5f9] border border-transparent rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-2xs"
                />
              </div>

              {/* Category & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full appearance-none bg-[#f1f5f9] border border-transparent rounded-2xl px-4 py-3 pr-9 text-sm text-gray-800 focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-2xs"
                    >
                      <option>Language & Culture</option>
                      <option>Business Korean</option>
                      <option>Literature</option>
                      <option>Grammar</option>
                      <option>Conversation</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Price (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                      $
                    </span>
                    <input 
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="49.99"
                      className="w-full bg-[#f1f5f9] border border-transparent rounded-2xl pl-8 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Course Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Course Description
                </label>
                <textarea 
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what students will achieve in this course..."
                  className="w-full bg-[#f1f5f9] border border-transparent rounded-2xl p-4 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:outline-none resize-none transition shadow-2xs"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Card 2: Curriculum Structure */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <BookOpen size={16} />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Curriculum Structure</h3>
              </div>
              <button
                type="button"
                onClick={handleAddWeek}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 transition flex items-center gap-1 cursor-pointer"
              >
                + Add Week
              </button>
            </div>

            <div className="space-y-4">
              {weeks.map((week) => (
                <div key={week.id} className="bg-[#f8fafc] border border-gray-200/70 rounded-2xl p-5 shadow-2xs">
                  {/* Week Title & Actions */}
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-gray-900 text-sm">{week.title}</h4>
                    <div className="flex items-center gap-2">
                      <button type="button" className="text-gray-400 hover:text-gray-600 p-1" title="Edit week">
                        <Edit2 size={14} />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleDeleteWeek(week.id)}
                        className="text-red-400 hover:text-red-600 p-1" 
                        title="Delete week"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Lessons in this week */}
                  <div className="space-y-2 mb-3">
                    {week.lessons.map((lesson) => (
                      <div 
                        key={lesson.id}
                        className="bg-white rounded-xl p-3 px-4 border border-gray-100 flex items-center justify-between shadow-2xs text-xs font-medium text-gray-700"
                      >
                        <span>{lesson.title}</span>
                        <span className="flex items-center gap-1 text-gray-400 font-mono">
                          <Clock size={12} /> {lesson.duration}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Add Lesson Button */}
                  <button
                    type="button"
                    onClick={() => handleAddLesson(week.id)}
                    className="w-full py-2.5 rounded-xl border border-dashed border-gray-200 hover:border-blue-400 bg-white hover:bg-blue-50/20 text-xs font-bold text-gray-500 hover:text-blue-600 transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} /> Add Lesson
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ================= RIGHT COLUMN: Cover, Level, Tags, CTA ================= */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Course Cover Card */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs">
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-3">
              Course Cover
            </h4>
            
            <div className="border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-[#f8fafc] hover:bg-blue-50/10 transition cursor-pointer relative overflow-hidden group">
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="Preview" className="w-full h-36 object-cover rounded-xl" />
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-blue-50 text-gray-400 group-hover:text-blue-600 flex items-center justify-center mb-3 transition">
                    <ImageIcon size={22} />
                  </div>
                  <p className="text-xs font-bold text-gray-500 group-hover:text-gray-700">
                    Upload image (1280×720)
                  </p>
                </>
              )}
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setThumbnailPreview(URL.createObjectURL(file));
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Difficulty Level Card */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs">
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-3">
              Difficulty Level
            </h4>
            
            <div className="space-y-2.5">
              {/* Beginner */}
              <label 
                onClick={() => setLevel('beginner')}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                  level === 'beginner' 
                    ? 'border-emerald-300 bg-emerald-50/60 text-emerald-900 font-bold' 
                    : 'border-emerald-100 bg-emerald-50/20 text-gray-700 hover:bg-emerald-50/40'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  level === 'beginner' ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'
                }`}>
                  {level === 'beginner' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className="text-xs font-semibold">Beginner</span>
              </label>

              {/* Intermediate */}
              <label 
                onClick={() => setLevel('intermediate')}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                  level === 'intermediate' 
                    ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-bold' 
                    : 'border-blue-100 bg-blue-50/10 text-gray-700 hover:bg-blue-50/20'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  level === 'intermediate' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                }`}>
                  {level === 'intermediate' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className="text-xs font-semibold">Intermediate</span>
              </label>

              {/* Advanced */}
              <label 
                onClick={() => setLevel('advanced')}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                  level === 'advanced' 
                    ? 'border-purple-300 bg-purple-50/60 text-purple-900 font-bold' 
                    : 'border-purple-100 bg-purple-50/20 text-gray-700 hover:bg-purple-50/40'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  level === 'advanced' ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                }`}>
                  {level === 'advanced' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className="text-xs font-semibold">Advanced</span>
              </label>
            </div>
          </div>

          {/* Prerequisites Card */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs">
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-2">
              Prerequisites
            </h4>
            <input 
              type="text"
              value={prerequisites}
              onChange={(e) => setPrerequisites(e.target.value)}
              placeholder="e.g. TOPIK Level 2"
              className="w-full bg-[#f1f5f9] border border-transparent rounded-2xl px-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:outline-none transition"
            />
          </div>

          {/* Tags Card */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs">
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-2">
              Tags
            </h4>
            
            {/* Tag Pills */}
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span 
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold"
                >
                  {tag}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-500 transition cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            <input 
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Add tag and press Enter..."
              className="w-full bg-[#f1f5f9] border border-transparent rounded-2xl px-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:outline-none transition"
            />
          </div>

          {/* Create CTA Buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit(true)}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/25 transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Create Course 🚀</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit(false)}
              className="w-full py-2 text-xs font-bold text-gray-500 hover:text-gray-800 transition text-center cursor-pointer"
            >
              Save as Draft
            </button>
          </div>

        </div>

      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 border-t border-gray-200 mt-16 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
        <div>
          <span className="font-bold text-gray-700">SRI-KO LMS</span>
          <span className="ml-2">© 2024 SRI-KO LMS. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-gray-600">Privacy Policy</a>
          <a href="#" className="hover:text-gray-600">Terms of Service</a>
          <a href="#" className="hover:text-gray-600">Contact Support</a>
          <a href="#" className="hover:text-gray-600">Help Center</a>
          <div className="flex items-center gap-2 text-gray-400">
            <Globe size={14} />
            <HelpCircle size={14} />
          </div>
        </div>
      </footer>

    </div>
  );
}
