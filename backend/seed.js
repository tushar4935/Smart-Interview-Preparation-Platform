const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const User = require('./models/User');
const Question = require('./models/Question');
const Interview = require('./models/Interview');
const Resume = require('./models/Resume');
const questionBank = require('./data');

const DAY = 24 * 60 * 60 * 1000;
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const sample = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// 13 profiles with different target roles + skills so the users list feels real
const sampleUsers = [
  { name: 'Aditya Verma', email: 'aditya@example.com', targetRole: 'Backend Engineer', bio: 'Node and databases person, prepping for product companies.', skills: ['Node.js', 'MongoDB', 'System Design', 'Docker'] },
  { name: 'Priya Nair', email: 'priya@example.com', targetRole: 'Frontend Engineer', bio: 'React developer who loves clean UI and accessibility.', skills: ['React', 'JavaScript', 'HTML/CSS', 'Testing'] },
  { name: 'Rohan Mehta', email: 'rohan@example.com', targetRole: 'Full Stack Developer', bio: 'MERN stack, building side projects to learn.', skills: ['React', 'Node.js', 'MongoDB', 'JavaScript'] },
  { name: 'Sneha Kapoor', email: 'sneha@example.com', targetRole: 'SDE Intern', bio: 'Final year CS student grinding DSA.', skills: ['Data Structures', 'Algorithms', 'Java', 'OOP'] },
  { name: 'Karthik Reddy', email: 'karthik@example.com', targetRole: 'DevOps Engineer', bio: 'Into containers, CI/CD and cloud infra.', skills: ['Docker', 'DevOps', 'Security', 'Git'] },
  { name: 'Ananya Iyer', email: 'ananya@example.com', targetRole: 'Data-oriented Backend', bio: 'SQL nerd, learning distributed systems.', skills: ['DBMS/SQL', 'Python', 'System Design'] },
  { name: 'Vikram Singh', email: 'vikram@example.com', targetRole: 'Java Backend', bio: 'Spring Boot at work, interviewing for senior roles.', skills: ['Java', 'OOP', 'DBMS/SQL', 'System Design'] },
  { name: 'Meera Joshi', email: 'meera@example.com', targetRole: 'Frontend Engineer', bio: 'Design-minded engineer, ex-agency.', skills: ['React', 'HTML/CSS', 'JavaScript'] },
  { name: 'Arjun Das', email: 'arjun@example.com', targetRole: 'SDE-1', bio: 'Fresh grad, balancing DSA with system design basics.', skills: ['Algorithms', 'Data Structures', 'JavaScript', 'React'] },
  { name: 'Fatima Sheikh', email: 'fatima@example.com', targetRole: 'Python Developer', bio: 'Automation and scripting, moving into backend.', skills: ['Python', 'DBMS/SQL', 'Testing'] },
  { name: 'Nikhil Rao', email: 'nikhil@example.com', targetRole: 'Security Engineer', bio: 'AppSec enthusiast, CTF on weekends.', skills: ['Security', 'Computer Networks', 'Operating Systems'] },
  { name: 'Divya Menon', email: 'divya@example.com', targetRole: 'Full Stack Developer', bio: 'Bootcamp grad, first dev job hunt.', skills: ['React', 'Node.js', 'Git', 'HTML/CSS'] },
  { name: 'Sameer Khan', email: 'sameer@example.com', targetRole: 'Platform Engineer', bio: 'Infra + backend, likes the low-level stuff.', skills: ['Operating Systems', 'Computer Networks', 'DevOps', 'Node.js'] },
];

const verdictFor = (s) => (s >= 8 ? 'Strong answer' : s >= 6 ? 'Mostly solid' : s >= 4 ? 'Partial understanding' : 'Needs work');
const feedbackFor = (s) =>
  s >= 8 ? 'Clear, accurate, and hits the key points for this question.'
  : s >= 6 ? 'Good direction with a couple of important details missing.'
  : s >= 4 ? 'Partially correct but glosses over the core ideas.'
  : 'Review this topic - the fundamentals are not solid yet.';

const craftAnswer = (q, score) => {
  const exp = q.expectedAnswer || '';
  if (score >= 8) return exp;
  if (score >= 5) {
    const cut = Math.max(40, Math.floor(exp.length * 0.55));
    return `${exp.slice(0, cut).trim()}.`;
  }
  const kw = (q.keywords && q.keywords[0]) || 'this concept';
  return `I think it has to do with ${kw}, but I am not fully confident on the details.`;
};

const strengthsFor = (q, score) => (score >= 6 ? (q.keywords || []).slice(0, 2).map((k) => `Correctly referenced ${k}`) : []);
const improvementsFor = (q, score) =>
  score >= 8 ? [] : (q.keywords || []).slice(0, score >= 6 ? 2 : 3).map((k) => `Explain ${k} more precisely`);

const buildInterview = (userId, questions, category, difficulty, completedAt, baseline, progress) => {
  const answers = questions.map((q) => {
    const score = clamp(Math.round(baseline + progress * 1.5 + (Math.random() * 3 - 1.5)), 0, 10);
    return {
      question: q._id,
      questionText: q.text,
      expectedAnswer: q.expectedAnswer,
      keywords: q.keywords,
      type: q.type,
      userAnswer: craftAnswer(q, score),
      score,
      verdict: verdictFor(score),
      feedback: feedbackFor(score),
      strengths: strengthsFor(q, score),
      improvements: improvementsFor(q, score),
      scoreSource: Math.random() < 0.6 ? 'ai' : 'keyword',
      timeTaken: rand(25, q.timeLimit || 120),
    };
  });
  const totalScore = answers.reduce((s, a) => s + a.score, 0);
  const maxScore = questions.length * 10;
  return {
    user: userId,
    title: `${category} Practice`,
    category,
    difficulty,
    source: 'standard',
    answers,
    totalQuestions: questions.length,
    answeredQuestions: questions.length,
    totalScore,
    maxScore,
    percentage: Math.round((totalScore / maxScore) * 100),
    status: 'completed',
    completedAt,
    duration: answers.reduce((s, a) => s + a.timeTaken, 0),
  };
};

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await Promise.all([
    Question.deleteMany({}),
    Interview.deleteMany({}),
    Resume.deleteMany({}),
    User.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // --- users (create() so the password hashing hook runs) ---
  const admin = await User.create({
    name: 'Admin User', email: 'admin@example.com', password: 'admin123',
    role: 'admin', isVerified: true, targetRole: 'Platform', bio: 'Platform administrator.',
  });
  const demo = await User.create({
    name: 'Demo User', email: 'demo@example.com', password: 'demo123', role: 'user',
    isVerified: true, targetRole: 'Full Stack Developer', bio: 'Demo account for trying the platform.',
    skills: ['React', 'Node.js', 'JavaScript', 'MongoDB'],
  });

  const others = [];
  for (const u of sampleUsers) {
    const created = await User.create({ ...u, password: 'password123', isVerified: true });
    others.push(created);
  }
  console.log(`Created ${others.length + 2} users`);

  // --- questions ---
  const insertedQuestions = await Question.insertMany(
    questionBank.map((q) => ({ ...q, source: 'seed', createdBy: admin._id }))
  );
  const byCategory = {};
  insertedQuestions.forEach((q) => {
    (byCategory[q.category] = byCategory[q.category] || []).push(q);
  });
  console.log(`Seeded ${insertedQuestions.length} questions`);

  // --- interviews: dozens, spread across ~85 days, with per-user weak/strong areas ---
  const categories = Object.keys(byCategory);
  const learners = [demo, ...others];
  const allInterviews = [];

  for (const user of learners) {
    const strong = sample(categories, 3);
    const weak = sample(categories.filter((c) => !strong.includes(c)), 3);
    const activeCats = [...new Set([...strong, ...weak, ...sample(categories, 2)])];
    const n = rand(6, 12);

    for (let i = 0; i < n; i++) {
      const category = pick(activeCats);
      const progress = n > 1 ? i / (n - 1) : 1; // improves over time
      const daysAgo = Math.round(85 - 85 * progress) + rand(0, 3);
      const completedAt = new Date(Date.now() - daysAgo * DAY - rand(0, 20) * 60 * 60 * 1000);
      const baseline = strong.includes(category) ? 7.2 : weak.includes(category) ? 3.8 : 5.6;
      const difficulty = pick(['Easy', 'Medium', 'Medium', 'Hard']);

      const pool = byCategory[category];
      const questions = sample(pool, Math.min(5, pool.length));
      allInterviews.push(buildInterview(user._id, questions, category, difficulty, completedAt, baseline, progress));
    }
  }

  await Interview.insertMany(allInterviews);
  console.log(`Seeded ${allInterviews.length} completed interviews`);

  // roll up per-user stats so the profile/dashboard headline numbers are populated
  for (const user of learners) {
    const done = allInterviews.filter((iv) => String(iv.user) === String(user._id));
    if (!done.length) continue;
    await User.findByIdAndUpdate(user._id, {
      totalInterviews: done.length,
      averageScore: Math.round(done.reduce((s, iv) => s + iv.percentage, 0) / done.length),
    });
  }

  // --- sample resumes (metadata only; backed by the seed placeholder file) ---
  const samplePath = path.join(__dirname, 'uploads', 'resumes', 'sample-resume.txt');
  const resumeOwners = [demo, admin, others[0], others[1], others[2]];
  await Resume.insertMany(
    resumeOwners.map((u, idx) => ({
      user: u._id,
      fileName: 'sample-resume.txt',
      originalName: `${u.name.split(' ')[0]}_Resume.pdf`,
      filePath: samplePath,
      fileSize: 2048,
      mimeType: 'text/plain',
      isDefault: idx === 0,
    }))
  );
  console.log(`Seeded ${resumeOwners.length} resumes`);

  console.log('\nSeed complete.');
  console.log('  demo@example.com / demo123');
  console.log('  admin@example.com / admin123');
  console.log('  sample users password: password123');
  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
