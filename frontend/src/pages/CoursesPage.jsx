import { useState, useEffect } from 'react';
import {
  Search, Clock, Users,
  Star, GraduationCap, ChevronDown, Loader2, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import apiService from '../services/apiService';

const LEVEL_COLORS = {
  beginner:     { bg: 'bg-[#cbf4c9]', text: 'text-[#166534]' },
  intermediate: { bg: 'bg-blue-100',  text: 'text-blue-800'  },
  advanced:     { bg: 'bg-purple-100',text: 'text-[#6b21a8]' },
};

const LEVEL_ORDER = ['beginner', 'intermediate', 'advanced'];

export default function Courses() {
  const [courses,       setCourses]       = useState([]);
  const [filtered,      setFiltered]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [levelFilter,   setLevelFilter]   = useState('All Levels');
  const [sortBy,        setSortBy]        = useState('Popularity');
  const [levelOpen,     setLevelOpen]     = useState(false);
  const [sortOpen,      setSortOpen]      = useState(false);

  /* ── Fetch courses on mount ─────────────────────────────────────────────── */
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const res = await apiService.get('/courses', { params: { published: 'true', limit: 50 } });
        const data = res.data?.courses ?? [];
        setCourses(data);
        setFiltered(data);
      } catch (err) {
        setError('Failed to load courses. Please try again.');
        console.error('Courses fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  /* ── Filter + sort whenever dependencies change ─────────────────────────── */
  useEffect(() => {
    let result = [...courses];

    // search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        c =>
          c.title.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    // level filter
    if (levelFilter !== 'All Levels') {
      result = result.filter(c => c.level === levelFilter.toLowerCase());
    }

    // sort
    if (sortBy === 'Popularity') {
      result.sort((a, b) => (b.enrolledStudents?.length ?? 0) - (a.enrolledStudents?.length ?? 0));
    } else if (sortBy === 'Rating') {
      result.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
    } else if (sortBy === 'Price: Low to High') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'Price: High to Low') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'Newest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setFiltered(result);
  }, [courses, searchQuery, levelFilter, sortBy]);

  /* ── Helpers ────────────────────────────────────────────────────────────── */
  const levelStyle = (level) =>
    LEVEL_COLORS[level] ?? { bg: 'bg-gray-100', text: 'text-gray-700' };

  const formatPrice = (price) =>
    price === 0 ? 'Free' : `LKR ${price.toLocaleString()}`;

  const instructorName = (course) =>
    course.instructor?.name ?? 'SRI-KO Instructor';

  const instructorAvatar = (course) =>
    course.instructor?.avatar ??
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${instructorName(course)}`;

  const studentCount = (course) => {
    const n = course.enrolledStudents?.length ?? 0;
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
  };

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-gray-800">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative h-[360px] flex flex-col items-center justify-center px-4 overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000")',
            backgroundPosition: 'center 30%',
          }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
        </div>

        <div className="relative z-10 text-center w-full max-w-3xl mx-auto mt-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-wide drop-shadow-md">
            Explore Our Courses
          </h1>
          <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto drop-shadow-sm">
            Choose from a wide range of Korean language courses designed by expert instructors.
          </p>

          {/* Search */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses, topics, or tags..."
              className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-800 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            />
          </div>
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-16">

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <p className="text-sm text-gray-500 font-medium">
            {loading ? 'Loading...' : `${filtered.length} course${filtered.length !== 1 ? 's' : ''} found`}
          </p>

          <div className="flex gap-3 relative">
            {/* Level filter */}
            <div className="relative">
              <button
                onClick={() => { setLevelOpen(o => !o); setSortOpen(false); }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-300 transition-colors"
              >
                Level: {levelFilter} <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
              {levelOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                  {['All Levels', ...LEVEL_ORDER.map(l => l.charAt(0).toUpperCase() + l.slice(1))].map(opt => (
                    <button
                      key={opt}
                      onClick={() => { setLevelFilter(opt); setLevelOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors ${levelFilter === opt ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-700'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => { setSortOpen(o => !o); setLevelOpen(false); }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-300 transition-colors"
              >
                Sort: {sortBy} <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                  {['Popularity', 'Rating', 'Newest', 'Price: Low to High', 'Price: High to Low'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => { setSortBy(opt); setSortOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors ${sortBy === opt ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-700'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-gray-500 font-medium">Loading courses...</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <AlertCircle className="w-10 h-10 text-red-500" />
            <p className="text-gray-700 font-semibold">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <GraduationCap className="w-12 h-12 text-gray-300" strokeWidth={1.5} />
            <p className="text-gray-500 font-medium">No courses match your search.</p>
            <button
              onClick={() => { setSearchQuery(''); setLevelFilter('All Levels'); }}
              className="text-blue-600 text-sm font-semibold hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Course Grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course) => {
              const lvl = levelStyle(course.level);
              return (
                <Link
                  key={course._id}
                  to={`/courses/${course._id}`}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all group"
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 bg-gray-200">
                    <img
                      src={course.thumbnail || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800'}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {course.level && (
                      <div className={`absolute top-4 left-4 ${lvl.bg} ${lvl.text} text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider`}>
                        {course.level}
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {course.duration} Weeks
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {studentCount(course)} Students
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 mb-4 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                      {course.title}
                    </h3>

                    {/* Instructor */}
                    <div className="flex items-center gap-2 mt-auto mb-4">
                      <img
                        src={instructorAvatar(course)}
                        alt={instructorName(course)}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-sm text-gray-600 font-medium">{instructorName(course)}</span>
                    </div>

                    {/* Price + rating */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        {course.averageRating > 0 ? course.averageRating.toFixed(1) : 'New'}
                      </div>
                      <div className="text-blue-700 font-bold text-base">
                        {formatPrice(course.price)}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* CTA card */}
            <div className="bg-[#eef2f6] rounded-2xl p-8 flex flex-col items-center justify-center text-center">
              <div className="mb-4">
                <GraduationCap className="w-10 h-10 text-blue-700" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Can't find your fit?</h3>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed px-4">
                Request a personalised curriculum or group session for your corporate team or school.
              </p>
              <button className="bg-[#0052cc] hover:bg-blue-800 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}