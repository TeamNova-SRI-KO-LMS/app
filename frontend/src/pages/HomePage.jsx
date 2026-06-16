import {
  AcademicCapIcon,
  ArrowRightIcon,
  BookOpenIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  HeartIcon,
  LanguageIcon,
  LightBulbIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
  StarIcon,
  TrophyIcon,
  UserGroupIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import {
  features,
  programs,
  stats,
  testimonials,
} from "../data/homeData";

import { Link } from "react-router-dom";
import heroImage from "../assets/heroSection.jpeg";
import useAuth from "../context/useAuth";

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  const scrollToWhyChoose = () => {
    const element = document.getElementById("why-choose-sriko");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

 

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: "bg-blue-600",
        text: "text-blue-600",
        light: "bg-blue-100",
        border: "border-blue-200",
      },
      green: {
        bg: "bg-green-600",
        text: "text-green-600",
        light: "bg-green-100",
        border: "border-green-200",
      },
      purple: {
        bg: "bg-purple-600",
        text: "text-purple-600",
        light: "bg-purple-100",
        border: "border-purple-200",
      },
      orange: {
        bg: "bg-orange-600",
        text: "text-orange-600",
        light: "bg-orange-100",
        border: "border-orange-200",
      },
      red: {
        bg: "bg-red-600",
        text: "text-red-600",
        light: "bg-red-100",
        border: "border-red-200",
      },
      yellow: {
        bg: "bg-yellow-600",
        text: "text-yellow-600",
        light: "bg-yellow-100",
        border: "border-yellow-200",
      },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div
        className="bg-cover bg-center bg-no-repeat relative w-full lg:w-screen"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t via-black/10 to-transparent"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-84 pb-16 flex flex-col justify-end min-h-[60vh] lg:min-h-screen">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Welcome to <span className="text-yellow-300">SRI-KO</span>
            </h1>
            <p className="text-xl md:text-2xl text-white mb-8 max-w-3xl mx-auto">
              Your premier destination for Korean language learning. Experience
              authentic Korean education with native instructors, cultural
              immersion, and proven results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-blue-600 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Go to Dashboard
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Link>
                  <button
                    onClick={scrollToWhyChoose}
                    className="inline-flex items-center px-8 py-4 border-2 border-white text-base font-medium rounded-lg text-white hover:bg-white hover:text-blue-600 transition-colors"
                  >
                    Why Choose Us
                    <HeartIcon className="ml-2 h-5 w-5" />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/join-us"
                    className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    Join Us Today
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    to="/courses"
                    className="inline-flex items-center px-8 py-4 border-2 border-white text-base font-medium rounded-lg text-white hover:bg-white hover:text-blue-600 transition-colors"
                  >
                    Browse Courses
                    <BookOpenIcon className="ml-2 h-5 w-5" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const colors = getColorClasses(stat.color);
            const Icon = stat.icon;

            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div
                      className={`h-12 w-12 ${colors.light} rounded-lg flex items-center justify-center`}
                    >
                      <Icon className={`h-6 w-6 ${colors.text}`} />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            What Makes SRI-KO Special?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover the unique advantages that make SRI-KO the best choice for
            Korean language learning
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const colors = getColorClasses(feature.color);
            const Icon = feature.icon;

            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow"
              >
                <div
                  className={`h-16 w-16 ${colors.light} rounded-full flex items-center justify-center mx-auto mb-4`}
                >
                  <Icon className={`h-8 w-8 ${colors.text}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Korean Language Programs Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Korean Language Programs
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose from our comprehensive range of Korean language courses
              designed for every level
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {programs.map((program, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {program.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{program.description}</p>
                  <div className="flex justify-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {program.duration}
                    </span>
                    <span className="flex items-center">
                      <AcademicCapIcon className="h-4 w-4 mr-1" />
                      {program.level}
                    </span>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {program.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-center text-sm text-gray-600"
                    >
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/courses"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  Learn More
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What Our Students Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Hear from our successful students who have achieved their Korean
              language goals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div className="border-t pt-4">
                  <p className="font-semibold text-gray-900">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why Choose SRI-KO Section */}
      <div id="why-choose-sriko" className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose SRI-KO Foreign Language Training Center?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We are committed to providing the highest quality Korean language
              education
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Certified Excellence
              </h3>
              <p className="text-gray-600">
                All our instructors are certified Korean language teachers with
                years of experience
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GlobeAltIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Global Recognition
              </h3>
              <p className="text-gray-600">
                Our certificates are recognized internationally for academic and
                professional purposes
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CurrencyDollarIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Affordable Pricing
              </h3>
              <p className="text-gray-600">
                Quality education at competitive prices with flexible payment
                options
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserGroupIcon className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Community Support
              </h3>
              <p className="text-gray-600">
                Join our vibrant community of Korean language learners and
                cultural enthusiasts
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
