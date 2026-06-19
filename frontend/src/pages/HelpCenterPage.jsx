import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChatBubbleLeftRightIcon,
  UserIcon,
  PaperAirplaneIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  BookOpenIcon,
  StarIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const HelpCenterPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "안녕하세요! 👋 Welcome to SRI-KO Korean Language Training Institute! I'm your AI assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // AI Knowledge Base for SRI-KO Korean Language Training Institute
  const knowledgeBase = {
    greeting: [
      "안녕하세요! Welcome to SRI-KO Korean Language Training Institute!",
      "Hello! I'm here to help you with information about our Korean language courses.",
      "Hi there! Welcome to SRI-KO. How can I assist you today?"
    ],
    courses: [
      "We offer comprehensive Korean language courses for all levels: Complete Beginner, Beginner, Intermediate, Advanced, and Native Level.",
      "Our courses include Korean Language Basics, Business Korean, Korean Culture, K-Pop & K-Drama, Korean Cuisine, Travel Korean, Academic Korean, and Korean Literature.",
      "Each course is designed by certified Korean language instructors with years of teaching experience."
    ],
    pricing: [
      "We offer flexible pricing plans to suit different budgets. Please visit our Pricing page for detailed information.",
      "We have monthly, quarterly, and annual subscription options with special discounts for long-term commitments.",
      "Group classes and private tutoring options are available with different pricing structures."
    ],
    enrollment: [
      "To enroll, visit our Join Us page and fill out the enrollment form with your details.",
      "You can also contact us directly via phone, email, or visit our institute in person.",
      "We accept students aged 16 and above for our Korean language programs."
    ],
    schedule: [
      "We offer flexible class schedules: Morning (9:00 AM - 12:00 PM), Afternoon (1:00 PM - 4:00 PM), Evening (6:00 PM - 9:00 PM), Weekend Classes, and Flexible Schedule options.",
      "You can choose the time that best fits your schedule.",
      "We also offer online classes for students who prefer remote learning."
    ],
    location: [
      "SRI-KO Korean Language Training Institute is located in a convenient location with easy access to public transportation.",
      "Our institute has modern facilities including classrooms, a library, and a cultural center.",
      "We provide detailed directions and parking information for students."
    ],
    contact: [
      "You can reach us by phone, email, or visit our institute during office hours.",
      "Our contact information is available on the Join Us page under the 'Get in Touch' section.",
      "We respond to inquiries within 24 hours and offer immediate assistance for urgent matters."
    ],
    instructors: [
      "Our instructors are native Korean speakers with professional teaching qualifications.",
      "They have extensive experience in Korean language education and cultural studies.",
      "All instructors are certified and regularly participate in professional development programs."
    ],
    materials: [
      "We provide comprehensive learning materials including textbooks, workbooks, and digital resources.",
      "Students receive access to our online learning platform with interactive content.",
      "We also provide cultural materials to enhance your understanding of Korean culture."
    ],
    certification: [
      "Upon completion of courses, students receive certificates recognized by Korean language institutions.",
      "We prepare students for official Korean language proficiency tests like TOPIK.",
      "Our certificates can be used for academic and professional purposes."
    ]
  };

  const getBotResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // Greeting responses
    if (message.includes('hello') || message.includes('hi') || message.includes('안녕')) {
      return knowledgeBase.greeting[Math.floor(Math.random() * knowledgeBase.greeting.length)];
    }
    
    // Course-related questions
    if (message.includes('course') || message.includes('class') || message.includes('learn') || message.includes('korean')) {
      return knowledgeBase.courses[Math.floor(Math.random() * knowledgeBase.courses.length)];
    }
    
    // Pricing questions
    if (message.includes('price') || message.includes('cost') || message.includes('fee') || message.includes('payment')) {
      return knowledgeBase.pricing[Math.floor(Math.random() * knowledgeBase.pricing.length)];
    }
    
    // Enrollment questions
    if (message.includes('enroll') || message.includes('join') || message.includes('register') || message.includes('sign up')) {
      return knowledgeBase.enrollment[Math.floor(Math.random() * knowledgeBase.enrollment.length)];
    }
    
    // Schedule questions
    if (message.includes('schedule') || message.includes('time') || message.includes('when') || message.includes('hours')) {
      return knowledgeBase.schedule[Math.floor(Math.random() * knowledgeBase.schedule.length)];
    }
    
    // Location questions
    if (message.includes('location') || message.includes('address') || message.includes('where') || message.includes('place')) {
      return knowledgeBase.location[Math.floor(Math.random() * knowledgeBase.location.length)];
    }
    
    // Contact questions
    if (message.includes('contact') || message.includes('phone') || message.includes('email') || message.includes('reach')) {
      return knowledgeBase.contact[Math.floor(Math.random() * knowledgeBase.contact.length)];
    }
    
    // Instructor questions
    if (message.includes('instructor') || message.includes('teacher') || message.includes('staff')) {
      return knowledgeBase.instructors[Math.floor(Math.random() * knowledgeBase.instructors.length)];
    }
    
    // Materials questions
    if (message.includes('material') || message.includes('book') || message.includes('resource')) {
      return knowledgeBase.materials[Math.floor(Math.random() * knowledgeBase.materials.length)];
    }
    
    // Certification questions
    if (message.includes('certificate') || message.includes('certification') || message.includes('diploma')) {
      return knowledgeBase.certification[Math.floor(Math.random() * knowledgeBase.certification.length)];
    }
    
    // Default responses for unknown questions
    const defaultResponses = [
      "I understand you're asking about something specific. Could you please provide more details? I'm here to help with information about our Korean language courses, enrollment, pricing, schedules, and more.",
      "That's an interesting question! While I have extensive knowledge about SRI-KO Korean Language Training Institute, I might need more context. Feel free to ask about our courses, instructors, schedules, or enrollment process.",
      "I'd be happy to help! Please let me know if you have questions about our Korean language courses, enrollment process, pricing, schedules, or any other aspect of our institute.",
      "Great question! I can help you with information about our Korean language programs, course schedules, pricing, enrollment, instructors, and more. What would you like to know?"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: getBotResponse(inputMessage),
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "What courses do you offer?",
    "How much does it cost?",
    "When are the classes?",
    "How do I enroll?",
    "Where is your institute located?",
    "What are your contact details?"
  ];

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white bg-opacity-20 rounded-full p-4">
                <ChatBubbleLeftRightIcon className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              24/7 AI Assistant
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Get instant answers about SRI-KO Korean Language Training Institute. 
              Ask me anything about our courses, enrollment, schedules, and more!
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
                <div className="flex items-center">
                  <div className="bg-white bg-opacity-20 rounded-full p-2 mr-3">
                    <SparklesIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">SRI-KO AI Assistant</h3>
                    <p className="text-sm text-blue-100">Always here to help! 🤖</p>
                  </div>
                  <div className="ml-auto">
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      Online
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <div className="flex items-start">
                        {message.sender === 'bot' && (
                          <div className="bg-blue-600 rounded-full p-1 mr-2 mt-1">
                            <SparklesIcon className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm">{message.text}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                      <div className="flex items-center">
                        <div className="bg-blue-600 rounded-full p-1 mr-2">
                          <SparklesIcon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about SRI-KO Korean Language Training..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Questions & Info */}
          <div className="space-y-6">
            {/* Quick Questions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <QuestionMarkCircleIcon className="h-5 w-5 mr-2 text-blue-600" />
                Quick Questions
              </h3>
              <div className="space-y-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <PhoneIcon className="h-5 w-5 mr-2 text-blue-600" />
                Contact Us
              </h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  <span>+94 11 234 5678</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  <span>info@sriko-korean.com</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPinIcon className="h-4 w-4 mr-2" />
                  <span>Colombo, Sri Lanka</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  <span>Mon-Fri: 9AM-6PM</span>
                </div>
              </div>
            </div>

            {/* Popular Topics */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BookOpenIcon className="h-5 w-5 mr-2 text-blue-600" />
                Popular Topics
              </h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <StarIcon className="h-4 w-4 mr-2 text-yellow-500" />
                  <span>Korean Language Courses</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <StarIcon className="h-4 w-4 mr-2 text-yellow-500" />
                  <span>Course Schedules</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <StarIcon className="h-4 w-4 mr-2 text-yellow-500" />
                  <span>Enrollment Process</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <StarIcon className="h-4 w-4 mr-2 text-yellow-500" />
                  <span>Pricing & Payment</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <StarIcon className="h-4 w-4 mr-2 text-yellow-500" />
                  <span>Instructor Information</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Ready to Start Learning?</h3>
              <p className="text-sm text-blue-100 mb-4">
                Join our Korean language program today!
              </p>
              <div className="space-y-2">
                <Link
                  to="/join-us"
                  className="w-full bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center text-sm font-medium"
                >
                  <ArrowRightIcon className="h-4 w-4 mr-2" />
                  Enroll Now
                </Link>
                <Link
                  to="/courses"
                  className="w-full bg-transparent border border-white text-white px-4 py-2 rounded-lg hover:bg-white hover:text-blue-600 transition-colors flex items-center justify-center text-sm font-medium"
                >
                  <BookOpenIcon className="h-4 w-4 mr-2" />
                  Browse Courses
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterPage;
