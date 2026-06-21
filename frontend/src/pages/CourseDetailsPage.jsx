import  { useState } from 'react';
import { 
  User, ArrowLeft, Clock, Users, Star, Calendar, 
  CheckCircle2, AlertTriangle, Tag, ChevronDown, PlayCircle, 
  CreditCard, FileText, ChevronUp
} from 'lucide-react';

export default function CourseDetails() {
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-gray-800 relative">

      {/* Absolute Background Gradient */}
      <div className="absolute top-0 left-0 w-full h-[450px] bg-gradient-to-br from-[#6b21a8] via-[#2563eb] to-[#10b981] z-0"></div>

      {/* Main Unified Layout Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 flex flex-col lg:flex-row gap-10 pb-20">
        
        {/* Left Column: Hero Text + Main Content */}
        <div className="flex-1 min-w-0">
            
          {/* Hero Content Section (White Text) */}
          <div className="text-white pb-12">
            <a href="#" className="inline-flex items-center text-white/80 hover:text-white text-sm font-medium mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Courses
            </a>

            <div className="flex items-center gap-3 mb-6">
              <span className="bg-white text-orange-600 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                Advanced
              </span>
              <span className="text-white/90 text-sm font-medium border border-white/30 px-3 py-1 rounded-full">
                Business
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight tracking-tight">
              Advanced Korean Business Etiquette & Professional Communication
            </h1>
            
            <p className="text-lg text-white/90 mb-8 max-w-3xl leading-relaxed">
              Master the nuances of the Korean corporate world. From the art of the perfect bow to complex honorifics used in high-stakes negotiations, this course prepares you for success in Seoul's business district.
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm text-white/90 font-medium mb-8">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 opacity-80" /> 18 weeks
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 opacity-80" /> 1,284 students
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" /> 4.9 Rating
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 opacity-80" /> Oct 20, 2024
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold border border-white/30">
                J
              </div>
              <div>
                <p className="text-sm font-bold">Dr. Ji-Hoon Kim</p>
                <p className="text-xs text-white/70">Lead Instructor</p>
              </div>
            </div>
          </div>

          {/* Main Content Section (Dark Text) */}
          <div className="text-gray-800 mt-2">
            
            {/* Tabs */}
            <div className="flex space-x-8 border-b border-gray-200 mb-10 overflow-x-auto">
              {['Overview', 'Curriculum', 'Instructor', 'Reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab === 'Overview' && <FileText className="w-4 h-4" />}
                  {tab === 'Curriculum' && <Clock className="w-4 h-4" />}
                  {tab === 'Instructor' && <User className="w-4 h-4" />}
                  {tab === 'Reviews' && <Star className="w-4 h-4" />}
                  {tab}
                </button>
              ))}
            </div>

            {/* Overview Section */}
            <section className="mb-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">What you'll learn</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                  <p className="text-gray-600">Advanced honorific structures (Jondaetmal) for executives.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                  <p className="text-gray-600">The "Nunchi" principle in corporate negotiations.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                  <p className="text-gray-600">Business card exchange and seating hierarchy.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                  <p className="text-gray-600">Dining etiquette for formal corporate dinners (Hoesik).</p>
                </div>
              </div>

              <div className="bg-[#f8fafc] border border-gray-100 rounded-2xl p-6 mb-10">
                <h4 className="font-bold text-gray-900 mb-4">Prerequisites</h4>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <span className="text-gray-600 text-sm">Intermediate Korean proficiency (TOPIK Level 3+)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <span className="text-gray-600 text-sm">Basic understanding of professional corporate environments</span>
                  </li>
                </ul>
              </div>

              <h4 className="font-bold text-gray-900 mb-4">Tags</h4>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
                  <Tag className="w-3.5 h-3.5" /> Business
                </span>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
                  <Tag className="w-3.5 h-3.5" /> Corporate Culture
                </span>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
                  <Tag className="w-3.5 h-3.5" /> Communication
                </span>
              </div>
            </section>

            {/* Curriculum Section */}
            <section className="mb-16 border-t border-gray-200 pt-10">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Course Curriculum</h3>
              
              <div className="space-y-4">
                {/* Module 1 (Expanded) */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <div className="p-6 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        W1
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Foundation of Professional Respect</h4>
                        <p className="text-xs text-gray-500 mt-1">The fundamental pillars of Korean business hierarchy.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500 font-medium">2 lessons • 38m</span>
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  
                  {/* Expanded Content */}
                  <div className="border-t border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between p-4 px-6 hover:bg-gray-100 transition-colors border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <PlayCircle className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">The 15, 30, and 45 Degree Bow</span>
                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Preview</span>
                      </div>
                      <span className="text-xs text-gray-500 font-medium">15:42</span>
                    </div>
                    <div className="flex items-center justify-between p-4 px-6 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <PlayCircle className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Hierarchy in the Elevator & Vehicle</span>
                      </div>
                      <span className="text-xs text-gray-500 font-medium">22:10</span>
                    </div>
                  </div>
                </div>

                {/* Module 2 (Collapsed) */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <div className="p-6 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-sm shrink-0">
                        W2
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">The Art of Negotiation & Nunchi</h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500 font-medium">4 lessons • 180m</span>
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Instructor Section */}
            <section className="mb-16 border-t border-gray-200 pt-10">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">Your Instructor</h3>
              <div className="flex flex-col sm:flex-row gap-6">
                <img 
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256&h=256" 
                  alt="Dr. Ji-Hoon Kim" 
                  className="w-24 h-24 rounded-2xl object-cover shrink-0"
                />
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-1">Dr. Ji-Hoon Kim</h4>
                  <p className="text-blue-600 text-sm font-medium mb-4">Former Senior Protocol Officer at SK Group</p>
                  <p className="text-gray-600 text-sm italic mb-6 leading-relaxed max-w-2xl">
                    "Dr. Kim has over 20 years of experience in international corporate protocol. He has advised CEOs of major conglomerates on cross-cultural communication and spent a decade training foreign executives."
                  </p>
                  <div className="flex gap-8">
                    <div>
                      <div className="text-xl font-bold text-gray-900">4.9</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Rating</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900">12,450</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Students</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900">15</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Courses</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Reviews Section */}
            <section className="border-t border-gray-200 pt-10">
              <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-gray-900">Student Reviews</h3>
                  <div className="flex items-center gap-2">
                      <div className="flex text-yellow-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className="w-5 h-5 fill-current" />
                          ))}
                      </div>
                      <span className="font-bold text-gray-900">4.9</span>
                      <span className="text-gray-500 text-sm">(322 reviews)</span>
                  </div>
              </div>

              {/* Write a Review Box */}
              <div className="bg-[#f8fafc] border border-gray-200 rounded-3xl p-8 mb-10">
                  <h4 className="font-bold text-gray-900 mb-4">Write a Review</h4>
                  
                  <div className="mb-6">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                          Rating <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-4">
                          <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                  <Star key={star} className="w-6 h-6 text-gray-300 cursor-pointer hover:text-yellow-400 transition-colors" />
                              ))}
                          </div>
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Rating</span>
                      </div>
                  </div>

                  <div className="mb-6">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                          Your Feedback
                      </label>
                      <textarea 
                          rows={4} 
                          className="w-full rounded-xl border border-gray-200 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          placeholder="Share your experience with this course..."
                      ></textarea>
                      <div className="text-right mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Max 500 Characters
                      </div>
                  </div>

                  <button className="bg-[#0052cc] hover:bg-blue-800 text-white font-bold py-2.5 px-8 rounded-xl transition-colors text-sm">
                      Submit Review
                  </button>
              </div>

              {/* Individual Review */}
              <div className="border border-gray-100 rounded-3xl p-8 bg-white shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#6366f1] text-white flex items-center justify-center font-bold text-sm shrink-0">
                              SJ
                          </div>
                          <div>
                              <h5 className="font-bold text-gray-900">Sarah Jenkins</h5>
                              <p className="text-xs text-gray-500">2 weeks ago</p>
                          </div>
                      </div>
                      <div className="flex text-yellow-400 gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className="w-3.5 h-3.5 fill-current" />
                          ))}
                      </div>
                  </div>
                  <p className="text-gray-600 text-sm italic leading-relaxed">
                      “This course was exactly what I needed before my relocation to Seoul. The details on 'Nunchi' and dining etiquette were lifesavers during my first executive dinner. Dr. Kim explains complex hierarchy in a way that is easy to digest.”
                  </p>
              </div>
              
            </section>

          </div>
        </div>

        {/* Right Column: Sticky Pricing Card */}
        <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0">
          <div className="sticky top-24 bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <div className="text-center mb-6">
              <h2 className="text-4xl font-bold text-blue-700 mb-2">LKR 14,500</h2>
              <div className="flex items-center justify-center gap-2">
                  <span className="text-gray-400 line-through text-sm">LKR 22,000</span>
                  <span className="text-xs font-medium text-gray-500">One-time payment</span>
              </div>
            </div>

            <button className="w-full bg-[#1d4ed8] hover:bg-blue-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors mb-8 shadow-md">
              <CreditCard className="w-5 h-5" /> Enroll Now
            </button>

            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-sm">Includes:</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-sm text-gray-600">Lifetime access to materials</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-sm text-gray-600">12 downloadable resources</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-sm text-gray-600">Official SRI-KO Certificate</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-sm text-gray-600">Direct Q&A with Instructor</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>

     
    </div>
  );
}