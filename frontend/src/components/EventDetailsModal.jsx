import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Users, 
  Share2, 
  ExternalLink, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Copy, 
  Download, 
  Award, 
  BookOpen, 
  GraduationCap, 
  Tag, 
  User as UserIcon,
  Globe,
  Radio
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuth from '../context/useAuth';
import eventService from '../services/eventService';
import { useNavigate } from 'react-router-dom';

const getCategoryTheme = (category) => {
  const norm = (category || 'seminar').toLowerCase();
  switch (norm) {
    case 'ceremony':
      return {
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        accent: 'from-emerald-600 to-teal-700',
        icon: Award,
        label: 'Ceremony'
      };
    case 'workshop':
      return {
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        accent: 'from-amber-500 to-orange-600',
        icon: Sparkles,
        label: 'Workshop'
      };
    case 'cultural':
      return {
        badge: 'bg-rose-50 text-rose-700 border-rose-200',
        accent: 'from-rose-500 to-pink-600',
        icon: Globe,
        label: 'Cultural Immersion'
      };
    case 'exam':
      return {
        badge: 'bg-red-50 text-red-700 border-red-200',
        accent: 'from-red-600 to-rose-700',
        icon: GraduationCap,
        label: 'TOPIK Exam Prep'
      };
    case 'webinar':
      return {
        badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        accent: 'from-cyan-600 to-blue-600',
        icon: Video,
        label: 'Online Webinar'
      };
    case 'general':
      return {
        badge: 'bg-gray-100 text-gray-700 border-gray-200',
        accent: 'from-gray-600 to-slate-700',
        icon: Users,
        label: 'Gathering'
      };
    case 'seminar':
    default:
      return {
        badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        accent: 'from-blue-600 to-indigo-700',
        icon: BookOpen,
        label: 'Academic Seminar'
      };
  }
};

const getStatusBadge = (status, eventDate) => {
  const norm = (status || 'upcoming').toLowerCase();
  const isPast = eventDate && new Date(eventDate) < new Date();

  if (norm === 'cancelled') {
    return {
      text: 'Cancelled',
      className: 'bg-rose-100 text-rose-800 border-rose-200'
    };
  }
  if (norm === 'ongoing') {
    return {
      text: 'Live Now',
      isLive: true,
      className: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    };
  }
  if (norm === 'completed' || isPast) {
    return {
      text: 'Past Event',
      className: 'bg-gray-100 text-gray-600 border-gray-200'
    };
  }
  return {
    text: 'Upcoming',
    className: 'bg-blue-100 text-blue-700 border-blue-200'
  };
};

export default function EventDetailsModal({ event, onClose, onAttendanceChange }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Photo gallery state
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMeeting, setCopiedMeeting] = useState(false);
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);

  // Normalise all unique photos
  const photos = useMemo(() => {
    if (!event) return [];
    const rawList = [];
    if (event.coverImage) rawList.push(event.coverImage);
    if (Array.isArray(event.photos)) {
      rawList.push(...event.photos);
    }
    // Remove duplicates and empty items
    const unique = Array.from(new Set(rawList.filter(Boolean)));
    // Fallback if none exist
    if (unique.length === 0) {
      unique.push('/event1.png');
    }
    return unique;
  }, [event]);

  // Reset active photo index on event change
  useEffect(() => {
    setActivePhotoIdx(0);
  }, [event?._id]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (lightboxOpen) {
          setLightboxOpen(false);
        } else {
          onClose();
        }
      } else if (lightboxOpen) {
        if (e.key === 'ArrowLeft') {
          setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
        } else if (e.key === 'ArrowRight') {
          setActivePhotoIdx((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, photos.length, onClose]);

  if (!event) return null;

  const categoryTheme = getCategoryTheme(event.category);
  const statusInfo = getStatusBadge(event.status, event.eventDate);
  const CategoryIcon = categoryTheme.icon;

  // Attendees info
  const attendeesList = event.attendees || [];
  const attendeesCount = attendeesList.length;
  const isAttending = isAuthenticated && user && attendeesList.some((a) => {
    const attendeeId = typeof a === 'object' ? a._id : a;
    return String(attendeeId) === String(user._id);
  });

  const capacity = event.capacity || 0;
  const isFull = capacity > 0 && attendeesCount >= capacity;
  const spotsLeft = capacity > 0 ? Math.max(0, capacity - attendeesCount) : null;
  const isOnline = Boolean(event.location?.toLowerCase().includes('online') || event.meetingLink);

  // Format dates
  const eventDateObj = new Date(event.eventDate);
  const formattedFullDate = eventDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const formattedTime = eventDateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // End time calculation
  const durationMinutes = event.duration || 60;
  const endDateObj = event.endDate ? new Date(event.endDate) : new Date(eventDateObj.getTime() + durationMinutes * 60000);
  const formattedEndTime = endDateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Calculate relative time / countdown
  const now = new Date();
  const diffMs = eventDateObj - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  let countdownText = '';
  if (diffMs > 0) {
    if (diffDays === 0) countdownText = 'Happening today!';
    else if (diffDays === 1) countdownText = 'Starts tomorrow!';
    else countdownText = `Starts in ${diffDays} days`;
  }

  // Attendance Toggle Handler
  const handleToggleAttendance = async () => {
    if (!isAuthenticated) {
      toast('Please sign in to register for this event', { icon: '🔐' });
      navigate('/login?redirect=' + encodeURIComponent(`/events?id=${event._id}`));
      return;
    }

    try {
      setIsRegistering(true);
      if (isAttending) {
        await eventService.cancelAttendance(event._id);
        toast.success('Registration cancelled');
        if (onAttendanceChange) {
          onAttendanceChange(event._id, false);
        }
      } else {
        await eventService.registerAttendance(event._id);
        toast.success("You're registered for this event! See you there.");
        if (onAttendanceChange) {
          onAttendanceChange(event._id, true);
        }
      }
    } catch (err) {
      console.error('Attendance toggle error:', err);
      toast.error(err.response?.data?.message || 'Failed to update registration status');
    } finally {
      setIsRegistering(false);
    }
  };

  // Copy Event URL
  const handleCopyLink = () => {
    const url = `${window.location.origin}/events?id=${event._id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success('Event link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Copy Meeting Link
  const handleCopyMeetingLink = () => {
    if (!event.meetingLink) return;
    navigator.clipboard.writeText(event.meetingLink);
    setCopiedMeeting(true);
    toast.success('Meeting link copied!');
    setTimeout(() => setCopiedMeeting(false), 2500);
  };

  // Add to Google Calendar
  const handleAddToGoogleCalendar = () => {
    const isoStart = eventDateObj.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const isoEnd = endDateObj.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      event.title
    )}&dates=${isoStart}/${isoEnd}&details=${encodeURIComponent(
      `${event.description || ''}\n\nJoin link: ${event.meetingLink || event.location || 'Online'}`
    )}&location=${encodeURIComponent(event.location || 'Online')}`;
    window.open(gCalUrl, '_blank', 'noopener,noreferrer');
    setShowCalendarMenu(false);
  };

  // Download .ics File
  const handleDownloadIcs = () => {
    const startStr = eventDateObj.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endStr = endDateObj.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SRI-KO LMS//Korean Language Learning//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${event._id}@srikolms.edu`,
      `DTSTAMP:${new Date().toISOString().replace(/-|:|\.\d\d\d/g, '')}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:${event.title.replace(/\n/g, ' ')}`,
      `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
      `LOCATION:${event.location || 'Online'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowCalendarMenu(false);
    toast.success('Calendar file (.ics) downloaded');
  };

  const nextPhoto = (e) => {
    e?.stopPropagation();
    setActivePhotoIdx((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const prevPhoto = (e) => {
    e?.stopPropagation();
    setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 md:p-8 overflow-y-auto animate-fade-in"
        onClick={onClose}
      >
        {/* Main Modal Card */}
        <div 
          className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-auto flex flex-col max-h-[92vh] animate-scale-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Action Bar */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center gap-2.5">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border tracking-wide uppercase ${categoryTheme.badge}`}>
                <CategoryIcon className="w-3.5 h-3.5" />
                {categoryTheme.label}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.className}`}>
                {statusInfo.isLive && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
                {statusInfo.text}
              </span>
              {countdownText && (
                <span className="hidden sm:inline-flex text-xs font-semibold text-blue-600 bg-blue-50/80 px-2.5 py-1 rounded-full">
                  {countdownText}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Share button */}
              <button
                onClick={handleCopyLink}
                title="Copy Event Link"
                className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              >
                {copiedLink ? <Check size={16} className="text-emerald-600" /> : <Share2 size={16} />}
                <span className="hidden md:inline">{copiedLink ? 'Copied' : 'Share'}</span>
              </button>

              {/* Close button */}
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="overflow-y-auto flex-grow p-5 sm:p-7 space-y-6">
            
            {/* ======================================================== */}
            {/* HERO PHOTO GALLERY (MULTIPLE PHOTOS EXPERIENCE)          */}
            {/* ======================================================== */}
            <div className="relative rounded-2xl overflow-hidden bg-gray-900 group shadow-md border border-gray-100">
              {/* Main Photo Display */}
              <div 
                className="relative h-56 sm:h-64 md:h-72 w-full cursor-pointer flex items-center justify-center bg-gray-950 overflow-hidden"
                onClick={() => setLightboxOpen(true)}
              >
                <img 
                  src={photos[activePhotoIdx]} 
                  alt={`${event.title} - Photo ${activePhotoIdx + 1}`}
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.02]"
                />

                {/* Subtle vignette gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                {/* Lightbox / Zoom Prompt Overlay */}
                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/65 hover:bg-black/85 backdrop-blur-md text-white text-xs font-semibold rounded-xl border border-white/20 transition cursor-pointer shadow-lg"
                  >
                    <Maximize2 size={13} />
                    <span>View Fullscreen</span>
                  </button>
                </div>

                {/* Photo Counter Pill (if multiple photos) */}
                {photos.length > 1 && (
                  <div className="absolute top-4 left-4 bg-black/65 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/15 flex items-center gap-1.5 shadow-md">
                    <span>Photo {activePhotoIdx + 1} of {photos.length}</span>
                  </div>
                )}

                {/* Navigation Arrows for Multiple Photos */}
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      aria-label="Previous photo"
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition cursor-pointer shadow-lg sm:opacity-90 hover:scale-110 active:scale-95"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={nextPhoto}
                      aria-label="Next photo"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition cursor-pointer shadow-lg sm:opacity-90 hover:scale-110 active:scale-95"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails Strip (When there are 2 or more photos) */}
              {photos.length > 1 && (
                <div className="p-3 bg-gray-900/90 backdrop-blur-sm border-t border-white/10 flex items-center gap-2.5 overflow-x-auto scrollbar-thin">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 pl-1">
                    Gallery:
                  </span>
                  <div className="flex items-center gap-2 py-0.5">
                    {photos.map((photoUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePhotoIdx(idx)}
                        className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                          idx === activePhotoIdx 
                            ? 'border-blue-500 ring-2 ring-blue-400/50 scale-105' 
                            : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-500'
                        }`}
                      >
                        <img 
                          src={photoUrl} 
                          alt={`Thumbnail ${idx + 1}`} 
                          className="w-full h-full object-cover" 
                        />
                        {idx === activePhotoIdx && (
                          <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Event Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight tracking-tight">
                {event.title}
              </h1>
              {event.isPinned && (
                <div className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <Sparkles size={13} className="text-amber-500" />
                  <span>Featured Landmark Event</span>
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* KEY HIGHLIGHTS GRID                                      */}
            {/* ======================================================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Date & Time */}
              <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 flex items-start gap-3.5 hover:bg-gray-50 transition">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Date & Time</span>
                  <p className="text-sm font-bold text-gray-900 mt-0.5 leading-snug">
                    {formattedFullDate}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formattedTime} – {formattedEndTime}
                  </p>
                </div>
              </div>

              {/* Duration */}
              <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 flex items-start gap-3.5 hover:bg-gray-50 transition">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Clock size={20} />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Duration</span>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">
                    {durationMinutes} minutes
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Interactive session & Q&A
                  </p>
                </div>
              </div>

              {/* Location & Format */}
              <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 flex items-start gap-3.5 hover:bg-gray-50 transition sm:col-span-2 lg:col-span-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isOnline ? 'bg-cyan-100 text-cyan-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {isOnline ? <Video size={20} /> : <MapPin size={20} />}
                </div>
                <div className="flex-grow min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Location</span>
                  <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">
                    {event.location || (isOnline ? 'Online Meeting' : 'Campus Main Hall')}
                  </p>
                  {isOnline ? (
                    <span className="inline-flex items-center gap-1 text-xs text-cyan-700 font-semibold mt-0.5">
                      <Radio size={12} className="animate-pulse" /> Virtual Session
                    </span>
                  ) : (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(event.location || 'Colombo')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 mt-0.5"
                    >
                      View on Map <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Online Meeting Join Card (If meeting link exists) */}
            {event.meetingLink && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Video size={20} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-blue-900 block">Online Conference Link</span>
                    <span className="text-xs text-blue-700 font-medium truncate block max-w-sm sm:max-w-md">
                      {event.meetingLink}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopyMeetingLink}
                    className="p-2 bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                    title="Copy meeting link"
                  >
                    {copiedMeeting ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span className="hidden sm:inline">{copiedMeeting ? 'Copied' : 'Copy Link'}</span>
                  </button>

                  <a
                    href={event.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    <span>Join Session</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            )}

            {/* Attendance & Capacity Meter */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Users size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-800 block">
                    {attendeesCount} Registered Attendees
                  </span>
                  <span className="text-xs text-gray-500 block">
                    {capacity > 0 
                      ? `${spotsLeft} of ${capacity} seats remaining` 
                      : 'Open capacity — all students are welcome'}
                  </span>
                </div>
              </div>

              {capacity > 0 && (
                <div className="w-full sm:w-48">
                  <div className="flex justify-between text-[11px] font-semibold text-gray-500 mb-1">
                    <span>Capacity</span>
                    <span>{Math.round((attendeesCount / capacity) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFull ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, (attendeesCount / capacity) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* FULL DESCRIPTION / AGENDA                                */}
            {/* ======================================================== */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <BookOpen size={16} className="text-blue-600" />
                About This Event & Agenda
              </h3>
              <div className="p-5 rounded-2xl bg-gray-50/50 border border-gray-100 text-sm text-gray-700 leading-relaxed whitespace-pre-line font-normal">
                {event.description}
              </div>
            </div>

            {/* Tags / Topics */}
            {Array.isArray(event.tags) && event.tags.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Tag size={13} />
                  Related Topics & Focus
                </h4>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, i) => (
                    <span 
                      key={i} 
                      className="px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-xs font-medium transition cursor-default"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Organizer Info Card */}
            {event.organizer && (
              <div className="p-4 rounded-2xl bg-white border border-gray-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {event.organizer.avatar ? (
                      <img 
                        src={event.organizer.avatar} 
                        alt={event.organizer.name} 
                        className="w-full h-full rounded-full object-cover" 
                      />
                    ) : (
                      (event.organizer.name?.[0] || 'O').toUpperCase()
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Organized By</span>
                    <span className="text-sm font-bold text-gray-900 block">
                      {event.organizer.name || 'SRI-KO Academic Team'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {event.organizer.role === 'admin' ? 'Head Academic Department' : 'Language Instructor'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-medium text-gray-400">SRI-KO LMS</span>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* MODAL BOTTOM ACTION BAR                                  */}
          {/* ======================================================== */}
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/70 flex flex-wrap items-center justify-between gap-3 sticky bottom-0 z-20">
            {/* Calendar Options */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCalendarMenu(!showCalendarMenu)}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold transition cursor-pointer shadow-xs"
              >
                <Calendar size={16} className="text-gray-500" />
                <span>Add to Calendar</span>
              </button>

              {showCalendarMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setShowCalendarMenu(false)} 
                  />
                  <div className="absolute left-0 bottom-full mb-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-30 animate-scale-up">
                    <button
                      onClick={handleAddToGoogleCalendar}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition flex items-center gap-2 cursor-pointer"
                    >
                      <ExternalLink size={14} />
                      <span>Google Calendar</span>
                    </button>
                    <button
                      onClick={handleDownloadIcs}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition flex items-center gap-2 cursor-pointer"
                    >
                      <Download size={14} />
                      <span>iCalendar / Outlook (.ics)</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* RSVP / Registration Button */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer"
              >
                Close
              </button>

              {isAttending ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm font-bold rounded-xl">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>Registered</span>
                  </span>
                  <button
                    onClick={handleToggleAttendance}
                    disabled={isRegistering}
                    className="px-3.5 py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    {isRegistering ? 'Cancelling...' : 'Cancel RSVP'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleAttendance}
                  disabled={isRegistering || isFull}
                  className={`inline-flex items-center gap-2 px-6 py-2.5 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                    isFull
                      ? 'bg-gray-400'
                      : 'bg-blue-600 hover:bg-blue-700 active:scale-98 shadow-blue-500/20'
                  }`}
                >
                  {isRegistering ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Registering...</span>
                    </>
                  ) : isFull ? (
                    <>
                      <AlertCircle size={16} />
                      <span>Event Full</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>{isAuthenticated ? 'Register for Event' : 'Sign In to Register'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* IMMERSIVE FULLSCREEN LIGHTBOX FOR MULTIPLE PHOTOS       */}
      {/* ======================================================== */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Top Bar */}
          <div className="w-full flex items-center justify-between text-white/80 py-2 max-w-6xl z-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-white tracking-wide">
                {event.title}
              </span>
              <span className="text-xs text-white/60 bg-white/10 px-2.5 py-1 rounded-full">
                {activePhotoIdx + 1} / {photos.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={photos[activePhotoIdx]}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-white/10 text-white rounded-xl transition cursor-pointer"
                title="Open original high-res image"
              >
                <ExternalLink size={20} />
              </a>
              <button
                onClick={() => setLightboxOpen(false)}
                className="p-2 hover:bg-white/10 text-white rounded-xl transition cursor-pointer"
                aria-label="Close fullscreen"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Main Fullscreen Image Area */}
          <div 
            className="relative flex-grow flex items-center justify-center w-full max-w-6xl my-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={photos[activePhotoIdx]} 
              alt={`${event.title} Full View`}
              className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl transition duration-200" 
            />

            {/* Left & Right Navigation Buttons */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-md transition cursor-pointer border border-white/20 hover:scale-110 active:scale-95"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-md transition cursor-pointer border border-white/20 hover:scale-110 active:scale-95"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails Navigation */}
          {photos.length > 1 && (
            <div 
              className="flex items-center justify-center gap-2.5 max-w-3xl overflow-x-auto py-2 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {photos.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhotoIdx(i)}
                  className={`w-14 h-11 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    i === activePhotoIdx 
                      ? 'border-blue-500 ring-2 ring-blue-400 scale-105' 
                      : 'border-white/20 opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={p} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
