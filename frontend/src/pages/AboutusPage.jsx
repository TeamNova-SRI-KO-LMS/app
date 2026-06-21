import { 
 MessageSquare, Rocket, Eye, 
  ListChecks, MessageCircle, Map, UserCheck, Award, 
  Network, Users, Zap, RotateCw, Banknote
} from 'lucide-react';
export default function AboutUs() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-gray-800">
      
      <main className="pb-20">
        
        {/* Hero Section */}
        <div className="relative bg-[#7aaad0] pt-12 pb-8 flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 drop-shadow-md tracking-wide">
                <span className="text-yellow-300">SRI-KO</span> Korean Language Center
            </h1>
            
            {/* Main Collage Placeholder (Represents the top complex graphic) */}
            <div className="w-full max-w-6xl bg-black/10 rounded-xl overflow-hidden shadow-2xl relative h-[400px] border border-white/20 flex items-center justify-center">
                <img src="../public/images/about.png" class="w-full h-full object-cover"></img >
            </div>

            {/* AI Chat Button floating on Hero */}
            <div className="absolute right-6 top-6 bg-blue-700 text-white flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl cursor-pointer hover:bg-blue-800 transition-transform hover:scale-105 z-10">
                <div className="text-sm font-medium text-left leading-tight">
                    <div className="text-blue-200 text-xs">Need help?</div>
                    <div>Chat with AI.</div>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                    <MessageSquare className="w-5 h-5" />
                </div>
            </div>
        </div>

        <div className="max-w-7xl mx-auto mt-10 px-4 sm:px-6 lg:px-8">
            
            {/* Mission & Vision Section */}
            <section className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 -mt-8 relative z-20 mx-4 grid grid-cols-1 md:grid-cols-2 gap-12 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                <div className="flex flex-col pr-0 md:pr-8">
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
                        <Rocket className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
                    <p className="text-gray-600 leading-relaxed">
                        To empower students in Sri Lanka by providing world-class Korean language training that opens doors to prestigious career opportunities and educational excellence in South Korea. We are committed to student success through personalized mentorship and practical communication.
                    </p>
                </div>

                <div className="flex flex-col pt-8 md:pt-0 pl-0 md:pl-8">
                    <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mb-6">
                        <Eye className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h2>
                    <p className="text-gray-600 leading-relaxed">
                        To be recognized as the leading Korean language center in Sri Lanka, fostering a community of globally-ready scholars who master not just the language, but the cultural nuances required for true integration and professional growth.
                    </p>
                </div>
            </section>

            {/* Instructor Section */}
            <section className="py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Left Side: Image with Badge */}
                <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-[3/4] max-w-md mx-auto lg:mx-0 w-full">
                    {/* Using the provided teacher image */}
                    <img 
                        src="../public/images/teacher.jpg" 
                        alt="Nandana Kekulawala" 
                        className="w-full h-full object-cover"
                    />
                    {/* Floating Info Box */}
                    <div className="absolute bottom-6 left-6 right-6 bg-blue-700 text-white p-6 rounded-2xl shadow-lg backdrop-blur-sm bg-blue-700/95">
                        <h3 className="text-xl font-bold mb-1">Founder & Lead Instructor</h3>
                        <p className="text-blue-200">Nandana Kekulawala</p>
                    </div>
                </div>

                {/* Right Side: Text and Grid */}
                <div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                        Meet the Expert Behind Your Success
                    </h2>
                    <p className="text-gray-600 mb-10 leading-relaxed text-lg">
                        With years of expertise in Korean linguistics and cross-cultural communication, Mr. Nandana Kekulawala has dedicated his career to making Korean accessible for every Sri Lankan student.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 hover:shadow-md transition-shadow">
                            <ListChecks className="w-6 h-6 text-blue-600" />
                            <div>
                                <h4 className="font-bold text-gray-900">Clear Explanations</h4>
                                <p className="text-sm text-gray-500 mt-1">Complex grammar made simple.</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 hover:shadow-md transition-shadow">
                            <MessageCircle className="w-6 h-6 text-blue-600" />
                            <div>
                                <h4 className="font-bold text-gray-900">Practical Speaking</h4>
                                <p className="text-sm text-gray-500 mt-1">Focus on real-life dialogues.</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 hover:shadow-md transition-shadow">
                            <Map className="w-6 h-6 text-blue-600" />
                            <div>
                                <h4 className="font-bold text-gray-900">Step-by-Step</h4>
                                <p className="text-sm text-gray-500 mt-1">Structured learning roadmap.</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 hover:shadow-md transition-shadow">
                            <UserCheck className="w-6 h-6 text-blue-600" />
                            <div>
                                <h4 className="font-bold text-gray-900">Personalized Support</h4>
                                <p className="text-sm text-gray-500 mt-1">Mentorship for every student.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Divider */}
            <div className="flex justify-center mb-16">
                <div className="flex gap-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <div className="w-16 h-2 bg-blue-600 rounded-full"></div>
                </div>
            </div>

            {/* Features Grid Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
                {[
                    { icon: Award, title: "Experienced Instructor", desc: "Learn from a veteran educator with deep roots in Korean culture and language." },
                    { icon: Network, title: "Well-Structured Courses", desc: "From Beginner to Advanced, our curriculum follows international standards." },
                    { icon: Users, title: "Friendly Environment", desc: "Join a supportive community that makes learning comfortable and fun." },
                    { icon: Zap, title: "Real-Life Skills", desc: "We prepare you for the job market and everyday life in South Korea." },
                    { icon: RotateCw, title: "Regular Updates", desc: "Stay informed with the latest exam patterns and job opportunities." },
                    { icon: Banknote, title: "Affordable Learning", desc: "Quality education that doesn't break the bank. Invest in your future." },
                ].map((feature, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <feature.icon className="w-8 h-8 text-gray-700 mb-6" strokeWidth={1.5} />
                        <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
                    </div>
                ))}
            </section>

            {/* Bottom Banner Section */}
            <section className="w-full rounded-3xl overflow-hidden shadow-2xl mb-12">
                 {/* Using the provided generated image */}
                 <img 
                    src="../public/images/about2.png" 
                    alt="SRIKO Building a bridge to your future" 
                    className="w-full h-auto object-cover"
                />
            </section>

        </div>
      </main>

      

    </div>
  );
}