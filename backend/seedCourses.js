/**
 * seedCourses.js - Run with: node seedCourses.js
 * Seeds 8 realistic Korean-language courses into MongoDB for SRI-KO LMS.
 */
const mongoose = require('mongoose');
require('dotenv').config();
const Course = require('./models/Course');

const courses = [
  {
    title: 'Korean Foundations: Hangul & Phonics for Beginners',
    description: 'Start your Korean journey from scratch. This course covers the complete Hangul alphabet, pronunciation rules, vowel/consonant combinations, and basic sentence patterns. Perfect for absolute beginners with no prior exposure to the Korean language.',
    category: 'Language', level: 'beginner', duration: 6, price: 9500, isPublished: true,
    thumbnail: 'https://images.unsplash.com/photo-1581007871115-f14bc016e0a4?auto=format&fit=crop&q=80&w=800',
    tags: ['Hangul', 'Phonics', 'Beginner', 'Korean Alphabet'], prerequisites: [], averageRating: 4.8,
    curriculum: [
      { week: 1, title: 'Introduction to Hangul Vowels', description: 'Learn the 10 basic vowels and their pronunciation.', lessons: [
        { title: 'What is Hangul?', content: 'History and structure of the Korean writing system.', duration: 20, type: 'video', isFreePreview: true },
        { title: 'Basic Vowels', content: 'Pronunciation drills for each vowel.', duration: 30, type: 'video', isFreePreview: true },
        { title: 'Vowel Quiz', content: 'Test your vowel recognition skills.', duration: 15, type: 'quiz', isFreePreview: false },
      ]},
      { week: 2, title: 'Consonants & Syllable Blocks', description: 'Master the 14 basic consonants and form syllable blocks.', lessons: [
        { title: 'Basic Consonants', content: 'Detailed breakdown of each consonant sound.', duration: 35, type: 'video', isFreePreview: false },
        { title: 'Building Syllable Blocks', content: 'Combining consonants and vowels.', duration: 40, type: 'video', isFreePreview: false },
        { title: 'Writing Practice', content: 'Tracing and writing exercise worksheet.', duration: 20, type: 'assignment', isFreePreview: false },
      ]},
      { week: 3, title: 'Reading Simple Words', description: 'Apply phonics skills to read common Korean words.', lessons: [
        { title: 'Common Nouns', content: '50 everyday Korean nouns.', duration: 25, type: 'text', isFreePreview: false },
        { title: 'Reading Practice Session', content: 'Live reading drill with native speaker audio.', duration: 45, type: 'video', isFreePreview: false },
      ]},
      { week: 4, title: 'Basic Sentence Patterns', description: 'SOV sentence structure introduction.', lessons: [
        { title: 'Topic & Subject Markers', content: 'Explanation with examples.', duration: 30, type: 'video', isFreePreview: false },
        { title: 'Simple Sentences Quiz', content: 'Construct basic sentences.', duration: 20, type: 'quiz', isFreePreview: false },
      ]},
      { week: 5, title: 'Final Review', description: 'Comprehensive review and final phonics assessment.', lessons: [
        { title: 'Full Course Review', content: 'Summary of all Hangul rules covered.', duration: 40, type: 'video', isFreePreview: false },
        { title: 'Final Assessment', content: 'Reading and writing final test.', duration: 60, type: 'assignment', isFreePreview: false },
      ]},
    ],
  },
  {
    title: 'Everyday Korean Conversations: Level 1',
    description: 'Build real conversational skills for daily life in Korea. Covers greetings, shopping, dining, directions, and essential phrases for tourists and new residents. Learn to speak naturally with confidence from day one.',
    category: 'Conversation', level: 'beginner', duration: 8, price: 11500, isPublished: true,
    thumbnail: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800',
    tags: ['Conversation', 'Daily Life', 'Travel', 'Beginner'], prerequisites: ['Basic knowledge of Hangul helpful'], averageRating: 4.7,
    curriculum: [
      { week: 1, title: 'Greetings & Introductions', description: 'Korean greetings, farewells, and self-introductions.', lessons: [
        { title: 'Hello & Goodbye', content: 'Formal and informal greetings.', duration: 25, type: 'video', isFreePreview: true },
        { title: 'Introducing Yourself', content: 'Name, nationality, age expressions.', duration: 30, type: 'video', isFreePreview: true },
      ]},
      { week: 2, title: 'Numbers & Counting', description: 'Native and Sino-Korean number systems.', lessons: [
        { title: 'Sino-Korean Numbers', content: 'Used for dates, money, phone numbers.', duration: 35, type: 'video', isFreePreview: false },
        { title: 'Native Korean Numbers', content: 'Used for counting objects and age.', duration: 30, type: 'video', isFreePreview: false },
        { title: 'Numbers Quiz', content: 'Test yourself with both number systems.', duration: 15, type: 'quiz', isFreePreview: false },
      ]},
      { week: 3, title: 'At a Korean Restaurant', description: 'Order food, understand menus, and dine out confidently.', lessons: [
        { title: 'Common Food Vocabulary', content: 'Kimchi jjigae, Bulgogi, and more.', duration: 20, type: 'text', isFreePreview: false },
        { title: 'Ordering at a Restaurant', content: 'Dialogues and role-play exercises.', duration: 40, type: 'video', isFreePreview: false },
      ]},
      { week: 4, title: 'Shopping & Bargaining', description: 'Ask prices and navigate Korean markets.', lessons: [
        { title: 'Shopping Phrases', content: 'Eolmayeyo and more expressions.', duration: 30, type: 'video', isFreePreview: false },
        { title: 'Shopping Role-Play', content: 'Practice with a native Korean script.', duration: 35, type: 'assignment', isFreePreview: false },
      ]},
    ],
  },
  {
    title: 'TOPIK I Complete Preparation Course',
    description: 'Systematically prepare for the TOPIK I (Beginner) examination. Covers all question types, vocabulary lists, grammar patterns, and 3 complete mock exam papers with detailed answer explanations. Target score: TOPIK Level 1-2.',
    category: 'Grammar', level: 'beginner', duration: 10, price: 13500, isPublished: true,
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800',
    tags: ['TOPIK', 'Exam Prep', 'Grammar', 'Vocabulary'], prerequisites: ['Completed Hangul Foundations or equivalent'], averageRating: 4.9,
    curriculum: [
      { week: 1, title: 'Understanding the TOPIK I Format', description: 'Exam structure, scoring, and time management strategies.', lessons: [
        { title: 'TOPIK Exam Overview', content: 'Sections, question types, time limits.', duration: 30, type: 'video', isFreePreview: true },
        { title: 'Scoring Strategy', content: 'How to maximize your score in each section.', duration: 25, type: 'video', isFreePreview: true },
      ]},
      { week: 2, title: 'Essential Vocabulary (800 words)', description: 'High-frequency TOPIK I vocabulary organized by topic.', lessons: [
        { title: 'Family & Daily Life Vocabulary', content: 'Flashcards and usage examples.', duration: 40, type: 'text', isFreePreview: false },
        { title: 'Time & Place Vocabulary', content: 'Mastering situational vocabulary.', duration: 35, type: 'video', isFreePreview: false },
        { title: 'Vocabulary Quiz', content: '50-question vocabulary assessment.', duration: 20, type: 'quiz', isFreePreview: false },
      ]},
      { week: 3, title: 'Key Grammar Patterns', description: 'The 30 most commonly tested grammar structures.', lessons: [
        { title: 'Topic Markers & Postpositions', content: 'Markers in context.', duration: 45, type: 'video', isFreePreview: false },
        { title: 'Verb Endings', content: 'Polite present tense conjugation.', duration: 40, type: 'video', isFreePreview: false },
      ]},
    ],
  },
  {
    title: 'Advanced Level (A/L) Korean Syllabus - Full Prep',
    description: 'Comprehensive preparation for Sri Lanka A/L Korean language examination. Covers the full OUSL syllabus including reading comprehension, grammar essays, listening tasks, and writing skills. Ideal for students targeting A/B grades.',
    category: 'Grammar', level: 'intermediate', duration: 10, price: 16000, isPublished: true,
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800',
    tags: ['A/L', 'Syllabus', 'Exam Prep', 'Sri Lanka'], prerequisites: ['TOPIK Level 1 or 1 year of Korean study'], averageRating: 5.0,
    curriculum: [
      { week: 1, title: 'A/L Paper Structure & Reading', description: 'Exam format and reading practice.', lessons: [
        { title: 'Exam Paper Walkthrough', content: 'Section-by-section breakdown.', duration: 30, type: 'video', isFreePreview: true },
        { title: 'Reading Comprehension Practice 1', content: 'Annotated passage with answer guide.', duration: 50, type: 'text', isFreePreview: false },
      ]},
      { week: 2, title: 'Grammar Essay Writing', description: 'Structuring Korean essays for the written exam.', lessons: [
        { title: 'Essay Structure in Korean', content: 'Introduction-Body-Conclusion format.', duration: 35, type: 'video', isFreePreview: false },
        { title: 'Sample Essay Analysis', content: 'Model essays with teacher commentary.', duration: 45, type: 'text', isFreePreview: false },
        { title: 'Essay Assignment', content: 'Write a 300-word essay on a given topic.', duration: 60, type: 'assignment', isFreePreview: false },
      ]},
    ],
  },
  {
    title: 'EPS-TOPIK Complete Course - Employment Permit System',
    description: 'Full preparation for the EPS-TOPIK examination required for Korean employment visas. Covers all 80 question types, technical vocabulary for manufacturing, construction, and service industries, and intensive listening practice with native Korean audio.',
    category: 'Language', level: 'advanced', duration: 12, price: 18500, isPublished: true,
    thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800',
    tags: ['EPS-TOPIK', 'Work Visa', 'Employment', 'Advanced'], prerequisites: ['TOPIK Level 2 or 2 years of Korean study'], averageRating: 4.9,
    curriculum: [
      { week: 1, title: 'EPS-TOPIK Format & Listening', description: 'Master the 40-question listening section format.', lessons: [
        { title: 'EPS-TOPIK Introduction', content: 'Overview of exam, registration, and scoring.', duration: 25, type: 'video', isFreePreview: true },
        { title: 'Listening Drill Set 1', content: 'Workplace announcement comprehension.', duration: 45, type: 'video', isFreePreview: true },
        { title: 'Listening Quiz 1', content: 'Test on listening drill set 1.', duration: 20, type: 'quiz', isFreePreview: false },
      ]},
      { week: 2, title: 'Manufacturing & Safety Vocabulary', description: 'Industry vocabulary for factory settings.', lessons: [
        { title: 'Safety Signs & Commands', content: 'Critical workplace safety signs.', duration: 35, type: 'text', isFreePreview: false },
        { title: 'Machine & Tool Vocabulary', content: '50 essential manufacturing terms.', duration: 30, type: 'video', isFreePreview: false },
      ]},
      { week: 3, title: 'Reading Comprehension', description: 'Tackle the 40-question reading section.', lessons: [
        { title: 'Reading Strategy Session', content: 'Time management and scanning techniques.', duration: 30, type: 'video', isFreePreview: false },
        { title: 'Full Reading Mock Test', content: 'Complete 40-question reading paper.', duration: 60, type: 'assignment', isFreePreview: false },
      ]},
    ],
  },
  {
    title: 'Advanced Korean Business Etiquette & Professional Communication',
    description: 'Master the nuances of the Korean corporate world. From the art of the perfect bow to complex honorifics used in high-stakes negotiations, this course prepares you for success in Seoul business district. Learn unspoken rules of hierarchy, gift-giving, dining, and building relationships in Korean corporate culture.',
    category: 'Business', level: 'advanced', duration: 8, price: 14500, isPublished: true,
    thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
    tags: ['Business', 'Corporate Culture', 'Honorifics', 'Advanced'], prerequisites: ['Intermediate Korean proficiency (TOPIK Level 3+)'], averageRating: 4.8,
    curriculum: [
      { week: 1, title: 'Korean Corporate Hierarchy & Bowing', description: 'Understand job ranks and proper bowing angles.', lessons: [
        { title: 'Korean Corporate Structure', content: 'Chaebol culture, rank system, and Confucian roots.', duration: 35, type: 'video', isFreePreview: true },
        { title: 'The Art of Bowing', content: 'Degrees of bow for different situations.', duration: 25, type: 'video', isFreePreview: true },
      ]},
      { week: 2, title: 'Business Card Exchange & Meeting Protocol', description: 'Master formal introductions and meeting etiquette.', lessons: [
        { title: 'Business Card Exchange Rules', content: 'Two-handed exchange, reading, and storing.', duration: 20, type: 'video', isFreePreview: false },
        { title: 'Meeting Openers & Agenda Language', content: 'Formal phrases for running meetings.', duration: 40, type: 'video', isFreePreview: false },
        { title: 'Role-Play: Mock Board Meeting', content: 'Practice meeting Korean in a simulated setting.', duration: 50, type: 'assignment', isFreePreview: false },
      ]},
      { week: 3, title: 'Advanced Honorifics', description: 'Navigate complex formal speech levels.', lessons: [
        { title: 'Formal Speech Level', content: 'Most formal Korean speech - when and how.', duration: 45, type: 'video', isFreePreview: false },
        { title: 'Honorific Vocabulary for Executives', content: 'Respectful vocabulary alternatives.', duration: 35, type: 'video', isFreePreview: false },
      ]},
    ],
  },
  {
    title: 'Korean Literature & Webtoon Reading for Intermediates',
    description: 'Develop advanced reading fluency through authentic Korean literature, modern webtoons, and newspaper excerpts. Build vocabulary, understand cultural references, and enjoy Korean storytelling in its native form. Includes 5 short story analyses and a webtoon reading project.',
    category: 'Literature', level: 'intermediate', duration: 9, price: 12000, isPublished: true,
    thumbnail: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=800',
    tags: ['Literature', 'Reading', 'Webtoon', 'Culture'], prerequisites: ['TOPIK Level 2 or equivalent reading ability'], averageRating: 4.6,
    curriculum: [
      { week: 1, title: 'Intro to Modern Korean Literature', description: 'Overview of contemporary Korean authors and themes.', lessons: [
        { title: 'Korean Literature Landscape', content: 'Han Kang, Kim Young-ha, and their works.', duration: 30, type: 'video', isFreePreview: true },
        { title: 'Short Story Reading', content: 'Annotated reading of a contemporary short story.', duration: 50, type: 'text', isFreePreview: false },
      ]},
      { week: 2, title: 'Webtoon Reading & Informal Language', description: 'Read popular webtoons and learn casual Korean expressions.', lessons: [
        { title: 'Introduction to Korean Webtoons', content: 'Genre overview and vocabulary.', duration: 25, type: 'video', isFreePreview: false },
        { title: 'Webtoon Chapter Analysis', content: 'Vocabulary extraction and cultural notes.', duration: 60, type: 'text', isFreePreview: false },
      ]},
    ],
  },
  {
    title: 'Korean K-Culture Immersion: K-Pop, K-Drama & Korean Lifestyle',
    description: 'Learn Korean the fun way through K-Pop lyrics, K-Drama dialogue, and Korean lifestyle content. Understand slang, youth language, and trending expressions used by native Koreans online and in everyday conversation. Perfect for fans looking to deepen cultural understanding.',
    category: 'Culture', level: 'beginner', duration: 7, price: 8500, isPublished: true,
    thumbnail: 'https://images.unsplash.com/photo-1581007871115-f14bc016e0a4?auto=format&fit=crop&q=80&w=800',
    tags: ['K-Pop', 'K-Drama', 'Culture', 'Slang', 'Fun'], prerequisites: [], averageRating: 4.7,
    curriculum: [
      { week: 1, title: 'K-Pop Lyrics Decoding', description: 'Analyze popular K-Pop songs for vocabulary and grammar.', lessons: [
        { title: 'BTS Dynamite Grammar Breakdown', content: 'Line-by-line lyric translation and grammar notes.', duration: 40, type: 'video', isFreePreview: true },
        { title: 'K-Pop Vocabulary Flashcards', content: '100 expressions from popular songs.', duration: 20, type: 'text', isFreePreview: true },
      ]},
      { week: 2, title: 'K-Drama Dialogue & Emotions', description: 'Learn emotional expressions from famous Korean dramas.', lessons: [
        { title: 'K-Drama Scene Analysis', content: 'Vocabulary, expressions, and emotion words.', duration: 45, type: 'video', isFreePreview: false },
        { title: 'Korean Drama Slang Dictionary', content: 'Top 50 slang words from modern K-Dramas.', duration: 25, type: 'text', isFreePreview: false },
      ]},
      { week: 3, title: 'Internet Korean & Social Media Language', description: 'Navigate Korean social media and online communication.', lessons: [
        { title: 'Korean Internet Slang', content: 'What Koreans type online.', duration: 30, type: 'video', isFreePreview: false },
        { title: 'Comment Writing Practice', content: 'Write authentic Korean social media comments.', duration: 25, type: 'assignment', isFreePreview: false },
      ]},
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    const deleted = await Course.deleteMany({});
    console.log('Cleared ' + deleted.deletedCount + ' existing courses');
    const inserted = await Course.insertMany(courses);
    console.log('Seeded ' + inserted.length + ' courses successfully!');
    inserted.forEach((c, i) => console.log('  [' + (i+1) + '] ' + c.title));
    console.log('Done!');
  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
