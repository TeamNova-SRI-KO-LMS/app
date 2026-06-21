import { 
  Search, MessageSquare, Clock, Users, 
  Star, GraduationCap, ChevronDown
} from 'lucide-react';

export default function Courses() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-gray-800">
      
      

      {/* Hero Section */}
      <div className="relative h-[360px] flex flex-col items-center justify-center px-4 overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url("https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000")',
            backgroundPosition: 'center 30%'
          }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
        </div>

        {/* Floating AI Button */}
        <div className="absolute right-6 top-6 bg-blue-700 text-white flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl cursor-pointer hover:bg-blue-800 transition-transform z-20">
          <div className="text-sm font-medium text-left leading-tight">
              <div className="text-blue-200 text-xs">Need help?</div>
              <div>Chat with AI.</div>
          </div>
          <div className="bg-white/20 p-2 rounded-lg">
              <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center w-full max-w-3xl mx-auto mt-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-wide drop-shadow-md">
            Explore Our Courses
          </h1>
          <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto drop-shadow-sm">
            Choose from a wide range of courses designed by industry experts. Start your learning journey today.
          </p>
          
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search courses..." 
              className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-800 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-16">
        
        {/* Controls Row: Tabs & Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <div className="flex gap-3">
            <button className="bg-[#0052cc] text-white px-6 py-2 rounded-full text-sm font-semibold shadow-sm">
              All Courses
            </button>
            <button className="bg-gray-200 text-gray-600 px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-300 transition-colors">
              My Courses
            </button>
          </div>
          <div className="flex gap-3">
            <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-300 transition-colors">
              Level: All Levels <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-300 transition-colors">
              Sort: Popularity <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
            <div className="relative h-48 bg-gray-200">
              <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800" alt="Course Thumbnail" className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 bg-purple-100 text-[#6b21a8] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                ADVANCED
              </div>
            </div>
            <div className="p-6 flex flex-col flex-grow">
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3 font-medium">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 12 Weeks</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> 1.2k Students</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 leading-tight">
                EPS TOPIK (Employment Permit System) - Expert prep for the exam
              </h3>
              <div className="flex items-center gap-2 mt-auto mb-4">
                <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Instructor" className="w-6 h-6 rounded-full" />
                <span className="text-sm text-gray-600 font-medium">Ji-won Kim</span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> 4.9
                </div>
                <div className="text-blue-700 font-bold text-lg">
                  LKR 18,500
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
            <div className="relative h-48 bg-gray-200">
              <img src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800" alt="Course Thumbnail" className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 bg-blue-100 text-blue-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                INTERMEDIATE
              </div>
            </div>
            <div className="p-6 flex flex-col flex-grow">
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3 font-medium">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 10 Weeks</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> 850 Students</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 leading-tight">
                Advanced Level (A/L) Korean Syllabus - Focused Prep
              </h3>
              <div className="flex items-center gap-2 mt-auto mb-4">
                <img src="https://i.pravatar.cc/150?u=a042581f4e29026704e" alt="Instructor" className="w-6 h-6 rounded-full" />
                <span className="text-sm text-gray-600 font-medium">Dr. Sang-woo Park</span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> 5.0
                </div>
                <div className="text-blue-700 font-bold text-lg">
                  LKR 16,000
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
            <div className="relative h-48 bg-gray-200">
              <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800" alt="Course Thumbnail" className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 bg-purple-100 text-[#6b21a8] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                ADVANCED
              </div>
            </div>
            <div className="p-6 flex flex-col flex-grow">
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3 font-medium">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 8 Weeks</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> 420 Students</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 leading-tight">
                Advanced Korean Business Etiquette & Professional Communication
              </h3>
              <div className="flex items-center gap-2 mt-auto mb-4">
                <img src="https://i.pravatar.cc/150?u=a042581f4e29026704f" alt="Instructor" className="w-6 h-6 rounded-full" />
                <span className="text-sm text-gray-600 font-medium">Hana Lee</span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> 4.8
                </div>
                <div className="text-blue-700 font-bold text-lg">
                  LKR 14,500
                </div>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
            <div className="relative h-48 bg-gray-200">
              <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800" alt="Course Thumbnail" className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 bg-blue-100 text-blue-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                INTERMEDIATE
              </div>
            </div>
            <div className="p-6 flex flex-col flex-grow pb-8">
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3 font-medium">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 8 Weeks</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> 680 Students</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 leading-tight">
                Daily Life & Culinary Conversations - Practical speaking
              </h3>
              <div className="flex items-center gap-2 mt-auto">
                <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Instructor" className="w-6 h-6 rounded-full" />
                <span className="text-sm text-gray-600 font-medium">Ji-won Kim</span>
              </div>
            </div>
          </div>

          {/* Card 5 */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
            <div className="relative h-48 bg-gray-200">
              <img src="https://images.unsplash.com/photo-1581007871115-f14bc016e0a4?auto=format&fit=crop&q=80&w=800" alt="Course Thumbnail" className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 bg-[#cbf4c9] text-[#166534] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                BEGINNER
              </div>
            </div>
            <div className="p-6 flex flex-col flex-grow pb-8">
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3 font-medium">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 6 Weeks</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> 2.5k Students</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 leading-tight">
                Korean Foundations: Hangul & Phonics for Beginners
              </h3>
              <div className="flex items-center gap-2 mt-auto">
                <img src="https://i.pravatar.cc/150?u=a042581f4e29026704f" alt="Instructor" className="w-6 h-6 rounded-full" />
                <span className="text-sm text-gray-600 font-medium">Hana Lee</span>
              </div>
            </div>
          </div>

          {/* Card 6 - CTA */}
          <div className="bg-[#eef2f6] rounded-2xl p-8 flex flex-col items-center justify-center text-center">
            <div className="mb-4">
              <GraduationCap className="w-10 h-10 text-blue-700" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Can't find your fit?</h3>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed px-4">
              Request a personalized curriculum or group session for your corporate team or school group.
            </p>
            <button className="bg-[#0052cc] hover:bg-blue-800 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors">
              Contact Support
            </button>
          </div>

        </div>
      </main>


    </div>
  );
}