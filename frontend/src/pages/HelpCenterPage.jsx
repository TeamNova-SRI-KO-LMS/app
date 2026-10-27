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
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { sendChatMessage } from "../services/chatService";

const WELCOME_MESSAGE = {
  id: "welcome",
  text: "Hello Scholar! I'm your SRI-KO AI Assistant. Ask me about courses and fees, enrolling, your courses, assignments, attendance and progress, events, or Korean basics like Hangul and polite speech. Ask \"What can you do?\" to see everything I can help with.",
  sender: "bot",
  links: [],
  timestamp: new Date(),
};

const HelpCenterPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const chatInputRef = useRef(null);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  // Course discussed in the last answer, so follow-ups like "how much is it?" work
  const [lastCourseId, setLastCourseId] = useState(null);
  const messagesContainerRef = useRef(null);

  // Scroll the conversation itself, not the whole page
  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
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

  const handleSendMessage = async (preset) => {
    const text = (typeof preset === "string" ? preset : inputMessage).trim();
    if (!text || isTyping) return;

    const nextUserMessage = {
      id: `user-${Date.now()}`,
      text,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, nextUserMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const reply = await sendChatMessage(text, { courseId: lastCourseId || undefined });
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          text: reply.text,
          sender: "bot",
          links: reply.links || [],
          timestamp: new Date(reply.timestamp || Date.now()),
        },
      ]);
      setLastCourseId(reply.meta?.courseId || null);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-error-${Date.now()}`,
          text:
            error?.response?.data?.message ||
            "Sorry, I couldn't reach the assistant right now. Please check your connection and try again.",
          sender: "bot",
          isError: true,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
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
    "How do I enroll in a course?",
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
              src="/girl_AI.png"
              alt="AI assistant illustration"
              className="h-[280px] w-full object-contain"
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

            <div
              ref={messagesContainerRef}
              aria-live="polite"
              className="h-[470px] space-y-4 overflow-y-auto bg-[#f7f7f6] p-4 sm:p-5"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[82%] rounded-[18px] px-4 py-3 text-[14px] leading-6 ${message.sender === "user"
                      ? "bg-gradient-to-r from-[#2d5af8] to-[#5a67ff] text-white"
                      : message.isError
                        ? "bg-red-50 text-red-700 shadow-sm ring-1 ring-red-200"
                        : "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200/80"
                      }`}
                  >
                    <div className="flex items-start gap-2">
                      {message.sender === "bot" && (
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#edf1ff] text-[#3556da]">
                          <SparklesIcon className="h-3.5 w-3.5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="whitespace-pre-line break-words">{message.text}</p>
                        {message.links?.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            {message.links.map((link) => (
                              <button
                                key={`${message.id}-${link.to}`}
                                type="button"
                                onClick={() => navigate(link.to)}
                                className="inline-flex items-center gap-1 rounded-full bg-[#eef3ff] px-3 py-1 text-xs font-semibold text-[#2c60e7] transition hover:bg-[#e0e9ff]"
                              >
                                {link.label}
                                <ArrowRightIcon className="h-3 w-3" />
                              </button>
                            ))}
                          </div>
                        )}
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
            </div>

            <div id="chat-input-bar" className="border-t border-[#e7e7e7] bg-white px-4 py-4">
              <div className="flex items-center gap-3 rounded-full border border-[#e4e4e7] bg-[#f9f9f9] px-3 py-2 shadow-inner">
                <input
                  ref={chatInputRef}
                  value={inputMessage}
                  onChange={(event) => setInputMessage(event.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your question here..."
                  maxLength={500}
                  aria-label="Message the SRI-KO AI Assistant"
                  className="w-full border-0 bg-transparent px-2 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  aria-label="Send message"
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
