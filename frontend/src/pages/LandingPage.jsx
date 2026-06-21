import { Link } from 'react-router-dom';
import { 
  Users, BookOpen, GraduationCap, Award, Globe, Clock,
  Lightbulb, ShieldCheck, Heart, FileText, CheckCircle2, Star, CreditCard
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="font-sans text-gray-800 bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          {/* Logo Placeholder */}
            <Link to="/" className="w-12 h-15 bg-blue-100  flex items-center justify-center font-bold text-blue-800  text-xs overflow-hidden">
            <img src="/sri-ko-logo.png" alt="SRI-KO Logo" className="w-full h-full object-cover" />
          </Link>
          
        </div>
        <div className="hidden md:flex space-x-8 text-sm font-medium text-gray-600">
          <Link to="/" className="text-blue-600">Home</Link>
          <Link to="/courses" className="hover:text-blue-600 transition">Courses</Link>
          <Link to="/about" className="hover:text-blue-600 transition">About Us</Link>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition">Sign In</Link>
          <button className="bg-blue-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition">
            <Link to="/register" className="hover:text-blue-600 transition">Join Us Today</Link>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="relative pt-32 pb-32 lg:pt-48 lg:pb-48 flex items-center justify-center text-center px-4"
        style={{
          backgroundImage: ' url("../public/images/publicwallpaper.png")',
          backgroundSize: 'cover',
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
            <button className="bg-transparent border border-blue-600 text-blue-600 px-8 py-3 rounded-md font-medium hover:bg-white/10 transition flex items-center justify-center gap-2">
              Browse Courses <BookOpen size={18} />
              <Link to="/courses" className="hover:text-blue-600 transition">Courses</Link>
            </button>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Beginner */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                <span className="bg-blue-100 text-blue-600 text-xs font-bold px-3 py-1 rounded-full">BEGINNER</span>
                <span className="text-sm text-gray-500 flex items-center gap-1"><Clock size={14}/> 3 months</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Korean Language Basics</h3>
              <p className="text-gray-500 text-sm mb-6 flex-grow">Perfect for beginners starting their Korean language journey.</p>
              <ul className="space-y-3 mb-8">
                {["Hangul alphabet", "Basic grammar", "Essential vocabulary", "Pronunciation practice"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 size={16} className="text-green-500" /> {item}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition mt-auto">
                Learn More
              </button>
            </div>

            {/* Intermediate */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                <span className="bg-purple-100 text-purple-600 text-xs font-bold px-3 py-1 rounded-full">INTERMEDIATE</span>
                <span className="text-sm text-gray-500 flex items-center gap-1"><Clock size={14}/> 6 months</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Business Korean</h3>
              <p className="text-gray-500 text-sm mb-6 flex-grow">Professional Korean for business communication and workplace interactions.</p>
              <ul className="space-y-3 mb-8">
                {["Business etiquette", "Professional vocabulary", "Meeting Korean", "Email writing"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 size={16} className="text-green-500" /> {item}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition mt-auto">
                Learn More
              </button>
            </div>

            {/* All Levels */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                <span className="bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full">ALL LEVELS</span>
                <span className="text-sm text-gray-500 flex items-center gap-1"><Clock size={14}/> 4 months</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">TOPIK Preparation</h3>
              <p className="text-gray-500 text-sm mb-6 flex-grow">Comprehensive preparation for Korean proficiency tests.</p>
              <ul className="space-y-3 mb-8">
                {["Test strategies", "Mock exams", "Grammar review", "Vocabulary building"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 size={16} className="text-green-500" /> {item}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition mt-auto">
                Learn More
              </button>
            </div>
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

      {/* Footer */}
      <footer className="bg-gray-50 py-10 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start">
             <div className="flex items-center gap-2 mb-2">
                {/* Logo small */}
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 text-[10px]">
                  SK
                </div>
                <span className="font-bold text-gray-800">SRI-KO</span>
             </div>
             <p className="text-xs text-gray-500 text-center md:text-left max-w-sm">
                © 2024 SRI-KO. The Editorial Scholar Experience. Elevated language learning for the modern professional.
             </p>
          </div>
          
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-blue-600 transition">Terms of Service</a>
            <a href="#" className="hover:text-blue-600 transition">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600 transition">Help Center</a>
            <a href="#" className="hover:text-blue-600 transition">Contact Us</a>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;