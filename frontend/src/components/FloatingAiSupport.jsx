import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Bot, Loader2, RefreshCw, Send, Sparkles, User, X } from 'lucide-react';
import useAuth from '../context/useAuth';
import {
  GUEST_SUGGESTIONS,
  STUDENT_SUGGESTIONS,
  clearChatHistory,
  fetchChatHistory,
  sendChatMessage,
} from '../services/chatService';

const GUEST_STORAGE_KEY = 'sriko-chat-guest';
const MAX_MESSAGE_LENGTH = 500;

const firstNameOf = (user) => (user?.name || '').trim().split(/\s+/)[0] || '';

const welcomeMessage = (user) => {
  const firstName = firstNameOf(user);
  return {
    id: `welcome-${Date.now()}`,
    sender: 'ai',
    text: `Annyeonghaseyo${firstName ? `, ${firstName}` : ''}! 👋 Welcome to SRI-KO Foreign Language Training Center. Ask me about courses, fees, enrollment${user ? ', your attendance and progress' : ''}, or Korean basics.`,
    links: [],
    timestamp: new Date().toISOString(),
  };
};

// Guests keep their conversation for this browser tab; signed-in users' chats are saved on the server.
const readGuestChat = () => {
  try {
    return JSON.parse(sessionStorage.getItem(GUEST_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
};

const writeGuestChat = (chat) => {
  try {
    sessionStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(chat));
  } catch {
    // Storage unavailable (private mode / quota): the chat still works in memory
  }
};

const clearGuestChat = () => {
  try {
    sessionStorage.removeItem(GUEST_STORAGE_KEY);
  } catch {
    // Nothing to clear
  }
};

const hasAdminSession = () => {
  try {
    return localStorage.getItem('adminUser') !== null;
  } catch {
    return false;
  }
};

const loadConversation = async (user, ownerKey) => {
  if (user) {
    try {
      const data = await fetchChatHistory();
      const saved = data.messages || [];
      return {
        ownerKey,
        messages: saved.length ? saved : [welcomeMessage(user)],
        suggestions: data.suggestions?.length ? data.suggestions : STUDENT_SUGGESTIONS,
        courseId: null,
      };
    } catch {
      return { ownerKey, messages: [welcomeMessage(user)], suggestions: STUDENT_SUGGESTIONS, courseId: null };
    }
  }

  const saved = readGuestChat();
  return {
    ownerKey,
    messages: saved?.messages?.length ? saved.messages : [welcomeMessage(null)],
    suggestions: saved?.suggestions || GUEST_SUGGESTIONS,
    courseId: saved?.courseId || null,
  };
};

const formatTime = (value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const FloatingAiSupport = () => {
  // All hooks run on every render; the widget hides itself further down (an early
  // return before the hooks crashed React when navigating to/from admin pages).
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [chat, setChat] = useState({ ownerKey: null, messages: [], suggestions: [], courseId: null });
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesRef = useRef(null);

  // The conversation belongs to whoever is signed in; logging in or out starts the right one
  const ownerKey = user ? `user:${user._id || user.id}` : 'guest';
  const isLoaded = chat.ownerKey === ownerKey;
  const messages = isLoaded ? chat.messages : [];
  const suggestions = isLoaded ? chat.suggestions : [];

  useEffect(() => {
    if (!isOpen || isLoaded) return undefined;
    let ignore = false;
    loadConversation(user, ownerKey).then((next) => {
      if (!ignore) setChat(next);
    });
    return () => {
      ignore = true;
    };
  }, [isOpen, isLoaded, user, ownerKey]);

  useEffect(() => {
    if (!user && isLoaded) {
      writeGuestChat({ messages: chat.messages.slice(-40), suggestions: chat.suggestions, courseId: chat.courseId });
    }
  }, [chat, user, isLoaded]);

  // Keep the newest message in view (scrolls the chat panel, not the page)
  useEffect(() => {
    const container = messagesRef.current;
    if (isOpen && container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [chat.messages, isOpen, isTyping, isLoaded]);

  const sendMessage = async (preset) => {
    const text = (typeof preset === 'string' ? preset : inputValue).trim();
    if (!text || isTyping || !isLoaded) return;

    const askedBy = ownerKey;
    setChat((previous) => ({
      ...previous,
      messages: [...previous.messages, { id: `user-${Date.now()}`, sender: 'user', text, timestamp: new Date().toISOString() }],
      suggestions: [],
    }));
    if (typeof preset !== 'string') setInputValue('');
    setIsTyping(true);

    try {
      const reply = await sendChatMessage(text, { courseId: chat.courseId || undefined });
      setChat((previous) => (previous.ownerKey !== askedBy ? previous : {
        ...previous,
        messages: [
          ...previous.messages,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: reply.text,
            links: reply.links || [],
            timestamp: reply.timestamp || new Date().toISOString(),
          },
        ],
        suggestions: reply.suggestions || [],
        courseId: reply.meta?.courseId || null,
      }));
    } catch (error) {
      setChat((previous) => (previous.ownerKey !== askedBy ? previous : {
        ...previous,
        messages: [
          ...previous.messages,
          {
            id: `error-${Date.now()}`,
            sender: 'ai',
            isError: true,
            text: error?.response?.data?.message
              || "Sorry, I couldn't reach the SRI-KO assistant. Please check your connection and try again.",
            timestamp: new Date().toISOString(),
          },
        ],
        suggestions: [text], // tap to retry
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const handleResetChat = async () => {
    if (isTyping) return;
    if (user) {
      try {
        await clearChatHistory();
      } catch {
        // Start a fresh conversation locally even if the server call failed
      }
    } else {
      clearGuestChat();
    }
    setChat({
      ownerKey,
      messages: [welcomeMessage(user)],
      suggestions: user ? STUDENT_SUGGESTIONS : GUEST_SUGGESTIONS,
      courseId: null,
    });
  };

  const openLink = (to) => {
    navigate(to);
    if (window.innerWidth < 640) setIsOpen(false);
  };

  // Hide the assistant for admins and on the admin portal
  const isAdmin = user?.role === 'admin' || hasAdminSession();
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname === '/adminLogin';
  if (isAdmin || isAdminRoute) {
    return null;
  }

  return (
    <div className="fixed top-18 sm:top-20 md:top-24 right-3 sm:right-5 md:right-8 z-[9999] font-sans">
      {/* Expanded Chat Drawer / Box */}
      {isOpen ? (
        <div
          role="dialog"
          aria-label="SRI-KO AI Support chat"
          className="w-[calc(100vw-24px)] xs:w-[340px] sm:w-[380px] h-[460px] sm:h-[500px] max-h-[calc(100vh-100px)] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300 origin-top-right"
        >
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
                title="New conversation"
                aria-label="Start a new conversation"
                className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close AI Support"
                aria-label="Close chat"
                className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div ref={messagesRef} aria-live="polite" className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4 bg-slate-50/50">
            {!isLoaded && (
              <div className="h-full flex items-center justify-center gap-2 text-xs text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading conversation…
              </div>
            )}

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
                    className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line break-words ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-xs shadow-xs'
                        : msg.isError
                          ? 'bg-red-50 text-red-700 rounded-bl-xs shadow-xs border border-red-200'
                          : 'bg-white text-gray-800 rounded-bl-xs shadow-xs border border-gray-100'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {msg.links?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {msg.links.map((link) => (
                        <button
                          key={`${msg.id}-${link.to}`}
                          type="button"
                          onClick={() => openLink(link.to)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                        >
                          {link.label}
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}

                  <span className={`text-[9px] text-gray-400 block mt-1 px-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {formatTime(msg.timestamp)}
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
                <div className="bg-white px-3 py-2 rounded-xl rounded-bl-xs shadow-xs border border-gray-100 flex items-center gap-1.5" aria-label="Assistant is typing">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}

            {/* Suggested follow-ups from the latest answer */}
            {isLoaded && !isTyping && suggestions.length > 0 && (
              <div className="pt-1">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Suggested</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((question) => (
                    <button
                      key={question}
                      onClick={() => sendMessage(question)}
                      className="text-left text-[11px] sm:text-xs bg-white hover:bg-blue-50 text-blue-900 border border-gray-200/80 hover:border-blue-300 px-2.5 py-1.5 rounded-lg sm:rounded-xl transition-all shadow-2xs cursor-pointer"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-2.5 sm:p-3 bg-white border-t border-gray-100 flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={MAX_MESSAGE_LENGTH}
              disabled={!isLoaded}
              placeholder="Ask AI a question..."
              aria-label="Message SRI-KO AI Support"
              className="flex-1 bg-gray-100 hover:bg-gray-100/80 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none rounded-lg sm:rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-800 transition-all placeholder:text-gray-400 disabled:opacity-60"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!inputValue.trim() || isTyping || !isLoaded}
              aria-label="Send message"
              className="bg-blue-700 hover:bg-blue-800 disabled:opacity-40 text-white p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all shadow-xs flex items-center justify-center shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Sub-footer banner */}
          <div className="bg-gray-50 border-t border-gray-100 py-1.5 px-3 text-center">
            <span className="text-[9px] sm:text-[10px] text-gray-400 flex items-center justify-center gap-1">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-500" />
              Answers use live SRI-KO course and account data
            </span>
          </div>

        </div>
      ) : (
        /* Floating Button Widget Trigger */
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Chat with AI"
          className="group bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 hover:from-blue-800 hover:to-indigo-950 text-white rounded-full shadow-lg shadow-blue-900/25 hover:shadow-xl hover:shadow-blue-800/35 p-2 sm:p-2.5 flex items-center group-hover:gap-2 sm:group-hover:gap-2.5 group-hover:pr-3.5 sm:group-hover:pr-4 md:group-hover:pr-4.5 transition-all duration-500 ease-in-out transform hover:scale-105 active:scale-95 border border-white/20 cursor-pointer backdrop-blur-md"
        >
          <div className="relative shrink-0">
            <div className="bg-white/20 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition-colors duration-500 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-white" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-400 border-2 border-blue-900 rounded-full animate-pulse shadow-xs"></span>
          </div>

          <div className="max-w-0 opacity-0 group-hover:max-w-[160px] sm:group-hover:max-w-[200px] group-hover:opacity-100 overflow-hidden transition-all duration-500 ease-in-out text-left whitespace-nowrap">
            <p className="text-[8px] sm:text-[9px] md:text-[10px] text-blue-200 leading-none uppercase tracking-wider font-bold mb-0.5">NEED HELP?</p>
            <p className="text-[11px] sm:text-xs md:text-sm font-extrabold leading-tight flex items-center gap-1 text-white">
              Chat with AI
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 text-yellow-300 opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
            </p>
          </div>
        </button>
      )}
    </div>
  );
};

export default FloatingAiSupport;
