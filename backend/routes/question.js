const express = require('express');
const { getQuestions, getQuestionById, createQuestion, updateQuestion, deleteQuestion, getCategories } = require('../controllers/questionController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

const router = express.Router();

router.get('/categories', protect, getCategories);
router.get('/', protect, getQuestions);
router.get('/:id', protect, getQuestionById);
router.post('/', protect, admin, createQuestion);
router.put('/:id', protect, admin, updateQuestion);
router.delete('/:id', protect, admin, deleteQuestion);

module.exports = router;
