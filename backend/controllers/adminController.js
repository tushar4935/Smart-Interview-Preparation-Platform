const User = require('../models/User');
const Interview = require('../models/Interview');
const Question = require('../models/Question');
const Resume = require('../models/Resume');

const getAdminStats = async (req, res) => {
  try {
    const [totalUsers, totalInterviews, totalQuestions, totalResumes] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Interview.countDocuments({ status: 'completed' }),
      Question.countDocuments({ isActive: true }),
      Resume.countDocuments(),
    ]);
    const recentUsers = await User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(5).select('-password');
    const topPerformers = await User.find({ role: 'user', totalInterviews: { $gt: 0 } })
      .sort({ averageScore: -1 })
      .limit(5)
      .select('name email averageScore totalInterviews');
    res.json({ success: true, stats: { totalUsers, totalInterviews, totalQuestions, totalResumes }, recentUsers, topPerformers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search || '';
    const filter = { role: 'user' };
    if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    const total = await User.countDocuments(filter);
    const users = await User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select('-password');
    res.json({ success: true, users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllQuestions = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const { category, difficulty } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    const total = await Question.countDocuments(filter);
    const questions = await Question.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('createdBy', 'name');
    res.json({ success: true, questions, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAdminStats, getAllUsers, toggleUserStatus, getAllQuestions };
