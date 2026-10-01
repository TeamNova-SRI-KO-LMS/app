import { 
   History, ChevronLeft, ChevronRight 
} from 'lucide-react';

// Data for announcements matching the image
const announcementsData = [
  {
    type: 'EVENTS',
    priority: 'MEDIUM',
    title: 'Traditional Calligraphy Workshop: Registration Open',
    desc: 'Join us for a masterclass in Seoye (Korean calligraphy) led by visiting artist Park Min-Ho.',
    date: 'Oct 15, 2024',
    typeColors: 'bg-purple-100 text-purple-800',
    priorityColor: 'text-blue-600',
    dotColor: 'bg-blue-600'
  },
  {
    type: 'GENERAL',
    priority: 'LOW',
    title: 'Campus Cafeteria - New Menu Items for Autumn',
    desc: 'Explore our new seasonal selections including Pumpkin Jeon and warming Ginger Tea available starting next week.',
    date: 'Oct 20, 2024',
    typeColors: 'bg-gray-200 text-gray-600',
    priorityColor: 'text-gray-500',
    dotColor: 'bg-gray-400'
  },
  {
    type: 'COURSE',
    priority: 'HIGH',
    title: 'Intermediate Level II - Midterm Review Sessions',
    desc: 'Professor Kim will be hosting supplementary review sessions in Hall B and via Zoom for all enrolled students.',
    date: 'Oct 18, 2024',
    typeColors: 'bg-green-200 text-green-800',
    priorityColor: 'text-blue-600',
    dotColor: 'bg-blue-600'
  },
  {
    type: 'EVENTS',
    priority: 'MEDIUM',
    title: 'Traditional Calligraphy Workshop: Registration Open',
    desc: 'Join us for a masterclass in Seoye (Korean calligraphy) led by visiting artist Park Min-Ho.',
    date: 'Oct 15, 2024',
    typeColors: 'bg-purple-100 text-purple-800',
    priorityColor: 'text-blue-600',
    dotColor: 'bg-blue-600'
  },
  {
    type: 'COURSE',
    priority: 'HIGH',
    title: 'Intermediate Level II - Midterm Review Sessions',
    desc: 'Professor Kim will be hosting supplementary review sessions in Hall B and via Zoom for all enrolled students.',
    date: 'Oct 18, 2024',
    typeColors: 'bg-green-200 text-green-800',
    priorityColor: 'text-blue-600',
    dotColor: 'bg-blue-600'
  },
  {
    type: 'EVENTS',
    priority: 'MEDIUM',
    title: 'Traditional Calligraphy Workshop: Registration Open',
    desc: 'Join us for a masterclass in Seoye (Korean calligraphy) led by visiting artist Park Min-Ho.',
    date: 'Oct 15, 2024',
    typeColors: 'bg-purple-100 text-purple-800',
    priorityColor: 'text-blue-600',
    dotColor: 'bg-blue-600'
  },
  {
    type: 'GENERAL',
    priority: 'LOW',
    title: 'Library Hours Update for National Holiday',
    desc: 'The central library will operate on reduced hours (10 AM - 4 PM) during the upcoming holiday weekend.',
    date: 'Oct 10, 2024',
    typeColors: 'bg-gray-200 text-gray-600',
    priorityColor: 'text-gray-500',
    dotColor: 'bg-gray-400'
  },
  {
    type: 'EVENTS',
    priority: 'MEDIUM',
    title: 'Traditional Calligraphy Workshop: Registration Open',
    desc: 'Join us for a masterclass in Seoye (Korean calligraphy) led by visiting artist Park Min-Ho.',
    date: 'Oct 15, 2024',
    typeColors: 'bg-purple-100 text-purple-800',
    priorityColor: 'text-blue-600',
    dotColor: 'bg-blue-600'
  }
];

export default function Announcements() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 flex flex-col">

      {/* Main Content Area */}
      <main className="flex-grow bg-[#f8f9fa] pt-16 px-4 sm:px-8 lg:px-16 pb-20">
        <div className="max-w-6xl mx-auto w-full">
            
            {/* Header */}
            <div className="mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Announcements</h1>
                <p className="text-gray-600 text-lg max-w-2xl">
                    Stay updated with the latest institutional news, course updates, and community events from the SRI-KO Editorial Board.
                </p>
            </div>

            {/* List Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center text-xl font-bold text-gray-900">
                    <History className="w-6 h-6 mr-3 text-gray-700" />
                    Recent Announcements
                </div>
                <div className="flex gap-6 text-sm font-medium text-gray-500">
                    <button className="hover:text-gray-800 transition-colors">Filter by Type</button>
                    <button className="hover:text-gray-800 transition-colors">Mark all as read</button>
                </div>
            </div>

            {/* Announcements List */}
            <div className="flex flex-col gap-4 mb-10">
                {announcementsData.map((item, index) => (
                    <div 
                        key={index} 
                        className="bg-[#f2f4f7] rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        {/* Left: Tags */}
                        <div className="flex items-center gap-4 min-w-[180px]">
                            <span className={`${item.typeColors} text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider`}>
                                {item.type}
                            </span>
                            <span className={`flex items-center text-[10px] font-bold uppercase tracking-wider ${item.priorityColor}`}>
                                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${item.dotColor}`}></span>
                                {item.priority}
                            </span>
                        </div>

                        {/* Middle: Content */}
                        <div className="flex-grow">
                            <h3 className="text-gray-900 font-bold mb-1">{item.title}</h3>
                            <p className="text-gray-600 text-sm">{item.desc}</p>
                        </div>

                        {/* Right: Date */}
                        <div className="text-sm font-medium text-gray-500 min-w-[90px] text-right">
                            {item.date}
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center space-x-4">
                <button className="p-2 text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-50" disabled>
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex space-x-2">
                    <button className="w-8 h-8 flex items-center justify-center rounded-md bg-blue-600 text-white font-medium text-sm">
                        1
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-200 transition-colors font-medium text-sm">
                        2
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-200 transition-colors font-medium text-sm">
                        3
                    </button>
                </div>
                <button className="p-2 text-gray-500 hover:text-gray-800 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

        </div>
      </main>

      
    </div>
  );
}