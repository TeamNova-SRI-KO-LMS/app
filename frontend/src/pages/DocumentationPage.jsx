import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpenIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CogIcon,
  QuestionMarkCircleIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  StarIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const DocumentationPage = () => {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const documentationSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: BookOpenIcon,
      content: [
        {
          title: 'Welcome to SRI-KO LMS',
          description: 'Learn how to navigate and use our Korean Language Learning Management System.',
          items: [
            'Creating your account',
            'Setting up your profile',
            'Understanding the dashboard',
            'Navigating course materials'
          ]
        },
        {
          title: 'First Steps',
          description: 'Essential information for new students.',
          items: [
            'Account verification process',
            'Profile completion',
            'Course enrollment',
            'Accessing learning materials'
          ]
        }
      ]
    },
    {
      id: 'courses',
      title: 'Courses & Learning',
      icon: AcademicCapIcon,
      content: [
        {
          title: 'Course Structure',
          description: 'Understanding how our Korean language courses are organized.',
          items: [
            'Course levels and progression',
            'Lesson formats and types',
            'Assessment and quizzes',
            'Progress tracking'
          ]
        },
        {
          title: 'Learning Materials',
          description: 'Accessing and using course materials effectively.',
          items: [
            'Video lessons and tutorials',
            'Interactive exercises',
            'Downloadable resources',
            'Cultural content and activities'
          ]
        }
      ]
    },
    {
      id: 'account',
      title: 'Account Management',
      icon: UserGroupIcon,
      content: [
        {
          title: 'Profile Settings',
          description: 'Managing your personal information and preferences.',
          items: [
            'Updating personal details',
            'Changing password',
            'Profile picture upload',
            'Notification preferences'
          ]
        },
        {
          title: 'Subscription Management',
          description: 'Managing your course subscription and payments.',
          items: [
            'Viewing subscription status',
            'Upgrading or downgrading plans',
            'Payment history',
            'Cancellation process'
          ]
        }
      ]
    },
    {
      id: 'technical',
      title: 'Technical Support',
      icon: CogIcon,
      content: [
        {
          title: 'System Requirements',
          description: 'Technical specifications for optimal learning experience.',
          items: [
            'Browser compatibility',
            'Internet connection requirements',
            'Mobile device support',
            'Audio/video requirements'
          ]
        },
        {
          title: 'Troubleshooting',
          description: 'Common issues and their solutions.',
          items: [
            'Login problems',
            'Video playback issues',
            'Progress not saving',
            'Mobile app issues'
          ]
        }
      ]
    }
  ];

  const faqItems = [
    {
      question: "How do I access my courses?",
      answer: "After logging in, go to the Dashboard to see all your enrolled courses. Click on any course to access the learning materials and start your lessons."
    },
    {
      question: "Can I learn at my own pace?",
      answer: "Yes! Our courses are designed for self-paced learning. You can access materials anytime and progress through lessons at your own speed."
    },
    {
      question: "What if I need help with a lesson?",
      answer: "You can use our 24/7 AI chatbot for instant help, contact our support team, or reach out to your instructor through the course discussion forum."
    },
    {
      question: "How do I track my progress?",
      answer: "Your progress is automatically tracked as you complete lessons and quizzes. You can view detailed progress reports in your dashboard."
    },
    {
      question: "Can I download course materials?",
      answer: "Yes, most course materials including PDFs, audio files, and worksheets can be downloaded for offline study."
    },
    {
      question: "What happens if I miss a live session?",
      answer: "All live sessions are recorded and available for replay. You can access recordings in your course materials section."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white bg-opacity-20 rounded-full p-4">
                <DocumentTextIcon className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Documentation
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Complete guide to using SRI-KO Korean Language Learning Management System. 
              Find answers, tutorials, and helpful resources.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
              <h3 className="text-lg font-semibold mb-4">Quick Navigation</h3>
              <nav className="space-y-2">
                {documentationSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => toggleSection(section.id)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <section.icon className="h-5 w-5 mr-2 text-blue-600" />
                      <span className="text-sm font-medium">{section.title}</span>
                    </div>
                    {expandedSections[section.id] ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                  </button>
                ))}
              </nav>
              
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-semibold mb-3">Need Help?</h4>
                <Link
                  to="/help-center"
                  className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                  Chat with AI Assistant
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Documentation Sections */}
            {documentationSections.map((section) => (
              <div key={section.id} className="mb-8">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center mb-4">
                    <section.icon className="h-6 w-6 text-blue-600 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                  </div>
                  
                  {section.content.map((item, index) => (
                    <div key={index} className="mb-6 last:mb-0">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.title}</h3>
                      <p className="text-gray-600 mb-3">{item.description}</p>
                      <ul className="space-y-2">
                        {item.items.map((listItem, itemIndex) => (
                          <li key={itemIndex} className="flex items-start">
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{listItem}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* FAQ Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <QuestionMarkCircleIcon className="h-6 w-6 text-blue-600 mr-3" />
                Frequently Asked Questions
              </h2>
              
              <div className="space-y-4">
                {faqItems.map((faq, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">{faq.question}</h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Support Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white mt-8">
              <h2 className="text-2xl font-bold mb-4">Still Need Help?</h2>
              <p className="text-blue-100 mb-6">
                Can't find what you're looking for? Our support team is here to help you succeed in your Korean language learning journey.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  to="/help-center"
                  className="bg-white text-blue-600 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center text-sm font-medium"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                  AI Chat Assistant
                </Link>
                <Link
                  to="/join-us#get-in-touch"
                  className="bg-transparent border border-white text-white px-4 py-3 rounded-lg hover:bg-white hover:text-blue-600 transition-colors flex items-center justify-center text-sm font-medium"
                >
                  <ClockIcon className="h-4 w-4 mr-2" />
                  Contact Support
                </Link>
                <Link
                  to="/courses"
                  className="bg-transparent border border-white text-white px-4 py-3 rounded-lg hover:bg-white hover:text-blue-600 transition-colors flex items-center justify-center text-sm font-medium"
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

export default DocumentationPage;

