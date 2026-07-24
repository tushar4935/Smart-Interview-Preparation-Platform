const express = require('express');
const { body } = require('express-validator');
const {
  startInterview,
  startFromResume,
  submitAnswer,
  completeInterview,
  getInterviews,
  getInterviewById,
  deleteInterview,
} = require('../controllers/interviewController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { aiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(protect);

router.get('/', getInterviews);

router.post('/start', [
  body('questionCount').optional().isInt({ min: 1, max: 20 }).withMessage('questionCount must be 1-20'),
  body('title').optional().trim().isLength({ max: 120 }),
], validate, startInterview);

router.post('/from-resume', aiLimiter, [
  body('questionCount').optional().isInt({ min: 1, max: 15 }).withMessage('questionCount must be 1-15'),
], validate, startFromResume);

router.get('/:id', getInterviewById);

router.put('/:id/answer', aiLimiter, [
  body('questionIndex').isInt({ min: 0 }).withMessage('questionIndex is required'),
  body('userAnswer').optional().isString(),
  body('timeTaken').optional().isInt({ min: 0 }),
], validate, submitAnswer);

router.put('/:id/complete', completeInterview);

router.delete('/:id', deleteInterview);

module.exports = router;
