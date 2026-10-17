import { useState, useEffect } from 'react';
import { Calendar, ArrowRight, MapPin, Video, Clock, ExternalLink } from 'lucide-react';
import eventService from '../services/eventService';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await eventService.getActiveEvents();
        if (res.success && Array.isArray(res.events) && res.events.length > 0) {
          setEvents(res.events);
        }
      } catch (err) {
        console.warn('Could not fetch events, using fallback:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 flex flex-col">
      {/* Main Content Area */}
      <main className="flex-grow bg-[#f4f5f8] mt-2 rounded-t-[2.5rem] pt-16 px-4 sm:px-8 lg:px-16 flex flex-col">
        <div className="max-w-6xl mx-auto w-full flex-grow">
          <h1 className="text-3xl font-bold text-gray-900 mb-10">Featured Events</h1>

          {/* Event Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {events.length > 0 ? (
              events.map((event, idx) => {
                const cover = event.coverImage || (event.photos && event.photos[0]) || (idx % 2 === 0 ? '/event1.png' : '/event2.png');
                const cat = (event.category || 'SEMINAR').toUpperCase();
                const isOnline = event.location?.toLowerCase().includes('online');

                return (
                  <div key={event._id} className="bg-white rounded-[1.5rem] overflow-hidden shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col border border-gray-100">
                    <div className="relative h-64 bg-gray-200 overflow-hidden">
                      <img 
                        src={cover} 
                        alt={event.title} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-5 left-5 bg-[#e0e7ff] text-[#3730a3] text-xs font-bold px-3 py-1.5 rounded-full tracking-wider shadow-xs">
                        {cat}
                      </div>
                      {event.photos?.length > 1 && (
                        <div className="absolute bottom-4 right-4 bg-black/75 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                          +{event.photos.length} Photos
                        </div>
                      )}
                    </div>
                    
                    <div className="p-8 flex flex-col flex-grow">
                      <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm font-medium mb-4">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                          {new Date(event.eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                        {event.duration && (
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                            {event.duration} mins
                          </span>
                        )}
                        <span className="flex items-center">
                          {isOnline ? <Video className="w-4 h-4 mr-1.5 text-blue-500" /> : <MapPin className="w-4 h-4 mr-1.5 text-rose-500" />}
                          {event.location || 'Online'}
                        </span>
                      </div>
                      
                      <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-snug">
                        {event.title}
                      </h2>
                      
                      <p className="text-gray-600 mb-8 leading-relaxed line-clamp-3">
                        {event.description}
                      </p>
                      
                      <div className="mt-auto border-t border-gray-100 pt-6 flex items-center justify-between">
                        {event.meetingLink ? (
                          <a 
                            href={event.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 font-bold text-base hover:text-blue-800 transition-colors group"
                          >
                            Join Online Event
                            <ExternalLink className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                          </a>
                        ) : (
                          <span className="inline-flex items-center text-blue-600 font-bold text-base hover:text-blue-800 transition-colors group cursor-pointer">
                            Register Interest 
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                          </span>
                        )}

                        {event.attendees?.length > 0 && (
                          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                            {event.attendees.length} attending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <>
                {/* Event Card 1 */}
                <div className="bg-white rounded-[1.5rem] overflow-hidden shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col border border-gray-100">
                  {/* Image Container */}
                    <div className="relative h-64 bg-gray-200 overflow-hidden">
                        {/* Replace src with your actual seminar image path */}
                        <img 
                            src="/event1.png" 
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
                            src="/event2.png" 
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
              </>
            )}
          </div>

        </div>

       
      </main>

    </div>
  );
}