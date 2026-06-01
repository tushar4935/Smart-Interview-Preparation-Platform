const express = require('express');
const { getAdminStats, getAllUsers, toggleUserStatus, getAllQuestions } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

const router = express.Router();

router.use(protect, admin);
router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle', toggleUserStatus);
router.get('/questions', getAllQuestions);

module.exports = router;
