const Interview = require('../models/Interview');
const Question = require('../models/Question');
const User = require('../models/User');

const scoreAnswer = (userAnswer, expectedAnswer, keywords) => {
  if (!userAnswer || userAnswer.trim().length < 10) return 0;
  let score = 2;
  const ans = userAnswer.toLowerCase();
  if (expectedAnswer) {
    const expWords = expectedAnswer.toLowerCase().split(' ').filter(w => w.length > 4);
    const matches = expWords.filter(w => ans.includes(w));
    score += Math.min(4, Math.floor((matches.length / expWords.length) * 5));
  }
  if (keywords && keywords.length > 0) {
    const kwMatches = keywords.filter(kw => ans.includes(kw.toLowerCase()));
    score += Math.min(4, Math.floor((kwMatches.length / keywords.length) * 4));
  }
  return Math.min(10, score);
};

const startInterview = async (req, res) => {
  const { category, difficulty, questionCount = 5, title } = req.body;
  try {
    const filter = { isActive: true };
    if (category && category !== 'Mixed') filter.category = category;
    if (difficulty && difficulty !== 'Mixed') filter.difficulty = difficulty;
    const allQuestions = await Question.find(filter);
    if (allQuestions.length === 0) {
      return res.status(404).json({ success: false, message: 'No questions found for selected filters' });
    }
    const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, Math.min(questionCount, allQuestions.length));
    const interview = await Interview.create({
      user: req.user._id,
      title: title || `${category} Interview`,
      category: category || 'Mixed',
      difficulty: difficulty || 'Mixed',
      totalQuestions: shuffled.length,
      maxScore: shuffled.length * 10,
      answers: shuffled.map(q => ({
        question: q._id,
        questionText: q.text,
        userAnswer: '',
        score: 0,
        feedback: '',
        timeTaken: 0,
      })),
    });
    res.status(201).json({
      success: true,
      interview: { ...interview.toObject(), questions: shuffled },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const submitAnswer = async (req, res) => {
  const { questionIndex, userAnswer, timeTaken } = req.body;
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    if (interview.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Interview already completed' });
    }
    const answer = interview.answers[questionIndex];
    if (!answer) return res.status(400).json({ success: false, message: 'Invalid question index' });
    const question = await Question.findById(answer.question);
    const score = scoreAnswer(userAnswer, question?.expectedAnswer, question?.keywords);
    const feedback = score >= 7
      ? 'Great answer! You covered the key points well.'
      : score >= 4
      ? 'Good attempt. Try to include more specific details and key concepts.'
      : 'Needs improvement. Review the topic and focus on core concepts.';
    interview.answers[questionIndex].userAnswer = userAnswer;
    interview.answers[questionIndex].score = score;
    interview.answers[questionIndex].feedback = feedback;
    interview.answers[questionIndex].timeTaken = timeTaken || 0;
    interview.answeredQuestions = interview.answers.filter(a => a.userAnswer).length;
    await interview.save();
    res.json({ success: true, score, feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const completeInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    const totalScore = interview.answers.reduce((sum, a) => sum + a.score, 0);
    const percentage = interview.maxScore > 0 ? Math.round((totalScore / interview.maxScore) * 100) : 0;
    interview.totalScore = totalScore;
    interview.percentage = percentage;
    interview.status = 'completed';
    interview.completedAt = new Date();
    interview.duration = req.body.duration || 0;
    await interview.save();
    const user = await User.findById(req.user._id);
    const allCompleted = await Interview.find({ user: req.user._id, status: 'completed' });
    user.totalInterviews = allCompleted.length;
    user.averageScore = Math.round(allCompleted.reduce((s, i) => s + i.percentage, 0) / allCompleted.length);
    await user.save();
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
    await Interview.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Interview deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { startInterview, submitAnswer, completeInterview, getInterviews, getInterviewById, deleteInterview };
