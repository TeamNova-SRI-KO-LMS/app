import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, BookOpen, GraduationCap, Award, Globe, Clock,
  Lightbulb, ShieldCheck, Heart, FileText, CheckCircle2, Star, CreditCard, Play
} from 'lucide-react';
import apiService from '../services/apiService';
import { isVideoUrl } from '../utils/mediaUtils';

const FALLBACK_PROGRAMS = [
  {
    title: 'Korean Language Basics',
    level: 'beginner',
    duration: 12,
    description: 'Perfect for beginners starting their Korean language journey.',
    features: ['Hangul alphabet', 'Basic grammar', 'Essential vocabulary', 'Pronunciation practice'],
    thumbnail: 'https://images.unsplash.com/photo-1581007871115-f14bc016e0a4?auto=format&fit=crop&q=80&w=800',
  },
  {
    title: 'Business Korean',
    level: 'intermediate',
    duration: 24,
    description: 'Professional Korean for business communication and workplace interactions.',
    features: ['Business etiquette', 'Professional vocabulary', 'Meeting Korean', 'Email writing'],
    thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
  },
  {
    title: 'TOPIK Preparation',
    level: 'all-levels',
    duration: 16,
    description: 'Comprehensive preparation for Korean proficiency tests.',
    features: ['Test strategies', 'Mock exams', 'Grammar review', 'Vocabulary building'],
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800',
  },
];

const DEFAULT_THUMBNAILS = [
  'https://images.unsplash.com/photo-1581007871115-f14bc016e0a4?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800',
];

const getThumbnail = (course, index = 0) => {
  if (course?.thumbnail && course.thumbnail.trim()) {
    return course.thumbnail;
  }
  return DEFAULT_THUMBNAILS[index % DEFAULT_THUMBNAILS.length];
};

const getLevelBadge = (level) => {
  const lvl = (level || '').toLowerCase();
  if (lvl.includes('beginner')) {
    return { label: 'BEGINNER', bg: 'bg-blue-100 text-blue-600' };
  }
  if (lvl.includes('intermediate')) {
    return { label: 'INTERMEDIATE', bg: 'bg-purple-100 text-purple-600' };
  }
  if (lvl.includes('advanced')) {
    return { label: 'ADVANCED', bg: 'bg-red-100 text-red-600' };
  }
  return { label: 'ALL LEVELS', bg: 'bg-orange-100 text-orange-600' };
};

const formatDuration = (d) => {
  if (!d) return '3 months';
  if (typeof d === 'string') return d;
  if (d % 4 === 0) return `${d / 4} months`;
  return `${d} weeks`;
};

const getFeatures = (course) => {
  if (course.features && course.features.length > 0) return course.features;
  if (course.curriculum && course.curriculum.length > 0) {
    return course.curriculum.slice(0, 4).map(c => c.title);
  }
  if (course.tags && course.tags.length > 0) return course.tags.slice(0, 4);
  return ['Hangul alphabet', 'Basic grammar', 'Essential vocabulary', 'Pronunciation practice'];
};

const LandingPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        const res = await apiService.get('/courses', {
          params: { published: 'true', limit: 6 }
        });
        if (isMounted) {
          const list = res.data?.courses || [];
          const levelRank = {
            beginner: 1,
            intermediate: 2,
            'all-levels': 3,
            'all levels': 3,
            advanced: 4
          };
          const sorted = [...list].sort((a, b) => {
            const rankA = levelRank[a.level?.toLowerCase()] || 99;
            const rankB = levelRank[b.level?.toLowerCase()] || 99;
            if (rankA !== rankB) return rankA - rankB;
            return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
          });
          setCourses(sorted);
        }
      } catch (err) {
        console.error('Failed to load courses on landing page:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchPrograms();
    return () => { isMounted = false; };
  }, []);

  const featuredPrograms = courses.filter((c) => c.isFeatured);
  const displayCourses = featuredPrograms.length > 0 
    ? featuredPrograms.slice(0, 3) 
    : (courses.length > 0 ? courses.slice(0, 3) : FALLBACK_PROGRAMS);

  return (
    <div className="font-sans text-gray-800 bg-gray-50">



      {/* Hero Section */}
      <section 
        className="relative pt-32 pb-32 lg:pt-72 lg:pb-72 flex items-center justify-center text-center px-4"
        style={{
          backgroundImage: ' url("/unreghero.jpg")',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          width:'100%',
          height:'100%',
          backgroundPosition: 'center',
        }}
      >
        
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Users, count: "5,000+", label: "STUDENTS TAUGHT", color: "bg-blue-50 text-blue-600" },
            { icon: BookOpen, count: "50+", label: "KOREAN COURSES", color: "bg-green-50 text-green-600" },
            { icon: GraduationCap, count: "25+", label: "NATIVE INSTRUCTORS", color: "bg-purple-50 text-purple-600" },
            { icon: Award, count: "98%", label: "SUCCESS RATE", color: "bg-orange-50 text-orange-600" },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl shadow-sm flex items-center gap-4 border border-gray-100">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 tracking-wider mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

<section className="relative z-10  h-full w-full mx-auto  text-center py-8 ">
          <h1 className="text-4xl md:text-6xl font-bold text-blue-600 text-shadow-lg mb-6">
            Welcome to <span className="text-yellow-400  text-shadow-lg ">SRI-KO</span>
          </h1>
          <p className="text-lg md:text-xl text-black mb-10 max-w-3xl mx-auto leading-relaxed">
            Your premier destination for Korean language learning. Experience authentic Korean education with native instructors, cultural immersion, and proven results.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-md font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2">
              Join Us Today <span className="text-xl">→</span>
              <Link to="/register" className="hover:text-blue-600 transition">Register</Link>
            </button>
            <Link
              to="/courses"
              className="bg-transparent border border-blue-600 text-blue-600 px-8 py-3 rounded-md font-medium hover:bg-blue-50 transition flex items-center justify-center gap-2"
            >
              <span>Explore Courses</span>
              <BookOpen size={18} />
            </Link>
          </div>
        </section>
      {/* Features Section */}
      <section className="py-10 max-w-7xl mx-auto px-4">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What Makes SRI-KO Special?</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">Discover the unique advantages that make SRI-KO the best choice for Korean language learning.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: Globe, title: "Native Korean Instructors", desc: "Learn from certified native Korean speakers with extensive teaching experience and cultural knowledge.", bg: "bg-blue-50 text-blue-500" },
            { icon: FileText, title: "Comprehensive Curriculum", desc: "Structured courses covering all aspects of Korean language from beginner to advanced levels.", bg: "bg-green-50 text-green-500" },
            { icon: Heart, title: "Cultural Immersion", desc: "Experience Korean culture through language learning with authentic materials and cultural activities.", bg: "bg-red-50 text-red-500" },
            { icon: Clock, title: "Flexible Learning", desc: "Study at your own pace with 24/7 access to course materials and live online sessions.", bg: "bg-purple-50 text-purple-500" },
            { icon: Lightbulb, title: "Interactive Learning", desc: "Engage with interactive content, pronunciation practice, and real-time feedback from instructors.", bg: "bg-yellow-50 text-yellow-500" },
            { icon: Award, title: "Certification Programs", desc: "Earn internationally recognized Korean language certificates to boost your career prospects.", bg: "bg-orange-50 text-orange-500" }
          ].map((feature, idx) => (
            <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm text-center border border-gray-100 hover:shadow-md transition">
              <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-6 ${feature.bg}`}>
                <feature.icon size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
      {/* Programs Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Korean Language Programs</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Choose from our comprehensive range of Korean language courses designed for every level.</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex flex-col h-[520px] animate-pulse">
                  <div className="h-48 sm:h-52 w-full bg-gray-200"></div>
                  <div className="p-6 sm:p-8 flex flex-col flex-grow">
                    <div className="h-6 w-3/4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-2/3 bg-gray-200 rounded mb-6"></div>
                    <div className="space-y-3 mb-6 flex-grow">
                      <div className="h-4 w-4/5 bg-gray-200 rounded"></div>
                      <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                      <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-11 bg-gray-200 rounded-lg mt-auto"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {displayCourses.map((course, idx) => {
                const badge = getLevelBadge(course.level);
                const features = getFeatures(course);
                const targetLink = course._id ? `/courses/${course._id}` : '/courses';
                const thumbnailSrc = getThumbnail(course, idx);

                return (
                  <div 
                    key={course._id || idx} 
                    className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex flex-col h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                  >
                    {/* Course Thumbnail */}
                    <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-gray-900">
                      {isVideoUrl(thumbnailSrc) ? (
                        <>
                          <video
                            src={thumbnailSrc}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            muted
                            playsInline
                            preload="metadata"
                          />
                          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-xs text-white p-2 rounded-full shadow pointer-events-none">
                            <Play size={12} className="fill-current translate-x-0.5" />
                          </div>
                        </>
                      ) : (
                        <img
                          src={thumbnailSrc}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_THUMBNAILS[idx % DEFAULT_THUMBNAILS.length];
                          }}
                        />
                      )}
                      <div className="absolute top-4 left-4">
                        <span className={`${badge.bg} text-xs font-bold px-3 py-1 rounded-full uppercase shadow-sm`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                        <Clock size={13} /> {formatDuration(course.duration)}
                      </div>
                    </div>

                    <div className="p-6 sm:p-8 flex flex-col flex-grow">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-gray-500 text-sm mb-6 flex-grow leading-relaxed">
                        {course.description}
                      </p>

                      <ul className="space-y-3 mb-8">
                        {features.map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      <Link
                        to={targetLink}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition mt-auto text-center block shadow-sm hover:shadow"
                      >
                        Learn More
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 text-sm group"
            >
              <span>Explore All Language Programs</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Students Say</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">Hear from our successful students who have achieved their Korean language goals.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              quote: "\"SRI-KO helped me master Korean for my business trips to Seoul. The instructors are amazing and the cultural insights are invaluable.\"",
              name: "Sarah Johnson",
              role: "Business Professional"
            },
            {
              quote: "\"I passed TOPIK Level 4 thanks to SRI-KO's comprehensive curriculum and personalized guidance. Highly recommended!\"",
              name: "Michael Chen",
              role: "University Student"
            },
            {
              quote: "\"Learning Korean with SRI-KO has been so much fun! I can now understand my favorite K-dramas and songs.\"",
              name: "Emily Rodriguez",
              role: "K-Pop Enthusiast"
            }
          ].map((testimonial, idx) => (
            <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 italic text-sm mb-8 flex-grow">
                {testimonial.quote}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{testimonial.name}</h4>
                  <p className="text-xs text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose SRI-KO Foreign Language Training Center?</h2>
          <p className="text-gray-500 mb-16">We are committed to providing the highest quality Korean language education.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: ShieldCheck, title: "Certified Excellence", desc: "All our instructors are certified Korean language teachers with years of experience.", bg: "bg-blue-50 text-blue-500" },
              { icon: Globe, title: "Global Recognition", desc: "Our certificates are recognized internationally for academic and professional purposes.", bg: "bg-green-50 text-green-500" },
              { icon: CreditCard, title: "Affordable Pricing", desc: "Quality education at competitive prices with flexible payment options.", bg: "bg-purple-50 text-purple-500" },
              { icon: Users, title: "Community Support", desc: "Join our vibrant community of Korean language learners and cultural enthusiasts.", bg: "bg-orange-50 text-orange-500" }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${item.bg}`}>
                  <item.icon size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {/* <section className="py-20 max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-12 md:p-20 text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-white opacity-5 pattern-dots" />
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Start Your Journey Today</h2>
            <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
              Join thousands of students who have mastered Korean with SRI-KO.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-white text-blue-600 px-8 py-3 rounded-md font-bold hover:bg-gray-50 transition">
                Enroll Now
              </button>
              <button className="border border-white text-white px-8 py-3 rounded-md font-bold hover:bg-white/10 transition">
                Explore Courses
              </button>
            </div>
          </div>
        </div>
      </section> */}



    </div>
  );
};

export default LandingPage;