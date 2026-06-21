// import React from 'react';
import { 
  Users, BookOpen, GraduationCap, Award, Globe, Clock, 
  Lightbulb, ShieldCheck, Heart, FileText, CheckCircle2, Star, 
  CreditCard, Bot
} from 'lucide-react';

const HomePage = () => {
  return (
    <div className="font-sans text-gray-800 bg-[#f8f9fa] min-h-screen">
      
      

      {/* Hero Banner Section */}
      <section className="max-w-[1400px] mx-auto p-4 relative mt-4">
        <img src="../public/images/home.png" class="w-full h-full object-cover"></img >
        {/* <div className="w-full h-[400px] md:h-[500px] bg-gradient-to-r from-yellow-500 to-orange-400 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-md">
           <h1 className="text-7xl md:text-9xl font-black text-white drop-shadow-xl tracking-tighter">SRIKO</h1>
           <p className="absolute bottom-10 bg-white/90 px-6 py-2 text-xl font-bold tracking-widest italic transform -skew-x-12">KOREAN LANGUAGE TRAINING</p>
        </div> */}

        {/* Floating AI Support Button */}
        <button className="absolute top-8 right-8 bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-lg p-3 flex items-center gap-3 transition transform hover:scale-105 z-10">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-blue-200 leading-tight">Need help?</p>
            <p className="text-sm font-bold leading-tight">Chat with AI</p>
          </div>
          <div className="bg-white/20 p-2 rounded-lg">
            <Bot size={24} />
          </div>
        </button>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 mt-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Users, count: "5,000+", label: "STUDENTS TAUGHT", color: "bg-blue-50 text-blue-600" },
            { icon: BookOpen, count: "50+", label: "KOREAN COURSES", color: "bg-green-50 text-green-600" },
            { icon: GraduationCap, count: "25+", label: "NATIVE INSTRUCTORS", color: "bg-purple-50 text-purple-600" },
            { icon: Award, count: "98%", label: "SUCCESS RATE", color: "bg-orange-50 text-orange-600" },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm flex items-center gap-5 border border-gray-100">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 tracking-wider mb-1 uppercase">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What Makes SRI-KO Special?</h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm">Discover the unique advantages that make SRI-KO the best choice for Korean language learning.</p>
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
            <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm text-center border border-gray-100 hover:shadow-md transition duration-300">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 ${feature.bg}`}>
                <feature.icon size={30} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-20 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Korean Language Programs</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-sm">Choose from our comprehensive range of Korean language courses designed for every level.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Beginner */}
            <div className="bg-[#f8f9fa] rounded-3xl p-8 border border-gray-100 flex flex-col h-full hover:shadow-lg transition">
              <div className="flex justify-between items-center mb-6">
                <span className="bg-blue-100 text-blue-700 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wide">BEGINNER</span>
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1"><Clock size={14}/> 3 months</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Korean Language Basics</h3>
              <p className="text-gray-500 text-sm mb-6 flex-grow leading-relaxed">Perfect for beginners starting their Korean language journey.</p>
              <ul className="space-y-3 mb-8">
                {["Hangul alphabet", "Basic grammar", "Essential vocabulary", "Pronunciation practice"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                    <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-[#0a58ca] text-white py-3.5 rounded-xl font-semibold hover:bg-blue-800 transition mt-auto shadow-sm">
                Learn More
              </button>
            </div>

            {/* Intermediate */}
            <div className="bg-[#f8f9fa] rounded-3xl p-8 border border-gray-100 flex flex-col h-full hover:shadow-lg transition">
              <div className="flex justify-between items-center mb-6">
                <span className="bg-purple-100 text-purple-700 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wide">INTERMEDIATE</span>
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1"><Clock size={14}/> 6 months</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Business Korean</h3>
              <p className="text-gray-500 text-sm mb-6 flex-grow leading-relaxed">Professional Korean for business communication and workplace interactions.</p>
              <ul className="space-y-3 mb-8">
                {["Business etiquette", "Professional vocabulary", "Meeting Korean", "Email writing"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                    <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-[#0a58ca] text-white py-3.5 rounded-xl font-semibold hover:bg-blue-800 transition mt-auto shadow-sm">
                Learn More
              </button>
            </div>

            {/* All Levels */}
            <div className="bg-[#f8f9fa] rounded-3xl p-8 border border-gray-100 flex flex-col h-full hover:shadow-lg transition">
              <div className="flex justify-between items-center mb-6">
                <span className="bg-orange-100 text-orange-700 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wide">ALL LEVELS</span>
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1"><Clock size={14}/> 4 months</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">TOPIK Preparation</h3>
              <p className="text-gray-500 text-sm mb-6 flex-grow leading-relaxed">Comprehensive preparation for Korean proficiency tests.</p>
              <ul className="space-y-3 mb-8">
                {["Test strategies", "Mock exams", "Grammar review", "Vocabulary building"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                    <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-[#0a58ca] text-white py-3.5 rounded-xl font-semibold hover:bg-blue-800 transition mt-auto shadow-sm">
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
          <p className="text-gray-500 max-w-2xl mx-auto text-sm">Hear from our successful students who have achieved their Korean language goals.</p>
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
            <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 italic text-[15px] leading-relaxed mb-8 flex-grow">
                {testimonial.quote}
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{testimonial.name}</h4>
                  <p className="text-[11px] text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose SRI-KO Foreign Language Training Center?</h2>
          <p className="text-gray-500 mb-16 text-sm">We are committed to providing the highest quality Korean language education.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {[
              { icon: ShieldCheck, title: "Certified Excellence", desc: "All our instructors are certified Korean language teachers with years of experience.", bg: "bg-blue-50 text-blue-500" },
              { icon: Globe, title: "Global Recognition", desc: "Our certificates are recognized internationally for academic and professional purposes.", bg: "bg-green-50 text-green-500" },
              { icon: CreditCard, title: "Affordable Pricing", desc: "Quality education at competitive prices with flexible payment options.", bg: "bg-purple-50 text-purple-500" },
              { icon: Users, title: "Community Support", desc: "Join our vibrant community of Korean language learners and cultural enthusiasts.", bg: "bg-orange-50 text-orange-500" }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center group">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${item.bg} group-hover:scale-110 transition duration-300`}>
                  <item.icon size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed px-4">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 max-w-6xl mx-auto px-4">
        <div className="bg-gradient-to-r from-[#4f46e5] via-[#6366f1] to-[#3b82f6] rounded-[2.5rem] p-16 text-center shadow-2xl relative overflow-hidden">
          {/* Subtle abstract background element */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute w-[500px] h-[500px] bg-green-400 rounded-full blur-[100px] opacity-20 -bottom-64 -right-20"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Start Your Journey Today</h2>
            <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto font-medium">
              Join thousands of students who have mastered Korean with SRI-KO.
            </p>
            <button className="border-2 border-white text-white px-10 py-3.5 rounded-xl font-bold text-lg hover:bg-white hover:text-indigo-600 transition duration-300 shadow-lg">
              Explore Courses
            </button>
          </div>
        </div>
      </section>

     

    </div>
  );
};

export default HomePage;