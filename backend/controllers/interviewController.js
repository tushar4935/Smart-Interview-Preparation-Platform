const Interview = require('../models/Interview');
const Question = require('../models/Question');
const Resume = require('../models/Resume');
const User = require('../models/User');
const aiService = require('../services/aiService');
const resumeParser = require('../services/resumeParser');
const logger = require('../config/logger');

// shape a question (db doc or ai-generated object) into a blank interview answer
const toAnswer = (q) => ({
  question: q._id, // undefined for ai-generated questions, which is fine
  questionText: q.text,
  expectedAnswer: q.expectedAnswer || '',
  keywords: q.keywords || [],
  type: q.type || 'text',
  userAnswer: '',
  score: 0,
  feedback: '',
  timeTaken: 0,
});

const recalcUserStats = async (userId) => {
  const completed = await Interview.find({ user: userId, status: 'completed' });
  const user = await User.findById(userId);
  if (!user) return;
  user.totalInterviews = completed.length;
  user.averageScore = completed.length
    ? Math.round(completed.reduce((s, i) => s + i.percentage, 0) / completed.length)
    : 0;
  await user.save();
};

const startInterview = async (req, res) => {
  const { category, difficulty, questionCount = 5, title, type } = req.body;
  try {
    const filter = { isActive: true, source: { $ne: 'resume' } };
    if (category && category !== 'Mixed') filter.category = category;
    if (difficulty && difficulty !== 'Mixed') filter.difficulty = difficulty;
    if (type === 'code' || type === 'text') filter.type = type;

    const pool = await Question.find(filter);
    if (pool.length === 0) {
      return res.status(404).json({ success: false, message: 'No questions found for the selected filters' });
    }

    const count = Math.min(Math.max(Number(questionCount) || 5, 1), 20);
    const picked = pool.sort(() => Math.random() - 0.5).slice(0, Math.min(count, pool.length));

    const interview = await Interview.create({
      user: req.user._id,
      title: title || `${category || 'Mixed'} Interview`,
      category: category || 'Mixed',
      difficulty: difficulty || 'Mixed',
      totalQuestions: picked.length,
      maxScore: picked.length * 10,
      answers: picked.map(toAnswer),
    });

    // hand the frontend the questions but strip the answer key so it can't leak
    const questions = picked.map((q) => ({
      _id: q._id, text: q.text, category: q.category, difficulty: q.difficulty,
      type: q.type, timeLimit: q.timeLimit,
    }));
    res.status(201).json({ success: true, interview: { ...interview.toObject(), questions } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const startFromResume = async (req, res) => {
  const { resumeId, questionCount = 5 } = req.body;
  try {
    if (!aiService.isEnabled()) {
      return res.status(503).json({
        success: false,
        message: 'Resume-based practice needs AI to be configured on the server.',
      });
    }

    const query = resumeId
      ? { _id: resumeId, user: req.user._id }
      : { user: req.user._id, isDefault: true };
    let resume = await Resume.findOne(query);
    if (!resume && !resumeId) resume = await Resume.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (!resume) return res.status(404).json({ success: false, message: 'No resume found. Upload one first.' });

    const text = await resumeParser.extractText(resume.filePath, resume.mimeType);
    if (!text || text.length < 30) {
      return res.status(422).json({
        success: false,
        message: 'Could not read text from this resume. A text-based PDF works best.',
      });
    }

    const skills = await aiService.extractSkills(text);
    if (skills.length === 0) {
      return res.status(422).json({ success: false, message: 'Could not detect any skills from the resume.' });
    }

    const count = Math.min(Math.max(Number(questionCount) || 5, 1), 15);
    const generated = await aiService.generateQuestionsFromSkills(skills, count);
    if (generated.length === 0) {
      return res.status(502).json({ success: false, message: 'AI could not generate questions right now. Try again.' });
    }

    const interview = await Interview.create({
      user: req.user._id,
      title: 'Resume-based Practice',
      category: 'Mixed',
      difficulty: 'Mixed',
      source: 'resume',
      totalQuestions: generated.length,
      maxScore: generated.length * 10,
      answers: generated.map(toAnswer),
    });

    const questions = generated.map((q, i) => ({
      _id: interview.answers[i]._id, text: q.text, category: q.category,
      difficulty: q.difficulty, type: 'text', timeLimit: 150,
    }));
    res.status(201).json({ success: true, skills, interview: { ...interview.toObject(), questions } });
  } catch (err) {
    logger.error(`startFromResume failed: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

const submitAnswer = async (req, res) => {
  const { questionIndex, userAnswer, timeTaken, language, followUp } = req.body;
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    if (interview.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Interview already completed' });
    }
    const answer = interview.answers[questionIndex];
    if (!answer) return res.status(400).json({ success: false, message: 'Invalid question index' });

    const result = await aiService.scoreAnswer(
      answer.questionText,
      answer.expectedAnswer,
      userAnswer,
      answer.keywords
    );

    answer.userAnswer = userAnswer || '';
    answer.score = result.score;
    answer.verdict = result.verdict;
    answer.feedback = result.feedback;
    answer.strengths = result.strengths;
    answer.improvements = result.improvements;
    answer.scoreSource = result.source;
    answer.timeTaken = timeTaken || 0;
    if (language) answer.language = language;

    let followUpQuestion = null;
    if (followUp) {
      followUpQuestion = await aiService.generateFollowUp(answer.questionText, userAnswer);
      if (followUpQuestion) answer.followUp = followUpQuestion;
    }

    interview.answeredQuestions = interview.answers.filter((a) => a.userAnswer).length;
    await interview.save();

    res.json({
      success: true,
      score: result.score,
      verdict: result.verdict,
      feedback: result.feedback,
      strengths: result.strengths,
      improvements: result.improvements,
      source: result.source,
      followUp: followUpQuestion,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const completeInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    const totalScore = interview.answers.reduce((sum, a) => sum + a.score, 0);
    interview.totalScore = totalScore;
    interview.percentage = interview.maxScore > 0 ? Math.round((totalScore / interview.maxScore) * 100) : 0;
    interview.status = 'completed';
    interview.completedAt = new Date();
    interview.duration = req.body.duration || 0;
    await interview.save();
    await recalcUserStats(req.user._id);
    res.json({ success: true, interview });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getInterviews = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const total = await Interview.countDocuments({ user: req.user._id, status: 'completed' });
    const interviews = await Interview.find({ user: req.user._id, status: 'completed' })
      .sort({ completedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-answers');
    res.json({ success: true, interviews, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getInterviewById = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    res.json({ success: true, interview });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteInterview = async (req, res) => {
  try {
    const deleted = await Interview.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deleted) return res.status(404).json({ success: false, message: 'Interview not found' });
    await recalcUserStats(req.user._id);
    res.json({ success: true, message: 'Interview deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  startInterview,
  startFromResume,
  submitAnswer,
  completeInterview,
  getInterviews,
  getInterviewById,
  deleteInterview,
};
