const express = require('express');
const { startInterview, submitAnswer, completeInterview, getInterviews, getInterviewById, deleteInterview } = require('../controllers/interviewController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/', getInterviews);
router.post('/start', startInterview);
router.get('/:id', getInterviewById);
router.put('/:id/answer', submitAnswer);
router.put('/:id/complete', completeInterview);
router.delete('/:id', deleteInterview);

module.exports = router;
