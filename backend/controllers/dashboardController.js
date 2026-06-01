const Interview = require('../models/Interview');

const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const interviews = await Interview.find({ user: userId, status: 'completed' }).sort({ completedAt: -1 });

    const totalInterviews = interviews.length;
    const avgScore = totalInterviews > 0
      ? Math.round(interviews.reduce((s, i) => s + i.percentage, 0) / totalInterviews)
      : 0;
    const bestScore = totalInterviews > 0 ? Math.max(...interviews.map(i => i.percentage)) : 0;
    const recentInterviews = interviews.slice(0, 5);

    const categoryBreakdown = {};
    interviews.forEach(iv => {
      if (!categoryBreakdown[iv.category]) {
        categoryBreakdown[iv.category] = { count: 0, totalScore: 0 };
      }
      categoryBreakdown[iv.category].count++;
      categoryBreakdown[iv.category].totalScore += iv.percentage;
    });
    const categoryStats = Object.entries(categoryBreakdown).map(([cat, data]) => ({
      category: cat,
      count: data.count,
      avgScore: Math.round(data.totalScore / data.count),
    }));

    const last7 = interviews.filter(iv => {
      const diff = (Date.now() - new Date(iv.completedAt)) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    });
    const progressData = last7.map(iv => ({
      date: new Date(iv.completedAt).toLocaleDateString(),
      score: iv.percentage,
      category: iv.category,
    }));

    const difficultyBreakdown = {};
    interviews.forEach(iv => {
      difficultyBreakdown[iv.difficulty] = (difficultyBreakdown[iv.difficulty] || 0) + 1;
    });

    res.json({
      success: true,
      stats: { totalInterviews, avgScore, bestScore, last7Count: last7.length },
      recentInterviews,
      categoryStats,
      progressData,
      difficultyBreakdown,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboard };
