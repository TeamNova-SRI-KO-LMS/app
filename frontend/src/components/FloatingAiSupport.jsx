import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, RefreshCw, MessageSquare, ChevronDown, User, CheckCircle2 } from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  "📚 What Korean courses are available?",
  "💳 What payment options do you support?",
  "🎓 How do I register for a class?",
  "🕒 What are the class timings?"
];

const INITIAL_MESSAGES = [
  {
    id: 1,
    sender: 'ai',
    text: "Annyeonghaseyo! 👋 Welcome to SRI-KO Foreign Language Training Center. How can I assist your Korean language learning journey today?",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

const FloatingAiSupport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const generateAiReply = (userQuery) => {
    const query = userQuery.toLowerCase();
    
    if (query.includes('course') || query.includes('class') || query.includes('level') || query.includes('topik')) {
      return "We offer comprehensive Korean courses ranging from Beginner (Foundation & EPS-TOPIK preparation) to Intermediate and Advanced Business Korean! You can explore details on our Courses page or enroll directly from your dashboard.";
    } else if (query.includes('payment') || query.includes('pay') || query.includes('cost') || query.includes('fee') || query.includes('card')) {
      return "We accept Visa, MasterCard, Bank Transfers, and local payment methods. All course fees can be safely processed through our Payment Portal with instant enrollment confirmation!";
    } else if (query.includes('register') || query.includes('signup') || query.includes('join') || query.includes('enroll')) {
      return "To register: Click the 'Register' button in the top navigation bar, fill in your details, and select your preferred Korean course. Once registered, you will get access to student portal materials!";
    } else if (query.includes('time') || query.includes('schedule') || query.includes('duration') || query.includes('when')) {
      return "We offer flexible learning schedules including weekday morning/evening batches and weekend intensive classes. Online live sessions are also recorded for review!";
    } else if (query.includes('contact') || query.includes('phone') || query.includes('location') || query.includes('address')) {
      return "You can reach SRI-KO Center via phone at +94 11 234 5678 or visit our main campus located in Colombo. Our team is available Mon-Sat, 8:00 AM - 6:00 PM.";
    } else {
      return `Thank you for asking about "${userQuery}". Our team at SRI-KO is dedicated to giving you the best learning experience. If you need immediate human support, feel free to call our hotline or visit our Contact section!`;
    }
  };

  const handleSendMessage = (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const aiReplyText = generateAiReply(text);
      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: aiReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 900);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
    setIsTyping(false);
  };

  return (
    <div className="fixed top-18 sm:top-20 md:top-24 right-3 sm:right-5 md:right-8 z-[9999] font-sans">
      {/* Expanded Chat Drawer / Box */}
      {isOpen ? (
        <div className="w-[calc(100vw-24px)] xs:w-[340px] sm:w-[380px] h-[460px] sm:h-[500px] max-h-[calc(100vh-100px)] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300 origin-top-right">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between shadow-md relative">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="bg-white/20 p-1.5 rounded-lg sm:rounded-xl backdrop-blur-md">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-blue-800 rounded-full animate-pulse"></span>
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm leading-tight flex items-center gap-1.5">
                  SRI-KO AI Support
                  <Sparkles className="w-3 h-3 text-yellow-300" />
                </h3>
                <p className="text-[10px] sm:text-xs text-blue-200 font-medium">Online 24/7 • Instant Help</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Reset Chat"
                className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close AI Support"
                className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-700 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[80%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-xs shadow-xs'
                        : 'bg-white text-gray-800 rounded-bl-xs shadow-xs border border-gray-100'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className={`text-[9px] text-gray-400 block mt-1 px-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center shrink-0 text-xs font-bold shadow-xs mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-2 justify-start items-center">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-700 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white px-3 py-2 rounded-xl rounded-bl-xs shadow-xs border border-gray-100 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}

            {/* Suggested Prompt Chips */}
            {messages.length <= 2 && !isTyping && (
              <div className="pt-1">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Suggested Topics</p>
                <div className="flex flex-col gap-1">
                  {SUGGESTED_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="text-left text-[11px] sm:text-xs bg-white hover:bg-blue-50 text-blue-900 border border-gray-200/80 hover:border-blue-300 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl transition-all shadow-2xs cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-2.5 sm:p-3 bg-white border-t border-gray-100 flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask AI a question..."
              className="flex-1 bg-gray-100 hover:bg-gray-100/80 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none rounded-lg sm:rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-800 transition-all placeholder:text-gray-400"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim()}
              className="bg-blue-700 hover:bg-blue-800 disabled:opacity-40 text-white p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all shadow-xs flex items-center justify-center shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Sub-footer banner */}
          <div className="bg-gray-50 border-t border-gray-100 py-1.5 px-3 text-center">
            <span className="text-[9px] sm:text-[10px] text-gray-400 flex items-center justify-center gap-1">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-500" />
              SRI-KO AI Language Support
            </span>
          </div>

        </div>
      ) : (
        /* Floating Button Widget Trigger */
        <button
          onClick={() => setIsOpen(true)}
          className="group bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 hover:from-blue-800 hover:to-indigo-950 text-white rounded-full shadow-lg shadow-blue-900/25 hover:shadow-xl hover:shadow-blue-800/35 px-2.5 py-1.5 sm:px-3.5 sm:py-2 md:px-4 md:py-2.5 flex items-center gap-2 sm:gap-2.5 transition-all duration-300 transform hover:scale-105 active:scale-95 border border-white/20 cursor-pointer backdrop-blur-md"
        >
          <div className="relative">
            <div className="bg-white/20 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition-colors flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-400 border-2 border-blue-900 rounded-full animate-pulse shadow-xs"></span>
          </div>

          <div className="text-left pr-0.5">
            <p className="text-[8px] sm:text-[9px] md:text-[10px] text-blue-200 leading-none uppercase tracking-wider font-bold mb-0.5">NEED HELP?</p>
            <p className="text-[11px] sm:text-xs md:text-sm font-extrabold leading-tight flex items-center gap-1 text-white whitespace-nowrap">
              Chat with AI
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 text-yellow-300 opacity-90 group-hover:opacity-100 transition-opacity" />
            </p>
          </div>
        </button>
      )}
    </div>
  );
};

export default FloatingAiSupport;
