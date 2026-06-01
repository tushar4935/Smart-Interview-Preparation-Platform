const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  questionText: { type: String, required: true },
  userAnswer: { type: String, default: '' },
  score: { type: Number, min: 0, max: 10, default: 0 },
  feedback: { type: String, default: '' },
  timeTaken: { type: Number, default: 0 },
});

const interviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', 'Mixed'], default: 'Mixed' },
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
