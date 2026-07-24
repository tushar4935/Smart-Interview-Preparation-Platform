const express = require('express');
const { getDashboard, getAnalytics } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getDashboard);
router.get('/analytics', protect, getAnalytics);

module.exports = router;
