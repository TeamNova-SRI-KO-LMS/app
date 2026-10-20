const Course = require('../models/Course');
const Announcement = require('../models/Announcement');
const Event = require('../models/Event');
const Settings = require('../models/Settings');
const Progress = require('../models/Progress');
const Certificate = require('../models/Certificate');
const Attendance = require('../models/Attendance');
const DiscussionForum = require('../models/DiscussionForum');
const { summarizeAttendance, toAttendanceDay } = require('../utils/attendance');

/**
 * ChatbotEngine
 * Free, rule-based assistant behind the SRI-KO support chat. It needs no external
 * AI service: questions are matched to intents by keyword scoring, and every
 * answer about the platform is built from live MongoDB data (courses, fees,
 * announcements, events, and the signed-in student's own courses and attendance).
 * The only static knowledge is how the site works and Korean-language basics.
 */

// Shown when the admin has not filled in contact details under Settings (matches the site footer)
const SITE_CONTACT = {
  phone: '+94 11 234 5678',
  mobile: '+94 77 123 4567',
  email: 'info@sriko-korean.com',
  admissionsEmail: 'admissions@sriko-korean.com',
  address: '123 Education Street, Colombo 07, Sri Lanka',
  hours: 'Mon – Fri, 9:00 AM – 6:00 PM',
};

const DEFAULT_TIMEZONE = 'Asia/Colombo';

const GUEST_SUGGESTIONS = ['What courses do you offer?', 'How much are the courses?', 'How do I enroll?', 'Contact details'];
const STUDENT_SUGGESTIONS = ['My attendance', 'My courses and progress', 'What courses do you offer?', 'Latest announcements'];

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

const normalize = (text) => String(text || '')
  .toLowerCase()
  .normalize('NFKC')
  .replace(/['’]/g, '')
  .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const singular = (word) => (word.length > 3 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word);

const analyze = (message) => {
  const text = normalize(message);
  const words = text ? text.split(' ') : [];
  return {
    text,
    padded: ` ${text} `,
    tokens: new Set(words.flatMap((word) => [word, singular(word)])),
  };
};

// Korean attaches particles to words (출석률이), so Hangul keywords match as substrings;
// phrases match on word boundaries and single words match whole tokens.
const matchesKeyword = (input, keyword) => {
  if (HANGUL.test(keyword)) {
    return input.text.includes(keyword);
  }
  if (keyword.includes(' ')) {
    return input.padded.includes(` ${keyword} `);
  }
  return input.tokens.has(keyword);
};

const matchesAny = (input, keywords) => keywords.some((keyword) => matchesKeyword(input, keyword));

// Order matters: on equal scores the earlier (more specific) intent wins.
const INTENTS = [
  { name: 'account', keywords: ['password', 'forgot', 'reset', 'login', 'log in', 'sign in', 'signin', 'account', 'otp', 'verification code', 'locked out', '비밀번호', '로그인'] },
  { name: 'attendance', keywords: ['attendance', 'attend', 'attended', 'present', 'absent', 'absence', 'absences', 'late', 'excused', 'mark attendance', 'attendance rate', '출석', '결석'] },
  { name: 'myCourses', keywords: ['my course', 'my courses', 'my class', 'my classes', 'enrolled', 'my progress', 'progress', 'continue learning', 'my lessons', 'my learning'] },
  { name: 'certificate', keywords: ['certificate', 'certificates', 'certification', 'certified', 'diploma', '수료증'] },
  { name: 'forum', keywords: ['forum', 'forums', 'discussion', 'discussions', 'community', 'classmates', '토론'] },
  { name: 'events', keywords: ['event', 'events', 'workshop', 'workshops', 'seminar', 'seminars', 'webinar', 'meetup', '행사', '이벤트'] },
  { name: 'announcements', keywords: ['announcement', 'announcements', 'news', 'notice', 'notices', 'whats new', 'latest update', 'latest updates', '공지'] },
  { name: 'payment', keywords: ['pay', 'paying', 'payment', 'payments', 'card', 'credit card', 'debit card', 'visa', 'mastercard', 'stripe', 'checkout', 'bank transfer', 'receipt', 'refund', 'refunds', 'money back', 'invoice', '결제', '환불'] },
  { name: 'pricing', keywords: ['price', 'prices', 'pricing', 'cost', 'costs', 'fee', 'fees', 'how much', 'expensive', 'cheap', 'cheapest', 'free', 'lkr', 'rupees', 'tuition', 'discount', '가격', '비용', '수강료'] },
  { name: 'enroll', keywords: ['enroll', 'enrol', 'enrolling', 'enrollment', 'enrolment', 'register', 'registration', 'sign up', 'signup', 'join', 'apply', 'application', 'admission', 'admissions', 'get started', '등록', '신청', '가입'] },
  { name: 'schedule', keywords: ['schedule', 'schedules', 'timetable', 'timing', 'timings', 'when', 'duration', 'how long', 'weeks', 'batch', 'batches', 'intake', 'weekend', 'weekday', 'start date', 'class time', '일정', '시간표'] },
  { name: 'contact', keywords: ['contact', 'phone', 'call', 'telephone', 'email', 'mail', 'address', 'location', 'located', 'where', 'office', 'visit', 'whatsapp', 'reach', 'office hours', 'opening hours', 'talk to', 'human', 'staff', '연락', '주소', '전화'] },
  { name: 'koreanBasics', keywords: ['korean basics', 'korean language basics', 'hangul', 'hangeul', 'alphabet', 'letters', 'consonant', 'consonants', 'vowel', 'vowels', 'pronunciation', 'pronounce', 'batchim', 'honorific', 'honorifics', 'formal', 'informal', 'polite', 'politeness', 'speech level', 'speech levels', 'banmal', 'jondaetmal', 'phrase', 'phrases', 'how do you say', 'how to say', 'in korean', 'korean numbers', 'numbers', 'counting', 'topik', 'eps topik', 'exam', '한글', '존댓말', '반말', '발음', '받침', '숫자'] },
  { name: 'courses', keywords: ['course', 'courses', 'class', 'classes', 'program', 'programs', 'programme', 'curriculum', 'lesson', 'lessons', 'syllabus', 'beginner', 'intermediate', 'advanced', 'level', 'levels', 'offer', 'catalog', 'learn korean', 'study korean', 'learning korean', '강좌', '강의', '수업', '과정'] },
  { name: 'capabilities', keywords: ['help', 'what can you do', 'who are you', 'what are you', 'menu', 'options', 'features'] },
  { name: 'greeting', weight: 0.5, keywords: ['hi', 'hello', 'hey', 'hiya', 'howdy', 'good morning', 'good afternoon', 'good evening', 'annyeong', 'annyeonghaseyo', '안녕하세요'] },
  { name: 'thanks', weight: 0.5, keywords: ['thanks', 'thank', 'thx', 'appreciate', 'appreciated', '감사', '고마워', '고맙습니다'] },
  { name: 'goodbye', weight: 0.5, keywords: ['bye', 'goodbye', 'see you', 'see ya', 'good night', '안녕히'] },
];

// "courses" already matches the keyword "course" (tokens include singular forms),
// so drop listed plurals to avoid scoring the same word twice.
INTENTS.forEach((intent) => {
  intent.keywords = intent.keywords.filter(
    (keyword) => !(keyword.endsWith('s') && intent.keywords.includes(keyword.slice(0, -1))),
  );
});

const rankIntents = (input) => INTENTS
  .map((intent, index) => {
    const score = intent.keywords.reduce(
      (total, keyword) => total + (matchesKeyword(input, keyword) ? (keyword.includes(' ') ? 2 : 1) : 0),
      0,
    );
    return { name: intent.name, score: score * (intent.weight || 1), index };
  })
  .filter((intent) => intent.score > 0)
  .sort((a, b) => b.score - a.score || a.index - b.index);

// Intents that can be about one specific course
const COURSE_AWARE_INTENTS = new Set(['courses', 'pricing', 'enroll', 'schedule', 'payment', 'fallback']);
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

const capitalize = (text = '') => text.charAt(0).toUpperCase() + text.slice(1);

// ─── Data access (lazy, once per message) ─────────────────────────────────────

const createDataLoader = () => {
  const cache = new Map();
  // Cache the result promise, not the Mongoose query: awaiting a query twice re-runs it
  const once = (key, load) => {
    if (!cache.has(key)) cache.set(key, load().exec());
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
    phone: settings?.contactPhone || `${SITE_CONTACT.phone} / ${SITE_CONTACT.mobile}`,
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
    keywords: ['hangul', 'hangeul', 'alphabet', 'letters', 'consonant', 'consonants', 'vowel', 'vowels', '한글'],
    text: 'Hangul (한글) is the Korean alphabet, created under King Sejong the Great and published in 1446.\n\n'
      + '• 14 basic consonants: ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ\n'
      + '• 10 basic vowels: ㅏ ㅑ ㅓ ㅕ ㅗ ㅛ ㅜ ㅠ ㅡ ㅣ\n'
      + '• Letters combine into syllable blocks: 한 = ㅎ + ㅏ + ㄴ\n\n'
      + 'Most learners can read Hangul within a few days of practice — it is the first step in our beginner courses.',
  },
  {
    key: 'batchim',
    keywords: ['batchim', 'pronunciation', 'pronounce', 'final consonant', '받침', '발음'],
    text: 'Batchim (받침) is the final consonant at the bottom of a syllable block, as in 한 or 국.\n\n'
      + '• Only 7 sounds are pronounced in final position: ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅇ — so 옷 (clothes) ends in a "t" sound.\n'
      + '• When the next syllable starts with ㅇ, the batchim moves over (연음): 한국어 is read [한구거].',
  },
  {
    key: 'honorifics',
    keywords: ['honorific', 'honorifics', 'formal', 'informal', 'polite', 'politeness', 'speech level', 'speech levels', 'banmal', 'jondaetmal', '존댓말', '반말'],
    text: 'Korean shows politeness through verb endings (speech levels):\n\n'
      + '• Formal polite (합쇼체): -습니다 / -ㅂ니다 — e.g. 감사합니다. Used in presentations, the news and business.\n'
      + '• Informal polite (해요체): -아요 / -어요 — e.g. 고마워요. The everyday polite style.\n'
      + '• Casual (반말): -아 / -어 — e.g. 고마워. Only with close friends or younger people.\n\n'
      + 'When in doubt, use the -요 endings — they are polite in almost every situation.',
  },
  {
    key: 'numbers',
    keywords: ['numbers', 'korean numbers', 'counting', '숫자'],
    text: 'Korean uses two number systems:\n\n'
      + '• Native Korean — 하나, 둘, 셋, 넷, 다섯 (1–5): for counting things, age and hours (세 시 = 3 o\'clock).\n'
      + '• Sino-Korean — 일, 이, 삼, 사, 오 (1–5): for dates, money, minutes and phone numbers (삼십 분 = 30 minutes).',
  },
  {
    key: 'topik',
    keywords: ['topik', 'eps topik', 'exam', '시험'],
    text: 'TOPIK (Test of Proficiency in Korean) is the official Korean language exam:\n\n'
      + '• TOPIK I — levels 1–2, with listening and reading sections.\n'
      + '• TOPIK II — levels 3–6, with listening, writing and reading sections.\n'
      + '• EPS-TOPIK is a separate test for the Employment Permit System, needed to work in Korea through the EPS programme.',
  },
  {
    key: 'phrases',
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
      text: `${summary.join(' ')}\n${shown.map(courseLine).join('\n')}\n\nFees are in Sri Lankan Rupees (LKR) and paid once per course.`,
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

    if (matchesAny(ctx.input, ['refund', 'refunds', 'money back', '환불'])) {
      lines.push('', "Refunds: we offer a 14-day money-back guarantee on eligible full-course enrollments if you've completed less than 20% of the lessons. See our Terms of Service for the details.");
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
    links.push({ label: 'Ask for a recommendation', to: '/join-us' });

    return {
      text: `${intro}\n${steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}\n\nNot sure which level suits you? Send us a Join Us application and our team will recommend a course.`,
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

    lines.push('Each course page shows its duration and lesson plan. Class times for each intake are confirmed by our team when you enroll — contact us if you need a particular time slot.');

    const { phone } = await contactDetails(ctx.data);
    lines.push(`Call ${phone} to ask about upcoming intakes.`);

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

    const [courses, progress] = await Promise.all([
      Course.find({ $or: [{ _id: { $in: ctx.user.enrolledCourses || [] } }, { enrolledStudents: ctx.user._id }] })
        .select('title')
        .lean(),
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
      suggestions: ['My attendance', 'Do I have certificates?', 'Latest announcements'],
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
      suggestions: ['My courses and progress', 'Do I have certificates?', 'Latest announcements'],
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
      suggestions: ['Upcoming events', ctx.user ? 'My attendance' : 'How do I enroll?'],
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
      text: `Upcoming events:\n${lines.join('\n')}`,
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
        'We usually reply within 24 hours. You can also send us a message through the contact form.',
      ].join('\n'),
      links: [{ label: 'Contact form', to: '/contact' }],
      suggestions: ['What courses do you offer?', 'How do I enroll?'],
    };
  },

  async account(ctx) {
    const { email } = await contactDetails(ctx.data);
    return {
      text: [
        'Account help:',
        '• Forgot your password? Choose "Forgot password" on the sign-in page — we\'ll email you a 6-digit code (valid for 10 minutes) to set a new one.',
        '• You can also sign in with your Google account.',
        '• Update your password and profile details anytime in Settings.',
        '',
        `Still stuck? Email us at ${email}.`,
      ].join('\n'),
      links: ctx.user
        ? [{ label: 'Settings', to: '/settings' }]
        : [{ label: 'Sign in', to: '/login' }, { label: 'Reset password', to: '/forgot-password' }],
      suggestions: ['Contact details', 'What courses do you offer?'],
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
    lines.push(ctx.user ? 'Open My Courses to join the conversation.' : 'Sign in and open My Courses to join the conversation.');

    return {
      text: lines.join('\n\n'),
      links: [ctx.user ? { label: 'My courses', to: '/my-courses' } : { label: 'Sign in', to: '/login' }],
      suggestions: ['Korean basics', 'What courses do you offer?'],
    };
  },

  async koreanBasics(ctx) {
    const topic = KOREAN_TOPICS.find((candidate) => matchesAny(ctx.input, candidate.keywords));

    if (!topic) {
      return {
        text: 'Happy to help with Korean basics! Pick a topic below — Hangul, polite speech, everyday phrases, numbers or the TOPIK exam.',
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
      .map((candidate) => ({
        hangul: 'Explain Hangul',
        batchim: 'What is batchim?',
        honorifics: 'Formal vs informal Korean',
        numbers: 'Korean numbers',
        topik: 'What is TOPIK?',
        phrases: 'Common Korean phrases',
      }[candidate.key]));

    return reply;
  },

  async capabilities(ctx) {
    return {
      text: [
        "I'm the SRI-KO assistant. I can help you with:",
        '• Courses, levels and fees',
        '• Enrolling and paying for a course',
        ctx.user ? '• Your enrolled courses, progress and attendance' : '• How attendance and progress tracking work',
        '• Announcements and upcoming events',
        '• Account and password help',
        '• Korean basics — Hangul, polite speech, phrases, numbers and TOPIK',
        '',
        'Type a question or tap a suggestion below.',
      ].join('\n'),
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
      text: "I'm not sure I understood that. I can answer questions about our courses, fees, enrollment, your attendance and progress, announcements, and Korean basics like Hangul or polite speech.\n\n"
        + `For anything else, our team is happy to help: ${contact.phone} · ${contact.email}`,
      links: [{ label: 'Contact us', to: '/contact' }],
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
    const data = createDataLoader();
    const ranked = rankIntents(input);
    let intent = ranked[0]?.name || 'fallback';
    const greeted = intent !== 'greeting' && ranked.some((candidate) => candidate.name === 'greeting');

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
