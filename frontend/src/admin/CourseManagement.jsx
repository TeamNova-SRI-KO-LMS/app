import React, { useState } from 'react';
import { 
  BookOpen, 
  Users, 
  DollarSign, 
  FileEdit, 
  Plus, 
  Award, 
  SlidersHorizontal, 
  ArrowUpDown, 
  FileText, 
  Edit3, 
  EyeOff, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  X
} from 'lucide-react';

const initialCourses = [
  {
    id: 'KOR-204-LIT',
    title: 'Mastering Choson Poetry',
    category: 'Literature',
    level: 'ADVANCED',
    levelBg: 'bg-purple-100 text-purple-700',
    price: '$189.00',
    enrollmentCount: '842',
    status: 'PUBLISHED'
  },
  {
    id: 'KOR-105-BUS',
    title: 'Business Etiquette & Email',
    category: 'Business',
    level: 'INTERMEDIATE',
    levelBg: 'bg-indigo-100 text-indigo-700',
    price: '$149.00',
    enrollmentCount: '1,205',
    status: 'PUBLISHED'
  },
  {
    id: 'KOR-106-BUS',
    title: 'Business Etiquette & Email',
    category: 'Business',
    level: 'INTERMEDIATE',
    levelBg: 'bg-indigo-100 text-indigo-700',
    price: '$149.00',
    enrollmentCount: '1,205',
    status: 'PUBLISHED'
  }
];

const CourseManagement = () => {
  const [courses, setCourses] = useState(initialCourses);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedLevel, setSelectedLevel] = useState('All Levels');
  const [selectedStatus, setSelectedStatus] = useState('Status');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', category: 'Literature', level: 'BEGINNER', price: '$149.00' });

  const handleDelete = (id) => {
    setCourses(courses.filter(c => c.id !== id));
  };

  const handleCreateCourse = (e) => {
    e.preventDefault();
    if (!newCourse.title) return;

    const courseObj = {
      id: `KOR-${Math.floor(100 + Math.random() * 900)}-GEN`,
      title: newCourse.title,
      category: newCourse.category,
      level: newCourse.level,
      levelBg: newCourse.level === 'BEGINNER' ? 'bg-emerald-100 text-emerald-700' : newCourse.level === 'INTERMEDIATE' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700',
      price: newCourse.price || '$149.00',
      enrollmentCount: '0',
      status: 'PUBLISHED'
    };

    setCourses([courseObj, ...courses]);
    setNewCourse({ title: '', category: 'Literature', level: 'BEGINNER', price: '$149.00' });
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Title & Top Right Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Course Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Create, update, and manage your academic offerings. Monitor enrollment statuses and refine content for The Editorial Scholar students.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer">
            <Award size={16} />
            <span>Certificates management</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>Add New Course</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Courses */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <BookOpen size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-500 block">Total Courses</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">128</span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold text-emerald-600 bg-emerald-50 self-start">
            +12%
          </span>
        </div>

        {/* Active Students */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Users size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-500 block">Active Students</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">4,290</span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold text-emerald-600 bg-emerald-50 self-start">
            +5.4%
          </span>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <DollarSign size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-500 block">Monthly Revenue</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">$42,500</span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold text-emerald-600 bg-emerald-50 self-start">
            +8.1%
          </span>
        </div>

        {/* Draft Courses */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center mb-3">
              <FileEdit size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-500 block">Draft Courses</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">14</span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold text-red-500 bg-red-50 self-start">
            4 Actions
          </span>
        </div>
      </div>

      {/* Filter and Sort Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-transparent rounded-xl text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
          >
            <option>All Categories</option>
            <option>Literature</option>
            <option>Business</option>
            <option>Language</option>
          </select>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-transparent rounded-xl text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
          >
            <option>All Levels</option>
            <option>BEGINNER</option>
            <option>INTERMEDIATE</option>
            <option>ADVANCED</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-transparent rounded-xl text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
          >
            <option>Status</option>
            <option>PUBLISHED</option>
            <option>DRAFT</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 self-end sm:self-auto">
          <span>SORT BY:</span>
          <button className="flex items-center gap-1 font-bold text-gray-900 cursor-pointer hover:text-blue-600">
            <span>Newest First</span>
            <ArrowUpDown size={14} />
          </button>
        </div>
      </div>

      {/* Course Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50/80 text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">COURSE TITLE</th>
                <th className="px-6 py-4">CATEGORY</th>
                <th className="px-6 py-4">LEVEL</th>
                <th className="px-6 py-4">PRICE</th>
                <th className="px-6 py-4">ENROLLMENT</th>
                <th className="px-6 py-4">STATUS</th>
                <th className="px-6 py-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center shrink-0 border border-gray-200">
                        <BookOpen size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm leading-snug">
                          {course.title}
                        </h4>
                        <span className="text-[10px] font-mono text-gray-400 block mt-0.5">
                          ID: {course.id}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-semibold text-gray-800">
                    {course.category}
                  </td>

                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider ${course.levelBg}`}>
                      {course.level}
                    </span>
                  </td>

                  <td className="px-6 py-4 font-extrabold text-gray-900">
                    {course.price}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2 overflow-hidden">
                        <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-300" />
                        <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-blue-300" />
                        <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-500" />
                      </div>
                      <span className="text-xs font-semibold text-gray-600">
                        {course.enrollmentCount}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {course.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <button className="text-gray-400 hover:text-gray-600 cursor-pointer" title="View Details">
                        <FileText size={15} />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600 cursor-pointer" title="Edit">
                        <Edit3 size={15} />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600 cursor-pointer" title="Hide">
                        <EyeOff size={15} />
                      </button>
                      <button 
                        onClick={() => handleDelete(course.id)}
                        className="text-gray-400 hover:text-red-600 cursor-pointer" 
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium">
          <span>Showing 1-10 of 128 courses</span>

          <div className="flex items-center gap-1">
            <button className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
              <ChevronLeft size={16} />
            </button>
            <button className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              1
            </button>
            <button className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-700 font-semibold text-xs flex items-center justify-center">
              2
            </button>
            <button className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-700 font-semibold text-xs flex items-center justify-center">
              3
            </button>
            <span className="px-1 text-gray-400">...</span>
            <button className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-700 font-semibold text-xs flex items-center justify-center">
              13
            </button>
            <button className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-base text-gray-900">Add New Course</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advanced Hangul Poetry"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
                <select
                  value={newCourse.category}
                  onChange={(e) => setNewCourse({...newCourse, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
                >
                  <option value="Literature">Literature</option>
                  <option value="Business">Business</option>
                  <option value="Language">Language</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Level</label>
                <select
                  value={newCourse.level}
                  onChange={(e) => setNewCourse({...newCourse, level: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
                >
                  <option value="BEGINNER">BEGINNER</option>
                  <option value="INTERMEDIATE">INTERMEDIATE</option>
                  <option value="ADVANCED">ADVANCED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Price</label>
                <input
                  type="text"
                  placeholder="$149.00"
                  value={newCourse.price}
                  onChange={(e) => setNewCourse({...newCourse, price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;
