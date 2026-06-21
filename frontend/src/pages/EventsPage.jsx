import { Calendar, ArrowRight } from 'lucide-react';

export default function Events() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 flex flex-col">
      
     

      {/* Main Content Area - Note the rounded top corners and light background */}
      <main className="flex-grow bg-[#f4f5f8] mt-2 rounded-t-[2.5rem] pt-16 px-4 sm:px-8 lg:px-16 flex flex-col">
        <div className="max-w-6xl mx-auto w-full flex-grow">
            
            <h1 className="text-3xl font-bold text-gray-900 mb-10">Featured Events</h1>

            {/* Event Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                
                {/* Event Card 1 */}
                <div className="bg-white rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col border border-gray-100">
                    {/* Image Container */}
                    <div className="relative h-64 bg-gray-200 overflow-hidden">
                        {/* Replace src with your actual seminar image path */}
                        <img 
                            src="https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&q=80&w=1000" 
                            alt="Foreigners Seminar" 
                            className="w-full h-full object-cover"
                        />
                        {/* Badge */}
                        <div className="absolute top-5 left-5 bg-[#e0e7ff] text-[#3730a3] text-xs font-bold px-3 py-1.5 rounded-full tracking-wider shadow-sm">
                            SEMINAR
                        </div>
                    </div>
                    
                    {/* Content Container */}
                    <div className="p-8 flex flex-col flex-grow">
                        <div className="flex items-center text-gray-500 text-sm font-medium mb-4">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            November 15, 2024
                        </div>
                        
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">
                            Foreigners Seminar: Bridging Cultures
                        </h2>
                        
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            A special lecture series featuring international scholars discussing the global impact of Korean linguistics.
                        </p>
                        
                        <div className="mt-auto border-t border-gray-100 pt-6">
                            <a href="#" className="inline-flex items-center text-blue-600 font-bold text-lg hover:text-blue-800 transition-colors group">
                                Register Interest 
                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Event Card 2 */}
                <div className="bg-white rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col border border-gray-100">
                    {/* Image Container */}
                    <div className="relative h-64 bg-gray-200 overflow-hidden">
                         {/* Replace src with your actual ceremony image path */}
                        <img 
                            src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=1000" 
                            alt="Prize Giving Ceremony" 
                            className="w-full h-full object-cover"
                        />
                        {/* Badge */}
                        <div className="absolute top-5 left-5 bg-[#bbf7d0] text-[#166534] text-xs font-bold px-3 py-1.5 rounded-full tracking-wider shadow-sm">
                            CEREMONY
                        </div>
                    </div>
                    
                    {/* Content Container */}
                    <div className="p-8 flex flex-col flex-grow">
                        <div className="flex items-center text-gray-500 text-sm font-medium mb-4">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            December 20, 2024
                        </div>
                        
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">
                            Annual Prize Giving Ceremony
                        </h2>
                        
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            Honoring our most dedicated scholars for their academic achievements and cultural contributions.
                        </p>
                        
                        <div className="mt-auto border-t border-gray-100 pt-6">
                            <a href="#" className="inline-flex items-center text-blue-600 font-bold text-lg hover:text-blue-800 transition-colors group">
                                Event Details 
                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </a>
                        </div>
                    </div>
                </div>

            </div>

        </div>

       
      </main>

    </div>
  );
}