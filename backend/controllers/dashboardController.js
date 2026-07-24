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

// deeper analytics for the dedicated page: weak-area detection, per-category and
// per-difficulty breakdowns, a progress timeline, and what to work on next
const getAnalytics = async (req, res) => {
  try {
    const interviews = await Interview.find({ user: req.user._id, status: 'completed' })
      .sort({ completedAt: 1 });

    if (interviews.length === 0) {
      return res.json({
        success: true,
        hasData: false,
        categoryPerformance: [],
        difficultyPerformance: [],
        timeline: [],
        scoreDistribution: [],
        weakest: null,
        strongest: null,
        topImprovements: [],
        aiCoverage: { ai: 0, keyword: 0 },
      });
    }

    // roll answer-level scores up by the interview's category (skip 'Mixed' since
    // we can't attribute those answers to a single topic)
    const catMap = {};
    const diffMap = {};
    const dist = [0, 0, 0, 0, 0]; // 0-2, 3-4, 5-6, 7-8, 9-10
    const improvementCount = {};
    let aiCount = 0;
    let keywordCount = 0;
    let totalTime = 0;
    let answerCount = 0;

    interviews.forEach((iv) => {
      diffMap[iv.difficulty] = diffMap[iv.difficulty] || { count: 0, total: 0 };
      diffMap[iv.difficulty].count += 1;
      diffMap[iv.difficulty].total += iv.percentage;

      iv.answers.forEach((a) => {
        answerCount += 1;
        totalTime += a.timeTaken || 0;
        dist[Math.min(4, Math.floor(a.score / 2))] += 1;
        if (a.scoreSource === 'ai') aiCount += 1;
        else keywordCount += 1;
        (a.improvements || []).forEach((imp) => {
          improvementCount[imp] = (improvementCount[imp] || 0) + 1;
        });
        if (iv.category && iv.category !== 'Mixed') {
          catMap[iv.category] = catMap[iv.category] || { answered: 0, total: 0 };
          catMap[iv.category].answered += 1;
          catMap[iv.category].total += a.score * 10; // 0-10 -> 0-100
        }
      });
    });

    const categoryPerformance = Object.entries(catMap)
      .map(([category, d]) => ({ category, answered: d.answered, avgScore: Math.round(d.total / d.answered) }))
      .sort((a, b) => a.avgScore - b.avgScore);

    const difficultyPerformance = Object.entries(diffMap)
      .map(([difficulty, d]) => ({ difficulty, count: d.count, avgScore: Math.round(d.total / d.count) }));

    const timeline = interviews.map((iv) => ({
      date: new Date(iv.completedAt).toLocaleDateString(),
      score: iv.percentage,
      title: iv.title,
    }));

    const scoreDistribution = ['0-2', '3-4', '5-6', '7-8', '9-10'].map((range, i) => ({
      range, count: dist[i],
    }));

    const topImprovements = Object.entries(improvementCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([text, count]) => ({ text, count }));

    res.json({
      success: true,
      hasData: true,
      categoryPerformance,
      difficultyPerformance,
      timeline,
      scoreDistribution,
      weakest: categoryPerformance[0] || null,
      strongest: categoryPerformance[categoryPerformance.length - 1] || null,
      topImprovements,
      avgTimePerQuestion: answerCount ? Math.round(totalTime / answerCount) : 0,
      aiCoverage: { ai: aiCount, keyword: keywordCount },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboard, getAnalytics };
