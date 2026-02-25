// backend/seeds/defaultQuestions.js
import mongoose from 'mongoose';
import QuestionBank from '../models/QuestionBank.js';
import dotenv from 'dotenv';
dotenv.config();

const defaults = [
  { text: 'Tell me about yourself and your professional background.', type: 'general', difficulty: 'easy', category: 'introduction', idealResponseHints: 'Clear, concise. Should connect to this role.' },
  { text: 'What interests you about this position?', type: 'general', difficulty: 'easy', category: 'motivation', idealResponseHints: 'Shows company research. Generic = red flag.' },
  { text: 'Tell me about a time you faced a significant challenge at work.', type: 'behavioral', difficulty: 'medium', category: 'problem-solving', idealResponseHints: 'STAR format. Specifics over generalities.' },
  { text: 'Describe a situation where you worked with a difficult team member.', type: 'behavioral', difficulty: 'medium', category: 'teamwork', idealResponseHints: 'Empathy and conflict resolution.' },
  { text: 'Give me an example of a time you took initiative.', type: 'behavioral', difficulty: 'medium', category: 'leadership', idealResponseHints: 'Proactiveness and ownership.' },
  { text: 'Tell me about a professional mistake and what you learned.', type: 'behavioral', difficulty: 'medium', category: 'self-awareness', idealResponseHints: 'Genuine vulnerability and learning.' },
  { text: 'If assigned a project with an impossible deadline, how would you approach it?', type: 'situational', difficulty: 'medium', category: 'problem-solving', idealResponseHints: 'Communication, scope negotiation, structure.' },
  { text: 'How would you handle disagreeing with your manager?', type: 'situational', difficulty: 'hard', category: 'communication', idealResponseHints: 'Balance assertiveness with respect.' },
  { text: 'Walk me through how you learn a new technology quickly.', type: 'technical', difficulty: 'easy', category: 'learning', idealResponseHints: 'Structured approach, hands-on practice.' },
  { text: 'How do you prioritize tasks with competing deadlines?', type: 'situational', difficulty: 'medium', category: 'time-management', idealResponseHints: 'Concrete frameworks or systems.' }
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await QuestionBank.deleteMany({ isDefault: true });
  await QuestionBank.insertMany(defaults.map(q => ({ ...q, isDefault: true, isActive: true })));
  console.log(`Seeded ${defaults.length} default questions`);
  process.exit();
})();