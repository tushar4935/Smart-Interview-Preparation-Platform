const Question = require('../models/Question');

const getQuestions = async (req, res) => {
  try {
    const { category, difficulty, limit = 10 } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    const questions = await Question.find(filter).limit(Number(limit)).select('-expectedAnswer -keywords');
    res.json({ success: true, count: questions.length, questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getQuestionById = async (req, res) => {
  try {
    const q = await Question.findById(req.params.id);
    if (!q) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, question: q });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createQuestion = async (req, res) => {
  try {
    const question = await Question.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Question deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Question.distinct('category', { isActive: true });
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getQuestions, getQuestionById, createQuestion, updateQuestion, deleteQuestion, getCategories };
