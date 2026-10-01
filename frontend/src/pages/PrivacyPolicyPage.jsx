import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheckIcon,
  EyeIcon,
  LockClosedIcon,
  UserIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

const PrivacyPolicyPage = () => {
  const sections = [
    {
      title: 'Information We Collect',
      icon: UserIcon,
      content: [
        {
          subtitle: 'Personal Information',
          items: [
            'Name, email address, and contact information',
            'Date of birth and age verification',
            'Korean language proficiency level',
            'Learning preferences and goals',
            'Profile pictures and avatars'
          ]
        },
        {
          subtitle: 'Learning Data',
          items: [
            'Course progress and completion status',
            'Quiz scores and assessment results',
            'Time spent on lessons and materials',
            'Learning preferences and study patterns',
            'Feedback and course evaluations'
          ]
        },
        {
          subtitle: 'Technical Information',
          items: [
            'IP address and device information',
            'Browser type and version',
            'Operating system details',
            'Usage analytics and performance data',
            'Cookies and tracking technologies'
          ]
        }
      ]
    },
    {
      title: 'How We Use Your Information',
      icon: EyeIcon,
      content: [
        {
          subtitle: 'Educational Services',
          items: [
            'Provide personalized Korean language courses',
            'Track learning progress and achievements',
            'Customize content based on proficiency level',
            'Send course updates and notifications',
            'Generate progress reports and certificates'
          ]
        },
        {
          subtitle: 'Communication',
          items: [
            'Send important course announcements',
            'Provide customer support and assistance',
            'Share educational resources and tips',
            'Notify about new courses and features',
            'Respond to inquiries and feedback'
          ]
        },
        {
          subtitle: 'Platform Improvement',
          items: [
            'Analyze usage patterns to improve services',
            'Develop new features and course content',
            'Ensure platform security and performance',
            'Conduct research and analytics',
            'Comply with legal and regulatory requirements'
          ]
        }
      ]
    },
    {
      title: 'Data Protection & Security',
      icon: LockClosedIcon,
      content: [
        {
          subtitle: 'Security Measures',
          items: [
            'Encryption of sensitive data in transit and at rest',
            'Secure authentication and access controls',
            'Regular security audits and assessments',
            'Employee training on data protection',
            'Incident response and breach notification procedures'
          ]
        },
        {
          subtitle: 'Data Retention',
          items: [
            'Personal data retained for active account duration',
            'Learning progress data kept for educational purposes',
            'Analytics data anonymized after specified periods',
            'Legal compliance requirements for data retention',
            'Secure deletion procedures for expired data'
          ]
        },
        {
          subtitle: 'Third-Party Services',
          items: [
            'Carefully selected service providers with privacy commitments',
            'Data processing agreements with all third parties',
            'Regular audits of third-party security practices',
            'Limited data sharing only for essential services',
            'User consent for any additional data sharing'
          ]
        }
      ]
    },
    {
      title: 'Your Rights & Choices',
      icon: ShieldCheckIcon,
      content: [
        {
          subtitle: 'Access and Control',
          items: [
            'View and download your personal data',
            'Update or correct inaccurate information',
            'Request deletion of your account and data',
            'Export your learning progress and achievements',
            'Opt-out of non-essential communications'
          ]
        },
        {
          subtitle: 'Privacy Settings',
          items: [
            'Control visibility of your profile information',
            'Manage notification preferences',
            'Choose data sharing options',
            'Set learning progress privacy levels',
            'Control cookie and tracking preferences'
          ]
        },
        {
          subtitle: 'Legal Rights',
          items: [
            'Right to access your personal information',
            'Right to rectification of inaccurate data',
            'Right to erasure under certain circumstances',
            'Right to data portability',
            'Right to object to processing'
          ]
        }
      ]
    }
  ];

  const contactInfo = [
    {
      icon: EnvelopeIcon,
      label: 'Email',
      value: 'privacy@sriko-korean.com',
      description: 'For privacy-related inquiries'
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
                <ShieldCheckIcon className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Privacy Policy
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Your privacy is important to us. Learn how SRI-KO Korean Language Training Institute 
              collects, uses, and protects your personal information.
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
            At SRI-KO Korean Language Training Institute, we are committed to protecting your privacy 
            and ensuring the security of your personal information. This Privacy Policy explains how 
            we collect, use, disclose, and safeguard your information when you use our learning 
            management system and related services.
          </p>
          <p className="text-gray-600">
            By using our services, you agree to the collection and use of information in accordance 
            with this policy. We will not use or share your information with anyone except as 
            described in this Privacy Policy.
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

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Notice</h3>
              <p className="text-yellow-700">
                We may update this Privacy Policy from time to time. We will notify you of any 
                changes by posting the new Privacy Policy on this page and updating the "Last updated" 
                date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Us</h2>
          <p className="text-gray-600 mb-6">
            If you have any questions about this Privacy Policy or our data practices, 
            please contact us using the information below:
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
          <h2 className="text-2xl font-bold mb-4">Questions About Privacy?</h2>
          <p className="text-blue-100 mb-6">
            Our privacy team is here to help you understand how we protect your information 
            and respect your privacy rights.
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
              Contact Privacy Team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;

