const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  // optional: resume-generated questions may not have a persisted Question doc
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  questionText: { type: String, required: true },
  // scoring inputs are copied onto the answer so we don't have to re-fetch the
  // question at submit time (and so resume-generated questions work too)
  expectedAnswer: { type: String, default: '' },
  keywords: [{ type: String }],
  type: { type: String, enum: ['text', 'code'], default: 'text' },
  language: { type: String, default: '' },
  userAnswer: { type: String, default: '' },
  score: { type: Number, min: 0, max: 10, default: 0 },
  verdict: { type: String, default: '' },
  feedback: { type: String, default: '' },
  strengths: [{ type: String }],
  improvements: [{ type: String }],
  scoreSource: { type: String, enum: ['ai', 'keyword'], default: 'keyword' },
  followUp: { type: String, default: '' },
  timeTaken: { type: Number, default: 0 },
});

const interviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', 'Mixed'], default: 'Mixed' },
  source: { type: String, enum: ['standard', 'resume'], default: 'standard' },
  answers: [answerSchema],
  totalQuestions: { type: Number, default: 0 },
  answeredQuestions: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  status: { type: String, enum: ['in-progress', 'completed', 'abandoned'], default: 'in-progress' },
  duration: { type: Number, default: 0 },
  completedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
