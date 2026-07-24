const express = require('express');
const { uploadResume, getResumes, deleteResume, setDefaultResume, analyzeResume } = require('../controllers/resumeController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { aiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(protect);
router.get('/', getResumes);
router.post('/upload', upload.single('resume'), uploadResume);
router.get('/:id/analyze', aiLimiter, analyzeResume);
router.delete('/:id', deleteResume);
router.put('/:id/default', setDefaultResume);

module.exports = router;
