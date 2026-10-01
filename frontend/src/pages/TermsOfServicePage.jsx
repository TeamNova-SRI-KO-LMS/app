import React from 'react';
import { Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  AcademicCapIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

const TermsOfServicePage = () => {
  const sections = [
    {
      title: 'Acceptance of Terms',
      icon: DocumentTextIcon,
      content: [
        {
          subtitle: 'Agreement to Terms',
          items: [
            'By accessing and using SRI-KO Korean Language Training Institute services, you accept and agree to be bound by these Terms of Service',
            'If you do not agree to these terms, you may not access or use our services',
            'These terms apply to all users, including students, instructors, and visitors',
            'We reserve the right to modify these terms at any time with notice to users'
          ]
        },
        {
          subtitle: 'Eligibility',
          items: [
            'You must be at least 16 years old to use our services',
            'You must provide accurate and complete information when creating an account',
            'You are responsible for maintaining the confidentiality of your account',
            'You must notify us immediately of any unauthorized use of your account'
          ]
        }
      ]
    },
    {
      title: 'User Responsibilities',
      icon: UserIcon,
      content: [
        {
          subtitle: 'Account Security',
          items: [
            'Maintain the security of your login credentials',
            'Notify us immediately of any security breaches',
            'Use strong passwords and enable two-factor authentication when available',
            'Log out of your account when using shared devices'
          ]
        },
        {
          subtitle: 'Appropriate Use',
          items: [
            'Use our services only for educational purposes',
            'Respect other users and maintain a positive learning environment',
            'Do not share inappropriate, offensive, or illegal content',
            'Follow all applicable laws and regulations'
          ]
        },
        {
          subtitle: 'Prohibited Activities',
          items: [
            'Attempting to hack, disrupt, or damage our systems',
            'Sharing account credentials with others',
            'Using automated tools to access our services',
            'Violating intellectual property rights of others'
          ]
        }
      ]
    },
    {
      title: 'Educational Services',
      icon: AcademicCapIcon,
      content: [
        {
          subtitle: 'Course Access',
          items: [
            'Course access is granted based on enrollment and payment status',
            'We reserve the right to modify course content and structure',
            'Course materials are for personal educational use only',
            'Sharing course materials with non-enrolled users is prohibited'
          ]
        },
        {
          subtitle: 'Learning Progress',
          items: [
            'Progress tracking is provided as a learning aid',
            'We do not guarantee specific learning outcomes',
            'Students are responsible for their own learning progress',
            'Certificates are issued based on course completion criteria'
          ]
        },
        {
          subtitle: 'Instructor Interaction',
          items: [
            'Instructors are available during scheduled office hours',
            'Response times may vary based on instructor availability',
            'Professional and respectful communication is expected',
            'Instructors reserve the right to moderate discussions'
          ]
        }
      ]
    },
    {
      title: 'Payment & Refunds',
      icon: CreditCardIcon,
      content: [
        {
          subtitle: 'Payment Terms',
          items: [
            'All fees are due in advance of course access',
            'Payment methods accepted include credit cards and bank transfers',
            'Prices are subject to change with 30 days notice',
            'Failed payments may result in suspension of services'
          ]
        },
        {
          subtitle: 'Refund Policy',
          items: [
            'Refunds are available within 7 days of enrollment',
            'Refunds are not available after course completion',
            'Refund requests must be submitted through our support system',
            'Processing time for refunds is 5-10 business days'
          ]
        },
        {
          subtitle: 'Subscription Management',
          items: [
            'Subscriptions automatically renew unless cancelled',
            'Cancellation must be done at least 24 hours before renewal',
            'No refunds for partial subscription periods',
            'Downgrading subscriptions may affect course access'
          ]
        }
      ]
    },
    {
      title: 'Intellectual Property',
      icon: ShieldCheckIcon,
      content: [
        {
          subtitle: 'Our Content',
          items: [
            'All course materials, videos, and content are owned by SRI-KO',
            'Content is protected by copyright and other intellectual property laws',
            'Users may not reproduce, distribute, or modify our content',
            'Unauthorized use may result in legal action'
          ]
        },
        {
          subtitle: 'User Content',
          items: [
            'Users retain ownership of content they create and submit',
            'Users grant us license to use their content for educational purposes',
            'Users are responsible for ensuring they have rights to submitted content',
            'We may remove content that violates these terms'
          ]
        }
      ]
    }
  ];

  const violations = [
    'Account suspension or termination',
    'Loss of access to course materials',
    'Legal action for serious violations',
    'Reporting to relevant authorities when required'
  ];

  const contactInfo = [
    {
      icon: EnvelopeIcon,
      label: 'Email',
      value: 'legal@sriko-korean.com',
      description: 'For legal and terms-related inquiries'
    },
    {
      icon: PhoneIcon,
      label: 'Phone',
      value: '+94 11 234 5678',
      description: 'Monday to Friday, 9AM-6PM'
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
              Terms of Service
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Please read these terms carefully before using SRI-KO Korean Language Training Institute 
              services. These terms govern your use of our platform.
            </p>
            <p className="text-sm text-blue-200 mt-4">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Introduction */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
          <p className="text-gray-600 mb-4">
            Welcome to SRI-KO Korean Language Training Institute. These Terms of Service ("Terms") 
            govern your use of our learning management system, courses, and related services. 
            By accessing or using our services, you agree to be bound by these Terms.
          </p>
          <p className="text-gray-600">
            These Terms constitute a legally binding agreement between you and SRI-KO Korean Language 
            Training Institute. Please read them carefully and contact us if you have any questions.
          </p>
        </div>

        {/* Main Sections */}
        {sections.map((section, index) => (
          <div key={index} className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center mb-6">
              <section.icon className="h-8 w-8 text-blue-600 mr-4" />
              <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
            </div>
            
            {section.content.map((item, itemIndex) => (
              <div key={itemIndex} className="mb-6 last:mb-0">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">{item.subtitle}</h3>
                <ul className="space-y-2">
                  {item.items.map((listItem, listIndex) => (
                    <li key={listIndex} className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{listItem}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}

        {/* Violations & Consequences */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <XCircleIcon className="h-6 w-6 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Violations & Consequences</h3>
              <p className="text-red-700 mb-3">
                Violation of these Terms may result in the following consequences:
              </p>
              <ul className="space-y-1">
                {violations.map((violation, index) => (
                  <li key={index} className="flex items-start">
                    <XCircleIcon className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-red-700">{violation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Limitation of Liability */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Limitation of Liability</h3>
              <p className="text-yellow-700">
                SRI-KO Korean Language Training Institute shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages, including but not limited 
                to loss of profits, data, or use, arising out of or relating to your use of our services.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Us</h2>
          <p className="text-gray-600 mb-6">
            If you have any questions about these Terms of Service, please contact us:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contactInfo.map((contact, index) => (
              <div key={index} className="flex items-start">
                <contact.icon className="h-6 w-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800">{contact.label}</h3>
                  <p className="text-gray-600">{contact.value}</p>
                  <p className="text-sm text-gray-500">{contact.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-white mt-8">
          <h2 className="text-2xl font-bold mb-4">Questions About Our Terms?</h2>
          <p className="text-blue-100 mb-6">
            Our legal team is available to help clarify any questions you may have about 
            these Terms of Service and your rights and obligations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/help-center"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center font-medium"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Ask AI Assistant
            </Link>
            <Link
              to="/join-us#get-in-touch"
              className="bg-transparent border border-white text-white px-6 py-3 rounded-lg hover:bg-white hover:text-blue-600 transition-colors flex items-center justify-center font-medium"
            >
              <ArrowRightIcon className="h-5 w-5 mr-2" />
              Contact Legal Team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;

