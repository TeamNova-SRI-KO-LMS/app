import {
  ArrowRightIcon,
  BookOpenIcon,
  ChevronRightIcon,
  ClockIcon,
  EnvelopeIcon,
  MapPinIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const HelpCenterPage = () => {
  const location = useLocation();
  const chatInputRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello Scholar! I'm your SRI-KO AI Assistant. I can help you with course navigation, Hangul pronunciation, and course settings. What's on your mind today?",
      sender: "bot",
      timestamp: new Date("2024-01-01T09:00:00"),
    },
    {
      id: 2,
      text: "Can you explain the difference between formal and informal endings in Korean?",
      sender: "user",
      timestamp: new Date("2024-01-01T09:01:00"),
    },
    {
      id: 3,
      text: "That's a great question! In Korean, speech levels are important. Informal endings like “-아/어” are used with friends or close peers. Formal endings like “-습니다/-ㅂ니다” are used in polite or professional settings. If you want, I can give you examples for everyday conversation or business Korean.",
      sender: "bot",
      timestamp: new Date("2024-01-01T09:02:00"),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleStartChatting = () => {
    chatInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 400);
  };

  useEffect(() => {
    if (location.hash === "#chat" || location.hash === "#chat-input" || location.state?.focusChat) {
      setTimeout(() => {
        handleStartChatting();
      }, 300);
    }
  }, [location]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const knowledgeBase = {
    greeting: [
      "Hello! I can help with courses, pricing, schedules, enrollment, and Korean language basics.",
      "Welcome to SRI-KO! Ask me anything about your learning journey or course details.",
      "Hi there! I’m here to guide you through course options, study plans, and support.",
    ],
    courses: [
      "We offer beginner to advanced Korean language courses, including business, travel, and culture-focused tracks.",
      "Our learning paths are designed around speaking, listening, reading, and writing proficiency.",
      "Every program is paced for practical communication and confident daily use of Korean.",
    ],
    pricing: [
      "We offer flexible pricing plans for individuals, groups, and premium coaching support.",
      "You can compare course options and payment details on the pricing page, and we also offer bundles.",
      "Private sessions and group courses have different pricing based on duration and level.",
    ],
    enrollment: [
      "To enroll, visit our application page and complete the form with your preferred course and timeline.",
      "Our team can help you choose the right class based on your current Korean level and goals.",
      "You can also reach out to us by email or phone if you need guidance before registering.",
    ],
    schedule: [
      "We offer morning, afternoon, evening, weekend, and flexible online learning options.",
      "Class timings are designed to support students with different routines and commitments.",
      "If you are unsure which slot suits you best, we can help recommend one based on your schedule.",
    ],
    location: [
      "We are based in Colombo and cater to both local and international learners.",
      "You can contact us for campus details and directions before your visit.",
      "Online learning options are also available for students outside the local area.",
    ],
    contact: [
      "You can email or call our support team for any assistance with course information or registration.",
      "We usually respond to general queries within one business day.",
      "Our staff can help with onboarding, scheduling, and course recommendations.",
    ],
    instructors: [
      "Our instructors are experienced Korean language educators with a student-focused teaching style.",
      "They guide learners through grammar, speaking, pronunciation, and cultural understanding.",
      "Every program is designed to make progress practical and engaging.",
    ],
    materials: [
      "Students receive learning materials, guided practice, and digital support throughout their course.",
      "We focus on both textbook learning and real-world conversation practice.",
      "Our resources are designed to improve confidence in everyday Korean use.",
    ],
    certification: [
      "We provide certificates based on course completion and student progress.",
      "Students may also prepare for Korean proficiency recognition and academic pathways.",
      "Certification is available depending on the selected program and completion requirements.",
    ],
  };

  const getBotResponse = (userMessage) => {
    const message = userMessage.toLowerCase();

    if (
      message.includes("hello") ||
      message.includes("hi") ||
      message.includes("hey") ||
      message.includes("안녕")
    ) {
      return knowledgeBase.greeting[
        Math.floor(Math.random() * knowledgeBase.greeting.length)
      ];
    }
    if (
      message.includes("course") ||
      message.includes("class") ||
      message.includes("lesson") ||
      message.includes("learn") ||
      message.includes("korean")
    ) {
      return knowledgeBase.courses[
        Math.floor(Math.random() * knowledgeBase.courses.length)
      ];
    }
    if (
      message.includes("price") ||
      message.includes("cost") ||
      message.includes("fee") ||
      message.includes("payment")
    ) {
      return knowledgeBase.pricing[
        Math.floor(Math.random() * knowledgeBase.pricing.length)
      ];
    }
    if (
      message.includes("enroll") ||
      message.includes("join") ||
      message.includes("register") ||
      message.includes("sign up")
    ) {
      return knowledgeBase.enrollment[
        Math.floor(Math.random() * knowledgeBase.enrollment.length)
      ];
    }
    if (
      message.includes("schedule") ||
      message.includes("time") ||
      message.includes("when") ||
      message.includes("hours")
    ) {
      return knowledgeBase.schedule[
        Math.floor(Math.random() * knowledgeBase.schedule.length)
      ];
    }
    if (
      message.includes("location") ||
      message.includes("address") ||
      message.includes("where") ||
      message.includes("place")
    ) {
      return knowledgeBase.location[
        Math.floor(Math.random() * knowledgeBase.location.length)
      ];
    }
    if (
      message.includes("contact") ||
      message.includes("phone") ||
      message.includes("email") ||
      message.includes("reach")
    ) {
      return knowledgeBase.contact[
        Math.floor(Math.random() * knowledgeBase.contact.length)
      ];
    }
    if (
      message.includes("teacher") ||
      message.includes("instructor") ||
      message.includes("guide")
    ) {
      return knowledgeBase.instructors[
        Math.floor(Math.random() * knowledgeBase.instructors.length)
      ];
    }
    if (
      message.includes("book") ||
      message.includes("material") ||
      message.includes("resource")
    ) {
      return knowledgeBase.materials[
        Math.floor(Math.random() * knowledgeBase.materials.length)
      ];
    }
    if (
      message.includes("certificate") ||
      message.includes("certification") ||
      message.includes("diploma")
    ) {
      return knowledgeBase.certification[
        Math.floor(Math.random() * knowledgeBase.certification.length)
      ];
    }

    const defaultResponses = [
      "I can help with course recommendations, payments, enrollment steps, and learning support. Tell me what you want to know.",
      "That sounds important. I can guide you through course options, schedules, and next steps for your Korean study plan.",
      "I’m happy to help! Ask me about classes, certificates, pricing, or how to get started.",
      "I can answer many common questions about SRI-KO programs, support, and learning pathways. What would you like to know?",
    ];

    return defaultResponses[
      Math.floor(Math.random() * defaultResponses.length)
    ];
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const nextUserMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, nextUserMessage]);
    setInputMessage("");
    setIsTyping(true);

    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        text: getBotResponse(nextUserMessage.text),
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 900);
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "How do I track my progress?",
    "Password reset instructions",
    "Pronunciation guide help",
    "Booking a tutoring session",
  ];

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f4] text-slate-800">
      <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-9 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-[520px]">
            <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Always online
            </div>
            <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.06em] text-[#1c52c3] sm:text-[4.1rem]">
              Your Personal
              <span className="mt-2 block">24/7 AI Assistant</span>
            </h1>
            <p className="mt-6 max-w-[470px] text-base leading-7 text-slate-600">
              Experience the Sejong Modern approach to learning support. Instant
              answers, cultural insights, and technical guidance powered by
              advanced intelligence.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={handleStartChatting}
                className="rounded-xl bg-gradient-to-r from-[#2b5cf7] to-[#6b5cf9] px-6 py-3 text-base font-semibold text-white shadow-[0_12px_25px_rgba(59,98,255,0.25)] transition hover:opacity-95"
              >
                Start Chatting Now
              </button>
              <Link
               to="/docs"
               className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
               >
                View Documentation
              </Link>
            </div>
          </div>

          <div className="w-full max-w-[450px] rounded-[28px] bg-[#7ec0c3] p-4 shadow-[0_16px_35px_rgba(25,49,90,0.08)]">
            <img
              src="/public/girl_AI.png"
              alt="AI assistant illustration"
              className="h-[280px] w-full object-contain"
            />
            <defs>
              <linearGradient id="shirt" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#eefafc" />
                <stop offset="100%" stopColor="#d8edf0" />
              </linearGradient>
              <linearGradient id="hair" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#8d4f26" />
                <stop offset="100%" stopColor="#6f3d1d" />
              </linearGradient>
            </defs>

            <rect
              x="0"
              y="15"
              width="500"
              height="295"
              rx="24"
              fill="#6db6ba"
              opacity="0.15"
            />
            <ellipse
              cx="290"
              cy="300"
              rx="130"
              ry="20"
              fill="#5ab0b5"
              opacity="0.18"
            />

            <path
              d="M186 230 C200 180, 270 165, 320 185 L345 252 C318 270, 225 276, 177 255 Z"
              fill="url(#shirt)"
            />
            <path
              d="M206 235 L176 260 L240 280 L288 272 L332 255 L300 230 Z"
              fill="#d6eff1"
              opacity="0.85"
            />

            <path
              d="M230 145 C206 145, 190 166, 190 192 C190 222, 215 244, 246 244 L255 244 C279 244, 302 220, 302 192 C302 163, 287 145, 261 145 Z"
              fill="#e1a16d"
              opacity="0.18"
            />

            <path
              d="M226 150 C232 116, 261 93, 291 98 C310 102, 326 120, 332 139 C346 161, 340 196, 327 212 C304 200, 284 193, 254 193 C239 193, 226 179, 226 150 Z"
              fill="url(#hair)"
            />
            <path
              d="M280 160 C294 166, 306 177, 311 196 C307 205, 300 215, 290 222 C278 230, 260 231, 246 225 C236 212, 238 198, 245 183 C252 170, 264 164, 280 160 Z"
              fill="#f1c39f"
            />
            <circle cx="286" cy="182" r="65" fill="#f4c7a1" />
            <path
              d="M216 195 C231 155, 258 136, 295 137 C330 138, 350 157, 361 193 C345 177, 332 172, 318 168 C306 163, 291 160, 274 162 C261 163, 244 170, 231 183 Z"
              fill="url(#hair)"
            />

            <path
              d="M235 183 C248 175, 262 171, 277 172 C294 174, 307 180, 318 191"
              fill="none"
              stroke="#7c4a28"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx="246" cy="184" r="5" fill="#2d2f36" />
            <circle cx="301" cy="184" r="5" fill="#2d2f36" />
            <path
              d="M264 202 C273 208, 286 208, 294 202"
              fill="none"
              stroke="#a35b50"
              strokeWidth="3"
              strokeLinecap="round"
            />

            <path d="M286 204 L326 205 L335 246 L290 247 Z" fill="#f0f5fa" />
            <path d="M287 210 L334 210 L312 247 L277 244 Z" fill="#dfeaf2" />

            <path d="M233 245 L270 245 L275 272 L212 275 Z" fill="#f1f6fb" />
            <path d="M287 246 L344 246 L356 278 L291 279 Z" fill="#edf2f8" />

            <path
              d="M216 260 L150 250 L176 308 L228 307 Z"
              fill="#e8eef5"
              opacity="0.8"
            />
            <path
              d="M315 259 L368 259 L392 310 L330 309 Z"
              fill="#edf4f8"
              opacity="0.9"
            />

            <rect
              x="150"
              y="130"
              width="140"
              height="96"
              rx="12"
              fill="#f7f8fa"
              stroke="#cfe0ea"
              strokeWidth="2"
            />
            <path
              d="M164 148 h114"
              stroke="#d8e3ef"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M164 167 h100"
              stroke="#d8e3ef"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M164 186 h86"
              stroke="#d8e3ef"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M164 205 h86"
              stroke="#d8e3ef"
              strokeWidth="3"
              strokeLinecap="round"
            />

            <path
              d="M154 130 C170 105, 196 97, 213 100"
              fill="none"
              stroke="#d3cad3"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </div>
        </div>

        <div className="mt-1 grid gap-6 lg:grid-cols-[1.7fr_0.85fr]">
          <div className="overflow-hidden rounded-[22px] border border-[#e7e7e7] bg-[#f8f8f7] shadow-[0_14px_20px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between border-b border-[#ebebeb] bg-white px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef1ff] text-[#3a54d9]">
                  <SparklesIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[15px] font-bold text-slate-800">
                    SRI-KO AI Assistant
                  </div>
                  <div className="text-xs text-slate-500">Online</div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-[#effcf2] px-2.5 py-1 text-[11px] font-medium text-[#1d9b58]">
                <span className="h-2 w-2 rounded-full bg-[#1d9b58]" />
                Online
              </div>
            </div>

            <div className="h-[470px] space-y-4 overflow-y-auto bg-[#f7f7f6] p-4 sm:p-5">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[82%] rounded-[18px] px-4 py-3 text-[14px] leading-6 ${message.sender === "user"
                      ? "bg-gradient-to-r from-[#2d5af8] to-[#5a67ff] text-white"
                      : "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200/80"
                      }`}
                  >
                    <div className="flex items-start gap-2">
                      {message.sender === "bot" && (
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#edf1ff] text-[#3556da]">
                          <SparklesIcon className="h-3.5 w-3.5" />
                        </div>
                      )}
                      <div>
                        <p>{message.text}</p>
                        <div
                          className={`mt-2 text-[10px] ${message.sender === "user" ? "text-blue-100" : "text-slate-400"}`}
                        >
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="rounded-[18px] bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200/80">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#edf1ff] text-[#3556da]">
                        <SparklesIcon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:120ms]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:240ms]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div id="chat-input-bar" className="border-t border-[#e7e7e7] bg-white px-4 py-4">
              <div className="flex items-center gap-3 rounded-full border border-[#e4e4e7] bg-[#f9f9f9] px-3 py-2 shadow-inner">
                <input
                  ref={chatInputRef}
                  value={inputMessage}
                  onChange={(event) => setInputMessage(event.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your question here..."
                  className="w-full border-0 bg-transparent px-2 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#2d5af8] to-[#6f52ff] text-white shadow-[0_10px_18px_rgba(75,94,255,0.25)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[22px] border border-[#e7e7e7] bg-white p-5 shadow-[0_14px_20px_rgba(15,23,42,0.03)]">
              <div className="mb-4 flex items-center gap-2 text-[15px] font-bold text-slate-800">
                <QuestionMarkCircleIcon className="h-5 w-5 text-[#2c60e7]" />
                Quick Questions
              </div>
              <div className="space-y-2">
                {quickQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => handleQuickQuestion(question)}
                    className="flex w-full items-center justify-between rounded-xl bg-[#f3f4f6] px-3 py-3 text-left text-sm text-slate-700 transition hover:bg-[#eef3ff]"
                  >
                    <span>{question}</span>
                    <ChevronRightIcon className="h-4 w-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[22px] border border-[#e7e7e7] bg-white p-5 shadow-[0_14px_20px_rgba(15,23,42,0.03)]">
              <div className="mb-4 flex items-center gap-2 text-[15px] font-bold text-slate-800">
                <PhoneIcon className="h-5 w-5 text-[#2c60e7]" />
                Contact Support
              </div>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center gap-3 rounded-xl bg-[#f7f8fb] p-2.5">
                  <EnvelopeIcon className="h-4 w-4 text-[#2c60e7]" />
                  <span>info@sriko-korean.com</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-[#f7f8fb] p-2.5">
                  <PhoneIcon className="h-4 w-4 text-[#2c60e7]" />
                  <span>+94 11 234 5678</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-[#f7f8fb] p-2.5">
                  <ClockIcon className="h-4 w-4 text-[#2c60e7]" />
                  <span>Mon - Fri, 9AM - 6PM</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-[#f7f8fb] p-2.5">
                  <MapPinIcon className="h-4 w-4 text-[#2c60e7]" />
                  <span>Colombo, Sri Lanka</span>
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-[#e7e7e7] bg-white p-5 shadow-[0_14px_20px_rgba(15,23,42,0.03)]">
              <div className="mb-4 flex items-center gap-2 text-[15px] font-bold text-slate-800">
                <BookOpenIcon className="h-5 w-5 text-[#2c60e7]" />
                Helpful Resources
              </div>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#2c60e7]" />
                  Korean language courses
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#2c60e7]" />
                  Course schedules
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#2c60e7]" />
                  Enrollment steps
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#2c60e7]" />
                  Pricing & payment
                </div>
              </div>
              <Link
                to="/courses"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2d5af8] to-[#6d60ff] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_18px_rgba(75,94,255,0.22)] transition hover:brightness-105"
              >
                Explore courses
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterPage;
