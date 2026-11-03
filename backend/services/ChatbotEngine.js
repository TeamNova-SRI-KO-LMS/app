const Course = require('../models/Course');
const Announcement = require('../models/Announcement');
const Event = require('../models/Event');
const Settings = require('../models/Settings');
const Progress = require('../models/Progress');
const Certificate = require('../models/Certificate');
const Attendance = require('../models/Attendance');
const DiscussionForum = require('../models/DiscussionForum');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const LectureMaterial = require('../models/LectureMaterial');
const Notification = require('../models/Notification');
const { summarizeAttendance, toAttendanceDay } = require('../utils/attendance');

/**
 * ChatbotEngine
 * Free, rule-based assistant behind the SRI-KO support chat. It needs no external
 * AI service: questions are matched to intents by keyword scoring, and every
 * answer about the platform is built from live MongoDB data (courses, fees,
 * announcements, events, and the signed-in student's own courses, assignments,
 * attendance and notifications). The only static knowledge is how the site works,
 * what the About page says about the institute, and Korean-language basics.
 */

// Shown when the admin has not saved contact details in Settings (matches the Contact page)
const SITE_CONTACT = {
  phone: '+94 77 307 9412',
  email: 'info@sriko-korean.com',
  admissionsEmail: 'admissions@sriko-korean.com',
  address: '123 Education Street, Colombo 07, Sri Lanka',
  hours: 'Mon – Fri 9:00 AM – 6:00 PM, Sat 9:00 AM – 1:00 PM (closed on Sundays)',
};

const DEFAULT_TIMEZONE = 'Asia/Colombo';

const GUEST_SUGGESTIONS = ['What can you do?', 'What courses do you offer?', 'How much are the courses?', 'How do I enroll?'];
const STUDENT_SUGGESTIONS = ['What can you do?', 'My courses and progress', 'My assignments', 'My attendance'];

const LEVEL_LABELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

const LEVEL_SYNONYMS = {
  beginner: ['beginner', 'basic', 'starter', 'foundation', 'newbie', 'introductory'],
  intermediate: ['intermediate'],
  advanced: ['advanced', 'expert', 'fluent'],
};

const CATEGORY_SYNONYMS = {
  Business: ['business', 'workplace', 'office'],
  Grammar: ['grammar'],
  Conversation: ['conversation', 'speaking', 'conversational'],
  Culture: ['culture', 'cultural'],
  Literature: ['literature', 'poetry'],
};

// ─── Text analysis ────────────────────────────────────────────────────────────

const HANGUL = /[ㄱ-ㆎ가-힣]/;

// Chat shorthand, expanded before matching ("what can u do")
const SHORTHAND = {
  u: 'you', ur: 'your', r: 'are', pls: 'please', plz: 'please', thx: 'thanks', thnx: 'thanks',
  wat: 'what', wht: 'what', hw: 'how', abt: 'about', pwd: 'password', pw: 'password',
};

const normalize = (text) => String(text || '')
  .toLowerCase()
  .normalize('NFKC')
  .replace(/['’]/g, '')
  .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

// classes → class, batches → batch, policies → policy, courses → course; leaves "status" alone
const singular = (word) => {
  if (word.length <= 3 || !word.endsWith('s') || /(ss|us|is)$/.test(word)) return word;
  if (/(sses|ches|shes|xes|zes)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`;
  return word.slice(0, -1);
};

const analyze = (message) => {
  const normalized = normalize(message);
  const words = normalized ? normalized.split(' ').map((word) => SHORTHAND[word] || word) : [];
  const text = words.join(' ');
  return {
    text,
    words,
    padded: ` ${text} `,
    // Lets the phrase "my course" match "my courses"
    singularPadded: ` ${words.map(singular).join(' ')} `,
    tokens: new Set(words.flatMap((word) => [word, singular(word)])),
  };
};

const singularPhrase = (phrase) => phrase.split(' ').map(singular).join(' ');

// Korean attaches particles to words (출석률이), so Hangul keywords match as substrings;
// phrases match on word boundaries and single words match whole tokens.
const matchesKeyword = (input, keyword) => {
  if (HANGUL.test(keyword)) {
    return input.text.includes(keyword);
  }
  if (keyword.includes(' ')) {
    return input.padded.includes(` ${keyword} `) || input.singularPadded.includes(` ${singularPhrase(keyword)} `);
  }
  return input.tokens.has(keyword);
};

const matchesAny = (input, keywords) => keywords.some((keyword) => matchesKeyword(input, keyword));

// Optimal string alignment distance: insertions, deletions, substitutions and swaps
const editDistance = (a, b) => {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j += 1) rows[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
      }
    }
  }
  return rows[a.length][b.length];
};

// Typos such as "attendence" or "certifcate": a word that starts with the same letter
// may be one edit away from a core term (two edits for terms of nine letters or more).
const matchesWithTypo = (input, term) => {
  const allowed = term.length >= 9 ? 2 : 1;
  return input.words.some((word) => {
    const candidate = singular(word);
    return candidate.length >= 5
      && candidate[0] === term[0]
      && Math.abs(candidate.length - term.length) <= allowed
      && editDistance(candidate, term) <= allowed;
  });
};

// Topical intents, ordered so that on equal scores the earlier (more specific) one wins.
// `core` lists the intent's own domain terms: they outweigh generic words such as
// "when" or "due", and they still match when misspelled.
const TOPICAL_INTENTS = [
  {
    name: 'account',
    keywords: ['password', 'forgot', 'reset', 'login', 'log in', 'sign in', 'signin', 'sign out', 'logout', 'account', 'otp', 'verification code', 'locked out', 'google sign in', 'cant log in', 'cannot log in', '비밀번호', '로그인'],
    core: ['password', 'account', 'login'],
  },
  {
    name: 'attendance',
    keywords: ['attendance', 'attend', 'attended', 'present', 'absent', 'absence', 'absences', 'late', 'excused', 'mark attendance', 'attendance rate', '출석', '결석'],
    core: ['attendance'],
  },
  {
    name: 'assignments',
    keywords: ['assignment', 'homework', 'submit', 'submission', 'submitted', 'resubmit', 'deadline', 'grade', 'graded', 'grading', 'my marks', 'my score', 'my result', '과제', '숙제', '제출'],
    core: ['assignment', 'homework', 'submission'],
  },
  {
    name: 'materials',
    keywords: ['video', 'lecture', 'material', 'pdf', 'download', 'notes', 'slides', 'recording', 'watch', 'free preview', 'preview', 'locked', 'classroom', 'study material', 'lesson video', 'not playing', '영상', '자료'],
    core: ['video', 'lecture', 'material', 'recording', 'classroom'],
  },
  { name: 'myCourses', keywords: ['my course', 'my class', 'enrolled', 'my progress', 'progress', 'continue learning', 'my lesson', 'my learning', 'my dashboard', 'dashboard'] },
  {
    name: 'certificate',
    keywords: ['certificate', 'certification', 'certified', 'diploma', '수료증'],
    core: ['certificate'],
  },
  {
    name: 'notifications',
    keywords: ['notification', 'alert', 'unread', 'bell', 'inbox', 'reminder', '알림'],
    core: ['notification'],
  },
  {
    name: 'profile',
    keywords: ['profile', 'avatar', 'profile picture', 'profile photo', 'my photo', 'my picture', 'my name', 'my details', 'personal details', 'update my', 'change my', 'settings', 'privacy', 'delete my account', 'close my account', '프로필'],
    core: ['profile', 'avatar'],
  },
  {
    name: 'forum',
    keywords: ['forum', 'discussion', 'community', 'classmates', 'ask other students', '토론'],
    core: ['forum', 'discussion'],
  },
  {
    name: 'events',
    keywords: ['event', 'workshop', 'seminar', 'webinar', 'meetup', 'register interest', 'celebration', '행사', '이벤트'],
    core: ['event', 'workshop', 'seminar'],
  },
  {
    name: 'announcements',
    keywords: ['announcement', 'news', 'notice', 'whats new', 'latest update', '공지'],
    core: ['announcement'],
  },
  {
    name: 'payment',
    keywords: ['pay', 'paying', 'payment', 'card', 'credit card', 'debit card', 'visa', 'mastercard', 'stripe', 'checkout', 'bank transfer', 'receipt', 'refund', 'money back', 'invoice', 'payment failed', 'declined', '결제', '환불'],
    core: ['payment', 'refund', 'receipt', 'invoice'],
  },
  {
    name: 'pricing',
    keywords: ['price', 'pricing', 'cost', 'fee', 'how much', 'expensive', 'cheap', 'cheapest', 'free', 'lkr', 'rupees', 'tuition', 'discount', 'subscription', 'subscribe', 'monthly', 'installment', '가격', '비용', '수강료'],
    core: ['price', 'pricing', 'fee', 'tuition'],
  },
  {
    name: 'enroll',
    keywords: ['enroll', 'enrol', 'enrolling', 'enrollment', 'enrolment', 'register', 'registration', 'sign up', 'signup', 'join', 'apply', 'application', 'admission', 'get started', 'create an account', '등록', '신청', '가입'],
    core: ['enroll', 'enrol', 'enrollment', 'registration', 'register'],
  },
  {
    name: 'schedule',
    keywords: ['schedule', 'timetable', 'timing', 'when', 'duration', 'how long', 'weeks', 'batch', 'intake', 'weekend', 'weekday', 'start date', 'class time', 'evening class', 'night class', 'morning class', 'weekend class', '일정', '시간표'],
    core: ['schedule', 'timetable'],
  },
  {
    name: 'contact',
    keywords: ['contact', 'phone', 'call', 'telephone', 'email', 'mail', 'address', 'location', 'located', 'where', 'office', 'visit', 'whatsapp', 'reach', 'office hours', 'opening hours', 'talk to', 'human', 'staff', 'map', 'directions', '연락', '주소', '전화'],
    core: ['contact', 'address', 'location', 'phone', 'email'],
  },
  {
    name: 'policies',
    keywords: ['privacy policy', 'terms', 'terms of service', 'terms and conditions', 'policy', 'policies'],
  },
  {
    name: 'support',
    keywords: ['not working', 'doesnt work', 'does not work', 'error', 'problem', 'issue', 'bug', 'broken', 'crash', 'slow', 'not loading', 'blank page', 'stuck', 'trouble', 'technical support', 'something went wrong'],
  },
  {
    name: 'koreanBasics',
    keywords: ['korean basics', 'korean language basics', 'hangul', 'hangeul', 'alphabet', 'letters', 'consonant', 'vowel', 'pronunciation', 'pronounce', 'batchim', 'honorific', 'formal', 'informal', 'polite', 'politeness', 'speech level', 'banmal', 'jondaetmal', 'phrase', 'how do you say', 'how to say', 'in korean', 'korean numbers', 'numbers', 'counting', 'particle', 'self introduction', 'introduce myself', 'topik', 'eps topik', 'exam', '한글', '존댓말', '반말', '발음', '받침', '숫자', '조사', '자기소개'],
    core: ['hangul', 'alphabet', 'pronunciation', 'honorific', 'topik'],
  },
  {
    name: 'courses',
    keywords: ['course', 'class', 'program', 'programme', 'curriculum', 'lesson', 'syllabus', 'beginner', 'intermediate', 'advanced', 'level', 'offer', 'catalog', 'learn korean', 'study korean', 'learning korean', '강좌', '강의', '수업', '과정'],
    core: ['course', 'curriculum', 'syllabus'],
  },
  {
    name: 'about',
    keywords: ['about you', 'about sri ko', 'about sriko', 'about the institute', 'about your institute', 'about us', 'what is sri ko', 'what is sriko', 'who owns', 'institute', 'institution', 'teacher', 'instructor', 'lecturer', 'tutor', 'who teaches', 'nandana', 'kekulawala', 'mission', 'vision', 'why choose', 'physical class', 'online class', 'in person', 'face to face', 'centre', 'center'],
    core: ['institute', 'instructor', 'teacher'],
  },
];

// Social intents only answer when nothing topical matched, in this order, so
// "what can you tell me about fees?" is answered as a fees question.
const CAPABILITY_PATTERNS = [
  /\b(what|which)\b.*\b(can|could|do|will)\b.*\byou\b.*\b(do|help|answer|offer|tell|support|handle|provide|know)\b/,
  /\bwhat\s+is\s+this\b/,
  /\bwhat\b.*\byou\b.*\b(can|could)\b.*\b(do|help|answer)\b/,
  /\bhow\b.*\b(can|could|do|will|would)\b.*\byou\b.*\b(help|assist|work)\b/,
  /\bwhat\b.*\b(can|could|should)\b.*\bi\b.*\bask\b/,
  /\b(who|what)\s+are\s+you\b/,
  /\bare\s+you\s+(a\s+|an\s+)?(bot|robot|human|real|person|ai|chatbot|machine)\b/,
  /\b(introduce|tell\s+me\s+about)\s+yourself\b/,
  /\bhow\b.*\b(does|do)\b.*\b(this|it|you)\b.*\bwork\b/,
  /\byour\s+(features|capabilities|abilities|skills|functions|services)\b/,
];

const SOCIAL_INTENTS = [
  { name: 'capabilities', keywords: ['help', 'menu', 'options', 'features', 'capabilities', 'abilities', 'commands', 'what can you do', '도와줘', '도와주세요'], patterns: CAPABILITY_PATTERNS },
  { name: 'thanks', keywords: ['thanks', 'thank', 'appreciate', 'appreciated', '감사', '고마워', '고맙습니다'] },
  { name: 'goodbye', keywords: ['bye', 'goodbye', 'see you', 'see ya', 'good night', '안녕히'] },
  { name: 'greeting', keywords: ['hi', 'hello', 'hey', 'hiya', 'howdy', 'good morning', 'good afternoon', 'good evening', 'annyeong', 'annyeonghaseyo', '안녕하세요'] },
];

// "courses" already matches the keyword "course" (tokens include singular forms),
// so drop listed plurals to avoid scoring the same word twice.
[...TOPICAL_INTENTS, ...SOCIAL_INTENTS].forEach((intent) => {
  intent.keywords = intent.keywords.filter((keyword) => {
    const base = singularPhrase(keyword);
    return base === keyword || !intent.keywords.includes(base);
  });
});

// A phrase scores 2, a core term 1.5, any other keyword 1 and a misspelled core term 0.75
const scoreIntent = (input, intent) => {
  const core = intent.core || [];
  let score = 0;
  intent.keywords.forEach((keyword) => {
    if (matchesKeyword(input, keyword)) {
      score += keyword.includes(' ') ? 2 : core.includes(keyword) ? 1.5 : 1;
    }
  });
  core.forEach((term) => {
    if (!input.tokens.has(term) && matchesWithTypo(input, term)) score += 0.75;
  });
  if ((intent.patterns || []).some((pattern) => pattern.test(input.text))) score += 2;
  return score;
};

const rankIntents = (input) => {
  const topical = TOPICAL_INTENTS
    .map((intent, index) => ({ name: intent.name, score: scoreIntent(input, intent), index }))
    .filter((intent) => intent.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const social = SOCIAL_INTENTS.filter((intent) => scoreIntent(input, intent) > 0).map((intent) => intent.name);
  return { topical, social };
};

// Intents that can be about one specific course
const COURSE_AWARE_INTENTS = new Set(['courses', 'pricing', 'enroll', 'schedule', 'payment', 'materials', 'fallback']);
// Follow-ups ("how much is it?") reuse the course from the previous answer
const FOLLOW_UP_INTENTS = new Set(['pricing', 'enroll', 'schedule', 'payment']);
const REFERRING_WORDS = ['it', 'this', 'that', 'more', 'details', 'detail'];

// Ignored when fuzzy-matching course titles: filler words, plus level/category words
// so "beginner courses" lists every beginner course instead of one titled "...for Beginners".
const TITLE_STOP_WORDS = new Set([
  'korean', 'course', 'class', 'the', 'and', 'for', 'of', 'to', 'in', 'with', 'level', 'program', 'programme', 'language',
  'beginner', 'beginners', 'basic', 'basics', 'intermediate', 'advanced',
  'business', 'grammar', 'conversation', 'culture', 'literature',
]);

const findMentionedCourse = (input, courses) => {
  let best = null;

  for (const course of courses) {
    const title = normalize(course.title);
    if (!title) continue;

    const shortTitle = title.replace(/^korean /, '');
    if (input.padded.includes(` ${title} `) || (shortTitle.includes(' ') && input.padded.includes(` ${shortTitle} `))) {
      return course;
    }

    const significant = title
      .split(' ')
      .filter((word) => word.length >= 3 && !TITLE_STOP_WORDS.has(word) && /\p{L}/u.test(word));
    if (significant.length === 0) continue;

    const hits = significant.filter((word) => input.tokens.has(word) || input.tokens.has(singular(word)));
    const score = hits.length / significant.length;
    if (hits.some((word) => word.length >= 4) && score >= 0.5 && (!best || score > best.score)) {
      best = { course, score };
    }
  }

  return best?.course || null;
};

const detectLevel = (input) => Object.keys(LEVEL_SYNONYMS)
  .find((level) => LEVEL_SYNONYMS[level].some((word) => input.tokens.has(word))) || null;

const detectCategory = (input) => Object.keys(CATEGORY_SYNONYMS)
  .find((category) => CATEGORY_SYNONYMS[category].some((word) => input.tokens.has(word))) || null;

// ─── Formatting helpers ───────────────────────────────────────────────────────

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

const formatFee = (price) => (Number(price) > 0 ? `LKR ${Number(price).toLocaleString('en-US')}` : 'Free');

const lessonCount = (course) => (course.curriculum || [])
  .reduce((total, week) => total + (week.lessons?.length || 0), 0);

const truncate = (text = '', length = 220) => {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  return clean.length > length ? `${clean.slice(0, length - 1).trimEnd()}…` : clean;
};

const courseLine = (course) => {
  const details = [
    LEVEL_LABELS[course.level],
    course.duration ? plural(course.duration, 'week') : null,
    formatFee(course.price),
  ].filter(Boolean);
  return `• ${course.title} — ${details.join(' · ')}`;
};

const formatDay = (date) => date.toLocaleDateString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
});

const formatDate = (date, timeZone) => new Date(date).toLocaleDateString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', timeZone,
});

const capitalize = (text = '') => text.charAt(0).toUpperCase() + text.slice(1);

const classroomLink = (courseId) => ({ label: 'Open classroom', to: `/course-info/${courseId}` });

// ─── Data access (lazy, once per message) ─────────────────────────────────────

const createDataLoader = (user) => {
  const cache = new Map();
  // Cache the result promise, not the Mongoose query: awaiting a query twice re-runs it
  const once = (key, load) => {
    if (!cache.has(key)) {
      const pending = load();
      cache.set(key, typeof pending?.exec === 'function' ? pending.exec() : pending);
    }
    return cache.get(key);
  };

  return {
    courses: () => once('courses', () => Course.find({ isPublished: true })
      .select('title description level category price duration averageRating tags curriculum.lessons._id')
      .sort({ createdAt: -1 })
      .lean()),
    settings: () => once('settings', () => Settings.findOne()
      .select('contactEmail contactPhone contactAddress systemSettings.timezone')
      .lean()),
    // Enrolment is recorded on the user, on the course and as a Progress document
    enrolledCourseIds: () => once('enrolledCourseIds', async () => {
      if (!user) return [];
      const [onCourses, withProgress] = await Promise.all([
        Course.distinct('_id', { enrolledStudents: user._id }),
        Progress.distinct('course', { student: user._id }),
      ]);
      const ids = new Map();
      [...(user.enrolledCourses || []), ...onCourses, ...withProgress]
        .filter(Boolean)
        .forEach((id) => ids.set(String(id._id || id), id._id || id));
      return [...ids.values()];
    }),
  };
};

// The timezone comes from admin Settings, so fall back if it isn't a valid IANA name.
const safeTimeZone = (timeZone) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return timeZone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
};

const contactDetails = async (data) => {
  const settings = await data.settings();
  return {
    phone: settings?.contactPhone || SITE_CONTACT.phone,
    email: settings?.contactEmail || SITE_CONTACT.email,
    address: settings?.contactAddress || SITE_CONTACT.address,
    hasCustomEmail: Boolean(settings?.contactEmail),
    timezone: safeTimeZone(settings?.systemSettings?.timezone || DEFAULT_TIMEZONE),
  };
};

// ─── Answers ──────────────────────────────────────────────────────────────────

const courseDetail = (course, closing = 'Open the course page to see the full curriculum and enroll.') => {
  const lessons = lessonCount(course);
  const facts = [
    course.level && `Level: ${LEVEL_LABELS[course.level]}`,
    course.category && `Category: ${course.category}`,
    course.duration && `Duration: ${plural(course.duration, 'week')}`,
    lessons && `Lessons: ${lessons}`,
    `Fee: ${formatFee(course.price)}`,
    course.averageRating > 0 && `Rating: ${course.averageRating.toFixed(1)} / 5`,
  ].filter(Boolean);

  return {
    text: [course.title, truncate(course.description), facts.map((fact) => `• ${fact}`).join('\n'), closing]
      .filter(Boolean)
      .join('\n\n'),
    links: [{ label: 'View course', to: `/courses/${course._id}` }],
    suggestions: ['How do I enroll?', 'What payment methods do you accept?', 'Show all courses'],
    meta: { courseId: String(course._id) },
  };
};

const NO_COURSES_REPLY = {
  text: "Our course catalog is being updated, so there are no open courses to show right now. Contact us and we'll let you know when the next intake opens.",
  links: [{ label: 'Contact us', to: '/contact' }],
  suggestions: ['Contact details', 'Korean basics'],
};

const filterCourses = (courses, input) => {
  const level = detectLevel(input);
  const category = detectCategory(input);
  const matching = courses.filter((course) => (!level || course.level === level) && (!category || course.category === category));
  const label = [level && LEVEL_LABELS[level], category].filter(Boolean).join(' ');
  return { matching, label };
};

const KOREAN_TOPICS = [
  {
    key: 'hangul',
    suggestion: 'Explain Hangul',
    keywords: ['hangul', 'hangeul', 'alphabet', 'letters', 'consonant', 'consonants', 'vowel', 'vowels', '한글'],
    text: 'Hangul (한글) is the Korean alphabet, created under King Sejong the Great and published in 1446.\n\n'
      + '• 14 basic consonants: ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ\n'
      + '• 10 basic vowels: ㅏ ㅑ ㅓ ㅕ ㅗ ㅛ ㅜ ㅠ ㅡ ㅣ\n'
      + '• Letters combine into syllable blocks: 한 = ㅎ + ㅏ + ㄴ\n\n'
      + 'Most learners can read Hangul within a few days of practice — it is the first step in our beginner courses.',
  },
  {
    key: 'batchim',
    suggestion: 'What is batchim?',
    keywords: ['batchim', 'pronunciation', 'pronounce', 'final consonant', '받침', '발음'],
    text: 'Batchim (받침) is the final consonant at the bottom of a syllable block, as in 한 or 국.\n\n'
      + '• Only 7 sounds are pronounced in final position: ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅇ — so 옷 (clothes) ends in a "t" sound.\n'
      + '• When the next syllable starts with ㅇ, the batchim moves over (연음): 한국어 is read [한구거].',
  },
  {
    key: 'honorifics',
    suggestion: 'Formal vs informal Korean',
    keywords: ['honorific', 'honorifics', 'formal', 'informal', 'polite', 'politeness', 'speech level', 'speech levels', 'banmal', 'jondaetmal', '존댓말', '반말'],
    text: 'Korean shows politeness through verb endings (speech levels):\n\n'
      + '• Formal polite (합쇼체): -습니다 / -ㅂ니다 — e.g. 감사합니다. Used in presentations, the news and business.\n'
      + '• Informal polite (해요체): -아요 / -어요 — e.g. 고마워요. The everyday polite style.\n'
      + '• Casual (반말): -아 / -어 — e.g. 고마워. Only with close friends or younger people.\n\n'
      + 'When in doubt, use the -요 endings — they are polite in almost every situation.',
  },
  {
    key: 'particles',
    suggestion: 'Korean particles',
    keywords: ['particle', 'particles', '조사'],
    text: 'Particles (조사) attach to a word and show its role in the sentence:\n\n'
      + '• 은 / 는 — topic: 저는 학생이에요 (I am a student)\n'
      + '• 이 / 가 — subject: 비가 와요 (It is raining)\n'
      + '• 을 / 를 — object: 사과를 먹어요 (I eat an apple)\n'
      + '• 에 — place or time: 학교에 가요 (I go to school)\n\n'
      + 'Use 은, 이 and 을 after a consonant, and 는, 가 and 를 after a vowel.',
  },
  {
    key: 'introduction',
    suggestion: 'Introduce myself in Korean',
    keywords: ['self introduction', 'introduce myself', '자기소개'],
    text: 'A simple self-introduction (자기소개):\n\n'
      + '• 안녕하세요. 저는 [name]입니다. — Hello, I am [name].\n'
      + '• 스리랑카에서 왔어요. — I am from Sri Lanka.\n'
      + '• 만나서 반갑습니다. — Nice to meet you.\n'
      + '• 잘 부탁드립니다. — I look forward to working with you.',
  },
  {
    key: 'numbers',
    suggestion: 'Korean numbers',
    keywords: ['numbers', 'korean numbers', 'counting', '숫자'],
    text: 'Korean uses two number systems:\n\n'
      + '• Native Korean — 하나, 둘, 셋, 넷, 다섯 (1–5): for counting things, age and hours (세 시 = 3 o\'clock).\n'
      + '• Sino-Korean — 일, 이, 삼, 사, 오 (1–5): for dates, money, minutes and phone numbers (삼십 분 = 30 minutes).',
  },
  {
    key: 'topik',
    suggestion: 'What is TOPIK?',
    keywords: ['topik', 'eps topik', 'exam', '시험'],
    text: 'TOPIK (Test of Proficiency in Korean) is the official Korean language exam:\n\n'
      + '• TOPIK I — levels 1–2, with listening and reading sections.\n'
      + '• TOPIK II — levels 3–6, with listening, writing and reading sections.\n'
      + '• EPS-TOPIK is a separate test for the Employment Permit System, needed to work in Korea through the EPS programme.',
  },
  {
    key: 'phrases',
    suggestion: 'Common Korean phrases',
    keywords: ['phrase', 'phrases', 'how do you say', 'how to say', 'in korean'],
    text: 'Useful everyday Korean phrases:\n\n'
      + '• 안녕하세요 (annyeonghaseyo) — Hello\n'
      + '• 감사합니다 (gamsahamnida) — Thank you\n'
      + '• 죄송합니다 (joesonghamnida) — I\'m sorry\n'
      + '• 네 / 아니요 (ne / aniyo) — Yes / No\n'
      + '• 처음 뵙겠습니다 (cheoeum boepgetseumnida) — Nice to meet you\n'
      + '• 안녕히 가세요 (annyeonghi gaseyo) — Goodbye (to someone leaving)\n'
      + '• 안녕히 계세요 (annyeonghi gyeseyo) — Goodbye (when you are the one leaving)',
  },
];

const ABOUT_TEXT = [
  'SRI-KO Foreign Language Training Center is a Korean language centre in Sri Lanka.',
  '• Mission: world-class Korean language training that opens doors to careers and education in South Korea.',
  '• Lead instructor: Mr. Nandana Kekulawala, who has years of expertise in Korean linguistics and cross-cultural communication.',
  '• Courses run from Beginner to Advanced, with a focus on real-life dialogue, exam preparation and mentorship for every student.',
  '• Lessons, materials, assignments and attendance are all on this platform. For class times and sessions at our centre, contact us.',
];

const RESPONDERS = {
  async courses(ctx) {
    if (ctx.course) {
      return courseDetail(ctx.course);
    }

    const courses = await ctx.data.courses();
    if (courses.length === 0) {
      return NO_COURSES_REPLY;
    }

    const { matching, label } = filterCourses(courses, ctx.input);
    let intro = `We currently offer ${plural(courses.length, 'course')}:`;
    let list = courses;
    if (label && matching.length > 0) {
      intro = `Here ${matching.length === 1 ? 'is our' : 'are our'} ${label} course${matching.length === 1 ? '' : 's'}:`;
      list = matching;
    } else if (label) {
      intro = `We don't have a ${label} course open right now. Here's everything we offer:`;
    }

    const shown = list.slice(0, 6);
    const more = list.length > shown.length ? `\n…and ${list.length - shown.length} more on the Courses page.` : '';

    return {
      text: `${intro}\n${shown.map(courseLine).join('\n')}${more}\n\nOpen a course to see its curriculum and enroll.`,
      links: [{ label: 'Browse all courses', to: '/courses' }],
      suggestions: ['How do I enroll?', 'What payment methods do you accept?', label ? 'Show all courses' : 'Beginner courses'],
      meta: shown.length === 1 ? { courseId: String(shown[0]._id) } : {},
    };
  },

  async pricing(ctx) {
    if (ctx.course) {
      const { course } = ctx;
      return {
        text: Number(course.price) > 0
          ? `${course.title} costs ${formatFee(course.price)} — a one-time payment for the full course.\n\nPay securely by card at checkout and you're enrolled immediately.`
          : `${course.title} is free — you can enroll at no cost.`,
        links: [{ label: 'View course', to: `/courses/${course._id}` }],
        suggestions: ['How do I enroll?', 'What payment methods do you accept?', 'Do you offer refunds?'],
        meta: { courseId: String(course._id) },
      };
    }

    const courses = await ctx.data.courses();
    if (courses.length === 0) {
      return NO_COURSES_REPLY;
    }

    const { matching, label } = filterCourses(courses, ctx.input);
    const list = label && matching.length > 0 ? matching : courses;
    const paid = list.filter((course) => Number(course.price) > 0).map((course) => Number(course.price));
    const freeCount = list.length - paid.length;

    const summary = [];
    if (paid.length > 0) {
      const min = Math.min(...paid);
      const max = Math.max(...paid);
      summary.push(min === max
        ? `${label ? `${label} courses` : 'Our paid courses'} cost ${formatFee(min)}.`
        : `${label ? `${label} course` : 'Course'} fees range from ${formatFee(min)} to ${formatFee(max)}.`);
    }
    if (freeCount > 0) {
      summary.push(`${plural(freeCount, 'course')} ${freeCount === 1 ? 'is' : 'are'} free.`);
    }

    const shown = list.slice(0, 6);
    return {
      text: `${summary.join(' ')}\n${shown.map(courseLine).join('\n')}\n\nFees are in Sri Lankan Rupees (LKR) and paid once per course — there is no monthly subscription.`,
      links: [{ label: 'Browse all courses', to: '/courses' }],
      suggestions: ['What payment methods do you accept?', 'How do I enroll?', 'Do you offer refunds?'],
      meta: shown.length === 1 ? { courseId: String(shown[0]._id) } : {},
    };
  },

  async payment(ctx) {
    const lines = [
      ctx.course ? `${ctx.course.title} costs ${formatFee(ctx.course.price)}. Here's how payment works:` : "Here's how payment works:",
      '• Open a course and click Enroll — paid courses go to a secure checkout.',
      '• Pay by credit or debit card; payments are processed securely by Stripe.',
      "• You're enrolled immediately and receive a receipt and a confirmation notification.",
      '• Free courses enroll instantly with no payment.',
      '',
      'Prefer a bank transfer or paying at our office? Contact us and our team will record the payment for you.',
    ];

    if (matchesAny(ctx.input, ['failed', 'declined', 'payment failed', 'not working', 'error'])) {
      lines.push('', "If a card payment fails or is declined, check the card details or try another card — you're only charged when the payment succeeds.");
    }

    if (matchesAny(ctx.input, ['refund', 'refunds', 'money back', '환불'])) {
      lines.push('', "Refunds: we offer a 14-day money-back guarantee on eligible full-course enrollments if you've completed less than 20% of the lessons. Send your request in writing through the Help Center; see our Terms of Service for the details.");
    }

    return {
      text: lines.join('\n'),
      links: [
        ctx.course ? { label: 'View course', to: `/courses/${ctx.course._id}` } : { label: 'Browse courses', to: '/courses' },
        { label: 'Payment & refund terms', to: '/terms' },
      ],
      suggestions: ['How much are the courses?', 'How do I enroll?', 'Contact details'],
      meta: ctx.course ? { courseId: String(ctx.course._id) } : {},
    };
  },

  async enroll(ctx) {
    if (ctx.user?.role === 'instructor') {
      return {
        text: 'Instructor accounts teach courses rather than enroll in them. To study a course yourself, sign in with a student account.',
        links: [{ label: 'Browse courses', to: '/courses' }],
      };
    }

    const steps = [];
    if (!ctx.user) steps.push('Create a free account (or sign in with Google).');
    steps.push(ctx.course ? `Open the ${ctx.course.title} course page.` : 'Browse the Courses page and open the course you want.');
    steps.push('Click Enroll — free courses start right away; paid courses go to a secure card checkout.');
    steps.push('Find the course under My Courses and start learning.');

    const intro = ctx.course
      ? `To enroll in ${ctx.course.title} (${formatFee(ctx.course.price)}):`
      : 'Enrolling only takes a few minutes:';

    const links = [];
    if (!ctx.user) links.push({ label: 'Create an account', to: '/register' });
    links.push(ctx.course ? { label: 'View course', to: `/courses/${ctx.course._id}` } : { label: 'Browse courses', to: '/courses' });
    links.push({ label: 'Ask for a recommendation', to: '/contact' });

    return {
      text: `${intro}\n${steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}\n\nNot sure which level suits you? Send us a message through the Contact Us form and our team will recommend a course.`,
      links,
      suggestions: ['How much are the courses?', 'What payment methods do you accept?', 'What courses do you offer?'],
      meta: ctx.course ? { courseId: String(ctx.course._id) } : {},
    };
  },

  async schedule(ctx) {
    const lines = [];

    if (ctx.course) {
      const lessons = lessonCount(ctx.course);
      lines.push(`${ctx.course.title} runs for ${plural(ctx.course.duration || 0, 'week')}${lessons ? ` with ${plural(lessons, 'lesson')}` : ''}.`);
    } else {
      const durations = (await ctx.data.courses()).map((course) => Number(course.duration)).filter((weeks) => weeks > 0);
      if (durations.length > 0) {
        const min = Math.min(...durations);
        const max = Math.max(...durations);
        lines.push(min === max ? `Our courses run for ${plural(min, 'week')}.` : `Our courses run for ${min} to ${max} weeks, depending on the course.`);
      }
    }

    lines.push('Each course page shows its duration and lesson plan, and you can study the lessons online at your own pace. Class times for each intake are confirmed by our team when you enroll — contact us if you need a particular time slot.');

    const { phone } = await contactDetails(ctx.data);
    lines.push(`Call ${phone} (${SITE_CONTACT.hours}) to ask about upcoming intakes.`);

    return {
      text: lines.join('\n\n'),
      links: [
        ctx.course ? { label: 'View course', to: `/courses/${ctx.course._id}` } : { label: 'Browse courses', to: '/courses' },
        { label: 'Contact us', to: '/contact' },
      ],
      suggestions: ['Upcoming events', 'How do I enroll?', 'Contact details'],
      meta: ctx.course ? { courseId: String(ctx.course._id) } : {},
    };
  },

  async myCourses(ctx) {
    if (!ctx.user) {
      return {
        text: 'Sign in to see the courses you are enrolled in and your progress in each one.',
        links: [{ label: 'Sign in', to: '/login' }, { label: 'Browse courses', to: '/courses' }],
        suggestions: ['What courses do you offer?', 'How do I enroll?'],
      };
    }

    const courseIds = await ctx.data.enrolledCourseIds();
    const [courses, progress] = await Promise.all([
      Course.find({ _id: { $in: courseIds } }).select('title').lean(),
      Progress.find({ student: ctx.user._id }).select('course overallProgress isCompleted').lean(),
    ]);

    if (courses.length === 0) {
      return {
        text: "You're not enrolled in any courses yet. Browse the catalog to find one that fits your level.",
        links: [{ label: 'Browse courses', to: '/courses' }],
        suggestions: ['What courses do you offer?', 'How do I enroll?'],
      };
    }

    const progressByCourse = new Map(progress.map((entry) => [String(entry.course), entry]));
    const lines = courses.map((course) => {
      const entry = progressByCourse.get(String(course._id));
      if (entry?.isCompleted) return `• ${course.title} — completed`;
      return `• ${course.title} — ${Math.round(entry?.overallProgress || 0)}% complete`;
    });

    return {
      text: `You're enrolled in ${plural(courses.length, 'course')}:\n${lines.join('\n')}\n\nPick up where you left off from My Courses.`,
      links: [{ label: 'My courses', to: '/my-courses' }, { label: 'Dashboard', to: '/dashboard' }],
      suggestions: ['My assignments', 'My attendance', 'Do I have certificates?'],
    };
  },

  async assignments(ctx) {
    const howTo = 'To submit, open the course classroom, choose the assignment and upload your work (up to 5 files, 50 MB each). Work handed in after the due date is marked late, and you get a notification when it has been graded.';

    if (!ctx.user) {
      return {
        text: `Each course has assignments set by our instructors, with a due date and a maximum score.\n\n${howTo}\n\nSign in to see your own assignments and grades.`,
        links: [{ label: 'Sign in', to: '/login' }, { label: 'Browse courses', to: '/courses' }],
        suggestions: ['How do I enroll?', 'What courses do you offer?'],
      };
    }

    const courseIds = await ctx.data.enrolledCourseIds();
    if (courseIds.length === 0) {
      return {
        text: "You're not enrolled in a course yet, so you have no assignments. Once you enroll, they appear in the course classroom.",
        links: [{ label: 'Browse courses', to: '/courses' }],
        suggestions: ['What courses do you offer?', 'How do I enroll?'],
      };
    }

    const assignments = await Assignment.find({ course: { $in: courseIds } })
      .select('title dueDate maxScore course')
      .populate('course', 'title')
      .sort({ dueDate: 1, createdAt: 1 })
      .lean();

    if (assignments.length === 0) {
      return {
        text: `Your courses don't have any assignments yet. New ones appear in the course classroom, and you'll get a notification.\n\n${howTo}`,
        links: [classroomLink(courseIds[0]), { label: 'My courses', to: '/my-courses' }],
        suggestions: ['My courses and progress', 'My attendance'],
      };
    }

    const submissions = await AssignmentSubmission.find({
      student: ctx.user._id,
      assignment: { $in: assignments.map((assignment) => assignment._id) },
    }).select('assignment status grade').lean();
    const submissionFor = new Map(submissions.map((submission) => [String(submission.assignment), submission]));

    const { timezone } = await contactDetails(ctx.data);
    const now = new Date();
    const groups = { toDo: [], overdue: [], waiting: [], graded: [] };
    // Name the course only when the assignments come from more than one
    const severalCourses = new Set(assignments.map((assignment) => String(assignment.course?._id))).size > 1;

    assignments.forEach((assignment) => {
      const submission = submissionFor.get(String(assignment._id));
      const course = severalCourses && assignment.course?.title ? ` (${assignment.course.title})` : '';
      const due = assignment.dueDate ? new Date(assignment.dueDate) : null;

      if (submission?.status === 'graded') {
        const score = typeof submission.grade === 'number' ? `${submission.grade}/${assignment.maxScore}` : 'graded';
        groups.graded.push(`• ${assignment.title}${course} — graded: ${score}`);
      } else if (submission?.status === 'resubmit') {
        groups.toDo.push(`• ${assignment.title}${course} — resubmission requested`);
      } else if (submission) {
        groups.waiting.push(`• ${assignment.title}${course} — submitted${submission.status === 'late' ? ' late' : ''}, waiting for a grade`);
      } else if (due && due < now) {
        groups.overdue.push(`• ${assignment.title}${course} — overdue since ${formatDate(due, timezone)}`);
      } else {
        groups.toDo.push(`• ${assignment.title}${course} — ${due ? `due ${formatDate(due, timezone)}` : 'no due date'}`);
      }
    });

    const counts = [
      groups.toDo.length && `${groups.toDo.length} to do`,
      groups.overdue.length && `${groups.overdue.length} overdue`,
      groups.waiting.length && `${groups.waiting.length} waiting for a grade`,
      groups.graded.length && `${groups.graded.length} graded`,
    ].filter(Boolean);
    const lines = [...groups.toDo, ...groups.overdue, ...groups.waiting, ...groups.graded.reverse()];
    const shown = lines.slice(0, 6);
    const more = lines.length > shown.length ? `\n…and ${lines.length - shown.length} more in your course classrooms.` : '';

    return {
      text: `You have ${plural(assignments.length, 'assignment')}: ${counts.join(', ')}.\n${shown.join('\n')}${more}\n\n${howTo}`,
      links: [classroomLink(courseIds[0]), { label: 'My courses', to: '/my-courses' }],
      suggestions: ['My courses and progress', 'My attendance', 'My notifications'],
    };
  },

  async materials(ctx) {
    const access = 'Lessons marked as free previews are open to everyone on the course page; the full lessons, PDFs and links unlock when you enroll.';
    const playback = "If a video won't play, refresh the page or check your connection — contact us if it still doesn't work.";

    if (ctx.course) {
      return {
        text: `${ctx.course.title} has its lesson videos, PDFs and links organised week by week. ${access}\n\n${playback}`,
        links: [{ label: 'View course', to: `/courses/${ctx.course._id}` }],
        suggestions: ['How do I enroll?', 'How much are the courses?'],
        meta: { courseId: String(ctx.course._id) },
      };
    }

    const courseIds = ctx.user ? await ctx.data.enrolledCourseIds() : [];
    if (courseIds.length === 0) {
      return {
        text: `Every course has lesson videos, PDFs and links organised week by week. ${access}\n\n${ctx.user ? 'Enroll in a course to open its classroom.' : 'Sign in and enroll to open the classroom.'}`,
        links: ctx.user
          ? [{ label: 'Browse courses', to: '/courses' }]
          : [{ label: 'Browse courses', to: '/courses' }, { label: 'Sign in', to: '/login' }],
        suggestions: ['What courses do you offer?', 'How do I enroll?'],
      };
    }

    const [courses, counts] = await Promise.all([
      Course.find({ _id: { $in: courseIds } }).select('title').lean(),
      LectureMaterial.aggregate([
        { $match: { course: { $in: courseIds } } },
        { $group: { _id: '$course', count: { $sum: 1 } } },
      ]),
    ]);
    const countFor = new Map(counts.map((entry) => [String(entry._id), entry.count]));
    const lines = courses.slice(0, 6).map((course) => `• ${course.title} — ${plural(countFor.get(String(course._id)) || 0, 'learning material')}`);

    return {
      text: `Your lesson videos and materials are in each course classroom:\n${lines.join('\n')}\n\nOpen a course from My Courses to watch the lessons and download the files.\n\n${playback}`,
      links: [classroomLink(courses[0]?._id || courseIds[0]), { label: 'My courses', to: '/my-courses' }],
      suggestions: ['My assignments', 'My courses and progress'],
    };
  },

  async attendance(ctx) {
    if (!ctx.user) {
      return {
        text: 'Attendance is tracked for enrolled students. After signing in, open your Profile and click any date on the attendance calendar to mark yourself present, late, excused or absent. Your attendance rate updates straight away.',
        links: [{ label: 'Sign in', to: '/login' }, { label: 'Create an account', to: '/register' }],
        suggestions: ['How do I enroll?', 'What courses do you offer?'],
      };
    }

    const records = await Attendance.find({ student: ctx.user._id })
      .select('status date course')
      .sort({ date: -1 })
      .populate('course', 'title')
      .lean();

    if (records.length === 0) {
      return {
        text: "You haven't recorded any attendance yet. Open your Profile, click a date on the attendance calendar, choose a status and save — it only takes a second.",
        links: [{ label: 'Open my attendance', to: '/profile' }],
        suggestions: ['My courses and progress', 'Latest announcements'],
      };
    }

    const stats = summarizeAttendance(records);
    const last = records[0];
    const lastDay = toAttendanceDay(last.date);
    const encouragement = stats.attendanceRate >= 90
      ? 'Excellent consistency — keep it up!'
      : stats.attendanceRate >= 70
        ? 'Good progress — aim for above 90% to stay on track.'
        : 'Try to attend more sessions — regular attendance makes a big difference to your progress.';

    return {
      text: [
        "Here's your attendance so far:",
        `• Attendance rate: ${stats.attendanceRate}%`,
        `• Sessions recorded: ${stats.totalSessions}`,
        `• Present ${stats.present} · Late ${stats.late} · Excused ${stats.excused} · Absent ${stats.absent}`,
        `• Last recorded: ${lastDay ? formatDay(lastDay) : '—'} (${capitalize(last.status)}${last.course?.title ? `, ${last.course.title}` : ''})`,
        '',
        encouragement,
      ].join('\n'),
      links: [{ label: 'Open my attendance', to: '/profile' }],
      suggestions: ['My courses and progress', 'My assignments', 'Do I have certificates?'],
    };
  },

  async certificate(ctx) {
    const general = "Certificates are issued by our team after you complete a course, and you'll get a notification as soon as yours is ready.";

    if (!ctx.user) {
      return {
        text: `${general} Sign in to check your certificates and course progress.`,
        links: [{ label: 'Sign in', to: '/login' }],
        suggestions: ['What courses do you offer?', 'How do I enroll?'],
      };
    }

    const [certificates, completed] = await Promise.all([
      Certificate.countDocuments({ student: ctx.user._id }),
      Progress.countDocuments({ student: ctx.user._id, isCompleted: true }),
    ]);

    const status = certificates > 0
      ? `You have ${plural(certificates, 'certificate')} — you'll find ${certificates === 1 ? 'it' : 'them'} on your dashboard.`
      : completed > 0
        ? `You've completed ${plural(completed, 'course')}; your certificate will appear on your dashboard once it's issued.`
        : "You haven't earned a certificate yet — complete all the lessons in a course to qualify.";

    return {
      text: `${general}\n\n${status}`,
      links: [{ label: 'Dashboard', to: '/dashboard' }],
      suggestions: ['My courses and progress', 'My attendance'],
    };
  },

  async notifications(ctx) {
    if (!ctx.user) {
      return {
        text: 'Notifications tell you about new assignments, grades, announcements, events and payments. Sign in to see yours — the bell at the top of the page shows how many are unread.',
        links: [{ label: 'Sign in', to: '/login' }],
        suggestions: ['What can you do?', 'Latest announcements'],
      };
    }

    // Same audience rules as GET /api/notifications/unread-count, so the answer matches the bell
    const now = new Date();
    const audience = [{ targetAudience: 'all' }, { targetUsers: ctx.user._id }];
    if (ctx.user.role) {
      audience.push({ targetAudience: `${ctx.user.role}s` }, { targetRoles: ctx.user.role });
    }
    const unread = await Notification.find({
      isActive: true,
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }],
      'readBy.user': { $ne: ctx.user._id },
      $and: [{ $or: audience }],
    })
      .sort({ createdAt: -1 })
      .select('title')
      .lean();

    const latest = unread.slice(0, 3).map((notification) => `• ${notification.title}`).join('\n');

    return {
      text: unread.length > 0
        ? `You have ${plural(unread.length, 'unread notification')}${latest ? `:\n${latest}` : '.'}\n\nOpen Notifications to read them all.`
        : "You're all caught up — you have no unread notifications.",
      links: [{ label: 'Notifications', to: '/notifications' }],
      suggestions: ['My assignments', 'Latest announcements', 'My courses and progress'],
    };
  },

  async profile(ctx) {
    const lines = [
      'You can manage your details from these pages:',
      '• Profile — your details and your attendance calendar.',
      '• Settings — update your name and details, change your profile photo and change your password.',
      '',
      'Forgot your password? Use "Forgot password?" on the sign-in page. To close your account, contact us.',
    ];

    return {
      text: lines.join('\n'),
      links: ctx.user
        ? [{ label: 'Profile', to: '/profile' }, { label: 'Settings', to: '/settings' }]
        : [{ label: 'Sign in', to: '/login' }, { label: 'Create an account', to: '/register' }],
      suggestions: ['I forgot my password', 'Contact details'],
    };
  },

  async announcements(ctx) {
    const now = new Date();
    const audience = [{ targetAudience: /^all$/i }];
    if (ctx.user?.role === 'student' || ctx.user?.role === 'instructor') {
      audience.push({ targetAudience: new RegExp(ctx.user.role, 'i') });
    }

    const announcements = await Announcement.find({
      isActive: true,
      $and: [
        { $or: audience },
        { $or: [{ startDate: { $exists: false } }, { startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: now } }] },
      ],
    })
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(3)
      .select('title createdAt isPinned')
      .lean();

    const link = ctx.user
      ? { label: 'All announcements', to: '/announcements' }
      : { label: 'Sign in to read them', to: '/login' };

    if (announcements.length === 0) {
      return {
        text: "There are no new announcements right now. We'll post updates about classes, events and exams here.",
        links: [link],
        suggestions: ['Upcoming events', 'What courses do you offer?'],
      };
    }

    const lines = announcements.map((item) => `• ${item.title}${item.isPinned ? ' (pinned)' : ''} — ${formatDay(new Date(item.createdAt))}`);

    return {
      text: `Latest announcements:\n${lines.join('\n')}`,
      links: [link],
      suggestions: ['Upcoming events', ctx.user ? 'My notifications' : 'How do I enroll?'],
    };
  },

  async events(ctx) {
    const { timezone } = await contactDetails(ctx.data);
    // Same visibility rules as the public Events page: active events only, pinned first
    const events = await Event.find({
      isActive: true,
      status: { $in: ['upcoming', 'ongoing'] },
      eventDate: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    })
      .sort({ isPinned: -1, eventDate: 1 })
      .limit(3)
      .select('title eventDate location')
      .lean();

    if (events.length === 0) {
      return {
        text: 'There are no upcoming events scheduled right now. New events appear on the Events page and in Announcements as soon as they are published.',
        links: [{ label: 'Events', to: '/events' }],
        suggestions: ['Latest announcements', 'What courses do you offer?'],
      };
    }

    const lines = events.map((event) => {
      const when = new Date(event.eventDate).toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: timezone,
      });
      return `• ${event.title} — ${when} (${event.location || 'Online'})`;
    });

    return {
      text: `Upcoming events:\n${lines.join('\n')}\n\nTo join, open the event on the Events page and choose Register Interest${ctx.user ? '' : ' (sign in first)'}.`,
      links: [{ label: 'Events', to: '/events' }],
      suggestions: ['Latest announcements', 'How do I enroll?'],
    };
  },

  async contact(ctx) {
    const contact = await contactDetails(ctx.data);
    return {
      text: [
        'You can reach the SRI-KO team here:',
        `• Phone: ${contact.phone}`,
        `• Email: ${contact.email}${contact.hasCustomEmail ? '' : ` (admissions: ${SITE_CONTACT.admissionsEmail})`}`,
        `• Address: ${contact.address}`,
        `• Office hours: ${SITE_CONTACT.hours}`,
        '',
        'We usually reply within 24 hours. You can also send us a message through the Contact Us form.',
      ].join('\n'),
      links: [{ label: 'Contact Us form', to: '/contact' }],
      suggestions: ['What courses do you offer?', 'How do I enroll?', 'About SRI-KO'],
    };
  },

  async account(ctx) {
    const { email } = await contactDetails(ctx.data);
    return {
      text: [
        'Account help:',
        '• Forgot your password? Choose "Forgot password?" on the sign-in page — we\'ll email you a 6-digit code (valid for 10 minutes) to set a new one. Check your spam folder if it doesn\'t arrive.',
        '• You can also sign in with your Google account.',
        '• Update your password and profile details anytime in Settings.',
        '',
        `Still stuck? Email us at ${email}.`,
      ].join('\n'),
      links: ctx.user
        ? [{ label: 'Settings', to: '/settings' }]
        : [{ label: 'Sign in', to: '/login' }, { label: 'Reset password', to: '/forgot-password' }],
      suggestions: ['Contact details', 'What can you do?'],
    };
  },

  async support(ctx) {
    const contact = await contactDetails(ctx.data);
    return {
      text: [
        "Sorry you're having trouble. These steps usually help:",
        '• Refresh the page, or sign out and sign in again.',
        '• Check your internet connection — lesson videos need a stable connection.',
        '• Try another up-to-date browser such as Chrome, Edge, Firefox or Safari.',
        '',
        `If it still doesn't work, tell us what happened and on which page: ${contact.phone} · ${contact.email}`,
      ].join('\n'),
      links: [{ label: 'Contact us', to: '/contact' }, { label: 'Help Center', to: '/help' }],
      suggestions: ['I forgot my password', 'What can you do?'],
    };
  },

  async policies() {
    return {
      text: 'Our Terms of Service cover your responsibilities as a user, our educational services, payments and the 14-day refund policy, and intellectual property. The Privacy Policy explains what personal data we collect and how we protect it.',
      links: [{ label: 'Terms of Service', to: '/terms' }, { label: 'Privacy Policy', to: '/privacy' }],
      suggestions: ['Do you offer refunds?', 'Contact details'],
    };
  },

  async forum(ctx) {
    const [activeCount, topics] = await Promise.all([
      DiscussionForum.countDocuments({ isActive: true }),
      DiscussionForum.find({ isActive: true }).sort({ isPinned: -1, postCount: -1 }).limit(3).select('title').lean(),
    ]);

    const lines = [`Our discussion forums are the place to ask questions and practise with other learners${activeCount ? ` — there ${activeCount === 1 ? 'is' : 'are'} ${plural(activeCount, 'active topic')}` : ''}.`];
    if (topics.length > 0) {
      lines.push(`Popular topics:\n${topics.map((topic) => `• ${topic.title}`).join('\n')}`);
    }
    lines.push(ctx.user ? 'Open the Forum page to post a question or reply.' : 'Anyone can browse the Forum page; sign in to post questions and replies.');

    return {
      text: lines.join('\n\n'),
      links: [{ label: 'Forum', to: '/forum' }, ...(ctx.user ? [] : [{ label: 'Sign in', to: '/login' }])],
      suggestions: ['Korean basics', 'What courses do you offer?'],
    };
  },

  async about(ctx) {
    const courses = await ctx.data.courses();
    const offer = courses.length > 0 ? `\n\nWe currently offer ${plural(courses.length, 'course')} on this platform.` : '';
    return {
      text: `${ABOUT_TEXT.join('\n')}${offer}`,
      links: [{ label: 'About us', to: '/about' }, { label: 'Browse courses', to: '/courses' }],
      suggestions: ['What courses do you offer?', 'Contact details', 'How do I enroll?'],
    };
  },

  async koreanBasics(ctx) {
    const topic = KOREAN_TOPICS.find((candidate) => matchesAny(ctx.input, candidate.keywords));

    if (!topic) {
      return {
        text: 'Happy to help with Korean basics! Pick a topic below — Hangul, polite speech, particles, everyday phrases, numbers or the TOPIK exam.',
        suggestions: ['Explain Hangul', 'Formal vs informal Korean', 'Common Korean phrases', 'What is TOPIK?'],
      };
    }

    const reply = { text: topic.text, links: [{ label: 'Browse courses', to: '/courses' }] };

    if (topic.key === 'topik') {
      const prep = (await ctx.data.courses()).filter((course) => /topik/i.test(
        [course.title, course.description, ...(course.tags || [])].join(' '),
      ));
      if (prep.length > 0) {
        reply.text += `\n\nOur TOPIK preparation:\n${prep.slice(0, 4).map(courseLine).join('\n')}`;
      }
    }

    reply.suggestions = KOREAN_TOPICS
      .filter((candidate) => candidate.key !== topic.key)
      .slice(0, 3)
      .map((candidate) => candidate.suggestion);

    return reply;
  },

  async capabilities(ctx) {
    const signedIn = Boolean(ctx.user);
    return {
      text: [
        "I'm the SRI-KO assistant. Ask me in your own words about:",
        '• Courses — what we teach, levels, duration and fees in LKR',
        '• Enrolling and paying — accounts, card checkout, bank transfers and refunds',
        signedIn
          ? '• Your learning — your courses and progress, assignments and grades, lesson videos, attendance, certificates and notifications'
          : '• Learning on SRI-KO — lesson videos, assignments, attendance, progress and certificates (sign in for your own details)',
        '• Events, announcements and the discussion forum',
        '• Your account — signing in, Google sign-in, resetting your password and updating your profile',
        '• About SRI-KO and how to contact us',
        '• Korean basics — Hangul, polite speech, particles, phrases, numbers and TOPIK / EPS-TOPIK',
        '',
        'Type a question or tap a suggestion below.',
      ].join('\n'),
      suggestions: signedIn
        ? ['My courses and progress', 'My assignments', 'My attendance', 'My notifications']
        : ['What courses do you offer?', 'How do I enroll?', 'About SRI-KO', 'Korean basics'],
    };
  },

  async greeting(ctx) {
    return {
      text: `Annyeonghaseyo${ctx.firstName ? `, ${ctx.firstName}` : ''}! 👋 Welcome to SRI-KO Foreign Language Training Center. What would you like to know?`,
    };
  },

  async thanks() {
    return { text: "You're welcome! 감사합니다 (gamsahamnida) for learning with us. Is there anything else I can help with?" };
  },

  async goodbye() {
    return { text: 'Goodbye! 안녕히 가세요 (annyeonghi gaseyo). Come back anytime you have a question.' };
  },

  async fallback(ctx) {
    if (ctx.course) {
      return courseDetail(ctx.course);
    }

    const contact = await contactDetails(ctx.data);
    return {
      text: "Sorry, I don't have an answer for that yet. I can help with courses and fees, enrolling and payments, "
        + `${ctx.user ? 'your courses, assignments, attendance and certificates' : 'lessons, assignments, attendance and certificates'}, `
        + 'events and announcements, your account, and Korean basics. Try asking another way or tap a suggestion below.\n\n'
        + `For anything else, our team is happy to help: ${contact.phone} · ${contact.email}`,
      links: [{ label: 'Contact us', to: '/contact' }, { label: 'Help Center', to: '/help' }],
    };
  },
};

class ChatbotEngine {
  /**
   * Answer one chat message.
   *
   * @param {string} message - The visitor's question
   * @param {Object} [options]
   * @param {Object|null} [options.user] - Signed-in user document, for personal answers
   * @param {{courseId?: string}} [options.context] - Course discussed in the previous answer
   * @returns {Promise<{intent: string, text: string, suggestions: string[], links: {label: string, to: string}[], meta: Object}>}
   */
  static async reply(message, { user = null, context = {} } = {}) {
    const input = analyze(message);
    const data = createDataLoader(user);
    const { topical, social } = rankIntents(input);
    let intent = topical[0]?.name || social[0] || 'fallback';
    const greeted = intent !== 'greeting' && social.includes('greeting');

    let course = null;
    if (COURSE_AWARE_INTENTS.has(intent)) {
      const courses = await data.courses();
      course = findMentionedCourse(input, courses);

      const refersBack = FOLLOW_UP_INTENTS.has(intent)
        || (intent === 'fallback' && REFERRING_WORDS.some((word) => input.tokens.has(word)));
      if (!course && context.courseId && refersBack) {
        course = courses.find((candidate) => String(candidate._id) === String(context.courseId)) || null;
      }
    }

    const ctx = {
      input,
      user,
      firstName: (user?.name || '').trim().split(/\s+/)[0] || '',
      data,
      course,
    };
    const answer = await RESPONDERS[intent](ctx);
    if (intent === 'fallback' && course) {
      intent = 'courses';
    }

    const prefix = greeted ? `Hi${ctx.firstName ? ` ${ctx.firstName}` : ''}! ` : '';

    return {
      intent,
      text: `${prefix}${answer.text}`,
      suggestions: (answer.suggestions || (user ? STUDENT_SUGGESTIONS : GUEST_SUGGESTIONS)).slice(0, 4),
      links: (answer.links || []).filter((link) => typeof link.to === 'string' && link.to.startsWith('/')),
      meta: answer.meta || {},
    };
  }

  /** Starter suggestions for an empty conversation. */
  static suggestionsFor(user) {
    return user ? STUDENT_SUGGESTIONS : GUEST_SUGGESTIONS;
  }
}

module.exports = ChatbotEngine;
