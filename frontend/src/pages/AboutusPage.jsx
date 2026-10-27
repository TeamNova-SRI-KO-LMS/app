import { 
  Rocket, Eye, 
  ListChecks, MessageCircle, Map, UserCheck, Award, 
  Network, Users, Zap, RotateCw, Banknote
} from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-gray-800">
      
      <main className="pb-12 sm:pb-20">
        
        {/* Hero Section */}
        <div className="relative bg-gradient-to-b from-[#7aaad0] to-[#6898be] pt-8 sm:pt-12 pb-8 sm:pb-12 flex flex-col items-center justify-center text-center px-3 sm:px-6">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-8 drop-shadow-md tracking-wide px-2">
                <span className="text-yellow-300">SRI-KO</span> Korean Language Center
            </h1>
            
            {/* Main Collage Hero Banner */}
            <div className="w-full max-w-6xl rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl border border-white/25 bg-black/10">
                <img 
                  src="/aboutHero.png" 
                  alt="Explore the Korean language at SRIKO Institute: classrooms, expert leadership and student success stories" 
                  className="w-full h-auto block object-contain" 
                />
            </div>
        </div>

        <div className="max-w-7xl mx-auto mt-4 sm:mt-8 px-3 sm:px-6 lg:px-8">
            
            {/* Mission & Vision Section */}
            <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 shadow-sm border border-gray-100 -mt-6 sm:-mt-10 relative z-20 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                <div className="flex flex-col pr-0 md:pr-8">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                        <Rocket className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-4">Our Mission</h2>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                        To empower students in Sri Lanka by providing world-class Korean language training that opens doors to prestigious career opportunities and educational excellence in South Korea. We are committed to student success through personalized mentorship and practical communication.
                    </p>
                </div>

                <div className="flex flex-col pt-6 md:pt-0 pl-0 md:pl-8">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                        <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-4">Our Vision</h2>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                        To be recognized as the leading Korean language center in Sri Lanka, fostering a community of globally-ready scholars who master not just the language, but the cultural nuances required for true integration and professional growth.
                    </p>
                </div>
            </section>

            {/* Instructor Section */}
            <section className="py-12 sm:py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
                {/* Left Side: Image with Badge */}
                <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl aspect-[3/4] max-w-sm sm:max-w-md mx-auto lg:mx-0 w-full">
                    <img 
                        src="/teacher.png"
                        alt="Nandana Kekulawala" 
                        className="w-full h-full object-cover"
                    />
                    {/* Floating Info Box */}
                    <div className="absolute bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6 bg-blue-700/95 text-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl shadow-lg backdrop-blur-sm">
                        <h3 className="text-base sm:text-xl font-bold mb-0.5 sm:mb-1">Founder & Lead Instructor</h3>
                        <p className="text-xs sm:text-sm text-blue-200">Nandana Kekulawala</p>
                    </div>
                </div>

                {/* Right Side: Text and Grid */}
                <div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-6 leading-tight">
                        Meet the Expert Behind Your Success
                    </h2>
                    <p className="text-gray-600 mb-6 sm:mb-10 leading-relaxed text-sm sm:text-base lg:text-lg">
                        With years of expertise in Korean linguistics and cross-cultural communication, Mr. Nandana Kekulawala has dedicated his career to making Korean accessible for every Sri Lankan student.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                        <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 flex flex-row sm:flex-col items-center sm:items-start gap-3.5 sm:gap-3 hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                <ListChecks className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm sm:text-base">Clear Explanations</h4>
                                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Complex grammar made simple.</p>
                            </div>
                        </div>

                        <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 flex flex-row sm:flex-col items-center sm:items-start gap-3.5 sm:gap-3 hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                <MessageCircle className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm sm:text-base">Practical Speaking</h4>
                                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Focus on real-life dialogues.</p>
                            </div>
                        </div>

                        <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 flex flex-row sm:flex-col items-center sm:items-start gap-3.5 sm:gap-3 hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                <Map className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm sm:text-base">Step-by-Step</h4>
                                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Structured learning roadmap.</p>
                            </div>
                        </div>

                        <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 flex flex-row sm:flex-col items-center sm:items-start gap-3.5 sm:gap-3 hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                <UserCheck className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm sm:text-base">Personalized Support</h4>
                                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Mentorship for every student.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Divider */}
            <div className="flex justify-center mb-10 sm:mb-16">
                <div className="flex gap-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <div className="w-12 sm:w-16 h-2 bg-blue-600 rounded-full"></div>
                </div>
            </div>

            {/* Features Grid Section */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 mb-12 sm:mb-20">
                {[
                    { icon: Award, title: "Experienced Instructor", desc: "Learn from a veteran educator with deep roots in Korean culture and language." },
                    { icon: Network, title: "Well-Structured Courses", desc: "From Beginner to Advanced, our curriculum follows international standards." },
                    { icon: Users, title: "Friendly Environment", desc: "Join a supportive community that makes learning comfortable and fun." },
                    { icon: Zap, title: "Real-Life Skills", desc: "We prepare you for the job market and everyday life in South Korea." },
                    { icon: RotateCw, title: "Regular Updates", desc: "Stay informed with the latest exam patterns and job opportunities." },
                    { icon: Banknote, title: "Affordable Learning", desc: "Quality education that doesn't break the bank. Invest in your future." },
                ].map((feature, idx) => (
                    <div key={idx} className="bg-white p-5 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-3 sm:mb-6">
                            <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-3">{feature.title}</h3>
                        <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{feature.desc}</p>
                    </div>
                ))}
            </section>

            {/* Bottom Banner Section */}
            <section className="w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg sm:shadow-2xl mb-8 sm:mb-12 border border-gray-100">
                 <img 
                    src="/aboutwall2.png"
                    alt="SRIKO Building a bridge to your future" 
                    className="w-full h-auto object-cover block"
                />
            </section>

        </div>
      </main>

    </div>
  );
}